async function renderAdmin(){
  if(!isAdmin) return;
  // Agentes
  const {data:ags}=await sb.from('agentes').select('*').order('creado_en');
  document.getElementById('admin-agentes').innerHTML=ags?.length?`<table class="tbl"><thead><tr><th>Email</th><th>Nombre</th><th>Rol</th><th>Activo</th><th></th></tr></thead><tbody>
  ${ags.map(a=>`<tr>
    <td>${a.email}</td><td>${a.nombre||'—'}</td>
    <td><span class="status-badge ${a.rol==='admin'?'st-confirmada':'st-borrador'}">${a.rol}</span></td>
    <td>${a.activo?'✅':'❌'}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-out btn-xs" onclick="editAgentModal('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}','${a.email}','${a.rol}')">✏️ Editar</button>
      <button class="btn btn-out btn-xs" onclick="toggleAdmin('${a.id}','${a.rol}')">Cambiar rol</button>
    </td>
  </tr>`).join('')}</tbody></table>`:'<p style="color:var(--g3)">Sin agentes.</p>';

  // Aerolíneas
  const {data:aeros}=await sb.from('aerolineas').select('*').order('nombre');
  document.getElementById('admin-aero').innerHTML=aeros?.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>IATA</th><th>Activa</th><th></th></tr></thead><tbody>
  ${aeros.map(a=>`<tr><td>${a.nombre}</td><td><code>${a.codigo_iata||'—'}</code></td><td>${a.activa?'✅':'❌'}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-out btn-xs" onclick="editAeroModal('${a.id}','${(a.nombre||'').replace(/'/g,"\\'")}','${a.codigo_iata||''}')">✏️</button>
      <button class="btn btn-del btn-xs" onclick="deleteAero('${a.id}')">🗑️</button>
    </td></tr>`).join('')}</tbody></table>`:'<p>Sin aerolíneas.</p>';

  // Proveedores
  const {data:provs}=await sb.from('proveedores').select('*').order('nombre');
  document.getElementById('admin-prov').innerHTML=provs?.length?`<table class="tbl"><thead><tr><th>Nombre</th><th>Tipo</th><th>País</th><th>Contacto</th><th></th></tr></thead><tbody>
  ${provs.map(p=>`<tr><td>${p.nombre}</td><td>${p.tipo||'—'}</td><td>${p.pais||'—'}</td><td style="font-size:.75rem">${p.contacto||''}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-out btn-xs" onclick="editProvModal('${p.id}','${(p.nombre||'').replace(/'/g,"\\'")}','${p.tipo||''}','${(p.pais||'').replace(/'/g,"\\'")}','${(p.ciudad||'').replace(/'/g,"\\'")}','${(p.contacto||'').replace(/'/g,"\\'")}')">✏️</button>
      <button class="btn btn-del btn-xs" onclick="deleteProv('${p.id}')">🗑️</button>
    </td></tr>`).join('')}</tbody></table>`:'<p>Sin proveedores.</p>';

  // Datalists for autocomplete
  buildDataLists(aeros||[], provs||[]);
}

function buildDataLists(aeros, provs){
  let dl=document.getElementById('al-list');
  if(!dl){dl=document.createElement('datalist');dl.id='al-list';document.body.appendChild(dl);}
  dl.innerHTML=aeros.map(a=>`<option value="${a.nombre}">`).join('');
  let pl=document.getElementById('prov-list');
  if(!pl){pl=document.createElement('datalist');pl.id='prov-list';document.body.appendChild(pl);}
  pl.innerHTML=provs.map(p=>`<option value="${p.nombre}">`).join('');
  // Populate prov-sel dropdowns with Otro option
  const provOpts='<option value="">— Elegir proveedor —</option>'+provs.map(p=>`<option value="${p.nombre}">${p.nombre}${p.ciudad?' · '+p.ciudad:''}</option>`).join('')+'<option value="__otro__">✏️ Otro (escribir manualmente)</option>';
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
      <button class="btn btn-pri" onclick="saveAero()">💾 Guardar</button>
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
      <button class="btn btn-pri" onclick="saveProv()">💾 Guardar</button>
    </div>`;openModal();
}
async function saveProv(){
  const nm=document.getElementById('mp-nm').value.trim();if(!nm)return;
  await sb.from('proveedores').insert({nombre:nm,tipo:document.getElementById('mp-tipo').value,pais:document.getElementById('mp-pais').value,ciudad:document.getElementById('mp-ciudad').value,contacto:document.getElementById('mp-not').value});
  closeModal();toast('✓ Proveedor agregado');renderAdmin();
}
async function deleteProv(id){if(!confirm('¿Eliminar?'))return;await sb.from('proveedores').delete().eq('id',id);toast('Eliminado');renderAdmin();}

// ═══════════════════════════════════════════
// ADMIN EDIT MODALS
// ═══════════════════════════════════════════
function editAgentModal(id,nombre,email,rol){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">✏️ Editar agente</div>
    <div class="fg"><label class="lbl">Email</label><input class="finput" id="ea-em" value="${email}" readonly style="opacity:.6"></div>
    <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="ea-nm" value="${nombre}" placeholder="Nombre completo"></div>
    <div class="fg"><label class="lbl">Rol</label><select class="fsel" id="ea-rol"><option value="agente" ${rol==='agente'?'selected':''}>Agente</option><option value="admin" ${rol==='admin'?'selected':''}>Admin</option></select></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveAgentEdit('${id}')">💾 Guardar</button>
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
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">✏️ Editar aerolínea</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="aea-nm" value="${nombre}" placeholder="American Airlines"></div>
      <div class="fg"><label class="lbl">Código IATA</label><input class="finput" id="aea-iata" value="${iata}" placeholder="AA" maxlength="3" style="text-transform:uppercase"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveAeroEdit('${id}')">💾 Guardar</button>
    </div>`;openModal();
}
async function saveAeroEdit(id){
  const nm=document.getElementById('aea-nm').value.trim();if(!nm)return;
  await sb.from('aerolineas').update({nombre:nm,codigo_iata:document.getElementById('aea-iata').value.toUpperCase()}).eq('id',id);
  closeModal();toast('✓ Aerolínea actualizada');renderAdmin();
}

function editProvModal(id,nombre,tipo,pais,ciudad,contacto){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">✏️ Editar proveedor</div>
    <div class="g2">
      <div class="fg"><label class="lbl">Nombre</label><input class="finput" id="epv-nm" value="${nombre}" placeholder="Orlantours"></div>
      <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="epv-tipo"><option value="traslado" ${tipo==='traslado'?'selected':''}>Traslado</option><option value="excursion" ${tipo==='excursion'?'selected':''}>Excursión</option><option value="hotel" ${tipo==='hotel'?'selected':''}>Hotel</option><option value="seguro" ${tipo==='seguro'?'selected':''}>Seguro</option><option value="otro" ${tipo==='otro'?'selected':''}>Otro</option></select></div>
      <div class="fg"><label class="lbl">País</label><input class="finput" id="epv-pais" value="${pais}" placeholder="Estados Unidos"></div>
      <div class="fg"><label class="lbl">Ciudad</label><input class="finput" id="epv-ciudad" value="${ciudad}" placeholder="Orlando"></div>
      <div class="fg full"><label class="lbl">Contacto / Notas</label><input class="finput" id="epv-not" value="${contacto}" placeholder="Gabriel · +1 407..."></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="saveProvEdit('${id}')">💾 Guardar</button>
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
    <div class="fg"><label class="lbl">💰 Comisión agente</label>
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
  // Render metric cards
  const metrics=[
    {ico:'📅',lbl:'Cotizaciones este mes',val:mesActual.length,color:'var(--sky)'},
    {ico:'📋',lbl:'Total cotizaciones',val:all.length,color:'var(--navy)'},
    {ico:'✅',lbl:'Confirmadas',val:confirmadas.length,color:'var(--green)'},
    {ico:'💰',lbl:'Comisiones acumuladas',val:'USD '+Number(totalCom).toLocaleString('es-AR'),color:'var(--amber2)'},
    {ico:'📈',lbl:'Tasa de conversión',val:conversion+'%',color:'var(--green)'},
    {ico:'💵',lbl:'Valor confirmadas',val:'USD '+Number(totalPrecio).toLocaleString('es-AR'),color:'var(--sky2)'},
  ];
  document.getElementById('dash-metrics').innerHTML=metrics.map(m=>`
    <div style="background:white;border:1px solid var(--g2);border-radius:var(--r);padding:20px;box-shadow:var(--sh);border-left:4px solid ${m.color}">
      <div style="font-size:1.4rem;margin-bottom:8px">${m.ico}</div>
      <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g3);margin-bottom:6px">${m.lbl}</div>
      <div style="font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:700;color:${m.color}">${m.val}</div>
    </div>`).join('');
  // Cotizaciones del mes
  const stLbl={borrador:'📝',enviada:'📨',confirmada:'✅',cancelada:'❌'};
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
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px">📩 Invitar agente</div>
    <p style="font-size:.83rem;color:var(--g4);margin-bottom:16px;line-height:1.6">Los agentes se invitan desde el panel de <strong>Netlify Identity</strong>. El sistema los reconoce automáticamente al hacer login por primera vez.</p>
    <div class="tip">💡 Netlify → Site configuration → Identity → Invite users → Ingresá el email del agente. Recibirá un mail para crear su contraseña.</div>
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
