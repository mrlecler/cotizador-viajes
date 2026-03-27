let _histPageSize=25;
let _cliPageSize=25;

// Cache de nombres de agentes para mostrar en historial
let _agentNamesCache={};
async function _loadAgentNames(){
  if(Object.keys(_agentNamesCache).length) return;
  try{
    const {data}=await sb.from('agentes').select('id,nombre,email');
    (data||[]).forEach(a=>{_agentNamesCache[a.id]=a.nombre||a.email||'';});
  }catch(e){}
}

async function renderHistory(){
  const el=document.getElementById('hist-list');
  el.innerHTML='<div style="text-align:center;padding:40px;color:var(--g3)"><span class="spin spin-tq"></span> Cargando...</div>';
  const rows=await dbLoadQuotes();
  // Cargar nombres de agentes si es admin o agencia (ven cotizaciones de otros)
  if(currentRol==='admin'||currentRol==='agencia') await _loadAgentNames();
  const filt=document.getElementById('hist-filter')?.value||'';
  const srch=(document.getElementById('hist-search')?.value||'').toLowerCase().trim();
  const dateFrom=document.getElementById('hist-date-from')?.value||'';
  const dateTo=document.getElementById('hist-date-to')?.value||'';
  const filtered=rows.filter(r=>{
    if(filt&&r.estado!==filt)return false;
    if(srch){
      const nm=(r.datos?.cliente?.nombre||'').toLowerCase();
      const dest=(r.destino||'').toLowerCase();
      const ref=(r.ref_id||'').toLowerCase();
      if(!nm.includes(srch)&&!dest.includes(srch)&&!ref.includes(srch)&&!(r.pasajeros||'').toLowerCase().includes(srch))return false;
    }
    if(dateFrom){const d=new Date(r.creado_en||r.updated_at||0);if(d<new Date(dateFrom))return false;}
    if(dateTo){const d=new Date(r.creado_en||r.updated_at||0);if(d>new Date(dateTo+'T23:59:59'))return false;}
    return true;
  });
  if(!filtered.length){
    el.innerHTML=`<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>No hay resultados</p><small>Probá cambiando los filtros o el texto de búsqueda</small></div>`;
    return;
  }
  const shown=filtered.slice(0,_histPageSize);
  const stLbl={borrador:'Borrador',enviada:'Enviada',confirmada:'Confirmada',cancelada:'Cancelada'};
  el.innerHTML=shown.map(r=>{
    const isOwner = (r.agente_id === window._agenteId);
    const editBtn = isOwner
      ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();editFromHistory('${r.ref_id}','${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar</button>`
      : (currentRol==='admin' ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();loadFromHistory('${r.ref_id}','${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver</button>` : '');
    const dupBtn = isOwner
      ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();duplicateFromHistory('${r.ref_id}','${r.id}')" title="Duplicar cotizacion con nuevo numero"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Duplicar</button>` : '';
    const statusBtn = isOwner
      ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();openStatusModal('${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Estado</button>` : '';
    const delBtn = (isOwner && (!r.estado || r.estado==='borrador'))
      ? `<button class="btn btn-del btn-xs" onclick="event.stopPropagation();deleteQuote('${r.id}')" title="Eliminar borrador"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>` : '';
    return `
    <div class="hist-item" onclick="loadFromHistory('${r.ref_id}','${r.id}')">
      <div class="hist-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
      <div class="hist-info">
        <div class="hist-nm">${r.datos?.cliente?.nombre||'Sin nombre'} — ${r.destino||'Sin destino'}</div>
        <div class="hist-meta"><span class="hist-refid">${r.ref_id||'—'}</span>${r.pasajeros?' · '+r.pasajeros:''}${!isOwner&&r.agente_id&&_agentNamesCache[r.agente_id]?' · <span style="color:var(--primary);font-weight:600">'+_agentNamesCache[r.agente_id]+'</span>':''}</div>
        <div class="hist-meta">${new Date(r.creado_en||r.updated_at||Date.now()).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}${r.fecha_sal?' · salida: '+r.fecha_sal:''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <span class="status-badge st-${r.estado||'borrador'}">${stLbl[r.estado]||r.estado}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
          ${editBtn}${dupBtn}${statusBtn}${delBtn}
        </div>
      </div>
    </div>`;
  }).join('')+`
  <div class="list-footer">
    <span class="list-count">Mostrando ${shown.length} de ${filtered.length} cotizaciones</span>
    <div class="page-sel">
      <span>Ver</span>
      <select onchange="_setHistPageSize(this.value)">
        <option value="25" ${_histPageSize===25?'selected':''}>25</option>
        <option value="50" ${_histPageSize===50?'selected':''}>50</option>
        <option value="100" ${_histPageSize===100?'selected':''}>100</option>
      </select>
      <span>por página</span>
    </div>
  </div>`;
}
function _setHistPageSize(n){_histPageSize=parseInt(n);renderHistory();}

async function loadFromHistory(refId, id){
  // Vista previa (click en la fila)
  const {data}=await sb.from('cotizaciones').select('*').eq('id',id).single();
  if(!data)return;
  window._hFotos={};
  qData=data.datos;
  editingQuoteId=id;
  window._viewingQuoteOwnerId=data.agente_id||null;
  if(data.cover_url) coverUrl=data.cover_url; else if(data.datos?._coverUrl) coverUrl=data.datos._coverUrl;
  renderPreview(qData);switchTab('preview');
  // Ocultar botones de edición si no es propietario
  _applyPreviewPermissions();
}

async function editFromHistory(refId, id){
  // Cargar en formulario para editar
  const {data}=await sb.from('cotizaciones').select('*').eq('id',id).single();
  if(!data){ toast('No se encontró la cotización.',false); return; }
  // Verificar ownership — solo el propietario puede editar
  if(data.agente_id && data.agente_id !== window._agenteId && currentRol !== 'admin'){
    toast('Solo podés ver esta cotización, no editarla',false);
    return;
  }
  window._hFotos={};
  // Store editing context
  editingQuoteId = id;
  window._viewingQuoteOwnerId=data.agente_id||null;
  const d = data.datos;
  if(data.cover_url) coverUrl=data.cover_url; else if(data.datos?._coverUrl) coverUrl=data.datos._coverUrl;
  // Restore into form via restoreDraft
  formDraft = d;
  switchTab('form');
  // After DOM switch, restore
  setTimeout(()=>{
    if(formDraft) restoreDraft(formDraft);
    formDraft = null;
    // Show editing banner
    _showEditBanner(refId);
    toast('Cotización cargada para editar — guardá para actualizar');
  }, 80);
}

async function duplicateFromHistory(refId, id){
  const {data}=await sb.from('cotizaciones').select('*').eq('id',id).single();
  if(!data){ toast('No se encontró la cotización.',false); return; }
  // Deep copy datos and clear ref + client so a new quote is created
  const d=JSON.parse(JSON.stringify(data.datos||{}));
  delete d.refId;
  if(d.cliente){ d.cliente.nombre=''; d.cliente.celular=''; d.cliente.email=''; }
  // Reset editing state — this will be a NEW quote
  editingQuoteId=null;
  _hideEditBanner();
  if(data.cover_url) coverUrl=data.cover_url; else if(data.datos?._coverUrl) coverUrl=data.datos._coverUrl;
  formDraft=d;
  switchTab('form');
  setTimeout(()=>{
    if(formDraft) restoreDraft(formDraft);
    formDraft=null;
    const refEl=document.getElementById('m-ref'); if(refEl) refEl.value='';
    const nmEl=document.getElementById('m-nombre'); if(nmEl) nmEl.value='';
    const celEl=document.getElementById('m-cel'); if(celEl) celEl.value='';
    const emEl=document.getElementById('m-email'); if(emEl) emEl.value='';
    toast('Cotización duplicada — ingresá los datos del nuevo cliente y guardá');
  },80);
}

function _showEditBanner(refId){
  let banner = document.getElementById('edit-banner');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'edit-banner';
    banner.className = 'edit-banner';
    const formPanel = document.getElementById('tab-form');
    if(formPanel) formPanel.insertBefore(banner, formPanel.firstChild);
  }
  banner.innerHTML =
    '<div class="edit-banner-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>' +
    '<div class="edit-banner-body">' +
      '<div class="edit-banner-ttl">Editando cotización <strong>' + refId + '</strong></div>' +
      '<div class="edit-banner-sub">Los cambios se guardarán sobre esta cotización al presionar Guardar.</div>' +
    '</div>' +
    '<button onclick="cancelEdit()" class="edit-banner-btn">Descartar cambios</button>';
  banner.style.display = 'flex';
}

function _hideEditBanner(){
  const banner = document.getElementById('edit-banner');
  if(banner) banner.style.display = 'none';
}

function _confirmDialog(msg, yesLbl, noLbl, onYes){
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.style.display = 'flex';
  ov.innerHTML = '<div class="modal" style="width:360px;max-width:90vw"><div class="modal-body" style="padding:24px 22px 18px"><div style="font-size:.88rem;font-weight:600;color:var(--text);line-height:1.6;margin-bottom:20px">'+msg+'</div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-out btn-sm" id="_cd-no">'+noLbl+'</button><button class="btn btn-save btn-sm" id="_cd-yes">'+yesLbl+'</button></div></div></div>';
  document.body.appendChild(ov);
  ov.querySelector('#_cd-no').addEventListener('click', () => ov.remove());
  ov.querySelector('#_cd-yes').addEventListener('click', () => { ov.remove(); onYes(); });
}

function cancelEdit(){
  _confirmDialog(
    '¿Descartás los cambios? La cotización original no se modificará.',
    'Sí, descartar',
    'Seguir editando',
    _doCancelEdit
  );
}

function _doCancelEdit(){
  // ── RESET completo del modo edición ──────────────────────────────
  editingQuoteId = null;
  formDraft = null;
  _hideEditBanner();
  // Reset form — limpiar TODOS los campos incluyendo m-ref
  document.getElementById('vuelos-cont').innerHTML=''; vc=0;
  document.getElementById('hoteles-cont').innerHTML=''; hc=0;
  const tC=document.getElementById('traslados-cont'); if(tC){tC.innerHTML='';tc=0;}
  const eC=document.getElementById('excursiones-cont'); if(eC){eC.innerHTML='';ec=0;}
  const tkC=document.getElementById('tickets-cont'); if(tkC) tkC.innerHTML='';
  // m-ref se limpia explícitamente para garantizar ref_id nuevo en la próxima cotización
  ['m-nombre','m-cel','m-email','m-dest','m-pais','m-sal','m-reg','m-notas','m-ref',
   'p-pp','p-tot','p-res','p-cuo','p-can','p-val','p-tyc','m-adu','m-nin','m-inf',
   'seg-nm','seg-precio','seg-com','seg-extra','seg-fin',
   'm-estado','p-cur','p-cur2','p-cur3','seg-cur','seg-med','seg-eq','seg-pre','seg-dias'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  addVuelo(); addHotel(); addTraslado(); addExcursion(); addTicket();
  toast('Nueva cotización en blanco');
}
async function deleteQuote(id){
  if(!confirm('¿Eliminar esta cotización?'))return;
  // Solo el owner puede eliminar
  const {data:q}=await sb.from('cotizaciones').select('agente_id').eq('id',id).single();
  if(q && q.agente_id !== window._agenteId){
    toast('No podes eliminar cotizaciones de otro agente', false); return;
  }
  await sb.from('cotizaciones').delete().eq('id',id);
  toast('Cotización eliminada');renderHistory();
}
let _statusTargetId=null;
function openStatusModal(id){ _statusTargetId=id; const m=document.getElementById('modal-status'); m.style.display='flex'; }
function closeStatusModal(){ document.getElementById('modal-status').style.display='none'; _statusTargetId=null; }
async function applyStatus(s){
  if(!_statusTargetId) return;
  closeStatusModal();
  await sb.from('cotizaciones').update({estado:s}).eq('id',_statusTargetId);
  toast('✓ Estado actualizado a: '+s);
  renderHistory();
}

// ═══════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════
async function renderClients(){
  await loadClients();
  const q=(document.getElementById('cli-filter')?.value||'').toLowerCase().trim();
  const filtered=allClients.filter(c=>!q||(c.nombre||'').toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q)||(c.celular||'').includes(q));
  const el=document.getElementById('cli-list');
  if(!filtered.length){
    el.innerHTML=`<div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p>${q?'Sin resultados para "'+q+'"':'Todavía no tenés clientes'}</p><small>${q?'Probá con otro nombre, email o teléfono':'Agregá tu primer cliente con el botón + Nuevo cliente'}</small></div>`;
    return;
  }
  const shown=filtered.slice(0,_cliPageSize);
  el.innerHTML=`<table class="tbl"><thead><tr><th>Nombre</th><th>Celular</th><th>Email</th><th>Notas</th><th></th></tr></thead><tbody>
  ${shown.map(c=>{
    const isOwner = (c.agente_id === window._agenteId);
    const editBtn = isOwner
      ? `<button class="btn btn-out btn-xs" onclick="openClientModal('${c.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`
      : (currentRol==='admin' ? `<button class="btn btn-out btn-xs" onclick="openClientModal('${c.id}')" title="Solo lectura"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>` : '');
    const delBtn = isOwner
      ? `<button class="btn btn-del btn-xs" onclick="deleteClient('${c.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>` : '';
    return `<tr>
    <td><strong>${c.nombre||'—'}</strong></td>
    <td>${c.celular||'—'}</td>
    <td>${c.email||'—'}</td>
    <td style="font-size:.75rem;color:var(--g3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.notas||''}</td>
    <td style="white-space:nowrap">${editBtn}${delBtn}</td>
  </tr>`;
  }).join('')}</tbody></table>
  <div class="list-footer">
    <span class="list-count">Mostrando ${shown.length} de ${filtered.length} clientes</span>
    <div class="page-sel">
      <span>Ver</span>
      <select onchange="_setCliPageSize(this.value)">
        <option value="25" ${_cliPageSize===25?'selected':''}>25</option>
        <option value="50" ${_cliPageSize===50?'selected':''}>50</option>
        <option value="100" ${_cliPageSize===100?'selected':''}>100</option>
      </select>
      <span>por página</span>
    </div>
  </div>`;
}
function _setCliPageSize(n){_cliPageSize=parseInt(n);renderClients();}

function openClientModal(id){
  const c=allClients.find(x=>x.id===id)||{};
  const _v=(k)=>c[k]||'';
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:12px">${id?'Editar cliente':'+ Nuevo cliente'}</div>
    <div class="cli-tabs">
      <div class="cli-tab on" onclick="_cliTab(0,this)">Datos</div>
      <div class="cli-tab" onclick="_cliTab(1,this)">Viaje</div>
      <div class="cli-tab" onclick="_cliTab(2,this)">Documentos</div>
      <div class="cli-tab" onclick="_cliTab(3,this)">Cotizaciones</div>
      <div class="cli-tab" onclick="_cliTab(4,this)">Grupos</div>
    </div>

    <!-- Tab 0: Datos personales -->
    <div class="cli-tab-panel on">
      <div class="g2">
        <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="mc-nm" value="${_v('nombre')}" placeholder="Hugo Mart&#237;nez"></div>
        <div class="fg"><label class="lbl">Celular</label><input class="finput" id="mc-cel" value="${_v('celular')}" placeholder="+54 362..." inputmode="tel"></div>
      </div>
      <div class="fg"><label class="lbl">Email</label><input class="finput" id="mc-em" value="${_v('email')}" placeholder="email@..." type="email"></div>
      <div class="g2">
        <div class="fg"><label class="lbl">Tipo documento</label><select class="finput" id="mc-doc-tipo"><option value="">—</option><option ${_v('doc_tipo')==='DNI'?'selected':''}>DNI</option><option ${_v('doc_tipo')==='Pasaporte'?'selected':''}>Pasaporte</option><option ${_v('doc_tipo')==='C&#233;dula'?'selected':''}>C&#233;dula</option><option ${_v('doc_tipo')==='Otro'?'selected':''}>Otro</option></select></div>
        <div class="fg"><label class="lbl">Nro documento</label><input class="finput" id="mc-doc" value="${_v('documento')}"></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="lbl">Vencimiento pasaporte</label><input class="finput" id="mc-pasaporte-vto" type="date" value="${_v('pasaporte_vto')}"></div>
        <div class="fg"><label class="lbl">Fecha nacimiento</label><input class="finput" id="mc-fecha-nac" type="date" value="${_v('fecha_nac')}"></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="lbl">Nacionalidad</label><input class="finput" id="mc-nacionalidad" value="${_v('nacionalidad')}"></div>
        <div class="fg"><label class="lbl">Direcci&#243;n</label><input class="finput" id="mc-direccion" value="${_v('direccion')}"></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="lbl">Ciudad</label><input class="finput" id="mc-ciudad" value="${_v('ciudad')}"></div>
        <div class="fg"><label class="lbl">Pa&#237;s</label><input class="finput" id="mc-pais" value="${_v('pais')}"></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="lbl">C&#243;digo postal</label><input class="finput" id="mc-cp" value="${_v('codigo_postal')}"></div>
        <div class="fg"><label class="lbl">Tel&#233;fono secundario</label><input class="finput" id="mc-tel2" value="${_v('telefono2')}" inputmode="tel"></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="lbl">Contacto emergencia nombre</label><input class="finput" id="mc-emerg-nm" value="${_v('emergencia_nombre')}"></div>
        <div class="fg"><label class="lbl">Contacto emergencia tel</label><input class="finput" id="mc-emerg-tel" value="${_v('emergencia_tel')}" inputmode="tel"></div>
      </div>
      <div class="fg"><label class="lbl">Notas</label><textarea class="ftxt" id="mc-not" rows="3">${_v('notas')}</textarea></div>
    </div>

    <!-- Tab 1: Viaje -->
    <div class="cli-tab-panel">
      <div class="g2">
        <div class="fg"><label class="lbl">Tipo de visa</label><input class="finput" id="mc-visa-tipo" value="${_v('visa_tipo')}"></div>
        <div class="fg"><label class="lbl">Pa&#237;s de visa</label><input class="finput" id="mc-visa-pais" value="${_v('visa_pais')}"></div>
      </div>
      <div class="fg"><label class="lbl">Vencimiento visa</label><input class="finput" id="mc-visa-vto" type="date" value="${_v('visa_vto')}"></div>
      <div class="g2">
        <div class="fg"><label class="lbl">Aerol&#237;nea freq flyer</label><input class="finput" id="mc-ff-aero" value="${_v('ff_aerolinea')}"></div>
        <div class="fg"><label class="lbl">Nro freq flyer</label><input class="finput" id="mc-ff-num" value="${_v('ff_numero')}"></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="lbl">Preferencia asiento</label><select class="finput" id="mc-asiento"><option value="">Indiferente</option><option ${_v('asiento_pref')==='Ventana'?'selected':''}>Ventana</option><option ${_v('asiento_pref')==='Pasillo'?'selected':''}>Pasillo</option></select></div>
        <div class="fg"><label class="lbl">Preferencia comida</label><input class="finput" id="mc-comida" value="${_v('comida_pref')}"></div>
      </div>
      <div class="fg"><label class="lbl">Alergias / notas m&#233;dicas</label><textarea class="ftxt" id="mc-alergias" rows="3">${_v('alergias')}</textarea></div>
    </div>

    <!-- Tab 2: Documentos -->
    <div class="cli-tab-panel">
      ${id?`<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <select class="finput" id="mc-doc-tipo-upload" style="width:auto;flex-shrink:0"><option value="pasaporte">Pasaporte</option><option value="visa">Visa</option><option value="voucher">Voucher</option><option value="seguro">Seguro</option><option value="confirmacion">Confirmaci&#243;n</option><option value="otro">Otro</option></select>
        <input type="file" id="mc-doc-file" style="display:none" onchange="uploadClientDoc('${id}')">
        <button class="btn btn-pri btn-sm" onclick="document.getElementById('mc-doc-file').click()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Subir documento</button>
      </div>
      <div id="mc-docs-list"><div style="color:var(--g3);font-size:.82rem;padding:12px 0">Cargando...</div></div>`
      :'<div style="color:var(--g3);font-size:.82rem;padding:12px 0">Guard&#225; el cliente primero para poder subir documentos.</div>'}
    </div>

    <!-- Tab 3: Cotizaciones -->
    <div class="cli-tab-panel">
      ${id?'<div id="mc-quotes-list"><div style="color:var(--g3);font-size:.82rem;padding:12px 0">Cargando...</div></div>':'<div style="color:var(--g3);font-size:.82rem;padding:12px 0">Guard&#225; el cliente primero para ver cotizaciones.</div>'}
    </div>

    <!-- Tab 4: Grupos -->
    <div class="cli-tab-panel">
      ${id?'<div id="mc-groups-list"><div style="color:var(--g3);font-size:.82rem;padding:12px 0">Cargando...</div></div>':'<div style="color:var(--g3);font-size:.82rem;padding:12px 0">Guard&#225; el cliente primero para gestionar grupos.</div>'}
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      ${(!id || c.agente_id===window._agenteId || !c.agente_id)
        ? `<button class="btn btn-cta" onclick="saveClient('${id||''}')">Guardar</button>`
        : `<span style="font-size:.78rem;color:var(--g3);align-self:center">Solo lectura (otro agente)</span>`}
    </div>`;

  // Widen modal for tabbed content
  const box=document.getElementById('modal-box');
  if(box) box.style.maxWidth='640px';
  openModal();

  // Load async tab data if editing existing client
  if(id){
    loadClientDocs(id);
    loadClientQuotes(id, c.nombre||'');
    loadClientGroups(id);
  }
}

function _cliTab(idx, el){
  document.querySelectorAll('.cli-tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.cli-tab-panel').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.cli-tab-panel')[idx]?.classList.add('on');
}

async function saveClient(id){
  const v=fid=>document.getElementById(fid)?.value?.trim()||'';
  const nm=v('mc-nm');
  if(!nm){alert('Nombre requerido');return;}
  const row={nombre:nm};
  const fields={
    celular:'mc-cel', email:'mc-em', doc_tipo:'mc-doc-tipo', documento:'mc-doc',
    pasaporte_vto:'mc-pasaporte-vto', fecha_nac:'mc-fecha-nac', nacionalidad:'mc-nacionalidad',
    direccion:'mc-direccion', ciudad:'mc-ciudad', pais:'mc-pais', codigo_postal:'mc-cp',
    telefono2:'mc-tel2', emergencia_nombre:'mc-emerg-nm', emergencia_tel:'mc-emerg-tel',
    notas:'mc-not', visa_tipo:'mc-visa-tipo', visa_pais:'mc-visa-pais', visa_vto:'mc-visa-vto',
    ff_aerolinea:'mc-ff-aero', ff_numero:'mc-ff-num', asiento_pref:'mc-asiento',
    comida_pref:'mc-comida', alergias:'mc-alergias'
  };
  Object.entries(fields).forEach(([col,elId])=>{
    const val=v(elId);
    if(val) row[col]=val;
  });
  if(id){await sb.from('clientes').update(row).eq('id',id);}
  else{
    // Asignar agente_id al crear cliente nuevo
    if(window._agenteId) row.agente_id = window._agenteId;
    await sb.from('clientes').insert(row);
  }
  // Restore modal max-width
  const box=document.getElementById('modal-box');
  if(box) box.style.maxWidth='500px';
  closeModal();toast('Cliente guardado');renderClients();
}
async function deleteClient(id){
  if(!confirm('¿Eliminar cliente?'))return;
  // Solo el owner puede eliminar
  const {data:c}=await sb.from('clientes').select('agente_id').eq('id',id).single();
  if(c && c.agente_id && c.agente_id !== window._agenteId){
    toast('No podes eliminar clientes de otro agente', false); return;
  }
  await sb.from('clientes').delete().eq('id',id);
  toast('Cliente eliminado');renderClients();
}

// ═══════════════════════════════════════════
// CLIENT DOCUMENTS
// ═══════════════════════════════════════════

async function uploadClientDoc(clienteId){
  const inp=document.getElementById('mc-doc-file');
  const tipo=document.getElementById('mc-doc-tipo-upload')?.value||'otro';
  const f=inp.files[0]; if(!f)return;
  const ext=f.name.split('.').pop();
  const path=`${clienteId}/${tipo}_${Date.now()}.${ext}`;
  const {error}=await sb.storage.from('documentos-clientes').upload(path,f);
  if(error){toast('Error al subir: '+error.message,false);return;}
  await sb.from('documentos_cliente').insert({cliente_id:clienteId,tipo,nombre:f.name,storage_path:path});
  toast('Documento subido');
  loadClientDocs(clienteId);
  inp.value='';
}

async function loadClientDocs(clienteId){
  const el=document.getElementById('mc-docs-list');if(!el)return;
  const {data}=await sb.from('documentos_cliente').select('*').eq('cliente_id',clienteId).order('creado_en',{ascending:false});
  if(!data?.length){el.innerHTML='<div style="color:var(--g3);font-size:.82rem;padding:12px 0">Sin documentos</div>';return;}
  el.innerHTML=data.map(d=>{
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <div style="flex:1;min-width:0">
        <div style="font-size:.82rem;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.nombre||d.storage_path}</div>
        <span style="font-size:.68rem;padding:2px 8px;border-radius:10px;background:rgba(27,158,143,.1);color:var(--primary);font-weight:600">${d.tipo}</span>
      </div>
      <button onclick="downloadClientDoc('${d.storage_path}')" style="background:none;border:none;cursor:pointer;color:var(--primary)" title="Descargar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
      <button onclick="deleteClientDoc('${d.id}','${d.storage_path}','${clienteId}')" style="background:none;border:none;cursor:pointer;color:var(--red)" title="Eliminar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>`;
  }).join('');
}

async function downloadClientDoc(path){
  const {data}=await sb.storage.from('documentos-clientes').createSignedUrl(path,3600);
  if(data?.signedUrl) window.open(data.signedUrl,'_blank');
  else toast('Error al generar link',false);
}

async function deleteClientDoc(docId,path,clienteId){
  if(!confirm('Eliminar este documento?'))return;
  await sb.storage.from('documentos-clientes').remove([path]);
  await sb.from('documentos_cliente').delete().eq('id',docId);
  toast('Documento eliminado');
  loadClientDocs(clienteId);
}

// ═══════════════════════════════════════════
// CLIENT QUOTES LIST
// ═══════════════════════════════════════════

async function loadClientQuotes(clienteId, clienteNombre){
  const el=document.getElementById('mc-quotes-list');if(!el)return;
  const {data}=await sb.from('cotizaciones').select('*').order('creado_en',{ascending:false});
  const matches=(data||[]).filter(r=>r.cliente_id===clienteId || (r.datos?.cliente?.nombre||'').toLowerCase()===clienteNombre.toLowerCase());
  if(!matches.length){el.innerHTML='<div style="color:var(--g3);font-size:.82rem;padding:12px 0">Sin cotizaciones</div>';return;}
  const stLbl={borrador:'Borrador',enviada:'Enviada',confirmada:'Confirmada',cancelada:'Cancelada'};
  el.innerHTML=`<table class="tbl" style="width:100%"><thead><tr><th>Ref</th><th>Destino</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>${matches.map(r=>`<tr style="cursor:pointer" onclick="document.getElementById('modal-box').style.maxWidth='500px';closeModal();loadFromHistory('${r.ref_id}','${r.id}')">
    <td style="font-family:'DM Mono',monospace;font-size:.75rem">${r.ref_id||'---'}</td>
    <td>${r.destino||'---'}</td>
    <td><span class="status-badge st-${r.estado||'borrador'}">${stLbl[r.estado]||r.estado||'---'}</span></td>
    <td style="font-size:.75rem;color:var(--g4)">${new Date(r.creado_en||Date.now()).toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}</td>
  </tr>`).join('')}</tbody></table>`;
}

// ═══════════════════════════════════════════
// CLIENT GROUPS
// ═══════════════════════════════════════════

async function loadClientGroups(clienteId){
  const el=document.getElementById('mc-groups-list');if(!el)return;
  const {data:memberships}=await sb.from('grupo_miembros').select('grupo_id').eq('cliente_id',clienteId);
  if(!memberships?.length){el.innerHTML='<div style="color:var(--g3);font-size:.82rem;padding:12px 0">No pertenece a ning&#250;n grupo</div>';return;}
  const groupIds=memberships.map(m=>m.grupo_id);
  const {data:groups}=await sb.from('grupos_viaje').select('*').in('id',groupIds);
  el.innerHTML=(groups||[]).map(g=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
    <span style="font-size:.85rem;font-weight:600">${g.nombre}</span>
    <button onclick="removeFromGroup('${clienteId}','${g.id}')" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--red);font-size:.72rem">Quitar</button>
  </div>`).join('');
}

async function removeFromGroup(clienteId,grupoId){
  await sb.from('grupo_miembros').delete().eq('cliente_id',clienteId).eq('grupo_id',grupoId);
  toast('Removido del grupo');
  loadClientGroups(clienteId);
}

// ═══════════════════════════════════════════
// PREVIEW PERMISSIONS
// ═══════════════════════════════════════════
function _applyPreviewPermissions(){
  const isOwner=!window._viewingQuoteOwnerId || window._viewingQuoteOwnerId===window._agenteId;
  // Botones en la toolbar de preview
  document.querySelectorAll('#prev-toolbar .btn').forEach(btn=>{
    const txt=btn.textContent||'';
    // Ocultar "Editar" y "Guardar" si no es propietario
    if(txt.includes('Editar')||txt.includes('Guardar')){
      btn.style.display=isOwner?'':'none';
    }
  });
}

// ═══════════════════════════════════════════
// TRAVEL GROUPS
// ═══════════════════════════════════════════

async function renderGroups(){
  const el=document.getElementById('group-list');if(!el)return;
  const {data:groups}=await sb.from('grupos_viaje').select('*').order('creado_en',{ascending:false});
  if(!groups?.length){el.innerHTML='<div style="color:var(--g3);font-size:.82rem;padding:12px 0">Sin grupos creados</div>';return;}
  const {data:members}=await sb.from('grupo_miembros').select('*');
  const allCli=await dbLoadClients();

  el.innerHTML=groups.map(g=>{
    const gMembers=(members||[]).filter(m=>m.grupo_id===g.id);
    const memberNames=gMembers.map(m=>{
      const cli=allCli.find(c=>c.id===m.cliente_id);
      return cli?.nombre||'---';
    });
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="width:36px;height:36px;border-radius:10px;background:rgba(27,158,143,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:.88rem;font-weight:700;color:var(--text)">${g.nombre}</div>
        <div style="font-size:.75rem;color:var(--g4);margin-top:2px">${memberNames.length?memberNames.join(', '):'Sin miembros'}</div>
      </div>
      <span style="font-size:.72rem;color:var(--g3);background:var(--g1);padding:3px 10px;border-radius:12px">${gMembers.length} miembro${gMembers.length!==1?'s':''}</span>
      <button onclick="openGroupModal('${g.id}')" class="btn btn-out btn-xs">Editar</button>
      <button onclick="deleteGroup('${g.id}')" style="background:none;border:none;cursor:pointer;color:var(--red)" title="Eliminar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>`;
  }).join('');
}

async function openGroupModal(id){
  const allCli=await dbLoadClients();
  let group={nombre:''}, existingMembers=[];
  if(id){
    const {data:g}=await sb.from('grupos_viaje').select('*').eq('id',id).single();
    if(g) group=g;
    const {data:mems}=await sb.from('grupo_miembros').select('cliente_id').eq('grupo_id',id);
    existingMembers=(mems||[]).map(m=>m.cliente_id);
  }

  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:16px">${id?'Editar grupo':'+ Nuevo grupo de viaje'}</div>
    <div class="fg"><label class="lbl">Nombre del grupo</label><input class="finput" id="mg-nm" value="${group.nombre}" placeholder="Ej: Familia Martinez, Amigos Europa 2026"></div>
    <div style="margin-top:16px">
      <label class="lbl">Miembros</label>
      <input class="finput" id="mg-search" placeholder="Buscar cliente..." oninput="_filterGroupMembers(this.value)" style="margin-bottom:8px">
      <div id="mg-members" style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r2);padding:4px">
        ${allCli.map(c=>`<label style="display:flex;align-items:center;gap:8px;padding:6px 8px;cursor:pointer;border-radius:6px;font-size:.82rem" class="mg-member-row">
          <input type="checkbox" value="${c.id}" ${existingMembers.includes(c.id)?'checked':''} style="accent-color:var(--primary)">
          <span>${c.nombre}</span>
          <span style="font-size:.7rem;color:var(--g3);margin-left:auto">${c.email||c.celular||''}</span>
        </label>`).join('')}
        ${!allCli.length?'<div style="padding:12px;color:var(--g3);font-size:.82rem">No hay clientes. Crea uno primero.</div>':''}
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-cta" onclick="saveGroup('${id||''}')">Guardar grupo</button>
    </div>`;
  openModal();
}

function _filterGroupMembers(q){
  const rows=document.querySelectorAll('.mg-member-row');
  const s=q.toLowerCase();
  rows.forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(s)?'':'none';});
}

async function saveGroup(id){
  const nm=document.getElementById('mg-nm')?.value?.trim();
  if(!nm){alert('Nombre requerido');return;}
  const checked=[...document.querySelectorAll('#mg-members input[type=checkbox]:checked')].map(c=>c.value);

  let groupId=id;
  if(id){
    await sb.from('grupos_viaje').update({nombre:nm}).eq('id',id);
  } else {
    const {data}=await sb.from('grupos_viaje').insert({nombre:nm}).select('id').single();
    if(data) groupId=data.id;
  }
  if(!groupId){toast('Error al guardar grupo',false);return;}

  // Sync members: delete all, re-insert checked
  await sb.from('grupo_miembros').delete().eq('grupo_id',groupId);
  if(checked.length){
    const rows=checked.map(cid=>({grupo_id:groupId,cliente_id:cid}));
    await sb.from('grupo_miembros').insert(rows);
  }

  closeModal();toast('Grupo guardado');renderGroups();
}

async function deleteGroup(id){
  if(!confirm('Eliminar este grupo?'))return;
  await sb.from('grupos_viaje').delete().eq('id',id);
  toast('Grupo eliminado');renderGroups();
}

// ═══════════════════════════════════════════
