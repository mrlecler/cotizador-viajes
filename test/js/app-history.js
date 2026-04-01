let _histPageSize=25;
let _cliPageSize=25;
let _agentNames={};

// ── Estado helpers ──
function _isExpired(r){
  const fv=r.datos?.fecha_vencimiento;
  if(!fv)return false;
  const today=new Date();today.setHours(0,0,0,0);
  return new Date(fv+'T12:00:00')<today;
}
// Auto-expirar filas con fecha_vencimiento pasada (modifica rows in-place y actualiza Supabase)
async function _autoExpireQuotes(rows){
  const today=new Date();today.setHours(0,0,0,0);
  const toExpire=rows.filter(r=>(r.estado==='enviada'||r.estado==='pendiente')&&r.datos?.fecha_vencimiento&&new Date(r.datos.fecha_vencimiento+'T12:00:00')<today);
  if(!toExpire.length)return;
  const ids=toExpire.map(r=>r.id);
  try{
    await sb.from('cotizaciones').update({estado:'vencida'}).in('id',ids);
    toExpire.forEach(r=>{r.estado='vencida';});
  }catch(e){console.warn('[autoExpire]',e);}
}

async function _loadAgentNames(){
  if(Object.keys(_agentNames).length) return;
  try{const{data}=await sb.from('agentes').select('id,nombre,email');
  (data||[]).forEach(a=>{_agentNames[a.id]=a.nombre||a.email||'';});}catch(e){}
}

async function renderHistory(){
  const el=document.getElementById('hist-list');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:40px;color:var(--g3)"><span class="spin spin-tq"></span> Cargando...</div>';
  try{
  if(currentRol==='admin'||currentRol==='agencia') await _loadAgentNames();
  const rows=await dbLoadQuotes();
  // Auto-expirar cotizaciones enviadas/pendientes con fecha_vencimiento pasada
  await _autoExpireQuotes(rows);
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
  // Agente solo ve sus propias cotizaciones (RLS puede devolver de mas)
  const visible=currentRol==='agente'?filtered.filter(r=>!r.agente_id||r.agente_id===window._agenteId):filtered;
  if(!visible.length){
    el.innerHTML=`<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>No hay resultados</p><small>Probá cambiando los filtros o el texto de búsqueda</small></div>`;
    return;
  }
  const shown=visible.slice(0,_histPageSize);
  const stLbl={borrador:'Borrador',enviada:'Enviada',pendiente:'Pendiente',confirmada:'Confirmada',aprobado:'Aprobada',cancelada:'Cancelada',vencida:'Vencida',revision:'Revisión'};
  // Calcular cuántas versiones tiene cada base ref_id (para mostrar indicador en V1)
  const _vBase=r=>(r.ref_id||'').replace(/-V\d+$/,'');
  const _vN=r=>{const m=(r.ref_id||'').match(/-V(\d+)$/);return m?parseInt(m[1]):1;};
  const baseCounts={};
  visible.forEach(r=>{const b=_vBase(r);baseCounts[b]=(baseCounts[b]||0)+1;});

  el.innerHTML=shown.map(r=>{
    const canE=_canEdit(r), canV=_canView(r);
    // Badge de versión
    const vn=_vN(r);
    const vBadge=`<span style="display:inline-flex;align-items:center;background:${vn>1?'rgba(27,158,143,0.12)':'rgba(45,31,20,0.06)'};border:1px solid ${vn>1?'rgba(27,158,143,0.3)':'rgba(45,31,20,0.1)'};border-radius:20px;padding:1px 7px;font-size:9px;font-weight:800;color:${vn>1?'var(--primary)':'var(--g3)'};letter-spacing:.5px;margin-left:5px">V${vn}</span>`;
    // Indicador de versiones extra (solo en V1 original)
    const extraVers=baseCounts[_vBase(r)]>1&&vn===1?`<span style="font-size:.7rem;color:var(--primary);font-weight:600;margin-left:6px">${baseCounts[_vBase(r)]} versiones</span>`:'';
    const editBtn = canE
      ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();editFromHistory('${r.ref_id}','${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar</button>`
      : (canV ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();loadFromHistory('${r.ref_id}','${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver</button>` : '');
    const dupBtn = canE
      ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();duplicateFromHistory('${r.ref_id}','${r.id}')" title="Duplicar cotizacion con nuevo numero"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>` : '';
    const statusBtn = canE
      ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();openStatusModal('${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Estado</button>` : '';
    const delBtn = (canE && (!r.estado || r.estado==='borrador'))
      ? `<button class="btn btn-del btn-xs" onclick="event.stopPropagation();deleteQuote('${r.id}')" title="Eliminar borrador"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>` : '';
    const rsvBtn = (canE && (r.estado==='aprobado'||r.estado==='confirmada'))
      ? `<button class="btn btn-out btn-xs" onclick="event.stopPropagation();openReservaDrawer('${r.id}')" style="color:#22c55e;border-color:rgba(34,197,94,0.3)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg> Seguimiento</button>` : '';
    // Indicadores visuales de reserva
    const rsv=r.datos?._reserva||{};
    const _pagos=Array.isArray(r.datos?._pagos)?r.datos._pagos:[];
    const _hoy=new Date().toISOString().slice(0,10);
    const rsvIndicators=[];
    if(rsv.fecha_limite_pago&&rsv.fecha_limite_pago<_hoy) rsvIndicators.push('<span style="color:#ef4444;font-size:.68rem;font-weight:600">Pago vencido</span>');
    if(_pagos.length>0){
      const _pt=Number(r.datos?.precio_total||r.datos?.total_precio||0);
      const _pp=_pagos.reduce((s,p)=>s+(+p.monto||0),0);
      const _saldo=_pt>0?Math.max(0,_pt-_pp):null;
      if(_saldo===0) rsvIndicators.push('<span style="color:#22c55e;font-size:.68rem;font-weight:600">Pagado completo</span>');
      else if(_pt>0) rsvIndicators.push('<span style="color:var(--primary);font-size:.68rem;font-weight:600">$'+_pp.toLocaleString('es-AR')+' pagados</span>');
      else rsvIndicators.push('<span style="color:var(--primary);font-size:.68rem;font-weight:600">'+_pagos.length+' pago'+(_pagos.length>1?'s':'')+' registrado'+(_pagos.length>1?'s':'')+'</span>');
    }
    if(rsv.vouchers_notas) rsvIndicators.push('<span style="color:#22c55e;font-size:.68rem;font-weight:600">Vouchers</span>');
    const rsvLine=rsvIndicators.length?'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:2px">'+rsvIndicators.join('')+'</div>':'';
    return `
    <div class="hist-item${vn>1?' hist-item-ver':''}" onclick="loadFromHistory('${r.ref_id}','${r.id}')" style="${vn>1?'border-left:3px solid rgba(27,158,143,0.35);margin-left:12px;':''}">
      <div class="hist-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
      <div class="hist-info">
        <div class="hist-nm">${r.datos?.cliente?.nombre||'Sin nombre'} — ${r.destino||'Sin destino'}${extraVers}</div>
        <div class="hist-meta"><span class="hist-refid">${r.ref_id||'—'}</span>${vBadge}${r.pasajeros?' · '+r.pasajeros:''}${(!canE&&r.agente_id&&_agentNames[r.agente_id])?' · <span style="color:var(--primary);font-weight:600">'+_agentNames[r.agente_id]+'</span>':''}</div>
        <div class="hist-meta">${new Date(r.creado_en||r.updated_at||Date.now()).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}${r.fecha_sal?' · salida: '+r.fecha_sal:''}${r.datos?.fecha_vencimiento?' · vence: <span style="color:'+(_isExpired(r)?'var(--red)':'var(--g4)')+'">'+new Date(r.datos.fecha_vencimiento+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short'})+'</span>':''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <span class="status-badge st-${r.estado||'borrador'}">${stLbl[r.estado]||r.estado}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
          ${editBtn}${dupBtn}${statusBtn}${rsvBtn}${delBtn}
        </div>
        ${rsvLine}
      </div>
    </div>`;
  }).join('')+`
  <div class="list-footer">
    <span class="list-count">Mostrando ${shown.length} de ${visible.length} cotizaciones</span>
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
  }catch(e){console.error('[renderHistory]',e);el.innerHTML='<div style="padding:20px;text-align:center;color:var(--g3);font-size:.82rem">No se pudo cargar el historial. Reintentá en un momento.</div>';}
}
function _setHistPageSize(n){_histPageSize=parseInt(n);renderHistory();}

async function loadFromHistory(refId, id){
  // Vista previa (click en la fila)
  const {data}=await sb.from('cotizaciones').select('*').eq('id',id).single();
  if(!data)return;
  window._hFotos={};
  qData=data.datos;
  editingQuoteId=id;
  if(data.cover_url) coverUrl=data.cover_url;
  // Restaurar template del agente — primero desde la cotización, si no desde agCfg
  const savedTheme=data.datos?._agent?.pdf_theme;
  if(savedTheme&&typeof selectPdfTheme==='function') selectPdfTheme(savedTheme);
  renderPreview(qData);switchTab('preview');
}

async function editFromHistory(refId, id){
  const {data}=await sb.from('cotizaciones').select('*').eq('id',id).single();
  if(!data){ toast('No se encontró la cotización.',false); return; }
  if(!_canEdit(data)){ toast('No tenés permiso para editar esta cotización',false); return; }
  window._hFotos={};
  // Store editing context
  editingQuoteId = id;
  const d = data.datos;
  if(data.cover_url) coverUrl=data.cover_url;
  // Restaurar template guardado en la cotización
  const savedTheme=d?._agent?.pdf_theme;
  if(savedTheme&&typeof selectPdfTheme==='function') selectPdfTheme(savedTheme);
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
  if(!_canEdit(data)){ toast('No podés duplicar cotizaciones de otro agente',false); return; }
  // Deep copy datos and clear ref + client so a new quote is created
  const d=JSON.parse(JSON.stringify(data.datos||{}));
  delete d.refId;
  if(d.cliente){ d.cliente.nombre=''; d.cliente.celular=''; d.cliente.email=''; }
  // Reset editing state — this will be a NEW quote
  editingQuoteId=null;
  _hideEditBanner();
  if(data.cover_url) coverUrl=data.cover_url;
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
  // Badge de versión si el ref_id tiene sufijo -Vn
  const vMatch=(refId||'').match(/-V(\d+)$/);
  const vBadge=vMatch?'<span style="display:inline-flex;align-items:center;background:rgba(27,158,143,0.15);border:1px solid rgba(27,158,143,0.3);border-radius:20px;padding:1px 8px;font-size:10px;font-weight:800;color:var(--primary);letter-spacing:.5px;margin-left:6px">V'+vMatch[1]+'</span>':'';
  banner.innerHTML =
    '<div class="edit-banner-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>' +
    '<div class="edit-banner-body">' +
      '<div class="edit-banner-ttl">Editando <strong>' + refId + '</strong>' + vBadge + '</div>' +
      '<div class="edit-banner-sub">Los cambios se guardarán sobre esta cotización. Usá V+ para crear una versión alternativa.</div>' +
    '</div>' +
    '<button onclick="cancelEdit()" class="edit-banner-btn">Descartar</button>';
  banner.style.display = 'flex';
  // Mostrar botón "Nueva versión" en la sticky bar
  const vBtn=document.getElementById('btn-new-version');
  if(vBtn)vBtn.style.display='';
}

function _hideEditBanner(){
  const banner = document.getElementById('edit-banner');
  if(banner) banner.style.display = 'none';
  // Ocultar botón "Nueva versión"
  const vBtn=document.getElementById('btn-new-version');
  if(vBtn)vBtn.style.display='none';
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
function openStatusModal(id){ if(!id||id==='null'||id==='undefined'){console.warn('[openStatusModal] id inválido:',id);return;} _statusTargetId=id; const m=document.getElementById('modal-status'); m.style.display='flex'; }
function closeStatusModal(){ document.getElementById('modal-status').style.display='none'; _statusTargetId=null; }
async function applyStatus(s){
  if(!_statusTargetId||_statusTargetId==='null'||_statusTargetId==='undefined') return;
  const {data:q}=await sb.from('cotizaciones').select('agente_id,datos').eq('id',_statusTargetId).maybeSingle();
  if(q&&!_canEdit(q)){toast('No podés cambiar el estado de cotizaciones de otro agente',false);closeStatusModal();return;}
  closeStatusModal();
  const upd={estado:s};
  // Al marcar como enviada: guardar fecha_vencimiento = hoy + validez_dias (default 7)
  if(s==='enviada'||s==='pendiente'){
    const dias=parseInt(agCfg?.validez_dias)||7;
    const vence=new Date();vence.setDate(vence.getDate()+dias);
    const fv=vence.toISOString().slice(0,10);
    const dCurrent=typeof q?.datos==='string'?JSON.parse(q.datos):(q?.datos||{});
    upd.datos={...dCurrent,fecha_vencimiento:fv};
  }
  const {error:stErr}=await sb.from('cotizaciones').update(upd).eq('id',_statusTargetId);
  if(stErr){toast('Error al cambiar estado: '+stErr.message,false);if(typeof _captureError==='function')_captureError('applyStatus',stErr);return;}
  // Post-aprobación: popup para registrar comisión como ingreso
  if((s==='aprobado'||s==='confirmada')&&typeof _showIngresoPostApproval==='function'){
    const d=typeof q?.datos==='string'?JSON.parse(q.datos):(q?.datos||{});
    const cli=d.cliente?.nombre||'';
    const dest=d.viaje?.destino||'';
    const com=d.total_comision||d.markup_comision||0;
    _showIngresoPostApproval(_statusTargetId,cli,dest,com);
  } else {
    toast('Estado actualizado a: '+s);
  }
  renderHistory();
  if(typeof loadDashboardMetrics==='function') loadDashboardMetrics();
}

// ═══════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════
async function renderClients(){
  const elCli=document.getElementById('cli-list');
  if(!elCli) return;
  elCli.innerHTML='<div style="text-align:center;padding:40px;color:var(--g3)"><span class="spin spin-tq"></span> Cargando...</div>';
  try{
  if(currentRol==='admin'||currentRol==='agencia') await _loadAgentNames();
  await loadClients();
  const q=(document.getElementById('cli-filter')?.value||'').toLowerCase().trim();
  const filtered=allClients.filter(c=>!q||(c.nombre||'').toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q)||(c.celular||'').includes(q));
  // Agente solo ve sus propios clientes
  const visible=currentRol==='agente'?filtered.filter(c=>!c.agente_id||c.agente_id===window._agenteId):filtered;
  const el=document.getElementById('cli-list');
  if(!visible.length){
    el.innerHTML=`<div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p>${q?'Sin resultados para "'+q+'"':'Todavía no tenés clientes'}</p><small>${q?'Probá con otro nombre, email o teléfono':'Agregá tu primer cliente con el botón + Nuevo cliente'}</small></div>`;
    return;
  }
  const shown=visible.slice(0,_cliPageSize);
  const showAgent=currentRol==='admin'||currentRol==='agencia';
  el.innerHTML=`<table class="tbl"><thead><tr><th>Nombre</th><th>Celular</th><th>Email</th>${showAgent?'<th>Agente</th>':''}<th>Notas</th><th></th></tr></thead><tbody>
  ${shown.map(c=>{
    const canE=_canEdit(c), canV=_canView(c);
    const editBtn = canE
      ? `<button class="btn btn-out btn-xs" onclick="openClientModal('${c.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`
      : (canV ? `<button class="btn btn-out btn-xs" onclick="openClientModal('${c.id}')" title="Solo lectura"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>` : '');
    const delBtn = canE
      ? `<button class="btn btn-del btn-xs" onclick="deleteClient('${c.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>` : '';
    const agName=showAgent&&c.agente_id&&_agentNames[c.agente_id]?`<td style="font-size:.78rem;color:var(--primary);font-weight:600">${_agentNames[c.agente_id]}</td>`:(showAgent?'<td style="color:var(--g3);font-size:.78rem">—</td>':'');
    return `<tr>
    <td><strong>${c.nombre||'—'}</strong></td>
    <td>${c.celular||'—'}</td>
    <td>${c.email||'—'}</td>
    ${agName}
    <td style="font-size:.75rem;color:var(--g3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.notas||''}</td>
    <td style="white-space:nowrap">${editBtn}${delBtn}</td>
  </tr>`;
  }).join('')}</tbody></table>
  <div class="list-footer">
    <span class="list-count">Mostrando ${shown.length} de ${visible.length} clientes</span>
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
  }catch(e){console.error('[renderClients]',e);elCli.innerHTML='<div style="padding:20px;text-align:center;color:var(--g3);font-size:.82rem">No se pudo cargar los clientes. Reintentá en un momento.</div>';}
}
function _setCliPageSize(n){_cliPageSize=parseInt(n);renderClients();}

function openClientModal(id){
  const c=allClients.find(x=>x.id===id)||{};
  const readOnly=!!id&&!_canEdit(c);
  const _v=(k)=>c[k]||'';
  const _dis=readOnly?' disabled':'';
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:12px">${readOnly?'Ver cliente':id?'Editar cliente':'+ Nuevo cliente'}</div>
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
      <button class="btn btn-out" onclick="closeModal()">${readOnly?'Cerrar':'Cancelar'}</button>
      ${readOnly?'':`<button class="btn btn-cta" onclick="saveClient('${id||''}')">Guardar</button>`}
    </div>`;

  // Widen modal for tabbed content
  const box=document.getElementById('modal-box');
  if(box) box.style.maxWidth='640px';
  openModal();
  // Read-only: deshabilitar todos los campos del modal
  if(readOnly){
    document.querySelectorAll('#modal-content input,#modal-content select,#modal-content textarea').forEach(el=>el.disabled=true);
    const uploadBtn=document.querySelector('#modal-content .btn-pri');
    if(uploadBtn) uploadBtn.style.display='none';
  }

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
  const {data:c}=await sb.from('clientes').select('agente_id').eq('id',id).maybeSingle();
  if(c&&!_canEdit(c)){toast('No podés eliminar clientes de otro agente',false);return;}
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
  const path=`${window._agenteId}/${clienteId}_${tipo}_${Date.now()}.${ext}`;
  const {error}=await sb.storage.from('documentos-clientes').upload(path,f);
  if(error){toast('Error al subir: '+error.message,false);return;}
  const {error:dbErr}=await sb.from('documentos_cliente').insert({cliente_id:clienteId,agente_id:window._agenteId,tipo,nombre:f.name,storage_path:path});
  if(dbErr){toast('Error al guardar: '+dbErr.message,false);return;}
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
  const stLbl={borrador:'Borrador',enviada:'Enviada',pendiente:'Pendiente',confirmada:'Confirmada',aprobado:'Aprobada',cancelada:'Cancelada',vencida:'Vencida',revision:'Revisión'};
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
// SEGUIMIENTO DE RESERVAS (drawer lateral)
// ═══════════════════════════════════════════
let _drawerQuotId=null;

function openDrawer(){
  document.getElementById('drawer-overlay')?.classList.add('open');
  document.getElementById('drawer-reserva')?.classList.add('open');
}
function closeDrawer(){
  document.getElementById('drawer-overlay')?.classList.remove('open');
  document.getElementById('drawer-reserva')?.classList.remove('open');
  _drawerQuotId=null;
}

async function openReservaDrawer(quotId){
  _drawerQuotId=quotId;
  const body=document.getElementById('drawer-reserva-body');
  body.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)"><span class="spin spin-tq"></span></div>';
  openDrawer();
  try{
    const{data}=await sb.from('cotizaciones').select('*').eq('id',quotId).single();
    if(!data){body.innerHTML='<p style="color:var(--g3)">No se encontró la cotización.</p>';return;}
    _renderReservaBody(data);
  }catch(e){body.innerHTML='<p style="color:var(--g3)">Error al cargar datos.</p>';console.error('[openReservaDrawer]',e);}
}

function _renderReservaBody(data){
  const body=document.getElementById('drawer-reserva-body');
  if(!body) return;
  const r=data.datos?._reserva||{};
  const pagos=Array.isArray(data.datos?._pagos)?data.datos._pagos:[];
  const cli=data.datos?.cliente?.nombre||'Pasajero';
  const dest=data.destino||data.datos?.viaje?.destino||'';
  const hoy=new Date().toISOString().slice(0,10);
  const limiteVencido=r.fecha_limite_pago&&r.fecha_limite_pago<hoy;

  // Precio total del viaje (de la cotización)
  const precioTotal=Number(data.datos?.precio_total||data.datos?.total_precio||data.precio_total||0);
  const totalPagado=pagos.reduce((s,p)=>s+(+p.monto||0),0);
  const saldo=Math.max(0,precioTotal-totalPagado);
  const pct=precioTotal>0?Math.min(100,(totalPagado/precioTotal)*100):0;
  const fmtAmt=n=>n>0?'$'+n.toLocaleString('es-AR'):'—';

  // Barra de progreso de pagos
  const progressBar=precioTotal>0?`
    <div style="margin:16px 0;padding:14px;background:var(--g1);border-radius:var(--r2)">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:.72rem;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:1px">Pagos del cliente</span>
        <span style="font-size:.78rem;font-weight:700;color:${saldo===0?'#22c55e':'var(--text)'}">${fmtAmt(totalPagado)} de ${fmtAmt(precioTotal)}</span>
      </div>
      <div style="height:6px;background:var(--g2);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${saldo===0?'#22c55e':'var(--primary)'};border-radius:3px;transition:width .3s"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <span style="font-size:.7rem;color:var(--g4)">Pagado: ${fmtAmt(totalPagado)}</span>
        <span style="font-size:.7rem;color:${saldo>0?'#FF6B35':'#22c55e'};font-weight:700">${saldo>0?'Saldo: '+fmtAmt(saldo):'Completado'}</span>
      </div>
    </div>`
  :`<div style="margin:16px 0;padding:12px;background:var(--g1);border-radius:var(--r2);font-size:.75rem;color:var(--g4)">El precio total no está cargado en la cotización. Editala para ver el seguimiento de saldo.</div>`;

  // Lista de pagos
  const pagoRows=pagos.length?pagos.map((p,i)=>`
    <div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="font-size:.82rem;font-weight:700;color:var(--text)">$${Number(p.monto||0).toLocaleString('es-AR')} USD</div>
        <div style="font-size:.72rem;color:var(--g4);margin-top:2px">${p.fecha||''} ${p.descripcion?'· '+p.descripcion:''}</div>
      </div>
      <button class="btn btn-del btn-xs" onclick="deletePago(${i})" title="Eliminar pago"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    </div>`).join('')
  :'<div style="padding:14px 0;text-align:center;color:var(--g3);font-size:.8rem">Sin pagos registrados</div>';

  body.innerHTML=`
    <!-- Header -->
    <div style="padding:12px 14px;background:var(--g1);border-radius:var(--r2);margin-bottom:16px">
      <div style="font-size:.85rem;font-weight:700;color:var(--text)">${cli}</div>
      <div style="font-size:.72rem;color:var(--g4);margin-top:2px">${dest} · <span style="font-family:'DM Mono',monospace">${data.ref_id||''}</span></div>
    </div>

    <!-- Progreso pagos -->
    ${progressBar}

    <!-- Agregar pago -->
    <div style="margin-bottom:16px">
      <label class="lbl" style="margin-bottom:8px;display:block">Registrar pago del cliente</label>
      <div style="display:flex;gap:8px;align-items:flex-start">
        <input class="finput" type="number" id="rsv-pago-monto" placeholder="Monto USD" style="width:110px;flex-shrink:0" min="1" step="any" inputmode="decimal">
        <input class="finput" type="date" id="rsv-pago-fecha" value="${hoy}" style="width:140px;flex-shrink:0">
        <input class="finput" id="rsv-pago-desc" placeholder="Descripción (opcional)" style="flex:1;min-width:0">
        <button class="btn btn-cta btn-sm" onclick="addPago()" title="Agregar pago" style="flex-shrink:0;white-space:nowrap">+ Agregar</button>
      </div>
    </div>

    <!-- Lista de pagos -->
    <div id="rsv-pagos-list" style="margin-bottom:20px;min-height:20px">
      ${pagoRows}
    </div>

    <!-- Info de reserva -->
    <div style="border-top:1px solid var(--border);padding-top:16px">
      <label class="lbl" style="margin-bottom:8px;display:block">Info de reserva</label>
      <div class="g2">
        <div class="fg"><label class="lbl">Nro. de reserva</label><input class="finput" id="rsv-nro" value="${r.nro_reserva||''}" placeholder="ABC-12345"></div>
        <div class="fg">
          <label class="lbl" style="${limiteVencido?'color:#ef4444':''}">${limiteVencido?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>':''} Vencimiento pago</label>
          <input class="finput" type="date" id="rsv-limite" value="${r.fecha_limite_pago||''}" style="${limiteVencido?'border-color:#ef4444;color:#ef4444':''}">
        </div>
      </div>
      <div class="fg"><label class="lbl">Notas internas</label><textarea class="finput" id="rsv-notas" rows="2" placeholder="Notas del agente sobre esta reserva..." style="resize:vertical">${r.notas_reserva||''}</textarea></div>
    </div>

    <!-- Documentos del viaje (vouchers, confirmaciones, seguros) -->
    <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:4px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <label class="lbl" style="margin:0">Documentos del viaje</label>
        <label style="cursor:pointer">
          <input type="file" id="rsv-doc-file" style="display:none" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif" onchange="uploadViajeDoc()">
          <span class="btn btn-out btn-xs" onclick="document.getElementById('rsv-doc-file').click()" style="display:inline-flex;align-items:center;gap:5px;cursor:pointer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Subir
          </span>
        </label>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <select class="finput" id="rsv-doc-tipo" style="flex:1;font-size:.78rem">
          <option value="voucher">Voucher</option>
          <option value="hotel">Confirmación hotel</option>
          <option value="aerolinea">Confirmación aerolínea</option>
          <option value="disney">Voucher Disney / Universal</option>
          <option value="seguro">Seguro de viaje</option>
          <option value="traslado">Confirmación traslado</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div id="rsv-docs-list"><div style="text-align:center;padding:12px;color:var(--g3);font-size:.78rem"><span class="spin spin-tq"></span></div></div>
    </div>
  \`;
  // Cargar documentos del viaje de forma asincrónica
  loadViajeDoc(data.id||_drawerQuotId);
}

let _drawerQuotData=null; // cache cotizacion data mientras el drawer está abierto

async function _loadDrawerData(){
  if(!_drawerQuotId) return null;
  const{data}=await sb.from('cotizaciones').select('*').eq('id',_drawerQuotId).single();
  _drawerQuotData=data;
  return data;
}

async function addPago(){
  const monto=parseFloat(document.getElementById('rsv-pago-monto')?.value);
  const fecha=document.getElementById('rsv-pago-fecha')?.value||new Date().toISOString().slice(0,10);
  const desc=(document.getElementById('rsv-pago-desc')?.value||'').trim();
  if(!monto||monto<=0){toast('Ingresá un monto válido',false);return;}
  if(!_drawerQuotId) return;
  try{
    const{data:row}=await sb.from('cotizaciones').select('*').eq('id',_drawerQuotId).single();
    const d=typeof row?.datos==='string'?JSON.parse(row.datos):(row?.datos||{});
    if(!Array.isArray(d._pagos)) d._pagos=[];
    d._pagos.push({fecha,monto,descripcion:desc,creado_en:new Date().toISOString()});
    const{error}=await sb.from('cotizaciones').update({datos:d}).eq('id',_drawerQuotId);
    if(error){toast('Error: '+error.message,false);return;}
    // limpiar inputs
    const mi=document.getElementById('rsv-pago-monto');if(mi) mi.value='';
    const di=document.getElementById('rsv-pago-desc');if(di) di.value='';
    // re-render drawer con datos frescos
    _renderReservaBody({...row,datos:d});
    toast('Pago registrado');
    renderHistory();
  }catch(e){toast('Error al agregar pago',false);console.error('[addPago]',e);}
}

async function deletePago(idx){
  if(!_drawerQuotId) return;
  if(!confirm('¿Eliminar este pago?')) return;
  try{
    const{data:row}=await sb.from('cotizaciones').select('*').eq('id',_drawerQuotId).single();
    const d=typeof row?.datos==='string'?JSON.parse(row.datos):(row?.datos||{});
    if(!Array.isArray(d._pagos)||d._pagos[idx]===undefined){toast('Pago no encontrado',false);return;}
    d._pagos.splice(idx,1);
    const{error}=await sb.from('cotizaciones').update({datos:d}).eq('id',_drawerQuotId);
    if(error){toast('Error: '+error.message,false);return;}
    _renderReservaBody({...row,datos:d});
    toast('Pago eliminado');
    renderHistory();
  }catch(e){toast('Error al eliminar pago',false);console.error('[deletePago]',e);}
}

async function saveReserva(){
  if(!_drawerQuotId) return;
  const reserva={
    nro_reserva:(document.getElementById('rsv-nro')?.value||'').trim(),
    fecha_limite_pago:document.getElementById('rsv-limite')?.value||null,
    notas_reserva:(document.getElementById('rsv-notas')?.value||'').trim()
  };
  try{
    const{data:row}=await sb.from('cotizaciones').select('datos').eq('id',_drawerQuotId).single();
    const d=typeof row?.datos==='string'?JSON.parse(row.datos):(row?.datos||{});
    d._reserva=reserva;
    const{error}=await sb.from('cotizaciones').update({datos:d}).eq('id',_drawerQuotId);
    if(error){toast('Error al guardar: '+error.message,false);return;}
    toast('Seguimiento guardado');
    closeDrawer();
    renderHistory();
    if(document.getElementById('crm-sub-seguimiento')?.classList.contains('on')) renderSeguimiento();
  }catch(e){toast('Error al guardar',false);console.error('[saveReserva]',e);}
}

// ═══════════════════════════════════════════
// DOCUMENTOS DEL VIAJE (Seguimiento)
// Usan documentos_cliente con quot_id para distinguirlos de docs personales
// ═══════════════════════════════════════════
async function uploadViajeDoc(){
  const inp=document.getElementById('rsv-doc-file');
  const tipo=document.getElementById('rsv-doc-tipo')?.value||'voucher';
  const f=inp?.files?.[0]; if(!f||!_drawerQuotId) return;
  const listEl=document.getElementById('rsv-docs-list');
  if(listEl) listEl.innerHTML='<div style="text-align:center;padding:10px;color:var(--g3);font-size:.78rem"><span class="spin spin-tq"></span> Subiendo...</div>';
  const ext=f.name.split('.').pop().toLowerCase();
  const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`${window._agenteId}/viajes/${_drawerQuotId}/${tipo}_${Date.now()}_${safe}`;
  try{
    const{error:storErr}=await sb.storage.from('documentos-clientes').upload(path,f,{upsert:false});
    if(storErr){toast('Error al subir: '+storErr.message,false);loadViajeDoc(_drawerQuotId);return;}
    // Obtener cliente_id de la cotización para mantener relación
    const{data:qt}=await sb.from('cotizaciones').select('cliente_id').eq('id',_drawerQuotId).maybeSingle();
    const insRow={
      agente_id:window._agenteId,
      quot_id:_drawerQuotId,
      cliente_id:qt?.cliente_id||null,
      tipo,
      nombre:f.name,
      storage_path:path
    };
    const{error:dbErr}=await sb.from('documentos_cliente').insert(insRow);
    if(dbErr){
      // Si quot_id no existe todavía, intentar sin él
      if(dbErr.code==='42703'||dbErr.message?.includes('quot_id')){
        delete insRow.quot_id;
        const{error:e2}=await sb.from('documentos_cliente').insert(insRow);
        if(e2){toast('Error al guardar: '+e2.message,false);loadViajeDoc(_drawerQuotId);return;}
        toast('Documento subido (ejecutá el SQL en Supabase para activar seguimiento completo)');
      } else {
        toast('Error al guardar: '+dbErr.message,false);loadViajeDoc(_drawerQuotId);return;
      }
    } else {
      toast('Documento subido');
    }
    if(inp) inp.value='';
    loadViajeDoc(_drawerQuotId);
  }catch(e){toast('Error al subir',false);console.error('[uploadViajeDoc]',e);loadViajeDoc(_drawerQuotId);}
}

async function loadViajeDoc(quotId){
  const el=document.getElementById('rsv-docs-list');if(!el||!quotId) return;
  try{
    const{data}=await sb.from('documentos_cliente')
      .select('*').eq('quot_id',quotId).order('creado_en',{ascending:false});
    if(!data?.length){
      el.innerHTML='<div style="color:var(--g3);font-size:.78rem;padding:8px 0;text-align:center">Sin documentos subidos</div>';
      return;
    }
    el.innerHTML=data.map(d=>`
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <div style="flex:1;min-width:0">
          <div style="font-size:.8rem;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${d.nombre||''}">${d.nombre||d.storage_path}</div>
          <span style="font-size:.65rem;padding:1px 7px;border-radius:10px;background:rgba(27,158,143,.1);color:var(--primary);font-weight:600">${d.tipo||'doc'}</span>
        </div>
        <button onclick="downloadViajeDoc('${d.storage_path}')" style="background:none;border:none;cursor:pointer;color:var(--primary);padding:4px" title="Descargar / Ver">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button onclick="deleteViajeDoc('${d.id}','${d.storage_path}')" style="background:none;border:none;cursor:pointer;color:var(--red);padding:4px" title="Eliminar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`).join('');
  }catch(e){
    el.innerHTML='<div style="color:var(--g3);font-size:.78rem;padding:8px 0">Error al cargar documentos</div>';
    console.warn('[loadViajeDoc]',e);
  }
}

async function downloadViajeDoc(path){
  const{data}=await sb.storage.from('documentos-clientes').createSignedUrl(path,3600);
  if(data?.signedUrl) window.open(data.signedUrl,'_blank');
  else toast('Error al generar link de descarga',false);
}

async function deleteViajeDoc(docId,path){
  if(!confirm('¿Eliminar este documento?')) return;
  await sb.storage.from('documentos-clientes').remove([path]);
  await sb.from('documentos_cliente').delete().eq('id',docId);
  toast('Documento eliminado');
  if(_drawerQuotId) loadViajeDoc(_drawerQuotId);
}

// ═══════════════════════════════════════════
// SEGUIMIENTO — sección propia
// ═══════════════════════════════════════════
async function renderSeguimiento(){
  const el=document.getElementById('seg-list');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:40px;color:var(--g3)"><span class="spin spin-tq"></span></div>';
  try{
    const{data:quotes,error}=await sb.from('cotizaciones')
      .select('*')
      .eq('agente_id',window._agenteId)
      .in('estado',['aprobado','confirmada'])
      .order('creado_en',{ascending:false});
    if(error){el.innerHTML='<div style="padding:20px;color:var(--red);font-size:.82rem">Error: '+error.message+'</div>';return;}
    if(!quotes||!quotes.length){
      el.innerHTML='<div style="text-align:center;padding:60px 24px"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--g2)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:16px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg><div style="font-size:.9rem;font-weight:700;color:var(--g3)">Sin reservas activas</div><div style="font-size:.78rem;color:var(--g3);margin-top:6px">Las cotizaciones aprobadas y confirmadas aparecerán acá</div></div>';
      return;
    }
    const hoy=new Date().toISOString().slice(0,10);
    const fmtAmt=n=>n>0?'$'+Number(n).toLocaleString('es-AR'):'—';
    const fmtDate=s=>s?new Date(s+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'2-digit'}):null;

    el.innerHTML=quotes.map(q=>{
      const d=q.datos||{};
      const r=d._reserva||{};
      const pagos=Array.isArray(d._pagos)?d._pagos:[];
      const cli=d.cliente?.nombre||'Sin nombre';
      const dest=q.destino||d.viaje?.destino||'Sin destino';
      const precioTotal=Number(d.precio_total||d.total_precio||q.precio_total||0);
      const totalPagado=pagos.reduce((s,p)=>s+(+p.monto||0),0);
      const saldo=precioTotal>0?Math.max(0,precioTotal-totalPagado):null;
      const pct=precioTotal>0?Math.min(100,(totalPagado/precioTotal)*100):null;
      const limiteVencido=r.fecha_limite_pago&&r.fecha_limite_pago<hoy;
      const isConf=q.estado==='confirmada';

      // Barra de progreso mini
      const barra=pct!==null?`
        <div style="height:4px;background:var(--g2);border-radius:2px;margin-top:6px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${saldo===0?'#22c55e':'var(--primary)'};border-radius:2px"></div>
        </div>`:'';

      return `<div class="card" style="margin-bottom:10px;cursor:pointer" onclick="openReservaDrawer('${q.id}')">
        <div class="card-body" style="padding:14px 16px">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                <span style="font-size:.85rem;font-weight:700;color:var(--text)">${cli}</span>
                <span style="font-size:.68rem;padding:2px 8px;border-radius:10px;background:${isConf?'rgba(34,197,94,.12)':'rgba(27,158,143,.12)'};color:${isConf?'#22c55e':'var(--primary)'};font-weight:700">${isConf?'Confirmada':'Aprobada'}</span>
                ${limiteVencido?'<span style="font-size:.68rem;padding:2px 8px;border-radius:10px;background:rgba(239,68,68,.1);color:#ef4444;font-weight:700">Pago vencido</span>':''}
              </div>
              <div style="font-size:.78rem;color:var(--g4)">${dest}</div>
              <div style="font-size:.68rem;color:var(--g3);margin-top:2px;font-family:'DM Mono',monospace">${q.ref_id||''}${q.fecha_sal?' · salida '+fmtDate(q.fecha_sal):''}</div>
              ${barra}
            </div>
            <div style="text-align:right;flex-shrink:0">
              ${precioTotal>0?`
                <div style="font-size:.72rem;color:var(--g3)">Total</div>
                <div style="font-size:.88rem;font-weight:800;color:var(--text)">${fmtAmt(precioTotal)}</div>
                ${pagos.length>0?`<div style="font-size:.7rem;margin-top:4px;color:${saldo===0?'#22c55e':'#FF6B35'};font-weight:700">${saldo===0?'Completado':'Saldo '+fmtAmt(saldo)}</div>`:''}
              `:`<div style="font-size:.72rem;color:var(--g3)">Sin precio</div>`}
              ${r.fecha_limite_pago?`<div style="font-size:.68rem;color:${limiteVencido?'#ef4444':'var(--g4)'};margin-top:4px">Vence ${fmtDate(r.fecha_limite_pago)}</div>`:''}
            </div>
          </div>
          ${r.nro_reserva?`<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:.72rem;color:var(--g4)">Nro. reserva: <span style="font-weight:700;color:var(--text);font-family:'DM Mono',monospace">${r.nro_reserva}</span></div>`:''}
          ${pagos.length>0?`<div style="margin-top:${r.nro_reserva?'4px':'8px'};font-size:.7rem;color:var(--g4)">${pagos.length} pago${pagos.length>1?'s':''} registrado${pagos.length>1?'s':''} · ${fmtAmt(totalPagado)} cobrado</div>`:''}
        </div>
      </div>`;
    }).join('');
  }catch(e){
    el.innerHTML='<div style="padding:20px;color:var(--red);font-size:.82rem">Error al cargar seguimientos.</div>';
    console.error('[renderSeguimiento]',e);
  }
}

// ═══════════════════════════════════════════
// FILTRO RÁPIDO HISTORIAL (Todas / Activas)
// ═══════════════════════════════════════════
let _histQuickFilter='';

function _setHistQuickFilter(btn){
  _histQuickFilter=btn.dataset.hqf||'';
  document.querySelectorAll('.hist-quick-filter').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  if(_histQuickFilter==='activas'){
    document.getElementById('hist-filter').value='aprobado';
  } else {
    document.getElementById('hist-filter').value='';
  }
  renderHistory();
}

// ═══════════════════════════════════════════
