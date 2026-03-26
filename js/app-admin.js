let _adminUsersData=[];

async function renderAdmin(){
  if(currentRol!=='admin'&&currentRol!=='agencia') return;
  // Usuarios (unificado)
  await renderAdminUsers();

  // Proveedores
  const {data:provs}=await sb.from('proveedores').select('*').order('nombre');
  document.getElementById('admin-prov').innerHTML=provs?.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Tipo</th><th>Pa\u00eds</th><th>Email</th><th>Contacto</th><th></th></tr></thead><tbody>
  ${provs.map(p=>`<tr><td>${p.nombre}</td><td>${p.tipo||'\u2014'}</td><td>${p.pais||'\u2014'}</td><td style="font-size:.75rem">${p.email||''}</td><td style="font-size:.75rem">${p.contacto||''}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-out btn-xs" onclick="editProvModal('${p.id}','${(p.nombre||'').replace(/'/g,"\\'")}','${p.tipo||''}','${(p.pais||'').replace(/'/g,"\\'")}','${(p.ciudad||'').replace(/'/g,"\\'")}','${(p.contacto||'').replace(/'/g,"\\'")}','${(p.email||'').replace(/'/g,"\\'")}','${(p.telefono||'').replace(/'/g,"\\'")}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="btn btn-del btn-xs" onclick="deleteProv('${p.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    </td></tr>`).join('')}</tbody></table>`:'<p>Sin proveedores.</p>';

  // Datalists for autocomplete
  buildDataLists(provs||[]);
  // Seguros
  loadSeguros();
  // Agencias (solo admin)
  if(currentRol==='admin') renderAdminAgencias();
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
  const {data,error}=await sb.from('agentes').select('*').order('nombre');
  if(error){el.innerHTML='<div style="color:var(--red);font-size:.82rem">Error: '+error.message+'</div>';return;}
  _adminUsersData=data||[];
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
    if(statusFilter==='pending' && !a.invite_token) return false;
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
    if(a.invite_token && !a.activo) return '<span style="font-size:.68rem;color:#D4A017;font-weight:600">Pendiente</span>';
    if(a.activo) return '<span style="font-size:.68rem;color:var(--primary);font-weight:600">Activo</span>';
    return '<span style="font-size:.68rem;color:var(--g3);font-weight:600">Inactivo</span>';
  };

  const myId=currentUser?.id||'';

  el.innerHTML=`<table class="tbl" style="width:100%">
    <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th style="text-align:right">Acciones</th></tr></thead>
    <tbody>${filtered.map(a=>`<tr>
      <td style="font-weight:600">${a.nombre||'\u2014'}</td>
      <td style="font-size:.82rem;color:var(--g4)">${a.email||'\u2014'}</td>
      <td>${rolBadge(a.rol)}</td>
      <td>${statusBadge(a)}</td>
      <td style="text-align:right">
        <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">
          ${!a.activo?`<button class="btn btn-out btn-xs" style="color:var(--primary);border-color:var(--primary)" onclick="activateUser('${a.id}')">Activar</button>`:''}
          ${a.activo&&a.id!==myId?`<button class="btn btn-out btn-xs" style="color:#D4A017;border-color:#D4A017" onclick="deactivateUser('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}')">Desactivar</button>`:''}
          ${a.invite_token?`<button class="btn btn-out btn-xs" onclick="regenerateInviteLink('${a.id}')">Nuevo enlace</button>`:''}
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
  const {error}=await sb.from('agentes').update({activo:true,invite_token:null}).eq('id',id);
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

async function regenerateInviteLink(id){
  const token=crypto.randomUUID();
  const {error}=await sb.from('agentes').update({invite_token:token,activo:false}).eq('id',id);
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

const _provTipos=[{v:'traslado',l:'Traslado'},{v:'excursion',l:'Excursi\u00f3n'},{v:'hotel',l:'Hotel'},{v:'seguro',l:'Seguro'},{v:'asistencia',l:'Asistencia'},{v:'DMC',l:'DMC'},{v:'receptivo',l:'Receptivo'},{v:'aerolinea',l:'Aerol\u00ednea'},{v:'crucero',l:'Crucero'},{v:'otro',l:'Otro'}];
function _provTipoOpts(sel){return _provTipos.map(t=>`<option value="${t.v}"${t.v===sel?' selected':''}>${t.l}</option>`).join('');}

function openProvModal(){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">+ Proveedor</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="mp-nm" placeholder="Orlantours"></div>
      <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="mp-tipo">${_provTipoOpts('')}</select></div>
      <div class="fg"><label class="lbl">Pa\u00eds</label><input class="finput" id="mp-pais" placeholder="Estados Unidos"></div>
      <div class="fg"><label class="lbl">Ciudad</label><input class="finput" id="mp-ciudad" placeholder="Orlando"></div>
      <div class="fg"><label class="lbl">Email</label><input class="finput" id="mp-email" placeholder="info@proveedor.com" inputmode="email"></div>
      <div class="fg"><label class="lbl">Telefono</label><input class="finput" id="mp-tel" placeholder="+1 407 555-1234" inputmode="tel"></div>
      <div class="fg full"><label class="lbl">Contacto / Notas</label><input class="finput" id="mp-not" placeholder="Gabriel Quezada"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-cta" onclick="saveProv()">Guardar</button>
    </div>`;openModal();
}
async function saveProv(){
  const nm=document.getElementById('mp-nm').value.trim();if(!nm)return;
  await sb.from('proveedores').insert({nombre:nm,tipo:document.getElementById('mp-tipo').value,pais:document.getElementById('mp-pais').value,ciudad:document.getElementById('mp-ciudad').value,email:document.getElementById('mp-email').value,telefono:document.getElementById('mp-tel').value,contacto:document.getElementById('mp-not').value});
  closeModal();toast('Proveedor agregado');
  if(typeof renderAgency==='function'&&document.getElementById('tab-agency')?.classList.contains('on'))renderAgency();
  else renderAdmin();
}
async function deleteProv(id){if(!confirm('¿Eliminar?'))return;await sb.from('proveedores').delete().eq('id',id);toast('Eliminado');renderAdmin();}

// ═══════════════════════════════════════════
// SEGUROS
// ═══════════════════════════════════════════
async function loadSeguros(){
  const {data:segs, error}=await sb.from('seguros').select('*').order('nombre');
  // Renderizar tabla en admin
  const el=document.getElementById('admin-seguros');
  if(el){
    if(error){
      const isSchemaError=error.message&&(error.message.includes('schema cache')||error.message.includes('does not exist')||error.message.includes('relation'));
      if(isSchemaError){
        el.innerHTML=`<div style="border:1px solid rgba(27,158,143,0.3);border-radius:12px;padding:16px 20px;background:rgba(27,158,143,0.07)">
          <div style="font-size:.8rem;font-weight:700;color:var(--primary);margin-bottom:10px">La tabla de seguros no está creada aún. Ejecutá el siguiente SQL en Supabase:</div>
          <pre style="background:rgba(0,0,0,0.06);border:1px solid rgba(27,158,143,0.2);border-radius:8px;padding:12px;font-size:.72rem;color:var(--text);overflow-x:auto;cursor:pointer;white-space:pre-wrap;word-break:break-all" title="Click para copiar" onclick="navigator.clipboard.writeText(this.textContent).then(()=>toast('SQL copiado'))">CREATE TABLE public.seguros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.seguros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso autenticado" ON public.seguros
  FOR ALL USING (auth.role() = 'authenticated');</pre>
          <div style="font-size:.72rem;color:var(--g3);margin-top:8px">Click en el bloque SQL para copiarlo · Luego ir a Supabase Dashboard &rarr; SQL Editor &rarr; pegar y ejecutar.</div>
        </div>`;
      } else {
        el.innerHTML=`<p style="color:var(--red);font-size:.8rem">Error al cargar seguros: ${error.message}</p>`;
      }
    } else {
      el.innerHTML=segs?.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Activo</th><th></th></tr></thead><tbody>
      ${segs.map(s=>`<tr><td>${s.nombre}</td><td>${s.activo?'Sí':'No'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-out btn-xs" onclick="editSeguroModal('${s.id}','${(s.nombre||'').replace(/'/g,"\'")}','${s.activo}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn btn-del btn-xs" onclick="deleteSeguro('${s.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </td></tr>`).join('')}</tbody></table>`:'<p style="color:var(--g3)">Sin seguros.</p>';
    }
  }
  // Actualizar select del formulario
  const sel=document.getElementById('seg-nm');
  if(sel){
    if(error||!segs){
      sel.innerHTML='<option value="">— Sin seguros disponibles —</option>';
    } else {
      const activos=segs.filter(s=>s.activo!==false);
      sel.innerHTML='<option value="">— Elegir aseguradora —</option>'+activos.map(s=>`<option value="${s.nombre}">${s.nombre}</option>`).join('');
    }
  }
}

function openSeguroModal(){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">+ Aseguradora</div>
    <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="ms-nm" placeholder="PAX Assistance"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-cta" onclick="saveSeguro()">Guardar</button>
    </div>`;openModal();
}

async function saveSeguro(){
  const nm=document.getElementById('ms-nm').value.trim();if(!nm)return;
  await sb.from('seguros').insert({nombre:nm,activo:true});
  closeModal();toast('Aseguradora agregada');await renderAdmin();await loadSeguros();
}

function editSeguroModal(id,nombre,activo){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">Editar aseguradora</div>
    <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="es-nm" value="${nombre}" placeholder="PAX Assistance"></div>
    <div class="fg"><label class="lbl">Activo</label>
      <select class="fsel" id="es-activo">
        <option value="true" ${activo==='true'?'selected':''}>Sí</option>
        <option value="false" ${activo==='false'?'selected':''}>No</option>
      </select>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-cta" onclick="saveSeguroEdit('${id}')">Guardar</button>
    </div>`;openModal();
}

async function saveSeguroEdit(id){
  const nm=document.getElementById('es-nm').value.trim();if(!nm)return;
  const activo=document.getElementById('es-activo').value==='true';
  await sb.from('seguros').update({nombre:nm,activo}).eq('id',id);
  closeModal();toast('Aseguradora actualizada');await renderAdmin();await loadSeguros();
}

async function deleteSeguro(id){if(!confirm('¿Eliminar?'))return;await sb.from('seguros').delete().eq('id',id);toast('Eliminado');await renderAdmin();await loadSeguros();}

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
  closeModal();toast('✓ Agente actualizado');renderAdmin();
}

function editProvModal(id,nombre,tipo,pais,ciudad,contacto,email,telefono){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">Editar proveedor</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="epv-nm" value="${nombre}" placeholder="Orlantours"></div>
      <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="epv-tipo">${_provTipoOpts(tipo)}</select></div>
      <div class="fg"><label class="lbl">Pa\u00eds</label><input class="finput" id="epv-pais" value="${pais}" placeholder="Estados Unidos"></div>
      <div class="fg"><label class="lbl">Ciudad</label><input class="finput" id="epv-ciudad" value="${ciudad}" placeholder="Orlando"></div>
      <div class="fg"><label class="lbl">Email</label><input class="finput" id="epv-email" value="${email||''}" placeholder="info@proveedor.com" inputmode="email"></div>
      <div class="fg"><label class="lbl">Telefono</label><input class="finput" id="epv-tel" value="${telefono||''}" placeholder="+1 407 555-1234" inputmode="tel"></div>
      <div class="fg full"><label class="lbl">Contacto / Notas</label><input class="finput" id="epv-not" value="${contacto}" placeholder="Gabriel"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-cta" onclick="saveProvEdit('${id}')">Guardar</button>
    </div>`;openModal();
}
async function saveProvEdit(id){
  const nm=document.getElementById('epv-nm').value.trim();if(!nm)return;
  await sb.from('proveedores').update({nombre:nm,tipo:document.getElementById('epv-tipo').value,pais:document.getElementById('epv-pais').value,ciudad:document.getElementById('epv-ciudad').value,email:document.getElementById('epv-email').value,telefono:document.getElementById('epv-tel').value,contacto:document.getElementById('epv-not').value}).eq('id',id);
  closeModal();toast('Proveedor actualizado');
  if(typeof renderAgency==='function'&&document.getElementById('tab-agency')?.classList.contains('on'))renderAgency();
  else renderAdmin();
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

  // Check if email already exists
  const {data:existing}=await sb.from('agentes').select('id,invite_token,activo').eq('email',email).maybeSingle();
  if(existing){
    if(existing.invite_token && !existing.activo){
      if(confirm('Este email ya tiene una invitacion pendiente. Generar un nuevo enlace?')){
        closeModal();
        regenerateInviteLink(existing.id);
      }
      return;
    }
    if(existing.activo){
      toast('Este email ya tiene una cuenta activa',false);
      return;
    }
  }

  // Create row in agentes with invite_token
  const token=crypto.randomUUID();
  const row={email,rol,activo:false,invite_token:token};
  if(nombre) row.nombre=nombre;
  const {error}=await sb.from('agentes').insert(row);
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
// AGENCY PANEL
// ═══════════════════════════════════════════
async function renderAgency(){
  if(currentRol!=='agencia'&&currentRol!=='admin') return;

  // Agentes — for now load all (agency_id linking pending)
  const {data:ags}=await sb.from('agentes').select('*').order('creado_en');
  const agEl=document.getElementById('agency-agentes');
  if(agEl){
    agEl.innerHTML=ags?.length?`<table class="tbl"><thead><tr><th>Email</th><th>Nombre</th><th>Rol</th><th>Activo</th></tr></thead><tbody>
    ${ags.map(a=>`<tr>
      <td>${a.email}</td><td>${a.nombre||'\u2014'}</td>
      <td><span class="status-badge ${a.rol==='admin'?'st-confirmada':a.rol==='agencia'?'st-enviada':'st-borrador'}">${{admin:'Admin',agencia:'Agencia',agente:'Agente'}[a.rol]||a.rol}</span></td>
      <td>${a.activo?'S\u00ed':'No'}</td>
    </tr>`).join('')}</tbody></table>`:'<p style="color:var(--g3)">Sin agentes.</p>';
  }

  // Proveedores
  const {data:provs}=await sb.from('proveedores').select('*').order('nombre');
  const pvEl=document.getElementById('agency-proveedores');
  if(pvEl){
    pvEl.innerHTML=provs?.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Tipo</th><th>Pa\u00eds</th><th>Email</th><th>Contacto</th><th></th></tr></thead><tbody>
    ${provs.map(p=>`<tr><td>${p.nombre}</td><td>${p.tipo||'\u2014'}</td><td>${p.pais||'\u2014'}</td><td style="font-size:.75rem">${p.email||''}</td><td style="font-size:.75rem">${p.contacto||''}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-out btn-xs" onclick="editProvModal('${p.id}','${(p.nombre||'').replace(/'/g,"\\'")}','${p.tipo||''}','${(p.pais||'').replace(/'/g,"\\'")}','${(p.ciudad||'').replace(/'/g,"\\'")}','${(p.contacto||'').replace(/'/g,"\\'")}','${(p.email||'').replace(/'/g,"\\'")}','${(p.telefono||'').replace(/'/g,"\\'")}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="btn btn-del btn-xs" onclick="deleteProv('${p.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
      </td></tr>`).join('')}</tbody></table>`:'<p style="color:var(--g3)">Sin proveedores.</p>';
  }

  // Build datalists for form autocomplete
  buildDataLists(provs||[]);
}

async function saveAgencyData(){
  if(!window._agenteId){toast('Error: no se pudo identificar tu cuenta',false);return;}
  const data={};
  const v=id=>(document.getElementById(id)?.value||'').trim();
  if(v('ag-nombre')) data.agencia=v('ag-nombre');
  if(v('ag-email')) data.email=v('ag-email');
  if(v('ag-tel')) data.telefono=v('ag-tel');
  if(v('ag-dir')) data.direccion=v('ag-dir');
  // Save to Supabase agentes table (each user's own row)
  const {error}=await sb.from('agentes').update(data).eq('id',window._agenteId);
  if(error){toast('Error al guardar: '+error.message,false);console.error('[saveAgencyData]',error);return;}
  // Update local config
  if(data.agencia) agCfg.ag=data.agencia;
  if(data.telefono) agCfg.tel=data.telefono;
  _saveAgCfg();
  toast('Datos de agencia guardados');
}

// Load agency data from Supabase
async function _loadAgencyFields(){
  if(!window._agenteId)return;
  try{
    const {data}=await sb.from('agentes').select('agencia,email,telefono,direccion').eq('id',window._agenteId).single();
    if(!data)return;
    const el=id=>document.getElementById(id);
    if(data.agencia && el('ag-nombre')) el('ag-nombre').value=data.agencia;
    if(data.email && el('ag-email')) el('ag-email').value=data.email;
    if(data.telefono && el('ag-tel')) el('ag-tel').value=data.telefono;
    if(data.direccion && el('ag-dir')) el('ag-dir').value=data.direccion;
  }catch(e){console.warn('[_loadAgencyFields]',e);}
}

// ═══════════════════════════════════════════
// BUILD QUOTE HTML (PDF renderer)
