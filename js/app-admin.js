async function renderAdmin(){
  if(!isAdmin) return;
  // Agentes
  const {data:ags}=await sb.from('agentes').select('*').order('creado_en');
  document.getElementById('admin-agentes').innerHTML=ags?.length?`<table class="tbl"><thead><tr><th>Email</th><th>Nombre</th><th>Rol</th><th>Activo</th><th></th></tr></thead><tbody>
  ${ags.map(a=>`<tr>
    <td>${a.email}</td><td>${a.nombre||'—'}</td>
    <td><span class="status-badge ${a.rol==='admin'?'st-confirmada':'st-borrador'}">${a.rol}</span></td>
    <td>${a.activo?'Sí':'No'}</td>
    <td style="white-space:nowrap;vertical-align:middle">
      <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
        <button class="btn btn-out btn-xs" onclick="editAgentModal('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}','${a.email}','${a.rol}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar</button>
        <button class="btn btn-out btn-xs" onclick="toggleAdmin('${a.id}','${a.rol}')">Cambiar rol</button>
      </div>
    </td>
  </tr>`).join('')}</tbody></table>`:'<p style="color:var(--g3)">Sin agentes.</p>';

  // Aerolíneas
  const {data:aeros}=await sb.from('aerolineas').select('*').order('nombre');
  document.getElementById('admin-aero').innerHTML=aeros?.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>IATA</th><th>Activa</th><th></th></tr></thead><tbody>
  ${aeros.map(a=>`<tr><td>${a.nombre}</td><td><code>${a.codigo_iata||'—'}</code></td><td>${a.activa?'Sí':'No'}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-out btn-xs" onclick="editAeroModal('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}','${a.codigo_iata||''}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="btn btn-del btn-xs" onclick="deleteAero('${a.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    </td></tr>`).join('')}</tbody></table>`:'<p>Sin aerolíneas.</p>';

  // Proveedores
  const {data:provs}=await sb.from('proveedores').select('*').order('nombre');
  document.getElementById('admin-prov').innerHTML=provs?.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Tipo</th><th>País</th><th>Contacto</th><th></th></tr></thead><tbody>
  ${provs.map(p=>`<tr><td>${p.nombre}</td><td>${p.tipo||'—'}</td><td>${p.pais||'—'}</td><td style="font-size:.75rem">${p.contacto||''}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-out btn-xs" onclick="editProvModal('${p.id}','${(p.nombre||'').replace(/'/g,"\\'")}','${p.tipo||''}','${(p.pais||'').replace(/'/g,"\\'")}','${(p.ciudad||'').replace(/'/g,"\\'")}','${(p.contacto||'').replace(/'/g,"\\'")}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="btn btn-del btn-xs" onclick="deleteProv('${p.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    </td></tr>`).join('')}</tbody></table>`:'<p>Sin proveedores.</p>';

  // Datalists for autocomplete
  buildDataLists(aeros||[], provs||[]);
  // Seguros
  loadSeguros();
}

function buildDataLists(aeros, provs){
  let dl=document.getElementById('al-list');
  if(!dl){dl=document.createElement('datalist');dl.id='al-list';document.body.appendChild(dl);}
  dl.innerHTML=aeros.map(a=>`<option value="${a.nombre}">`).join('');
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

async function toggleAdmin(id,rol){
  const nw=rol==='admin'?'agente':'admin';
  if(!confirm(`¿Cambiar rol a "${nw}"?`))return;
  await sb.from('agentes').update({rol:nw}).eq('id',id);
  toast('✓ Rol actualizado');renderAdmin();
}

function openAeroModal(){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">+ Aerolínea</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="ma-nm" placeholder="American Airlines"></div>
      <div class="fg"><label class="lbl">Código IATA</label><input class="finput" id="ma-iata" placeholder="AA" maxlength="3" style="text-transform:uppercase"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveAero()">Guardar</button>
    </div>`;openModal();
}
async function saveAero(){
  const nm=document.getElementById('ma-nm').value.trim();if(!nm)return;
  await sb.from('aerolineas').insert({nombre:nm,codigo_iata:document.getElementById('ma-iata').value.toUpperCase()});
  closeModal();toast('✓ Aerolínea agregada');renderAdmin();
}
async function deleteAero(id){if(!confirm('¿Eliminar?'))return;await sb.from('aerolineas').delete().eq('id',id);toast('Eliminada');renderAdmin();}

function openProvModal(){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">+ Proveedor</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="mp-nm" placeholder="Orlantours"></div>
      <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="mp-tipo"><option value="traslado">Traslado</option><option value="excursion">Excursión</option><option value="hotel">Hotel</option><option value="seguro">Seguro</option><option value="otro">Otro</option></select></div>
      <div class="fg"><label class="lbl">País</label><input class="finput" id="mp-pais" placeholder="Estados Unidos"></div>
      <div class="fg"><label class="lbl">Ciudad</label><input class="finput" id="mp-ciudad" placeholder="Orlando"></div>
      <div class="fg full"><label class="lbl">Contacto / Notas</label><input class="finput" id="mp-not" placeholder="Gabriel Quezada · +1 407..."></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveProv()">Guardar</button>
    </div>`;openModal();
}
async function saveProv(){
  const nm=document.getElementById('mp-nm').value.trim();if(!nm)return;
  await sb.from('proveedores').insert({nombre:nm,tipo:document.getElementById('mp-tipo').value,pais:document.getElementById('mp-pais').value,ciudad:document.getElementById('mp-ciudad').value,contacto:document.getElementById('mp-not').value});
  closeModal();toast('✓ Proveedor agregado');renderAdmin();
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
        el.innerHTML=`<div style="border:1px solid rgba(124,58,237,0.4);border-radius:12px;padding:16px 20px;background:rgba(124,58,237,0.08)">
          <div style="font-size:.8rem;font-weight:700;color:#C4B5FD;margin-bottom:10px">La tabla de seguros no está creada aún. Ejecutá el siguiente SQL en Supabase:</div>
          <pre style="background:rgba(0,0,0,0.35);border:1px solid rgba(124,58,237,0.3);border-radius:8px;padding:12px;font-size:.72rem;color:#E9D5FF;overflow-x:auto;cursor:pointer;white-space:pre-wrap;word-break:break-all" title="Click para copiar" onclick="navigator.clipboard.writeText(this.textContent).then(()=>toast('SQL copiado'))">CREATE TABLE public.seguros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.seguros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso autenticado" ON public.seguros
  FOR ALL USING (auth.role() = 'authenticated');</pre>
          <div style="font-size:.72rem;color:rgba(196,181,253,.6);margin-top:8px">Click en el bloque SQL para copiarlo · Luego ir a Supabase Dashboard &rarr; SQL Editor &rarr; pegar y ejecutar.</div>
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
      <button class="btn btn-pri" onclick="saveSeguro()">Guardar</button>
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
      <button class="btn btn-pri" onclick="saveSeguroEdit('${id}')">Guardar</button>
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
    <div class="fg"><label class="lbl">Rol</label><select class="fsel" id="ea-rol"><option value="agente" ${rol==='agente'?'selected':''}>Agente</option><option value="admin" ${rol==='admin'?'selected':''}>Admin</option></select></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveAgentEdit('${id}')">Guardar</button>
    </div>`;openModal();
}
async function saveAgentEdit(id){
  const nm=document.getElementById('ea-nm').value.trim();
  const rol=document.getElementById('ea-rol').value;
  await sb.from('agentes').update({nombre:nm,rol}).eq('id',id);
  closeModal();toast('✓ Agente actualizado');renderAdmin();
}

function editAeroModal(id,nombre,iata){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">Editar aerolínea</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="aea-nm" value="${nombre}" placeholder="American Airlines"></div>
      <div class="fg"><label class="lbl">Código IATA</label><input class="finput" id="aea-iata" value="${iata}" placeholder="AA" maxlength="3" style="text-transform:uppercase"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveAeroEdit('${id}')">Guardar</button>
    </div>`;openModal();
}
async function saveAeroEdit(id){
  const nm=document.getElementById('aea-nm').value.trim();if(!nm)return;
  await sb.from('aerolineas').update({nombre:nm,codigo_iata:document.getElementById('aea-iata').value.toUpperCase()}).eq('id',id);
  closeModal();toast('✓ Aerolínea actualizada');renderAdmin();
}

function editProvModal(id,nombre,tipo,pais,ciudad,contacto){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">Editar proveedor</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="epv-nm" value="${nombre}" placeholder="Orlantours"></div>
      <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="epv-tipo"><option value="traslado" ${tipo==='traslado'?'selected':''}>Traslado</option><option value="excursion" ${tipo==='excursion'?'selected':''}>Excursión</option><option value="hotel" ${tipo==='hotel'?'selected':''}>Hotel</option><option value="seguro" ${tipo==='seguro'?'selected':''}>Seguro</option><option value="otro" ${tipo==='otro'?'selected':''}>Otro</option></select></div>
      <div class="fg"><label class="lbl">País</label><input class="finput" id="epv-pais" value="${pais}" placeholder="Estados Unidos"></div>
      <div class="fg"><label class="lbl">Ciudad</label><input class="finput" id="epv-ciudad" value="${ciudad}" placeholder="Orlando"></div>
      <div class="fg full"><label class="lbl">Contacto / Notas</label><input class="finput" id="epv-not" value="${contacto}" placeholder="Gabriel · +1 407..."></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveProvEdit('${id}')">Guardar</button>
    </div>`;openModal();
}
async function saveProvEdit(id){
  const nm=document.getElementById('epv-nm').value.trim();if(!nm)return;
  await sb.from('proveedores').update({nombre:nm,tipo:document.getElementById('epv-tipo').value,pais:document.getElementById('epv-pais').value,ciudad:document.getElementById('epv-ciudad').value,contacto:document.getElementById('epv-not').value}).eq('id',id);
  closeModal();toast('✓ Proveedor actualizado');renderAdmin();
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
    const d=new Date(r.created_at||r.creado_en||Date.now());
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  });
  const confirmadas=all.filter(r=>r.estado==='confirmada');
  const totalPrecio=confirmadas.reduce((s,r)=>s+(r.precio_total||0),0);
  // Comisiones desde datos JSON
  const totalCom=all.reduce((s,r)=>s+(r.datos?.total_comision||0),0);
  const conversion=all.length?Math.round((confirmadas.length/all.length)*100):0;
  // Render metric cards — brand v2
  const comProm=confirmadas.length?Math.round(totalCom/confirmadas.length):0;
  const icons={
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    dollar:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    trend:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    bars:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'
  };
  const mkCard=(icon,label,value,grad,sub)=>`<div class="dash-metric"><div class="metric-label"><svg viewBox="0 0 24 24">${icon}</svg>${label}</div><div class="metric-value${grad?' grad':''}">${value}</div>${sub?'<div class="metric-sub">'+sub+'</div>':''}</div>`;
  document.getElementById('dash-metrics').innerHTML=[
    mkCard(icons.calendar,'Cotizaciones este mes',mesActual.length,false,'mes en curso'),
    mkCard(icons.file,'Total cotizaciones',all.length,false,'historial completo'),
    mkCard(icons.check,'Confirmadas',confirmadas.length,true,conversion+'% conversión'),
    mkCard(icons.dollar,'Comisiones totales','USD '+Number(totalCom).toLocaleString('es-AR'),true,'acumulado'),
    mkCard(icons.trend,'Tasa de conversión',conversion+'%',false,all.length+' cotizaciones'),
    mkCard(icons.bars,'Com. promedio','USD '+Number(comProm).toLocaleString('es-AR'),false,'por confirmada'),
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
    <td style="font-size:.75rem;color:var(--g3)">${new Date(r.created_at||r.creado_en||Date.now()).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}</td>
    <td><span class="status-badge st-${r.estado||'borrador'}">${stLbl[r.estado]||''} ${r.estado||'—'}</span></td>
    <td style="font-weight:700;color:var(--amber2)">USD ${Number(r.datos.total_comision).toLocaleString('es-AR')}</td>
  </tr>`).join('')}</tbody></table>`:'<div style="text-align:center;padding:30px;color:var(--g3)">Sin comisiones registradas todavía.</div>';
}

function openAgentModal(){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">Invitar agente</div>
    <p style="font-size:.83rem;color:var(--g4);margin-bottom:16px;line-height:1.6">Los agentes se invitan desde el panel de <strong>Netlify Identity</strong>. El sistema los reconoce automáticamente al hacer login por primera vez.</p>
    <div class="tip">Netlify → Site configuration → Identity → Invite users → Ingresá el email del agente. Recibirá un mail para crear su contraseña.</div>
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-pri" onclick="window.open('https://app.netlify.com','_blank');closeModal()">Ir a Netlify →</button>
    </div>`;openModal();
}

// ═══════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════
function openModal(){document.getElementById('modal-overlay').style.display='block';document.getElementById('modal-box').style.display='block';}
function closeModal(){document.getElementById('modal-overlay').style.display='none';document.getElementById('modal-box').style.display='none';}

// ═══════════════════════════════════════════
// BUILD QUOTE HTML (PDF renderer)
