let _adminUsersData=[];
let _adminAgenciasMap={}; // id → nombre

async function renderAdmin(){
  if(currentRol!=='admin'&&currentRol!=='agencia') return;
  // Usuarios (unificado)
  await renderAdminUsers();
  // Actividad reciente
  loadAdminLog();
}

// ═══════════════════════════════════════════
// AGENCIAS (Admin)
// ═══════════════════════════════════════════
async function renderAdminAgencias(){
  const el=document.getElementById('admin-agencias');if(!el)return;
  // Agencias = agentes con rol 'agencia'
  const {data:agencias}=await sb.from('agentes').select('*').eq('rol','agencia').order('nombre');
  if(!agencias?.length){el.innerHTML='<p style="color:var(--g3);font-size:.82rem">Sin agencias registradas.</p>';return;}
  el.innerHTML=`<table class="tbl"><thead><tr><th>Nombre</th><th>Email</th><th>Activo</th><th></th></tr></thead><tbody>
  ${agencias.map(a=>`<tr>
    <td style="font-weight:600">${a.nombre||'Sin nombre'}</td>
    <td style="font-size:.78rem">${a.email}</td>
    <td>${a.activo!==false?'<span style="color:var(--primary);font-weight:600">Activo</span>':'<span style="color:var(--g3)">Inactivo</span>'}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-out btn-xs" onclick="editAgentModal('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}','${a.email}','${a.rol}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar</button>
    </td>
  </tr>`).join('')}</tbody></table>`;
}

function openAgencyInviteModal(){
  openAgentModal('agencia');
}

function buildDataLists(provs){
  let pl=document.getElementById('prov-list');
  if(!pl){pl=document.createElement('datalist');pl.id='prov-list';document.body.appendChild(pl);}
  pl.innerHTML=provs.map(p=>`<option value="${p.nombre}">`).join('');
  // Populate prov-sel dropdowns with Otro option
  const provOpts='<option value="">— Elegir proveedor —</option>'+provs.map(p=>`<option value="${p.nombre}">${p.nombre}${p.ciudad?' · '+p.ciudad:''}</option>`).join('')+'<option value="__otro__">Otro (escribir manualmente)</option>';
  document.querySelectorAll('.prov-sel').forEach(sel=>{
    const cur=sel.getAttribute('data-val')||'';
    sel.innerHTML=provOpts;
    if(cur){
      // Check if value exists in options, else select __otro__ and fill sibling input
      const exists=[...sel.options].some(o=>o.value===cur);
      if(exists){sel.value=cur;}else{sel.value='__otro__';const inp=document.getElementById(sel.id.replace('-sel','-inp'));if(inp){inp.value=cur;inp.style.display='';}}
    }
  });
}

async function renderAdminUsers(){
  const el=document.getElementById('admin-users-list');if(!el)return;
  const [{data:agents,error},{data:pendingInvs},{data:agencias}]=await Promise.all([
    sb.from('agentes').select('*').order('nombre'),
    sb.from('invitaciones').select('*').eq('tipo','invite').eq('usado',false).order('creado_en',{ascending:false}),
    sb.from('agencias').select('id,nombre')
  ]);
  // Build agencias map
  _adminAgenciasMap={};
  (agencias||[]).forEach(a=>{_adminAgenciasMap[a.id]=a.nombre||'';});
  if(error){el.innerHTML='<div style="color:var(--red);font-size:.82rem">Error: '+error.message+'</div>';return;}
  // Merge: pending invites que aún no tienen cuenta (no aparecen en agentes)
  const activeEmails=new Set((agents||[]).map(a=>a.email));
  const pendingRows=(pendingInvs||[])
    .filter(inv=>!activeEmails.has(inv.email))
    .map(inv=>({id:inv.id,email:inv.email,nombre:inv.nombre||'',rol:inv.rol,activo:false,_pending:true,_invToken:inv.token}));
  _adminUsersData=[...(agents||[]),...pendingRows];
  _renderAdminUsersTable();
}

function _renderAdminUsersTable(){
  const el=document.getElementById('admin-users-list');if(!el)return;
  const search=(document.getElementById('admin-user-search')?.value||'').toLowerCase();
  const rolFilter=document.getElementById('admin-user-filter-rol')?.value||'';
  const statusFilter=document.getElementById('admin-user-filter-status')?.value||'';

  let filtered=_adminUsersData.filter(a=>{
    if(search && !((a.nombre||'').toLowerCase().includes(search) || (a.email||'').toLowerCase().includes(search))) return false;
    if(rolFilter && a.rol!==rolFilter) return false;
    if(statusFilter==='active' && !a.activo) return false;
    if(statusFilter==='inactive' && a.activo) return false;
    if(statusFilter==='pending' && !a._pending) return false;
    return true;
  });

  if(!filtered.length){
    el.innerHTML='<div style="color:var(--g3);font-size:.82rem;padding:12px 0">No se encontraron usuarios</div>';
    return;
  }

  const rolBadge=r=>{
    const colors={admin:'#1B9E8F',agencia:'#D4A017',agente:'#9B7FD4'};
    const labels={admin:'ADMIN',agencia:'AGENCIA',agente:'AGENTE'};
    return `<span style="font-size:.65rem;font-weight:700;padding:3px 10px;border-radius:12px;background:${colors[r]||'var(--g1)'}22;color:${colors[r]||'var(--g4)'};letter-spacing:.5px">${labels[r]||r}</span>`;
  };

  const statusBadge=a=>{
    if(a._pending) return '<span style="font-size:.68rem;color:#D4A017;font-weight:600">Pendiente</span>';
    if(a.activo) return '<span style="font-size:.68rem;color:var(--primary);font-weight:600">Activo</span>';
    return '<span style="font-size:.68rem;color:var(--g3);font-weight:600">Inactivo</span>';
  };

  const myId=currentUser?.id||'';

  const fmtDate=d=>{if(!d)return'\u2014';try{return new Date(d).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return'\u2014';}};

  el.innerHTML=`<table class="tbl" style="width:100%">
    <thead><tr><th>Nombre</th><th>Email</th><th>Agencia</th><th>Rol</th><th>Estado</th><th>Alta</th><th style="text-align:right">Acciones</th></tr></thead>
    <tbody>${filtered.map(a=>`<tr>
      <td style="font-weight:600">${a.nombre||'\u2014'}</td>
      <td style="font-size:.82rem;color:var(--g4)">${a.email||'\u2014'}</td>
      <td style="font-size:.78rem">${a.agencia_id&&_adminAgenciasMap[a.agencia_id]?_adminAgenciasMap[a.agencia_id]:'<span style="color:var(--g3)">\u2014</span>'}</td>
      <td>${rolBadge(a.rol)}</td>
      <td>${statusBadge(a)}</td>
      <td style="font-size:.72rem;color:var(--g4);white-space:nowrap">${fmtDate(a.creado_en||a.created_at)}</td>
      <td style="text-align:right">
        <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">
          ${!a.activo?`<button class="btn btn-out btn-xs" style="color:var(--primary);border-color:var(--primary)" onclick="activateUser('${a.id}')">Activar</button>`:''}
          ${a.activo&&a.id!==myId?`<button class="btn btn-out btn-xs" style="color:#D4A017;border-color:#D4A017" onclick="deactivateUser('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}')">Desactivar</button>`:''}
          ${a._pending?`<button class="btn btn-out btn-xs" onclick="regenerateInviteLink('${a.email}')">Nuevo enlace</button>`:''}
          ${a.activo?`<button class="btn btn-out btn-xs" onclick="generateResetLink('${a.id}')">Reset pass</button>`:''}
          <button class="btn btn-out btn-xs" onclick="editAgentModal('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}','${a.email}','${a.rol}')">Editar</button>
          ${a.id!==myId?`<button class="btn btn-out btn-xs" style="color:var(--red);border-color:var(--red)" onclick="deleteUser('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}')">Eliminar</button>`:''}
        </div>
      </td>
    </tr>`).join('')}</tbody>
  </table>`;
}

function _filterAdminUsers(){
  _renderAdminUsersTable();
}

async function changeRol(id,rol){
  const opts=(['admin','agencia','agente']).filter(r=>r!==rol);
  const nw=prompt('Cambiar rol de "'+rol+'" a:\n'+opts.map((r,i)=>(i+1)+'. '+r).join('\n')+'\n\nEscribí el nuevo rol:');
  if(!nw||!['admin','agencia','agente'].includes(nw.trim().toLowerCase()))return;
  const {error}=await sb.from('agentes').update({rol:nw.trim().toLowerCase()}).eq('id',id);
  if(error){toast('Error: '+error.message,false);return;}
  toast('Rol actualizado');renderAdminUsers();
}

async function activateUser(id){
  const {error}=await sb.from('agentes').update({activo:true}).eq('id',id);
  if(error){toast('Error al activar: '+error.message,false);console.error('[activateUser]',error);return;}
  toast('Usuario activado');
  await renderAdminUsers();
}

async function deactivateUser(id,nombre){
  if(!confirm('Desactivar a "'+nombre+'"? No podra acceder hasta que lo reactives.'))return;
  const {error}=await sb.from('agentes').update({activo:false}).eq('id',id);
  if(error){toast('Error: '+error.message,false);return;}
  toast('Usuario desactivado');
  await renderAdminUsers();
}

async function regenerateInviteLink(email){
  const token=crypto.randomUUID();
  // Invalidar invites previos del mismo email
  await sb.from('invitaciones').update({usado:true}).eq('email',email).eq('usado',false);
  // Obtener rol del email si tiene invitacion previa
  const {data:prev}=await sb.from('invitaciones').select('rol,agencia_id').eq('email',email).order('creado_en',{ascending:false}).limit(1).maybeSingle();
  const {error}=await sb.from('invitaciones').insert({email,rol:prev?.rol||'agente',tipo:'invite',token,agencia_id:prev?.agencia_id||null,usado:false});
  if(error){toast('Error: '+error.message,false);return;}
  const url=window.location.origin+window.location.pathname+'?invite='+token;
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:16px">Nuevo enlace de invitacion</div>
    <div style="font-size:.82rem;color:var(--g4);margin-bottom:12px">Comparti este enlace con el usuario para que cree su cuenta:</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input class="finput" id="regen-link" value="${url}" readonly style="flex:1;font-size:.78rem;font-family:'DM Mono',monospace">
      <button class="btn btn-pri btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('regen-link').value);toast('Enlace copiado')">Copiar</button>
    </div>
    <div style="margin-top:16px;text-align:right"><button class="btn btn-out" onclick="closeModal()">Cerrar</button></div>`;
  openModal();
  renderAdminUsers();
}

async function deleteUser(id,nombre){
  if(!confirm('Eliminar a "'+nombre+'"? Esta accion no se puede deshacer.'))return;
  const {error}=await sb.from('agentes').delete().eq('id',id);
  if(error){toast('Error: '+error.message,false);return;}
  toast('Usuario eliminado');renderAdminUsers();
}

const _provTipos=[{v:'traslado',l:'Traslado'},{v:'excursion',l:'Excursion'},{v:'hotel',l:'Hotel'},{v:'seguro',l:'Seguro'},{v:'asistencia',l:'Asistencia'},{v:'DMC',l:'DMC (Dest. Management)'},{v:'receptivo',l:'Receptivo'},{v:'aerolinea',l:'Aerolinea'},{v:'crucero',l:'Crucero'},{v:'otro',l:'Otro'}];
function _tiposBadges(tipos){
  if(!tipos||!tipos.length) return '<span style="color:var(--g3);font-size:.72rem">—</span>';
  return (Array.isArray(tipos)?tipos:[tipos]).map(t=>{
    const lbl=_provTipos.find(x=>x.v===t);
    return `<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:.68rem;font-weight:600;background:rgba(27,158,143,0.1);color:var(--primary);margin:1px 2px">${lbl?lbl.l:t}</span>`;
  }).join('');
}

// ═══════════════════════════════════════════
// PROVEEDORES — Tab unificado (proveedores + seguros)
// ═══════════════════════════════════════════
let _allProvs=[];
async function renderProviders(){
  const el=document.getElementById('prov-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)"><span class="spin spin-tq"></span> Cargando...</div>';
  const {data,error}=await sb.from('proveedores').select('*').order('nombre');
  if(error){el.innerHTML=`<p style="color:var(--red);font-size:.82rem">Error: ${error.message}</p>`;return;}
  _allProvs=data||[];
  // Filtro JS por rol: agente ve suyos + todos los de su agencia
  let visible=_allProvs;
  if(currentRol==='agente'){
    visible=_allProvs.filter(p=>
      p.agente_id===window._agenteId || // propios
      (window._agenciaId && p.agencia_id===window._agenciaId) // de la agencia (cualquier creador)
    );
  }
  // Filtros UI
  const q=(document.getElementById('prov-filter')?.value||'').toLowerCase().trim();
  const tf=document.getElementById('prov-type-filter')?.value||'';
  if(q) visible=visible.filter(p=>(p.nombre||'').toLowerCase().includes(q)||(p.ciudad||'').toLowerCase().includes(q)||(p.email||'').toLowerCase().includes(q));
  if(tf) visible=visible.filter(p=>(p.tipos||[p.tipo]).includes(tf));
  if(!visible.length){
    el.innerHTML=`<div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg><p>${q||tf?'Sin resultados':'Sin proveedores'}</p><small>${q||tf?'Proba cambiando los filtros':'Agrega tu primer proveedor con el boton + Nuevo proveedor'}</small></div>`;
    return;
  }
  el.innerHTML=`<table class="tbl"><thead><tr><th>Nombre</th><th>Tipos</th><th>Ciudad</th><th>Contacto</th><th>Comision</th><th></th></tr></thead><tbody>
  ${visible.map(p=>{
    const canE=_canEdit(p);
    const comTxt=p.comision?(p.comision_tipo==='fijo_usd'?'USD '+p.comision:p.comision+'%'):'—';
    const editBtn=canE?`<button class="btn btn-out btn-xs" onclick="openProviderModal('${p.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`
      :(_canView(p)?`<button class="btn btn-out btn-xs" onclick="openProviderModal('${p.id}')" title="Solo lectura"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>`:'');
    const delBtn=canE?`<button class="btn btn-del btn-xs" onclick="deleteProvider('${p.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>`:'';
    return `<tr><td><strong>${p.nombre||'—'}</strong></td><td>${_tiposBadges(p.tipos||[p.tipo])}</td><td>${p.ciudad||'—'}</td><td style="font-size:.75rem">${p.contacto||p.email||'—'}</td><td style="font-size:.75rem">${comTxt}</td><td style="white-space:nowrap">${editBtn}${delBtn}</td></tr>`;
  }).join('')}</tbody></table>`;
  // Actualizar provsList global para dropdowns del formulario
  window.provsList=(_allProvs||[]).filter(p=>p.nombre).map(p=>({nombre:p.nombre,tipo:p.tipo||'',tipos:p.tipos||[p.tipo||'otro'],ciudad:p.ciudad||''}));
  // Actualizar select de seguros en formulario
  _updateSeguroDropdown();
}

function _updateSeguroDropdown(){
  const sel=document.getElementById('seg-nm');if(!sel)return;
  const seguros=(_allProvs||[]).filter(p=>p.nombre&&(p.tipos||[p.tipo]).some(t=>t==='seguro'||t==='asistencia'));
  sel.innerHTML='<option value="">— Elegir aseguradora —</option>'+seguros.map(s=>`<option value="${s.nombre}">${s.nombre}</option>`).join('');
}

// Alias legacy para seguros — ahora son proveedores tipo seguro
async function loadSeguros(){_updateSeguroDropdown();}

function openProviderModal(id){
  const p=id?_allProvs.find(x=>x.id===id):null;
  const readOnly=!!p&&!_canEdit(p);
  const _v=k=>(p&&p[k])||'';
  const tipos=p?(p.tipos||[p.tipo||'']):[];
  const _dis=readOnly?' disabled':'';
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:16px">${readOnly?'Ver proveedor':id?'Editar proveedor':'+ Nuevo proveedor'}</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre *</label><input class="finput" id="mp-nm" value="${_v('nombre')}" placeholder="Orlantours"${_dis}></div>
      <div class="fg"><label class="lbl">CUIT / RUT</label><input class="finput" id="mp-cuit" value="${_v('cuit')}" placeholder="30-12345678-9"${_dis}></div>
    </div>
    <div class="g2">
      <div class="fg"><label class="lbl">Email</label><input class="finput" id="mp-email" value="${_v('email')}" placeholder="info@proveedor.com" inputmode="email"${_dis}></div>
      <div class="fg"><label class="lbl">Telefono</label><input class="finput" id="mp-tel" value="${_v('telefono')}" placeholder="+54 11 5555-1234" inputmode="tel"${_dis}></div>
    </div>
    <div class="g2">
      <div class="fg"><label class="lbl">Contacto</label><input class="finput" id="mp-contacto" value="${_v('contacto')}" placeholder="Gabriel Quezada"${_dis}></div>
      <div class="fg"><label class="lbl">Web</label><input class="finput" id="mp-web" value="${_v('web')}" placeholder="www.proveedor.com"${_dis}></div>
    </div>
    <div class="fg"><label class="lbl">Direccion</label><input class="finput" id="mp-dir" value="${_v('direccion')}" placeholder="Av. Corrientes 1234, CABA"${_dis}></div>
    <div class="g2">
      <div class="fg"><label class="lbl">Pais</label><input class="finput" id="mp-pais" value="${_v('pais')}" placeholder="Argentina"${_dis}></div>
      <div class="fg"><label class="lbl">Ciudad</label><input class="finput" id="mp-ciudad" value="${_v('ciudad')}" placeholder="Buenos Aires"${_dis}></div>
    </div>
    <div class="fg" style="margin-top:8px">
      <label class="lbl">Tipos de servicio</label>
      <div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:4px">
        ${_provTipos.map(t=>`<label style="display:flex;align-items:center;gap:4px;font-size:.82rem;cursor:${readOnly?'default':'pointer'}"><input type="checkbox" class="prov-tipo-chk" value="${t.v}" ${tipos.includes(t.v)?'checked':''}${_dis}> ${t.l}</label>`).join('')}
      </div>
    </div>
    <div class="g2" style="margin-top:8px">
      <div class="fg"><label class="lbl">Comision</label><input class="finput" id="mp-com" value="${_v('comision')}" placeholder="15" inputmode="decimal"${_dis}></div>
      <div class="fg"><label class="lbl">Tipo comision</label><select class="fsel" id="mp-com-tipo"${_dis}><option value="porcentaje" ${_v('comision_tipo')!=='fijo_usd'?'selected':''}>Porcentaje %</option><option value="fijo_usd" ${_v('comision_tipo')==='fijo_usd'?'selected':''}>Monto fijo USD</option></select></div>
    </div>
    <div class="fg"><label class="lbl">Notas internas</label><textarea class="ftxt" id="mp-notas" rows="2" placeholder="Notas sobre este proveedor..."${_dis}>${_v('notas')}</textarea></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <button class="btn btn-out" onclick="closeModal()">${readOnly?'Cerrar':'Cancelar'}</button>
      ${readOnly?'':`<button class="btn btn-cta" onclick="saveProvider('${id||''}')">Guardar</button>`}
    </div>`;
  const box=document.getElementById('modal-box');if(box)box.style.maxWidth='600px';
  openModal();
}

async function saveProvider(id){
  const nm=document.getElementById('mp-nm').value.trim();
  if(!nm){toast('El nombre es obligatorio',false);return;}
  const tipos=[...document.querySelectorAll('.prov-tipo-chk:checked')].map(c=>c.value);
  const row={
    nombre:nm,
    tipo:tipos[0]||'otro',
    tipos:tipos.length?tipos:['otro'],
    cuit:document.getElementById('mp-cuit')?.value||'',
    email:document.getElementById('mp-email')?.value||'',
    telefono:document.getElementById('mp-tel')?.value||'',
    contacto:document.getElementById('mp-contacto')?.value||'',
    web:document.getElementById('mp-web')?.value||'',
    direccion:document.getElementById('mp-dir')?.value||'',
    pais:document.getElementById('mp-pais')?.value||'',
    ciudad:document.getElementById('mp-ciudad')?.value||'',
    comision:parseFloat(document.getElementById('mp-com')?.value)||null,
    comision_tipo:document.getElementById('mp-com-tipo')?.value||'porcentaje',
    notas:document.getElementById('mp-notas')?.value||''
  };
  let error;
  if(id){
    ({error}=await sb.from('proveedores').update(row).eq('id',id));
    // Fallback si columnas nuevas no existen
    if(error&&(error.code==='42703'||error.message?.includes('column'))){
      const safe={nombre:row.nombre,tipo:row.tipo,pais:row.pais,ciudad:row.ciudad,email:row.email,telefono:row.telefono,contacto:row.contacto};
      ({error}=await sb.from('proveedores').update(safe).eq('id',id));
    }
  } else {
    row.agente_id=window._agenteId;
    row.agencia_id=window._agenciaId||null;
    ({error}=await sb.from('proveedores').insert(row));
    if(error&&(error.code==='42703'||error.message?.includes('column'))){
      const safe={nombre:row.nombre,tipo:row.tipo,pais:row.pais,ciudad:row.ciudad,email:row.email,telefono:row.telefono,contacto:row.contacto,agente_id:row.agente_id,agencia_id:row.agencia_id};
      ({error}=await sb.from('proveedores').insert(safe));
    }
  }
  if(error){toast('Error: '+error.message,false);_captureError('saveProvider',error);return;}
  closeModal();toast(id?'Proveedor actualizado':'Proveedor creado');
  renderProviders();
}

async function deleteProvider(id){
  if(!confirm('Eliminar este proveedor?'))return;
  const p=_allProvs.find(x=>x.id===id);
  if(p&&!_canEdit(p)){toast('No podes eliminar proveedores de otro agente',false);return;}
  await sb.from('proveedores').delete().eq('id',id);
  toast('Proveedor eliminado');renderProviders();
}

// Legacy aliases para compatibilidad con admin/agency panels
function openProvModal(){openProviderModal();}
async function saveProv(){/* deprecated — usar saveProvider */}
async function deleteProv(id){deleteProvider(id);}

// ═══════════════════════════════════════════
// ADMIN EDIT MODALS
// ═══════════════════════════════════════════
function editAgentModal(id,nombre,email,rol){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">Editar agente</div>
    <div class="fg"><label class="lbl">Email</label><input class="finput" id="ea-em" value="${email}" readonly style="opacity:.6"></div>
    <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="ea-nm" value="${nombre}" placeholder="Nombre completo"></div>
    <div class="fg"><label class="lbl">Rol</label><select class="fsel" id="ea-rol"><option value="agente" ${rol==='agente'?'selected':''}>Agente</option><option value="agencia" ${rol==='agencia'?'selected':''}>Agencia</option><option value="admin" ${rol==='admin'?'selected':''}>Admin</option></select></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-cta" onclick="saveAgentEdit('${id}')">Guardar</button>
    </div>`;openModal();
}
async function saveAgentEdit(id){
  const nm=document.getElementById('ea-nm').value.trim();
  const rol=document.getElementById('ea-rol').value;
  await sb.from('agentes').update({nombre:nm,rol}).eq('id',id);
  closeModal();toast('Agente actualizado');renderAdmin();
}

// ═══════════════════════════════════════════
// TICKET BLOCK
// ═══════════════════════════════════════════
let tkc=0;
function addTicket(d){
  d=d||{};const id=++tkc;
  const el=document.createElement('div');el.className='rep';el.id='tkb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Ticket ${id}</div>
    <button class="btn btn-del btn-xs" onclick="this.closest('.rep').remove()">✕</button></div>
  <div class="g3">
    <div class="fg full"><label class="lbl">Nombre / Descripción</label><input class="finput" type="text" id="tk${id}-nm" placeholder="City Pass · Universal 2 días" value="${d.nombre||''}"></div>
    <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="tk${id}-tipo"><option>Ticket de parque</option><option>City Pass</option><option>Entrada museo</option><option>Espectáculo</option><option>Transporte</option><option>Otro</option></select></div>
    <div class="fg"><label class="lbl">Proveedor</label>
      <select class="fsel prov-sel" id="tk${id}-sel" onchange="onProvSel('tk${id}-sel')" data-val=""><option value="">— Elegir proveedor —</option></select>
      <input class="finput" type="text" id="tk${id}-inp" placeholder="Nombre del proveedor" style="display:none;margin-top:6px" value="">
    </div>
  </div>
  <div class="g3">
    <div class="fg"><label class="lbl">Fecha</label><input class="finput" type="date" id="tk${id}-fe" value="${d.fecha||''}"></div>
    <div class="fg"><label class="lbl">Precio</label>
      <div class="money-wrap"><div class="money-cur"><select id="tk${id}-cur"><option>USD</option><option>ARS</option></select></div>
      <input class="money-inp" type="number" id="tk${id}-pr" placeholder="0" value="${d.precio||''}"></div>
    </div>
    <div class="fg"><label class="lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
      <div class="money-wrap"><div class="money-cur"><select id="tk${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
      <input class="money-inp" type="number" id="tk${id}-com" placeholder="0" value="${d.comision||''}"></div>
    </div>
  </div>
  <div class="fg"><label class="lbl">Notas</label><input class="finput" type="text" id="tk${id}-desc" placeholder="Canjeables en ventanilla..." value="${d.desc||''}"></div>`;
  document.getElementById('tickets-cont').appendChild(el);
  if(d.tipo) document.getElementById('tk'+id+'-tipo').value=d.tipo;
  _populateProvSel('tk'+id+'-sel',d.prov||'','');
}

// ═══════════════════════════════════════════
// EXCURSION CATEGORY OTROS
// ═══════════════════════════════════════════
function onExcCat(id,val){
  const wrap=document.getElementById('e'+id+'-cat-otros-wrap');
  if(wrap) wrap.style.display=val==='otros'?'':'none';
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
async function renderDashboard(){
  const all=await dbLoadQuotes();
  const now=new Date();
  const mesActual=all.filter(r=>{
    const d=new Date(r.creado_en||r.updated_at||Date.now());
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  });
  const confirmadas=all.filter(r=>r.estado==='confirmada');
  const totalPrecio=confirmadas.reduce((s,r)=>s+(r.precio_total||0),0);
  // Comisiones desde datos JSON
  const totalCom=all.reduce((s,r)=>s+(r.datos?.total_comision||0),0);
  const conversion=all.length?Math.round((confirmadas.length/all.length)*100):0;
  // Render metric cards — brand v3 pastel
  const comProm=confirmadas.length?Math.round(totalCom/confirmadas.length):0;
  const icons={
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    dollar:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    trend:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    bars:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'
  };
  const mkCard=(icon,label,value,grad,sub,cls='')=>`<div class="dash-metric${cls?' '+cls:''}"><div class="metric-label"><svg viewBox="0 0 24 24">${icon}</svg>${label}</div><div class="metric-value${grad?' grad':''}">${value}</div>${sub?'<div class="metric-sub">'+sub+'</div>':''}</div>`;
  document.getElementById('dash-metrics').innerHTML=[
    mkCard(icons.calendar,'Cotizaciones este mes',mesActual.length,false,'mes en curso','dm-vuelos'),
    mkCard(icons.file,'Total cotizaciones',all.length,false,'historial completo','dm-crucero'),
    mkCard(icons.check,'Confirmadas',confirmadas.length,true,conversion+'% conversión','dm-hotel'),
    mkCard(icons.dollar,'Comisiones totales','USD '+Number(totalCom).toLocaleString('es-AR'),true,'acumulado','dm-hotel'),
    mkCard(icons.trend,'Tasa de conversión',conversion+'%',false,all.length+' cotizaciones','dm-traslado'),
    mkCard(icons.bars,'Com. promedio','USD '+Number(comProm).toLocaleString('es-AR'),false,'por confirmada','dm-seguro'),
  ].join('');
  // Cotizaciones del mes
  const stLbl={borrador:'Borrador',enviada:'Enviada',confirmada:'Confirmada',cancelada:'Cancelada'};
  document.getElementById('dash-mes-list').innerHTML=mesActual.length?`<table class="tbl"><thead><tr><th>Cliente</th><th>Destino</th><th>Ref</th><th>Estado</th><th>Precio</th><th>Comisión</th></tr></thead><tbody>
  ${mesActual.map(r=>`<tr>
    <td><strong>${r.datos?.cliente?.nombre||'—'}</strong></td>
    <td>${r.destino||'—'}</td>
    <td style="font-size:.75rem;color:var(--g3)">${r.ref_id}</td>
    <td><span class="status-badge st-${r.estado||'borrador'}">${stLbl[r.estado]||''} ${r.estado||'—'}</span></td>
    <td style="font-weight:700;color:var(--sky)">${r.precio_total?r.moneda+' '+Number(r.precio_total).toLocaleString('es-AR'):'—'}</td>
    <td style="font-weight:700;color:var(--amber2)">${r.datos?.total_comision?'USD '+Number(r.datos.total_comision).toLocaleString('es-AR'):'—'}</td>
  </tr>`).join('')}</tbody></table>`:'<div style="text-align:center;padding:30px;color:var(--g3)">Sin cotizaciones este mes.</div>';
  // Últimas con comisión
  const conCom=all.filter(r=>r.datos?.total_comision>0).slice(0,10);
  document.getElementById('dash-comisiones-list').innerHTML=conCom.length?`<table class="tbl"><thead><tr><th>Cliente</th><th>Destino</th><th>Fecha</th><th>Estado</th><th>Comisión total</th></tr></thead><tbody>
  ${conCom.map(r=>`<tr>
    <td><strong>${r.datos?.cliente?.nombre||'—'}</strong></td>
    <td>${r.destino||'—'}</td>
    <td style="font-size:.75rem;color:var(--g3)">${new Date(r.creado_en||r.updated_at||Date.now()).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}</td>
    <td><span class="status-badge st-${r.estado||'borrador'}">${stLbl[r.estado]||''} ${r.estado||'—'}</span></td>
    <td style="font-weight:700;color:var(--amber2)">USD ${Number(r.datos.total_comision).toLocaleString('es-AR')}</td>
  </tr>`).join('')}</tbody></table>`:'<div style="text-align:center;padding:30px;color:var(--g3)">Sin comisiones registradas todavía.</div>';
}

function openInviteModal(rol){
  rol=rol||'agente';
  const label=rol==='agencia'?'agencia':'agente';
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:16px">Invitar ${label}</div>
    <div class="fg"><label class="lbl">Email</label><input class="finput" id="inv-email" type="email" placeholder="usuario@email.com" inputmode="email"></div>
    <div class="fg"><label class="lbl">Nombre (opcional)</label><input class="finput" id="inv-nombre" placeholder="Nombre completo"></div>
    <input type="hidden" id="inv-rol" value="${rol}">
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-cta" onclick="sendInvite()">Generar invitacion</button>
    </div>`;openModal();
}

async function sendInvite(){
  const email=(document.getElementById('inv-email')?.value||'').trim().toLowerCase();
  const nombre=(document.getElementById('inv-nombre')?.value||'').trim();
  const rol=document.getElementById('inv-rol')?.value||'agente';
  if(!email){toast('Ingresa un email',false);return;}

  // Check if email already has an active account
  const {data:existing}=await sb.from('agentes').select('id,activo').eq('email',email).maybeSingle();
  if(existing?.activo){toast('Este email ya tiene una cuenta activa',false);return;}

  // Check for pending invite
  const {data:pendingInv}=await sb.from('invitaciones').select('id').eq('email',email).eq('tipo','invite').eq('usado',false).maybeSingle();
  if(pendingInv){
    if(confirm('Este email ya tiene una invitacion pendiente. Generar un nuevo enlace?')){
      closeModal();
      regenerateInviteLink(email);
    }
    return;
  }

  // INSERT in invitaciones — NOT in agentes (agentes se crea cuando acepta con auth.uid())
  const token=crypto.randomUUID();
  const row={email,rol,tipo:'invite',token,usado:false};
  if(nombre) row.nombre=nombre;
  if(currentRol==='agencia'&&window._agenteId){
    // Vincular a la agencia de quien invita
    const {data:agRow}=await sb.from('agentes').select('agencia_id').eq('id',window._agenteId).maybeSingle();
    if(agRow?.agencia_id) row.agencia_id=agRow.agencia_id;
  }
  const {error}=await sb.from('invitaciones').insert(row);
  if(error){toast('Error: '+error.message,false);return;}

  const url=window.location.origin+window.location.pathname+'?invite='+token;
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:16px">Invitacion creada</div>
    <div style="font-size:.82rem;color:var(--g4);margin-bottom:12px">Comparti este enlace con el usuario para que cree su cuenta:</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input class="finput" id="inv-link" value="${url}" readonly style="flex:1;font-size:.78rem;font-family:'DM Mono',monospace">
      <button class="btn btn-pri btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('inv-link').value);toast('Enlace copiado')">Copiar</button>
    </div>
    <div style="font-size:.75rem;color:var(--g3);margin-top:10px">El usuario abrira el enlace, creara su contrasena y quedara como pendiente hasta que lo actives.</div>
    <div style="margin-top:16px;text-align:right"><button class="btn btn-out" onclick="closeModal()">Cerrar</button></div>`;
  renderAdminUsers();
}

// Legacy alias
function openAgentModal(){openInviteModal('agente');}

async function selfRegisterAsAgent(){
  if(!confirm('Al activarte como agente podras crear cotizaciones. Deberas reingresar para que los cambios tomen efecto.')) return;
  // Obtener nombre actual del agente (agencia)
  const {data:agRow}=await sb.from('agentes').select('nombre').eq('id',window._agenteId).single();
  const insertRow={
    email: currentUser.email,
    nombre: agRow?.nombre || '',
    rol: 'agente',
    activo: true
  };
  // agencia_id puede no existir como columna — asignar defensivamente
  if(window._agenteId) insertRow.agencia_id = window._agenteId;
  const {error}=await sb.from('agentes').insert(insertRow);
  if(error){ toast('Error: '+error.message, false); return; }
  toast('Te registraste como agente. Cerrando sesion...');
  setTimeout(async()=>{ await sb.auth.signOut(); location.reload(); }, 2000);
}

// ═══════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════
function openModal(){
  const box=document.getElementById('modal-box');
  const overlay=document.getElementById('modal-overlay');
  overlay.style.display='block';
  box.style.display='block';
  // Accesibilidad: encontrar primer h2/h3 y asignarle el id para aria-labelledby
  const ttl=box.querySelector('h2,h3,[class*="ttl"],[class*="title"]');
  if(ttl&&!ttl.id) ttl.id='modal-box-ttl';
  // Enfocar el modal para lectores de pantalla
  box.focus();
}
function closeModal(){document.getElementById('modal-overlay').style.display='none';document.getElementById('modal-box').style.display='none';}

// ═══════════════════════════════════════════
// IMÁGENES DE SECCIONES DEL FORMULARIO
// ═══════════════════════════════════════════
const _SPH_KEY='mp_sec_photos';
const _SPH_SECS=[
  {k:'vuelos',      el:'sph-vuelos',      lbl:'Vuelos',               fb:'linear-gradient(135deg,#0EA5E9,#1565C0)'},
  {k:'hotel',       el:'sph-hotel',       lbl:'Alojamiento',          fb:'linear-gradient(135deg,#FF8E53,#E65100)'},
  {k:'traslados',   el:'sph-traslados',   lbl:'Traslados',            fb:'linear-gradient(135deg,#E8826A,#C2185B)'},
  {k:'excursiones', el:'sph-excursiones', lbl:'Excursiones',          fb:'linear-gradient(135deg,#43A047,#1B5E20)'},
  {k:'tickets',     el:'sph-tickets',     lbl:'Tickets / Entradas',   fb:'linear-gradient(135deg,#43A047,#1B5E20)'},
  {k:'autos',       el:'sph-autos',       lbl:'Alquiler de Autos',    fb:'linear-gradient(135deg,#FF8F00,#E65100)'},
  {k:'cruceros',    el:'sph-cruceros',    lbl:'Cruceros',             fb:'linear-gradient(135deg,#0288D1,#01579B)'},
  {k:'seguro',      el:'sph-seguro',      lbl:'Asistencia al viajero',fb:'linear-gradient(135deg,#9B7FD4,#6D28D9)'},
];

function _applySecPhotos(){
  const saved=JSON.parse(localStorage.getItem(_SPH_KEY)||'{}');
  _SPH_SECS.forEach(s=>{
    const el=document.getElementById(s.el);
    if(!el) return;
    const url=(saved[s.k]?.url||'').trim();
    if(!url) return; // no custom URL → keep default inline style from HTML
    const pos=saved[s.k]?.pos||'center center';
    el.style.background=`url('${url}') ${pos}/cover no-repeat,${s.fb}`;
  });
}

function _loadSecPhotoAdmin(){
  const saved=JSON.parse(localStorage.getItem(_SPH_KEY)||'{}');
  _SPH_SECS.forEach(s=>{
    const u=document.getElementById('spc-'+s.k+'-url');
    const p=document.getElementById('spc-'+s.k+'-pos');
    if(u) u.value=saved[s.k]?.url||'';
    if(p) p.value=saved[s.k]?.pos||'center center';
    _sphUpdatePreview(s.k);
  });
}

function _sphUpdatePreview(k){
  const u=document.getElementById('spc-'+k+'-url');
  const p=document.getElementById('spc-'+k+'-pos');
  const prev=document.getElementById('spc-'+k+'-prev');
  if(!prev) return;
  const url=(u?.value||'').trim();
  const pos=p?.value||'center center';
  const s=_SPH_SECS.find(x=>x.k===k);
  prev.style.background=url
    ?`url('${url}') ${pos}/cover no-repeat,${s.fb}`
    :s.fb;
}

function _saveSecPhotos(){
  const data={};
  _SPH_SECS.forEach(s=>{
    const url=(document.getElementById('spc-'+s.k+'-url')?.value||'').trim();
    const pos=document.getElementById('spc-'+s.k+'-pos')?.value||'center center';
    if(url) data[s.k]={url,pos};
  });
  localStorage.setItem(_SPH_KEY,JSON.stringify(data));
  _applySecPhotos();
  toast('Imágenes de secciones guardadas');
}

function _resetSecPhotos(){
  if(!confirm('¿Restaurar todas las imágenes a las predeterminadas?')) return;
  localStorage.removeItem(_SPH_KEY);
  _applySecPhotos();
  _loadSecPhotoAdmin();
  toast('Imágenes restauradas');
}

function _initSecCollapse(){
  document.querySelectorAll('.form-sec-hd').forEach(hd=>{
    const card=hd.closest('.card');
    if(!card||card.dataset.secInit) return;
    card.dataset.secInit='1';
    card.classList.add('sec-card','collapsed');
    hd.addEventListener('click',()=>card.classList.toggle('collapsed'));
  });
}

document.addEventListener('DOMContentLoaded',()=>{ _initSecCollapse(); });

// ═══════════════════════════════════════════
// ADMIN ACTIVITY LOG
// ═══════════════════════════════════════════
let _logPage=0, _logPageSize=25, _logData=null;

function _relTime(ts){
  const diff=Date.now()-new Date(ts).getTime();
  const m=Math.floor(diff/60000);
  if(m<1)return'ahora';
  if(m<60)return'hace '+m+'m';
  const h=Math.floor(m/60);
  if(h<24)return'hace '+h+'h';
  const d=Math.floor(h/24);
  if(d<30)return'hace '+d+'d';
  return new Date(ts).toLocaleDateString('es-AR',{day:'2-digit',month:'short'});
}

function _renderLogTable(){
  const el=document.getElementById('admin-log');
  if(!el||!_logData)return;

  const errLog=window._appLog||[];
  const stLbl={borrador:'Borrador',enviada:'Enviada',confirmada:'Confirmada',cancelada:'Cancelada'};
  let html='';

  // --- Error section (unchanged timeline layout) ---
  if(errLog.length){
    html+=`<div class="alog-list">`;
    html+=`<div class="alog-section-hdr">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Errores de sesion (${errLog.length})
      <button onclick="window._appLog=[];loadAdminLog()" class="alog-clear-btn">Limpiar</button>
    </div>`;
    html+=errLog.map(e=>{
      const dt=new Date(e.ts);
      const dtStr=dt.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      return`<div class="alog-item alog-item-err">
        <div class="alog-dot alog-dot-red"></div>
        <div class="alog-body">
          <div class="alog-top">
            <span class="alog-ref" style="color:var(--color-red,#EF4444)">${e.ctx||'error'}</span>
            ${e.code?`<span class="status-badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.2)">${e.code}</span>`:''}
          </div>
          <div class="alog-nm" style="color:var(--text)">${_escHtml(e.msg)}</div>
          ${e.details?`<div class="alog-dest">${_escHtml(e.details)}</div>`:''}
          <div class="alog-meta">
            <span class="alog-time">${dtStr}</span>
            <span style="color:var(--border2)">·</span>
            <span class="alog-rel">${_relTime(e.ts)}</span>
          </div>
        </div>
      </div>`;
    }).join('');
    html+=`</div>`;
  }

  // --- Activity table with pagination ---
  const total=_logData.length;
  const totalPages=Math.max(1,Math.ceil(total/_logPageSize));
  if(_logPage>=totalPages)_logPage=totalPages-1;
  if(_logPage<0)_logPage=0;
  const start=_logPage*_logPageSize;
  const page=_logData.slice(start,start+_logPageSize);

  if(errLog.length||total){
    html+=`<div class="alog-section-hdr" style="${errLog.length?'margin-top:12px':''}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Actividad de cotizaciones (${total})
    </div>`;
  }

  // Pagination bar
  if(total>0){
    html+=`<div class="log-pager">
      <span>Mostrar</span>
      <select onchange="_setLogPageSize(+this.value)">
        <option value="10"${_logPageSize===10?' selected':''}>10</option>
        <option value="25"${_logPageSize===25?' selected':''}>25</option>
        <option value="50"${_logPageSize===50?' selected':''}>50</option>
      </select>
      <span style="margin-left:auto">Pagina ${_logPage+1} de ${totalPages}</span>
      <span style="color:var(--g3)">(${total} total)</span>
      <button onclick="_logPrevPage()"${_logPage===0?' disabled':''}>Anterior</button>
      <button onclick="_logNextPage()"${_logPage>=totalPages-1?' disabled':''}>Siguiente</button>
    </div>`;
  }

  // Table
  if(page.length){
    html+=`<div class="tbl-wrap"><table class="tbl">
    <thead><tr>
      <th>Ref</th><th>Cliente</th><th>Destino</th><th>Estado</th><th>Fecha</th><th>Hace</th>
    </tr></thead><tbody>`;
    html+=page.map(r=>{
      const est=r.estado||'borrador';
      const nm=r.datos?.cliente?.nombre||'Sin nombre';
      const dest=r.destino||r.datos?.viaje?.destino||'--';
      const dt=new Date(r.creado_en||Date.now());
      const dtStr=dt.toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})+' '+dt.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
      return`<tr>
        <td><span style="font-family:'DM Mono',monospace;font-size:.72rem;font-weight:600;letter-spacing:1px;color:var(--primary)">${r.ref_id||'--'}</span></td>
        <td>${_escHtml(nm)}</td>
        <td style="color:var(--g4)">${_escHtml(dest)}</td>
        <td><span class="status-badge st-${est}">${stLbl[est]||est}</span></td>
        <td style="font-size:.78rem;white-space:nowrap">${dtStr}</td>
        <td style="font-size:.78rem;font-weight:600;color:var(--primary);white-space:nowrap">${_relTime(r.creado_en)}</td>
      </tr>`;
    }).join('');
    html+=`</tbody></table></div>`;
  } else if(!errLog.length){
    html+='<div class="empty-state" style="padding:40px"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><p>Sin actividad registrada</p><small>Los errores y cotizaciones creadas apareceran aqui</small></div>';
  }

  el.innerHTML=html;

  const cnt=document.getElementById('admin-log-count');
  const totalAll=(errLog.length||0)+total;
  if(cnt) cnt.textContent=totalAll?'Ultimas '+totalAll:'';
}

function _setLogPageSize(v){_logPageSize=v;_logPage=0;_renderLogTable();}
function _logPrevPage(){if(_logPage>0){_logPage--;_renderLogTable();}}
function _logNextPage(){const totalPages=Math.ceil((_logData||[]).length/_logPageSize);if(_logPage<totalPages-1){_logPage++;_renderLogTable();}}

async function loadAdminLog(){
  const el=document.getElementById('admin-log');
  if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:36px;color:var(--g3)"><span class="spin spin-tq"></span></div>';

  const {data,error}=await sb.from('cotizaciones')
    .select('ref_id,destino,estado,creado_en,datos,agente_id')
    .order('creado_en',{ascending:false})
    .limit(500);

  if(error){
    _captureError('loadAdminLog',error);
  }

  _logData=data||[];
  _logPage=0;
  _renderLogTable();
}

function _escHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════
// AGENCY PANEL — Tabs: Agentes | Cotizaciones | Clientes | Proveedores
// ═══════════════════════════════════════════
let _agAgencyId=null; // cached agencia_id for current user
let _agQuotesData=[]; // cached quotes for agency
let _agClientsData=[]; // cached clients for agency

// Tab switching
function _agTab(tab){
  document.querySelectorAll('.ag-tab').forEach(b=>b.classList.toggle('on',b.dataset.agtab===tab));
  document.querySelectorAll('.ag-panel').forEach(p=>p.classList.toggle('on',p.id==='agp-'+tab));
  // Lazy load data for the tab
  if(tab==='cotizaciones') _loadAgQuotes();
  if(tab==='clientes') _loadAgClients();
  if(tab==='proveedores') _loadAgProviders();
  if(tab==='promos-vig') _loadPromosVig();
}

// Get agencia_id (cached)
async function _getAgencyId(){
  if(_agAgencyId) return _agAgencyId;
  if(!window._agenteId) return null;
  const {data}=await sb.from('agentes').select('agencia_id').eq('id',window._agenteId).maybeSingle();
  _agAgencyId=data?.agencia_id||null;
  return _agAgencyId;
}

async function renderAgency(){
  if(currentRol!=='agencia'&&currentRol!=='admin') return;
  const agId=await _getAgencyId();
  // Show agency name preview in collapsed header
  if(agId){
    const {data:ag}=await sb.from('agencias').select('nombre').eq('id',agId).maybeSingle();
    const prev=document.getElementById('ag-name-preview');
    if(prev&&ag?.nombre) prev.textContent=ag.nombre;
  }
  // Load first tab (agentes) by default
  await _loadAgAgentes();
  // Also load providers for datalists
  const {data:provs}=await sb.from('proveedores').select('*').order('nombre');
  _allProvs=provs||[];
  buildDataLists(provs||[]);
}

// ── Tab: Agentes ──
async function _loadAgAgentes(){
  const agId=await _getAgencyId();
  let ags=[];
  if(agId){
    const {data}=await sb.from('agentes').select('*').eq('agencia_id',agId).order('nombre');
    ags=data||[];
  }
  const el=document.getElementById('agency-agentes');
  if(!el) return;
  if(!ags.length){
    el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)">Sin agentes en tu agencia.</div>';
    return;
  }
  el.innerHTML=`<table class="tbl"><thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th></th></tr></thead><tbody>
  ${ags.map(a=>`<tr>
    <td><strong>${a.nombre||'\u2014'}</strong></td>
    <td>${a.email||''}</td>
    <td><span class="status-badge ${a.rol==='agencia'?'st-enviada':'st-borrador'}">${{agencia:'Agencia',agente:'Agente'}[a.rol]||a.rol}</span></td>
    <td>${a.activo?'<span style="color:var(--primary);font-weight:600">S\u00ed</span>':'<span style="color:var(--g3)">No</span>'}</td>
    <td style="text-align:right">${a.id!==window._agenteId?`<button class="btn btn-out btn-xs" onclick="_toggleAgentActive('${a.id}',${!a.activo})">${a.activo?'Desactivar':'Activar'}</button>`:''}</td>
  </tr>`).join('')}</tbody></table>`;
}

async function _toggleAgentActive(agId,active){
  const {error}=await sb.from('agentes').update({activo:active}).eq('id',agId);
  if(error){toast('Error: '+error.message,false);return;}
  toast(active?'Agente activado':'Agente desactivado');
  _loadAgAgentes();
}

// ── Tab: Cotizaciones (RO) ──
async function _loadAgQuotes(){
  const el=document.getElementById('agency-quotes');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)"><span class="spin spin-tq"></span> Cargando...</div>';
  await _loadAgentNames();
  const agId=await _getAgencyId();
  if(!agId){el.innerHTML='<div style="padding:20px;color:var(--g3)">Sin agencia asociada.</div>';return;}
  // Get all agentes of this agency, then their quotes
  const {data:agentes}=await sb.from('agentes').select('id').eq('agencia_id',agId);
  const ids=(agentes||[]).map(a=>a.id);
  if(!ids.length){el.innerHTML='<div style="padding:20px;color:var(--g3)">Sin agentes en la agencia.</div>';return;}
  const {data}=await sb.from('cotizaciones').select('*').in('agente_id',ids).order('creado_en',{ascending:false}).limit(200);
  _agQuotesData=data||[];
  _renderAgQuotes();
}

function _renderAgQuotes(){
  const el=document.getElementById('agency-quotes');
  if(!el) return;
  const srch=(document.getElementById('ag-quot-search')?.value||'').toLowerCase().trim();
  const stLbl={borrador:'Borrador',enviada:'Enviada',confirmada:'Confirmada',cancelada:'Cancelada'};
  const filtered=_agQuotesData.filter(r=>{
    if(!srch) return true;
    const nm=(r.datos?.cliente?.nombre||'').toLowerCase();
    const dest=(r.destino||'').toLowerCase();
    const ref=(r.ref_id||'').toLowerCase();
    return nm.includes(srch)||dest.includes(srch)||ref.includes(srch);
  });
  if(!filtered.length){
    el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)">Sin cotizaciones.</div>';
    return;
  }
  const shown=filtered.slice(0,50);
  el.innerHTML=`<table class="tbl" style="font-size:.82rem"><thead><tr><th>Ref</th><th>Cliente</th><th>Destino</th><th>Agente</th><th>Estado</th><th>Fecha</th><th></th></tr></thead><tbody>
  ${shown.map(r=>{
    const agName=_agentNames[r.agente_id]||'';
    return `<tr>
    <td style="font-family:'DM Mono',monospace;font-size:.75rem;color:var(--g4)">${r.ref_id||'\u2014'}</td>
    <td>${r.datos?.cliente?.nombre||'\u2014'}</td>
    <td>${r.destino||'\u2014'}</td>
    <td style="color:var(--primary);font-weight:600">${agName}</td>
    <td><span class="status-badge st-${r.estado||'borrador'}">${stLbl[r.estado]||r.estado||'borrador'}</span></td>
    <td style="font-size:.75rem;color:var(--g4)">${new Date(r.creado_en||r.updated_at||Date.now()).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}</td>
    <td><button class="btn btn-out btn-xs" onclick="loadFromHistory('${r.ref_id}','${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver</button></td>
    </tr>`;}).join('')}</tbody></table>
  <div style="padding:8px 16px;font-size:.75rem;color:var(--g3)">Mostrando ${shown.length} de ${filtered.length}</div>`;
}

// ── Tab: Clientes (RO) ──
async function _loadAgClients(){
  const el=document.getElementById('agency-clients');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)"><span class="spin spin-tq"></span> Cargando...</div>';
  await _loadAgentNames();
  const agId=await _getAgencyId();
  if(!agId){el.innerHTML='<div style="padding:20px;color:var(--g3)">Sin agencia asociada.</div>';return;}
  const {data:agentes}=await sb.from('agentes').select('id').eq('agencia_id',agId);
  const ids=(agentes||[]).map(a=>a.id);
  if(!ids.length){el.innerHTML='<div style="padding:20px;color:var(--g3)">Sin agentes.</div>';return;}
  const {data}=await sb.from('clientes').select('*').in('agente_id',ids).order('nombre');
  _agClientsData=data||[];
  _renderAgClients();
}

function _renderAgClients(){
  const el=document.getElementById('agency-clients');
  if(!el) return;
  const srch=(document.getElementById('ag-cli-search')?.value||'').toLowerCase().trim();
  const filtered=_agClientsData.filter(c=>{
    if(!srch) return true;
    return (c.nombre||'').toLowerCase().includes(srch)||(c.email||'').toLowerCase().includes(srch)||(c.celular||'').includes(srch);
  });
  if(!filtered.length){
    el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)">Sin clientes.</div>';
    return;
  }
  const shown=filtered.slice(0,50);
  el.innerHTML=`<table class="tbl" style="font-size:.82rem"><thead><tr><th>Nombre</th><th>Email</th><th>Telefono</th><th>Agente</th><th></th></tr></thead><tbody>
  ${shown.map(c=>{
    const agName=_agentNames[c.agente_id]||'';
    return `<tr>
    <td><strong>${c.nombre||'\u2014'}</strong></td>
    <td>${c.email||'\u2014'}</td>
    <td>${c.celular||'\u2014'}</td>
    <td style="color:var(--primary);font-weight:600">${agName}</td>
    <td><button class="btn btn-out btn-xs" onclick="openClientModal('${c.id}')" title="Solo lectura"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td>
    </tr>`;}).join('')}</tbody></table>
  <div style="padding:8px 16px;font-size:.75rem;color:var(--g3)">Mostrando ${shown.length} de ${filtered.length}</div>`;
}

// ── Tab: Proveedores ──
let _agProvsData=[];
async function _loadAgProviders(){
  const el=document.getElementById('agency-proveedores');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)"><span class="spin spin-tq"></span> Cargando...</div>';
  const agId=await _getAgencyId();
  if(!agId){el.innerHTML='<div style="padding:20px;color:var(--g3)">Sin agencia asociada.</div>';return;}
  const {data}=await sb.from('proveedores').select('*').eq('agencia_id',agId).order('nombre');
  _agProvsData=data||[];
  _renderAgProviders();
}

function _renderAgProviders(){
  const el=document.getElementById('agency-proveedores');
  if(!el) return;
  const srch=(document.getElementById('ag-prov-search')?.value||'').toLowerCase().trim();
  const typeLbl={hotel:'Hotel',traslado:'Traslado',excursion:'Excursion',seguro:'Seguro',asistencia:'Asistencia',DMC:'DMC',receptivo:'Receptivo',aerolinea:'Aerolinea',crucero:'Crucero',otro:'Otro'};
  const filtered=_agProvsData.filter(p=>{
    if(!srch) return true;
    return (p.nombre||'').toLowerCase().includes(srch)||(p.tipo||'').toLowerCase().includes(srch)||(p.ciudad||'').toLowerCase().includes(srch);
  });
  if(!filtered.length){
    el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)">Sin proveedores.</div>';
    return;
  }
  el.innerHTML=`<table class="tbl" style="font-size:.82rem"><thead><tr><th>Nombre</th><th>Tipo</th><th>Ciudad</th><th>Contacto</th><th></th></tr></thead><tbody>
  ${filtered.map(p=>`<tr>
    <td><strong>${p.nombre||'\u2014'}</strong></td>
    <td><span class="status-badge st-borrador">${typeLbl[p.tipo]||p.tipo||'\u2014'}</span></td>
    <td>${p.ciudad||'\u2014'}</td>
    <td style="font-size:.75rem">${p.email||p.telefono||'\u2014'}</td>
    <td style="text-align:right">
      <button class="btn btn-out btn-xs" onclick="openProvModal('${p.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="btn btn-del btn-xs" onclick="_deleteAgProv('${p.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    </td>
  </tr>`).join('')}</tbody></table>`;
}

async function _deleteAgProv(id){
  if(!confirm('Eliminar este proveedor?')) return;
  const {error}=await sb.from('proveedores').delete().eq('id',id);
  if(error){toast('Error: '+error.message,false);return;}
  toast('Proveedor eliminado');
  _loadAgProviders();
}

// ── Save agency data ──
async function saveAgencyData(){
  if(!window._agenteId){toast('Error: no se pudo identificar tu cuenta',false);return;}
  const v=id=>(document.getElementById(id)?.value||'').trim();
  const agData={};
  if(v('ag-nombre')) agData.nombre=v('ag-nombre');
  if(v('ag-email')) agData.email=v('ag-email');
  if(v('ag-tel')) agData.telefono=v('ag-tel');
  if(v('ag-dir')) agData.direccion=v('ag-dir');
  const agId=await _getAgencyId();
  if(!agId){toast('Error: no se encontro tu agencia',false);return;}
  const {error}=await sb.from('agencias').update(agData).eq('id',agId);
  if(error){toast('Error al guardar: '+error.message,false);console.error('[saveAgencyData]',error);return;}
  if(agData.nombre){
    agCfg.ag=agData.nombre;
    const prev=document.getElementById('ag-name-preview');
    if(prev) prev.textContent=agData.nombre;
  }
  _saveAgCfg();
  toast('Datos de agencia guardados');
}

// Load agency data from Supabase
async function _loadAgencyFields(){
  if(!window._agenteId)return;
  try{
    const agId=await _getAgencyId();
    if(!agId)return;
    const {data}=await sb.from('agencias').select('nombre,email,telefono,direccion').eq('id',agId).maybeSingle();
    if(!data)return;
    const el=id=>document.getElementById(id);
    if(data.nombre && el('ag-nombre')) el('ag-nombre').value=data.nombre;
    if(data.email && el('ag-email')) el('ag-email').value=data.email;
    if(data.telefono && el('ag-tel')) el('ag-tel').value=data.telefono;
    if(data.direccion && el('ag-dir')) el('ag-dir').value=data.direccion;
    const prev=document.getElementById('ag-name-preview');
    if(prev&&data.nombre) prev.textContent=data.nombre;
  }catch(e){console.warn('[_loadAgencyFields]',e);}
}

// ═══════════════════════════════════════════
// SOPORTE / TICKETS
// ═══════════════════════════════════════════
let _ticketsData=[];

async function renderSupportTickets(){
  const isAdm=currentRol==='admin';
  // UI toggles
  const sub=document.getElementById('support-subtitle');
  if(sub) sub.textContent=isAdm?'Tickets de soporte de agentes y agencias.':'Envia consultas o reporta problemas al equipo de ermix.';
  const formW=document.getElementById('support-form-wrap');
  if(formW) formW.style.display=isAdm?'none':'';
  const filters=document.getElementById('support-filters');
  if(filters) filters.style.display=isAdm?'flex':'none';
  const listTitle=document.getElementById('support-list-title');
  if(listTitle) listTitle.textContent=isAdm?'Todos los tickets':'Mis tickets';
  // Load tickets
  await _loadTickets();
}

async function _loadTickets(){
  const el=document.getElementById('support-list');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:36px;color:var(--g3)"><span class="spin spin-tq"></span></div>';
  try{
    const isAdm=currentRol==='admin';
    let q=sb.from('tickets_soporte').select('*').order('creado_en',{ascending:false});
    if(!isAdm) q=q.eq('agente_id',window._agenteId);
    const {data,error}=await q;
    if(error){
      el.innerHTML=`<div style="padding:20px;color:var(--red);font-size:.82rem">Error: ${error.message}</div>`;
      return;
    }
    _ticketsData=data||[];
    // Load agent names for admin view
    if(isAdm) await _loadAgentNames();
    _renderTickets();
  }catch(e){
    el.innerHTML='<div style="padding:20px;color:var(--red);font-size:.82rem">Error al cargar tickets.</div>';
    console.error('[_loadTickets]',e);
  }
}

function _renderTickets(){
  const el=document.getElementById('support-list');
  if(!el) return;
  const isAdm=currentRol==='admin';
  const filtro=document.getElementById('tk-filter-estado')?.value||'';
  const filtered=_ticketsData.filter(t=>!filtro||t.estado===filtro);

  if(!filtered.length){
    el.innerHTML=`<div style="text-align:center;padding:40px 20px">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--g3)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <p style="margin-top:10px;font-weight:600;color:var(--text)">Sin tickets${filtro?' con ese estado':''}</p>
      <small style="color:var(--g3)">${isAdm?'No hay consultas pendientes.':'Usa el formulario de arriba para enviar una consulta.'}</small>
    </div>`;
    return;
  }

  const estBadge=e=>{
    const c={abierto:'#f59e0b',en_progreso:'#0EA5E9',resuelto:'#22c55e'};
    const l={abierto:'Abierto',en_progreso:'En progreso',resuelto:'Resuelto'};
    return `<span style="font-size:.65rem;font-weight:700;padding:3px 10px;border-radius:12px;background:${c[e]||'var(--g1)'}22;color:${c[e]||'var(--g4)'}">${l[e]||e}</span>`;
  };
  const priBadge=p=>{
    const c={baja:'var(--g3)',normal:'var(--primary)',alta:'#ef4444'};
    return `<span style="font-size:.62rem;font-weight:600;color:${c[p]||'var(--g3)'};text-transform:uppercase;letter-spacing:.5px">${p||'normal'}</span>`;
  };
  const fmtDate=d=>{try{return new Date(d).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(e){return'';}};

  el.innerHTML=filtered.map(t=>{
    const resp=(t.respuestas||[]);
    const agName=isAdm&&t.agente_id&&_agentNames[t.agente_id]?_agentNames[t.agente_id]:'';
    return `<div class="tk-item" onclick="_openTicket('${t.id}')">
      <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;cursor:pointer">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.85rem;color:var(--text);margin-bottom:3px">${t.asunto||'Sin asunto'}</div>
          <div style="font-size:.75rem;color:var(--g4)">${fmtDate(t.creado_en)}${agName?' · <span style="color:var(--primary);font-weight:600">'+agName+'</span>':''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
          ${estBadge(t.estado)}
          ${priBadge(t.prioridad)}
        </div>
      </div>
      ${resp.length?`<div style="padding:0 16px 8px;font-size:.72rem;color:var(--g3)">${resp.length} respuesta${resp.length>1?'s':''}</div>`:''}
    </div>`;
  }).join('');
}

async function _submitTicket(){
  const asunto=(document.getElementById('tk-asunto')?.value||'').trim();
  const desc=(document.getElementById('tk-desc')?.value||'').trim();
  const prio=document.getElementById('tk-prioridad')?.value||'normal';
  if(!asunto){toast('Ingresa un asunto para el ticket.',false);return;}
  const row={asunto,descripcion:desc,prioridad:prio,agente_id:window._agenteId,estado:'abierto'};
  if(window._agenciaId) row.agencia_id=window._agenciaId;
  const {error}=await sb.from('tickets_soporte').insert(row);
  if(error){toast('Error al crear ticket: '+error.message,false);console.error('[_submitTicket]',error);return;}
  toast('Ticket enviado');
  document.getElementById('tk-asunto').value='';
  document.getElementById('tk-desc').value='';
  document.getElementById('tk-prioridad').value='normal';
  _loadTickets();
}

function _openTicket(id){
  const t=_ticketsData.find(x=>x.id===id);
  if(!t) return;
  const isAdm=currentRol==='admin';
  const fmtDate=d=>{try{return new Date(d).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(e){return'';}};
  const resp=(t.respuestas||[]);
  const estOpts=isAdm?`<select class="finput" id="tk-modal-estado" style="width:auto;padding:6px 10px;font-size:.78rem">
    <option value="abierto"${t.estado==='abierto'?' selected':''}>Abierto</option>
    <option value="en_progreso"${t.estado==='en_progreso'?' selected':''}>En progreso</option>
    <option value="resuelto"${t.estado==='resuelto'?' selected':''}>Resuelto</option>
  </select>`:`<span style="font-weight:600;color:var(--primary)">${{abierto:'Abierto',en_progreso:'En progreso',resuelto:'Resuelto'}[t.estado]||t.estado}</span>`;

  const html=`
    <div style="margin-bottom:16px">
      <div style="font-size:1rem;font-weight:700;color:var(--text)">${t.asunto}</div>
      <div style="font-size:.75rem;color:var(--g4);margin-top:4px">${fmtDate(t.creado_en)} · Prioridad: ${t.prioridad||'normal'}</div>
    </div>
    ${t.descripcion?`<div style="background:var(--g1);padding:12px;border-radius:var(--r2);font-size:.82rem;color:var(--text);margin-bottom:16px;white-space:pre-wrap">${t.descripcion}</div>`:''}
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
      <span class="lbl" style="margin:0">Estado:</span> ${estOpts}
    </div>
    ${resp.length?`<div style="margin-bottom:16px">
      <div class="lbl" style="margin-bottom:8px">Historial (${resp.length})</div>
      ${resp.map(r=>`<div style="padding:10px 12px;background:${r.from==='admin'?'rgba(27,158,143,0.06)':'var(--g1)'};border-radius:var(--r2);margin-bottom:6px;font-size:.8rem">
        <div style="font-weight:600;font-size:.72rem;color:${r.from==='admin'?'var(--primary)':'var(--g4)'};margin-bottom:3px">${r.from==='admin'?'Soporte ermix':'Tu'} · ${fmtDate(r.fecha)}</div>
        <div style="color:var(--text);white-space:pre-wrap">${r.texto}</div>
      </div>`).join('')}
    </div>`:''}
    ${isAdm?`<div class="fg full" style="margin-bottom:12px"><label class="lbl">Responder</label><textarea class="finput" id="tk-modal-resp" rows="3" placeholder="Escribe tu respuesta..." style="resize:vertical"></textarea></div>`:''}
    <div style="display:flex;gap:8px">
      ${isAdm?`<button class="btn btn-cta" onclick="_replyTicket('${t.id}')">Enviar respuesta</button>`:''}
      ${isAdm?`<button class="btn btn-pri" onclick="_updateTicketStatus('${t.id}')">Guardar estado</button>`:''}
      <button class="btn btn-out" onclick="closeModal()" style="margin-left:auto">Cerrar</button>
    </div>`;
  document.getElementById('modal-content').innerHTML=html;
  document.getElementById('modal-overlay').style.display='block';
  document.getElementById('modal-box').style.display='block';
}

async function _replyTicket(id){
  const texto=(document.getElementById('tk-modal-resp')?.value||'').trim();
  if(!texto){toast('Escribe una respuesta.',false);return;}
  const t=_ticketsData.find(x=>x.id===id);
  if(!t) return;
  const resp=[...(t.respuestas||[]),{from:'admin',texto,fecha:new Date().toISOString()}];
  const {error}=await sb.from('tickets_soporte').update({respuestas:resp}).eq('id',id);
  if(error){toast('Error: '+error.message,false);return;}
  toast('Respuesta enviada');
  closeModal();
  _loadTickets();
}

async function _updateTicketStatus(id){
  const estado=document.getElementById('tk-modal-estado')?.value;
  if(!estado) return;
  const upd={estado};
  if(estado==='resuelto') upd.resuelto_en=new Date().toISOString();
  const {error}=await sb.from('tickets_soporte').update(upd).eq('id',id);
  if(error){toast('Error: '+error.message,false);return;}
  toast('Estado actualizado');
  closeModal();
  _loadTickets();
}

// ═══════════════════════════════════════════
// PROMOCIONES VIGENTES (agencia CRUD + agente RO)
// ═══════════════════════════════════════════
let _promosVigData=[];
const _pvCatLabels={disney:'Disney',universal:'Universal',hotel:'Hotel',crucero:'Crucero',tickets:'Tickets',comida:'Plan de comida',paquete:'Paquete',descuento:'Descuento',otro:'Otro'};
const _pvCatColors={disney:'#0EA5E9',universal:'#9B7FD4',hotel:'#D4A017',crucero:'#0288D1',tickets:'#22c55e',comida:'#E8826A',paquete:'#1B9E8F',descuento:'#ef4444',otro:'#94a3b8'};

function _pvEstado(p){
  if(!p.activa) return {label:'Inactiva',color:'#94a3b8'};
  const hoy=new Date().toISOString().slice(0,10);
  if(p.fecha_vencimiento<hoy) return {label:'Vencida',color:'#ef4444'};
  // Warn if expires in 7 days
  const diff=(new Date(p.fecha_vencimiento)-new Date(hoy))/(1000*60*60*24);
  if(diff<=7) return {label:'Por vencer',color:'#f59e0b'};
  return {label:'Vigente',color:'#22c55e'};
}

// ── Load promos for agencia tab ──
async function _loadPromosVig(){
  const el=document.getElementById('promos-vig-list');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)"><span class="spin spin-tq"></span></div>';
  const agId=window._agenciaId;
  if(!agId){el.innerHTML='<div style="padding:20px;color:var(--g3)">Sin agencia asociada.</div>';return;}
  const {data,error}=await sb.from('promociones_agencia').select('*').eq('agencia_id',agId).order('fecha_vencimiento',{ascending:false});
  if(error){el.innerHTML=`<div style="padding:20px;color:var(--red);font-size:.82rem">Error: ${error.message}</div>`;return;}
  _promosVigData=data||[];
  _renderPromosVig();
}

function _renderPromosVig(){
  const el=document.getElementById('promos-vig-list');
  if(!el) return;
  const srch=(document.getElementById('pv-search')?.value||'').toLowerCase().trim();
  const estFilter=document.getElementById('pv-filter-estado')?.value||'';
  const hoy=new Date().toISOString().slice(0,10);
  const filtered=_promosVigData.filter(p=>{
    if(srch&&!(p.titulo||'').toLowerCase().includes(srch)&&!(_pvCatLabels[p.categoria]||'').toLowerCase().includes(srch)) return false;
    if(estFilter==='vigente'&&(p.fecha_vencimiento<hoy||!p.activa)) return false;
    if(estFilter==='vencida'&&p.fecha_vencimiento>=hoy) return false;
    return true;
  });
  if(!filtered.length){
    el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)">Sin promociones.</div>';
    return;
  }
  const fmtD=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d;}};
  const isAgencia=currentRol==='agencia';
  el.innerHTML=filtered.map(p=>{
    const st=_pvEstado(p);
    const catC=_pvCatColors[p.categoria]||'#94a3b8';
    return `<div class="tk-item">
      <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.85rem;color:var(--text);margin-bottom:3px">${p.titulo}</div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:2px">
            <span style="font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:10px;background:${catC}22;color:${catC}">${_pvCatLabels[p.categoria]||p.categoria}</span>
            <span style="font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:10px;background:${st.color}22;color:${st.color}">${st.label}</span>
          </div>
          <div style="font-size:.72rem;color:var(--g4)">Vence: ${fmtD(p.fecha_vencimiento)}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn btn-out btn-xs" onclick="_viewPromoVig('${p.id}')" title="Ver detalle"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
          ${isAgencia?`<button class="btn btn-out btn-xs" onclick="_openPromoVigModal('${p.id}')" title="Editar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn btn-del btn-xs" onclick="_deletePromoVig('${p.id}')" title="Eliminar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── View promo detail (modal, all roles) ──
function _viewPromoVig(id){
  const p=_promosVigData.find(x=>x.id===id);
  if(!p) return;
  const st=_pvEstado(p);
  const fmtD=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d;}};
  const catC=_pvCatColors[p.categoria]||'#94a3b8';
  const html=`
    <div style="margin-bottom:16px">
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
        <span style="font-size:.65rem;font-weight:700;padding:3px 10px;border-radius:10px;background:${catC}22;color:${catC}">${_pvCatLabels[p.categoria]||p.categoria}</span>
        <span style="font-size:.65rem;font-weight:700;padding:3px 10px;border-radius:10px;background:${st.color}22;color:${st.color}">${st.label}</span>
      </div>
      <div style="font-size:1.05rem;font-weight:700;color:var(--text)">${p.titulo}</div>
    </div>
    ${p.descripcion?`<div style="margin-bottom:16px"><div class="lbl" style="margin-bottom:4px">Descripcion</div><div style="background:var(--g1);padding:12px;border-radius:var(--r2);font-size:.82rem;color:var(--text);white-space:pre-wrap">${p.descripcion}</div></div>`:''}
    ${p.condiciones?`<div style="margin-bottom:16px"><div class="lbl" style="margin-bottom:4px">Condiciones</div><div style="background:var(--g1);padding:12px;border-radius:var(--r2);font-size:.82rem;color:var(--text);white-space:pre-wrap">${p.condiciones}</div></div>`:''}
    <div style="display:flex;gap:16px;font-size:.8rem;color:var(--g4);margin-bottom:16px">
      <span>Inicio: ${fmtD(p.fecha_inicio)}</span>
      <span>Vence: ${fmtD(p.fecha_vencimiento)}</span>
    </div>
    <button class="btn btn-out" onclick="closeModal()" style="width:100%;justify-content:center">Cerrar</button>`;
  document.getElementById('modal-content').innerHTML=html;
  document.getElementById('modal-overlay').style.display='block';
  document.getElementById('modal-box').style.display='block';
}

// ── Create/edit promo modal (agencia only) ──
function _openPromoVigModal(editId){
  const p=editId?_promosVigData.find(x=>x.id===editId):null;
  const hoy=new Date().toISOString().slice(0,10);
  const catOpts=Object.entries(_pvCatLabels).map(([k,v])=>`<option value="${k}"${p?.categoria===k?' selected':''}>${v}</option>`).join('');
  const html=`
    <div style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:16px">${p?'Editar':'Nueva'} promocion</div>
    <div class="g2">
      <div class="fg full"><label class="lbl">Titulo</label><input class="finput" id="pvm-titulo" value="${p?.titulo||''}" placeholder="Ej: Disney 4 dias + comida gratis"></div>
      <div class="fg"><label class="lbl">Categoria</label><select class="finput" id="pvm-cat">${catOpts}</select></div>
      <div class="fg"><label class="lbl">Prioridad / estado</label><select class="finput" id="pvm-activa"><option value="true"${!p||p.activa?' selected':''}>Activa</option><option value="false"${p&&!p.activa?' selected':''}>Inactiva</option></select></div>
      <div class="fg"><label class="lbl">Fecha inicio</label><input class="finput" type="date" id="pvm-inicio" value="${p?.fecha_inicio||hoy}"></div>
      <div class="fg"><label class="lbl">Fecha vencimiento</label><input class="finput" type="date" id="pvm-venc" value="${p?.fecha_vencimiento||''}"></div>
      <div class="fg full"><label class="lbl">Descripcion</label><textarea class="finput" id="pvm-desc" rows="3" style="resize:vertical" placeholder="Detalle de la promocion...">${p?.descripcion||''}</textarea></div>
      <div class="fg full"><label class="lbl">Condiciones</label><textarea class="finput" id="pvm-cond" rows="2" style="resize:vertical" placeholder="Condiciones, restricciones, blackout dates...">${p?.condiciones||''}</textarea></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-cta" onclick="_savePromoVig('${editId||''}')">Guardar</button>
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
    </div>`;
  document.getElementById('modal-content').innerHTML=html;
  document.getElementById('modal-overlay').style.display='block';
  document.getElementById('modal-box').style.display='block';
}

async function _savePromoVig(editId){
  const v=id=>(document.getElementById(id)?.value||'').trim();
  const titulo=v('pvm-titulo');
  if(!titulo){toast('Ingresa un titulo.',false);return;}
  const venc=v('pvm-venc');
  if(!venc){toast('Ingresa fecha de vencimiento.',false);return;}
  const row={
    titulo,
    categoria:v('pvm-cat')||'otro',
    descripcion:v('pvm-desc'),
    condiciones:v('pvm-cond'),
    fecha_inicio:v('pvm-inicio')||new Date().toISOString().slice(0,10),
    fecha_vencimiento:venc,
    activa:v('pvm-activa')==='true',
    agencia_id:window._agenciaId,
    creado_por:window._agenteId
  };
  let error;
  if(editId){
    ({error}=await sb.from('promociones_agencia').update(row).eq('id',editId));
  } else {
    ({error}=await sb.from('promociones_agencia').insert(row));
  }
  if(error){toast('Error: '+error.message,false);console.error('[_savePromoVig]',error);return;}
  toast(editId?'Promocion actualizada':'Promocion creada');
  closeModal();
  _loadPromosVig();
}

async function _deletePromoVig(id){
  if(!confirm('Eliminar esta promocion?')) return;
  const {error}=await sb.from('promociones_agencia').delete().eq('id',id);
  if(error){toast('Error: '+error.message,false);return;}
  toast('Promocion eliminada');
  _loadPromosVig();
}

// ── Agente: load promos vigentes RO ──
let _promosVigAgenteData=[];
async function _loadPromosVigAgente(){
  const el=document.getElementById('promos-vig-agente-list');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:36px;color:var(--g3)"><span class="spin spin-tq"></span></div>';
  const agId=window._agenciaId;
  if(!agId){el.innerHTML='<div style="padding:20px;color:var(--g3)">No perteneces a una agencia o tu agencia no tiene promociones.</div>';return;}
  const {data,error}=await sb.from('promociones_agencia').select('*').eq('agencia_id',agId).eq('activa',true).order('fecha_vencimiento');
  if(error){el.innerHTML=`<div style="padding:20px;color:var(--red);font-size:.82rem">Error: ${error.message}</div>`;return;}
  _promosVigAgenteData=data||[];
  _renderPromosVigAgente();
}

function _renderPromosVigAgente(){
  const el=document.getElementById('promos-vig-agente-list');
  if(!el) return;
  const srch=(document.getElementById('pvag-search')?.value||'').toLowerCase().trim();
  const hoy=new Date().toISOString().slice(0,10);
  const filtered=_promosVigAgenteData.filter(p=>{
    if(srch&&!(p.titulo||'').toLowerCase().includes(srch)&&!(_pvCatLabels[p.categoria]||'').toLowerCase().includes(srch)) return false;
    return true;
  });
  if(!filtered.length){
    el.innerHTML='<div style="text-align:center;padding:36px;color:var(--g3)">Sin promociones vigentes de tu agencia.</div>';
    return;
  }
  const fmtD=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d;}};
  el.innerHTML=filtered.map(p=>{
    const st=_pvEstado(p);
    const catC=_pvCatColors[p.categoria]||'#94a3b8';
    return `<div class="tk-item">
      <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.85rem;color:var(--text);margin-bottom:3px">${p.titulo}</div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:2px">
            <span style="font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:10px;background:${catC}22;color:${catC}">${_pvCatLabels[p.categoria]||p.categoria}</span>
            <span style="font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:10px;background:${st.color}22;color:${st.color}">${st.label}</span>
          </div>
          <div style="font-size:.72rem;color:var(--g4)">Vence: ${fmtD(p.fecha_vencimiento)}</div>
        </div>
        <button class="btn btn-out btn-xs" onclick="_viewPromoVigAgente('${p.id}')" title="Ver detalle"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
      </div>
    </div>`;
  }).join('');
}

function _viewPromoVigAgente(id){
  const p=_promosVigAgenteData.find(x=>x.id===id);
  if(!p) return;
  // Reuse the same view function
  _promosVigData=[..._promosVigAgenteData];
  _viewPromoVig(id);
}

// ═══════════════════════════════════════════
// BUILD QUOTE HTML (PDF renderer)
