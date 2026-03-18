async function renderHistory(){
  const el=document.getElementById('hist-list');
  el.innerHTML='<div style="text-align:center;padding:40px;color:var(--g3)"><span class="spin" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(27,158,143,.25);border-top-color:#1B9E8F;border-radius:50%;vertical-align:middle"></span> Cargando...</div>';
  const rows=await dbLoadQuotes();
  const filt=document.getElementById('hist-filter')?.value||'';
  const srch=(document.getElementById('hist-search')?.value||'').toLowerCase();
  const filtered=rows.filter(r=>{
    if(filt&&r.estado!==filt)return false;
    if(srch&&!(r.destino||'').toLowerCase().includes(srch)&&!(r.pasajeros||'').toLowerCase().includes(srch)&&!(r.ref_id||'').includes(srch))return false;
    return true;
  });
  if(!filtered.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--g3)">Sin resultados.</div>';return;}
  const stLbl={borrador:'Borrador',enviada:'Enviada',confirmada:'Confirmada',cancelada:'Cancelada'};
  el.innerHTML=filtered.map(r=>`
    <div class="hist-item" onclick="loadFromHistory('${r.ref_id}','${r.id}')">
      <div class="hist-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
      <div class="hist-info">
        <div class="hist-nm">${r.datos?.cliente?.nombre||'Sin nombre'} — ${r.destino||'Sin destino'}</div>
        <div class="hist-meta">Ref: ${r.ref_id} · ${r.pasajeros||''} · ${r.fecha_sal||''}</div>
        <div class="hist-meta">${new Date(r.created_at||r.creado_en||Date.now()).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <span class="status-badge st-${r.estado||'borrador'}">${stLbl[r.estado]||r.estado}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
          <button class="btn btn-out btn-xs" onclick="event.stopPropagation();editFromHistory('${r.ref_id}','${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar</button>
          <button class="btn btn-out btn-xs" onclick="event.stopPropagation();openStatusModal('${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Estado</button>
          <button class="btn btn-del btn-xs" onclick="event.stopPropagation();deleteQuote('${r.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </div>
      </div>
    </div>`).join('');
}

async function loadFromHistory(refId, id){
  // Vista previa (click en la fila)
  const {data}=await sb.from('cotizaciones').select('*').eq('id',id).single();
  if(!data)return;
  qData=data.datos;
  if(data.cover_url) coverUrl=data.cover_url;
  renderPreview(qData);switchTab('preview');
}

async function editFromHistory(refId, id){
  // Cargar en formulario para editar
  const {data}=await sb.from('cotizaciones').select('*').eq('id',id).single();
  if(!data){ toast('No se encontró la cotización.',false); return; }
  // Store editing context
  editingQuoteId = id;
  const d = data.datos;
  if(data.cover_url) coverUrl=data.cover_url;
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

function _showEditBanner(refId){
  let banner = document.getElementById('edit-banner');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'edit-banner';
    banner.style.cssText = 'background:#FEF3C7;border:1.5px solid #F59E0B;border-radius:10px;padding:12px 18px;margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:.84rem;font-weight:600;color:#92400E';
    const formPanel = document.getElementById('tab-form');
    if(formPanel) formPanel.insertBefore(banner, formPanel.firstChild);
  }
  banner.innerHTML = '<span>Editando Ref: <strong>' + refId + '</strong> — Al guardar se actualizará en Supabase. Esta es una cotización existente.</span>&nbsp;<button onclick="cancelEdit()" style="margin-left:auto;flex-shrink:0;background:none;border:1.5px solid #D97706;border-radius:6px;padding:5px 12px;font-size:.76rem;font-weight:700;color:#92400E;cursor:pointer">✕ Descartar y crear nueva</button>';
  banner.style.display = 'flex';
}

function _hideEditBanner(){
  const banner = document.getElementById('edit-banner');
  if(banner) banner.style.display = 'none';
}

function cancelEdit(){
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
// kept for backwards compatibility
async function changeStatus(id){ openStatusModal(id); }

// ═══════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════
async function renderClients(){
  await loadClients();
  const q=(document.getElementById('cli-filter')?.value||'').toLowerCase();
  const filtered=allClients.filter(c=>!q||(c.nombre||'').toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q)||(c.celular||'').includes(q));
  const el=document.getElementById('cli-list');
  if(!filtered.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--g3)">Sin clientes.</div>';return;}
  el.innerHTML=`<table class="tbl"><thead><tr><th>Nombre</th><th>Celular</th><th>Email</th><th>Notas</th><th></th></tr></thead><tbody>
  ${filtered.map(c=>`<tr>
    <td><strong>${c.nombre||'—'}</strong></td>
    <td>${c.celular||'—'}</td>
    <td>${c.email||'—'}</td>
    <td style="font-size:.75rem;color:var(--g3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.notas||''}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-out btn-xs" onclick="openClientModal('${c.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="btn btn-del btn-xs" onclick="deleteClient('${c.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    </td>
  </tr>`).join('')}</tbody></table>`;
}

function openClientModal(id){
  const c=allClients.find(x=>x.id===id)||{};
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">${id?'Editar cliente':'+ Nuevo cliente'}</div>
    <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="mc-nm" value="${c.nombre||''}" placeholder="Hugo Martínez"></div>
    <div class="fg"><label class="lbl">Celular</label><input class="finput" id="mc-cel" value="${c.celular||''}" placeholder="+54 362..."></div>
    <div class="fg"><label class="lbl">Email</label><input class="finput" id="mc-em" value="${c.email||''}" placeholder="email@..."></div>
    <div class="fg"><label class="lbl">Notas</label><textarea class="ftxt" id="mc-not" rows="3">${c.notas||''}</textarea></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveClient('${id||''}')">Guardar</button>
    </div>`;
  openModal();
}
async function saveClient(id){
  const nm=document.getElementById('mc-nm').value.trim();if(!nm){alert('Nombre requerido');return;}
  const row={nombre:nm,celular:document.getElementById('mc-cel').value,email:document.getElementById('mc-em').value,notas:document.getElementById('mc-not').value};
  if(id){await sb.from('clientes').update(row).eq('id',id);}
  else{await sb.from('clientes').insert(row);}
  closeModal();toast('✓ Cliente guardado');renderClients();
}
async function deleteClient(id){
  if(!confirm('¿Eliminar cliente?'))return;
  await sb.from('clientes').delete().eq('id',id);
  toast('Cliente eliminado');renderClients();
}

// ═══════════════════════════════════════════
