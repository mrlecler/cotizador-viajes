// ═══════════════════════════════════════════
// INGRESOS — CRUD + Balance mensual
// ═══════════════════════════════════════════
// Tabla Supabase: ingresos (id, agente_id, quot_id, concepto, monto, moneda, fecha_cobro, estado, notas, created_at)
// SQL para crear tabla:
// CREATE TABLE IF NOT EXISTS ingresos (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   agente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   quot_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,
//   concepto TEXT NOT NULL,
//   monto NUMERIC NOT NULL,
//   moneda TEXT DEFAULT 'USD',
//   fecha_cobro DATE,
//   estado TEXT DEFAULT 'cobrado',
//   notas TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "agente_own_ingresos" ON ingresos FOR ALL USING (agente_id = auth.uid());

let _ingresosData=[];
let _ingFilter='';
let _ingView='lista'; // 'lista' | 'resumen'
let _ingEditId=null;

async function loadIngresos(){
  try{
    const{data,error}=await sb.from('ingresos').select('*').eq('agente_id',window._agenteId).order('fecha_cobro',{ascending:false});
    if(error){console.warn('[loadIngresos]',error.message);_ingresosData=[];return;}
    _ingresosData=data||[];
  }catch(e){console.warn('[loadIngresos]',e);_ingresosData=[];}
}

async function renderIngresos(){
  const el=document.getElementById('ing-list');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:30px;color:var(--g3)"><span class="spin spin-tq"></span></div>';
  await loadIngresos();
  if(_ingView==='resumen'){_renderBalance(el);return;}
  // Lista filtrada
  let items=_ingresosData;
  if(_ingFilter) items=items.filter(i=>i.estado===_ingFilter);
  // Total filtrado
  const totalFilt=items.reduce((s,i)=>s+(+i.monto||0),0);
  const cobrado=items.filter(i=>i.estado==='cobrado').reduce((s,i)=>s+(+i.monto||0),0);
  const pendiente=items.filter(i=>i.estado==='pendiente').reduce((s,i)=>s+(+i.monto||0),0);
  let html=`<div class="ing-total-bar">
    <div><span class="lbl" style="margin:0">Total filtrado</span></div>
    <div style="display:flex;gap:16px;align-items:center">
      ${cobrado?`<span style="font-size:.78rem;color:var(--primary);font-weight:600">Cobrado: USD ${cobrado.toLocaleString('es-AR')}</span>`:''}
      ${pendiente?`<span style="font-size:.78rem;color:#D4A017;font-weight:600">Pendiente: USD ${pendiente.toLocaleString('es-AR')}</span>`:''}
      <span class="ing-total-val">USD ${totalFilt.toLocaleString('es-AR')}</span>
    </div>
  </div>`;
  if(!items.length){
    html+='<div style="text-align:center;padding:40px;color:var(--g3)">Sin ingresos registrados</div>';
  } else {
    html+=items.map(i=>{
      const fmtDate=i.fecha_cobro?new Date(i.fecha_cobro+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'}):'Sin fecha';
      return `<div class="ing-item" onclick="openIngresoModal('${i.id}')">
        <div style="flex:1;min-width:0">
          <div class="ing-concepto">${i.concepto||'Sin concepto'}</div>
          <div class="ing-meta">${fmtDate} · ${i.moneda||'USD'}${i.quot_id?` · <span style="color:var(--primary);cursor:pointer">Ver cotización</span>`:''}</div>
          ${i.notas?`<div class="ing-meta" style="margin-top:1px;font-style:italic">${i.notas.substring(0,80)}</div>`:''}
        </div>
        <div class="ing-monto ${i.estado||'cobrado'}">${i.moneda||'USD'} ${(+i.monto||0).toLocaleString('es-AR')}</div>
        <span class="status-badge ${i.estado==='cobrado'?'st-aprobado':'st-pendiente'}" style="font-size:.6rem">${i.estado==='cobrado'?'Cobrado':'Pendiente'}</span>
      </div>`;
    }).join('');
  }
  el.innerHTML=html;
}

function _renderBalance(el){
  // Agrupar por mes
  const byMonth={};
  _ingresosData.forEach(i=>{
    const m=i.fecha_cobro?i.fecha_cobro.substring(0,7):'sin-fecha';
    if(!byMonth[m]) byMonth[m]={cobrado:0,pendiente:0,count:0};
    byMonth[m].count++;
    if(i.estado==='cobrado') byMonth[m].cobrado+=(+i.monto||0);
    else byMonth[m].pendiente+=(+i.monto||0);
  });
  const meses=Object.keys(byMonth).sort().reverse();
  const totalAnio=_ingresosData.filter(i=>i.estado==='cobrado').reduce((s,i)=>s+(+i.monto||0),0);
  const mejorMes=meses.reduce((best,m)=>{const v=byMonth[m].cobrado;return v>best.v?{m,v}:best},{m:'',v:0});
  const promedio=meses.length?Math.round(totalAnio/meses.length):0;
  // Meta mensual
  const meta=agCfg?.meta_mensual||0;
  const hoy=new Date();
  const mesActualKey=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
  const cobradoMesActual=byMonth[mesActualKey]?.cobrado||0;
  const pctMeta=meta>0?Math.min(100,Math.round(cobradoMesActual/meta*100)):0;
  const metaColor=pctMeta>=100?'#22c55e':pctMeta>=50?'#f59e0b':'#ef4444';
  const fmtMes=(m)=>{if(m==='sin-fecha')return'Sin fecha';const[y,mo]=m.split('-');const d=new Date(y,parseInt(mo)-1);return d.toLocaleDateString('es-AR',{month:'long',year:'numeric'});};

  let html=`<div class="balance-grid">
    <div class="balance-card"><div class="balance-card-lbl">Total año</div><div class="balance-card-val" style="color:var(--primary)">USD ${totalAnio.toLocaleString('es-AR')}</div></div>
    <div class="balance-card"><div class="balance-card-lbl">Mejor mes</div><div class="balance-card-val" style="color:var(--text)">${mejorMes.m?fmtMes(mejorMes.m):'-'}</div><div style="font-size:.72rem;color:var(--g4);margin-top:2px">USD ${mejorMes.v.toLocaleString('es-AR')}</div></div>
    <div class="balance-card"><div class="balance-card-lbl">Promedio mensual</div><div class="balance-card-val" style="color:var(--text)">USD ${promedio.toLocaleString('es-AR')}</div></div>
  </div>`;
  // Meta mensual progress
  if(meta>0){
    html+=`<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r2);padding:16px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:.78rem;font-weight:700;color:var(--text)">Meta mensual</span>
        <span style="font-size:.78rem;font-weight:700;color:${metaColor}">${pctMeta}% — USD ${cobradoMesActual.toLocaleString('es-AR')} / ${meta.toLocaleString('es-AR')}</span>
      </div>
      <div class="meta-bar"><div class="meta-bar-fill" style="width:${pctMeta}%;background:${metaColor}"></div></div>
    </div>`;
  }
  // Tabla mensual
  html+=`<table class="tbl" style="width:100%"><thead><tr><th>Mes</th><th style="text-align:right">Cobrado</th><th style="text-align:right">Pendiente</th><th style="text-align:right">Total</th></tr></thead><tbody>`;
  meses.forEach(m=>{
    const d=byMonth[m];
    html+=`<tr><td style="font-weight:600">${fmtMes(m)}</td><td style="text-align:right;color:var(--primary);font-weight:700">USD ${d.cobrado.toLocaleString('es-AR')}</td><td style="text-align:right;color:#D4A017">USD ${d.pendiente.toLocaleString('es-AR')}</td><td style="text-align:right;font-weight:800">USD ${(d.cobrado+d.pendiente).toLocaleString('es-AR')}</td></tr>`;
  });
  html+=`</tbody></table>`;
  el.innerHTML=html;
}

function _setIngFilter(val){
  _ingFilter=val;
  document.querySelectorAll('.ing-filter-btn').forEach(b=>b.classList.toggle('on',b.dataset.ingf===val));
  renderIngresos();
}

function _setIngView(view){
  _ingView=view;
  document.querySelectorAll('.ing-view-btn').forEach(b=>b.classList.toggle('on',b.dataset.ingv===view));
  renderIngresos();
}

function openIngresoModal(id,preload){
  _ingEditId=id||null;
  const isEdit=!!id;
  const item=isEdit?_ingresosData.find(i=>i.id===id):null;
  const pre=preload||{};
  const concepto=item?.concepto||pre.concepto||'';
  const monto=item?.monto||pre.monto||'';
  const moneda=item?.moneda||pre.moneda||'USD';
  const fecha=item?.fecha_cobro||pre.fecha_cobro||new Date().toISOString().slice(0,10);
  const estado=item?.estado||pre.estado||'cobrado';
  const quotId=item?.quot_id||pre.quot_id||'';
  const notas=item?.notas||pre.notas||'';

  document.getElementById('modal-content').innerHTML=`
    <div style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:16px">${isEdit?'Editar ingreso':'Registrar ingreso'}</div>
    <div class="fg"><label class="lbl">Concepto</label><input class="finput" id="ing-concepto" value="${concepto}" placeholder="Comisión — Orlando"></div>
    <div class="g3">
      <div class="fg"><label class="lbl">Monto</label><input class="finput" type="number" id="ing-monto" value="${monto}" placeholder="450" step="0.01"></div>
      <div class="fg"><label class="lbl">Moneda</label><select class="fsel" id="ing-moneda"><option value="USD" ${moneda==='USD'?'selected':''}>USD</option><option value="ARS" ${moneda==='ARS'?'selected':''}>ARS</option><option value="EUR" ${moneda==='EUR'?'selected':''}>EUR</option></select></div>
      <div class="fg"><label class="lbl">Estado</label><select class="fsel" id="ing-estado"><option value="cobrado" ${estado==='cobrado'?'selected':''}>Cobrado</option><option value="pendiente" ${estado==='pendiente'?'selected':''}>Pendiente</option></select></div>
    </div>
    <div class="fg"><label class="lbl">Fecha de cobro</label><input class="finput" type="date" id="ing-fecha" value="${fecha}"></div>
    <div class="fg"><label class="lbl">Cotización vinculada <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--g4)">(opcional)</span></label>
      <input class="finput" id="ing-quotid" value="${quotId}" placeholder="ID de cotización (autocompletado al registrar desde historial)" readonly style="background:var(--g1)">
    </div>
    <div class="fg"><label class="lbl">Notas</label><textarea class="finput" id="ing-notas" rows="2" style="resize:vertical" placeholder="Detalle adicional...">${notas}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-cta" onclick="saveIngreso()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar</button>
      ${isEdit?`<button class="btn btn-del" onclick="deleteIngreso('${id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Eliminar</button>`:''}
      <button class="btn btn-out" onclick="closeModal()" style="margin-left:auto">Cancelar</button>
    </div>`;
  document.getElementById('modal-overlay').style.display='block';
  document.getElementById('modal-box').style.display='block';
  document.getElementById('modal-box').style.maxWidth='480px';
}

async function saveIngreso(){
  const concepto=(document.getElementById('ing-concepto')?.value||'').trim();
  const monto=parseFloat(document.getElementById('ing-monto')?.value)||0;
  if(!concepto){toast('Ingresa un concepto',false);return;}
  if(!monto){toast('Ingresa un monto',false);return;}
  const row={
    concepto,
    monto,
    moneda:document.getElementById('ing-moneda')?.value||'USD',
    estado:document.getElementById('ing-estado')?.value||'cobrado',
    fecha_cobro:document.getElementById('ing-fecha')?.value||null,
    notas:(document.getElementById('ing-notas')?.value||'').trim()||null
  };
  const quotId=(document.getElementById('ing-quotid')?.value||'').trim();
  if(quotId) row.quot_id=quotId;
  try{
    if(_ingEditId){
      const{error}=await sb.from('ingresos').update(row).eq('id',_ingEditId);
      if(error){toast('Error: '+error.message,false);return;}
      toast('Ingreso actualizado');
    } else {
      row.agente_id=window._agenteId;
      const{error}=await sb.from('ingresos').insert(row);
      if(error){toast('Error: '+error.message,false);return;}
      toast('Ingreso registrado');
    }
    closeModal();
    renderIngresos();
  }catch(e){toast('Error al guardar',false);}
}

async function deleteIngreso(id){
  if(!confirm('Eliminar este ingreso?')) return;
  try{
    const{error}=await sb.from('ingresos').delete().eq('id',id);
    if(error){toast('Error: '+error.message,false);return;}
    toast('Ingreso eliminado');
    closeModal();
    renderIngresos();
  }catch(e){toast('Error al eliminar',false);}
}

// ═══════════════════════════════════════════
// POST-APROBACIÓN: popup para registrar comisión
// ═══════════════════════════════════════════
function _showIngresoPostApproval(quotId,clientName,destino,comision){
  // Mostrar toast con acción
  const t=document.getElementById('toast'),m=document.getElementById('toast-msg'),ico=document.getElementById('toast-icon');
  if(!t||!m)return;
  t.style.background='var(--grad-soft)';
  t.style.borderColor='rgba(27,158,143,0.35)';
  if(ico) ico.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  m.innerHTML=`Viaje confirmado <button onclick="event.stopPropagation();openIngresoModal(null,{concepto:'Comisión — ${(clientName||'').replace(/'/g,"\\'")} → ${(destino||'').replace(/'/g,"\\'")}',monto:${comision||0},estado:'pendiente',quot_id:'${quotId||''}'})" style="background:var(--primary);color:white;border:none;border-radius:6px;padding:4px 10px;font-size:.75rem;font-weight:700;cursor:pointer;margin-left:8px;font-family:inherit">+ Registrar comisión</button>`;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),6000); // más tiempo para que pueda clickear
}
