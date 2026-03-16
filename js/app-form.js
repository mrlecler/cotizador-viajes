// ═══════════════════════════════════════════
// AIRPORTS AUTOCOMPLETE
// ═══════════════════════════════════════════
let airportsList=[];
fetch('data/airports.json').then(r=>r.json()).then(data=>{airportsList=data;}).catch(()=>{});

function airportAC(inputId,iataId){
  const inp=document.getElementById(inputId);
  const iataInp=iataId?document.getElementById(iataId):null;
  if(!inp)return;
  // Remove existing dropdown if present
  const existingDrop=document.getElementById('ac-drop-'+inputId);
  if(existingDrop)existingDrop.remove();
  // Create dropdown
  const drop=document.createElement('div');
  drop.id='ac-drop-'+inputId;
  drop.style.cssText='position:absolute;z-index:9999;left:0;right:0;top:100%;background:var(--surface,#0F0018);border:1px solid var(--border,rgba(255,255,255,0.07));border-radius:var(--r,12px);box-shadow:var(--sh,0 4px 16px rgba(79,70,229,0.06));max-height:280px;overflow-y:auto;display:none;';
  inp.parentElement.style.position='relative';
  inp.parentElement.appendChild(drop);
  function showSuggestions(q){
    if(!q||q.length<2){drop.style.display='none';return;}
    const qu=q.toUpperCase();
    const exact=airportsList.filter(a=>a.iata===qu);
    const startsWith=airportsList.filter(a=>a.iata!==qu&&(a.iata.startsWith(qu)||a.city.toUpperCase().startsWith(qu)||a.name.toUpperCase().startsWith(qu)));
    const contains=airportsList.filter(a=>a.iata!==qu&&!a.iata.startsWith(qu)&&!a.city.toUpperCase().startsWith(qu)&&!a.name.toUpperCase().startsWith(qu)&&(a.city.toUpperCase().includes(qu)||a.name.toUpperCase().includes(qu)));
    const results=[...exact,...startsWith,...contains].slice(0,8);
    if(!results.length){drop.style.display='none';return;}
    drop.innerHTML=results.map((a,i)=>`<div class="ac-item" data-i="${i}" style="padding:9px 14px;cursor:pointer;border-bottom:1px solid var(--border,rgba(255,255,255,0.05));display:flex;align-items:center;gap:10px;transition:background .15s" onmouseover="this.style.background='rgba(124,58,237,0.1)'" onmouseout="this.style.background=''" onmousedown="event.preventDefault();selectAirport('${inputId}','${iataId||''}','${a.iata.replace(/'/g,"\\'")}','${(a.city+' ('+a.iata+')').replace(/'/g,"\\'")}')"><span style="font-size:12px;font-weight:800;color:var(--primary,#7C3AED);min-width:36px;font-family:'DM Mono',monospace">${a.iata}</span><span style="font-size:12px;color:var(--text,#fff);flex:1;line-height:1.3">${a.city}<br><span style="font-size:10px;opacity:.55">${a.name} · ${a.country}</span></span></div>`).join('');
    drop.style.display='block';
  }
  inp.addEventListener('input',function(){showSuggestions(this.value);});
  inp.addEventListener('blur',function(){setTimeout(()=>drop.style.display='none',200);});
  inp.addEventListener('focus',function(){if(this.value.length>=2)showSuggestions(this.value);});
}
function selectAirport(inputId,iataId,iata,cityLabel){
  const inp=document.getElementById(inputId);
  const iataInp=iataId?document.getElementById(iataId):null;
  if(inp)inp.value=cityLabel;
  if(iataInp)iataInp.value=iata;
  const drop=document.getElementById('ac-drop-'+inputId);
  if(drop)drop.style.display='none';
}

function addVuelo(d){
  d=d||{};const id=++vc;
  const el=document.createElement('div');el.className='rep';el.id='vb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Vuelo ${id}</div>
    <button class="btn btn-del btn-xs" onclick="this.closest('.rep').remove()">✕</button></div>
  <div class="g3" style="margin-bottom:4px">
    <div class="fg"><label class="lbl">Modalidad</label>
      <select class="fsel" id="v${id}-mod" onchange="toggleRet(${id})">
        <option value="simple">Tramo único</option>
        <option value="idavuelta">Ida y vuelta (precio combinado)</option>
        <option value="interno">Vuelo interno</option>
      </select></div>
    <div class="fg"><label class="lbl">Aerolínea IDA</label>
      <input class="finput" list="al-list" type="text" id="v${id}-al" placeholder="American Airlines" value="${d.aerolinea||''}">
    </div>
    <div class="fg"><label class="lbl">N° vuelo IDA</label><input class="finput" type="text" id="v${id}-num" placeholder="AA 930" value="${d.numero||''}"></div>
  </div>
  <div style="background:var(--g1);border-radius:var(--rs);padding:14px;margin-bottom:12px">
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g4);margin-bottom:12px">TRAMO IDA</div>
    <div class="g4">
      <div class="fg"><label class="lbl">Ciudad origen</label><input class="finput" type="text" id="v${id}-or" placeholder="Buenos Aires (EZE)" value="${d.origen||''}"></div>
      <div class="fg"><label class="lbl">IATA</label><input class="finput" type="text" id="v${id}-io" placeholder="EZE" maxlength="3" style="text-transform:uppercase" value="${d.iata_o||''}"></div>
      <div class="fg"><label class="lbl">Fecha salida</label><input class="finput" type="date" id="v${id}-fs" value="${d.fs||''}"></div>
      <div class="fg"><label class="lbl">Hora salida</label><input class="finput" type="time" id="v${id}-hs" value="${d.hs||''}"></div>
    </div>
    <div class="g4">
      <div class="fg"><label class="lbl">Ciudad destino</label><input class="finput" type="text" id="v${id}-de" placeholder="Orlando (MCO)" value="${d.destino||''}"></div>
      <div class="fg"><label class="lbl">IATA</label><input class="finput" type="text" id="v${id}-id" placeholder="MCO" maxlength="3" style="text-transform:uppercase" value="${d.iata_d||''}"></div>
      <div class="fg"><label class="lbl">Fecha llegada</label><input class="finput" type="date" id="v${id}-fl" value="${d.fl||''}"></div>
      <div class="fg"><label class="lbl">Hora llegada</label><input class="finput" type="time" id="v${id}-hl" value="${d.hl||''}"></div>
    </div>
    <div class="g3">
      <div class="fg"><label class="lbl">Escala (ciudad)</label><input class="finput" type="text" id="v${id}-esc" placeholder="Miami (MIA) — vacío si directo" value="${d.escala||''}"></div>
      <div class="fg"><label class="lbl">Tiempo escala</label><input class="finput" type="text" id="v${id}-tesc" placeholder="2h 5min" value="${d.t_escala||''}"></div>
      <div class="fg"><label class="lbl">Duración total</label><input class="finput" type="text" id="v${id}-dur" placeholder="17h 19min" value="${d.duracion||''}"></div>
    </div>
  </div>
  <div id="v${id}-ret-sec" style="display:none;background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:var(--rs);padding:14px;margin-bottom:12px">
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sky);margin-bottom:12px">↩ TRAMO VUELTA</div>
    <div class="g3">
      <div class="fg"><label class="lbl">Aerolínea vuelta</label><input class="finput" list="al-list" type="text" id="v${id}-al2" placeholder="Avianca" value="${d.al2||''}"></div>
      <div class="fg"><label class="lbl">N° vuelo vuelta</label><input class="finput" type="text" id="v${id}-num2" placeholder="AV 123" value="${d.num2||''}"></div>
      <div class="fg"></div>
    </div>
    <div class="g4">
      <div class="fg"><label class="lbl">Origen vuelta</label><input class="finput" type="text" id="v${id}-or2" placeholder="Orlando (MCO)" value="${d.or2||''}"></div>
      <div class="fg"><label class="lbl">IATA</label><input class="finput" type="text" id="v${id}-io2" placeholder="MCO" maxlength="3" style="text-transform:uppercase" value="${d.io2||''}"></div>
      <div class="fg"><label class="lbl">Fecha salida</label><input class="finput" type="date" id="v${id}-fs2" value="${d.fs2||''}"></div>
      <div class="fg"><label class="lbl">Hora salida</label><input class="finput" type="time" id="v${id}-hs2" value="${d.hs2||''}"></div>
    </div>
    <div class="g4">
      <div class="fg"><label class="lbl">Destino vuelta</label><input class="finput" type="text" id="v${id}-de2" placeholder="Buenos Aires (EZE)" value="${d.de2||''}"></div>
      <div class="fg"><label class="lbl">IATA</label><input class="finput" type="text" id="v${id}-id2" placeholder="EZE" maxlength="3" style="text-transform:uppercase" value="${d.id2||''}"></div>
      <div class="fg"><label class="lbl">Fecha llegada</label><input class="finput" type="date" id="v${id}-fl2" value="${d.fl2||''}"></div>
      <div class="fg"><label class="lbl">Hora llegada</label><input class="finput" type="time" id="v${id}-hl2" value="${d.hl2||''}"></div>
    </div>
    <div class="g3">
      <div class="fg"><label class="lbl">Escala vuelta</label><input class="finput" type="text" id="v${id}-esc2" placeholder="Bogotá (BOG)" value="${d.esc2||''}"></div>
      <div class="fg"><label class="lbl">Tiempo escala</label><input class="finput" type="text" id="v${id}-tesc2" placeholder="2h" value="${d.tesc2||''}"></div>
      <div class="fg"><label class="lbl">Duración total</label><input class="finput" type="text" id="v${id}-dur2" placeholder="14h 30min" value="${d.dur2||''}"></div>
    </div>
  </div>
  <div class="g3">
    <div class="fg"><label class="lbl">Tarifa / Clase</label>
      <select class="fsel" id="v${id}-tar"><option>Economy Basic</option><option>Economy</option><option>Economy Flex</option><option>Premium Economy</option><option>Business</option><option>First Class</option></select></div>
    <div class="fg"><label class="lbl">Precio</label>
      <div class="money-wrap"><div class="money-cur"><select id="v${id}-cur"><option>USD</option><option>ARS</option></select></div>
      <input class="money-inp" type="number" id="v${id}-pr" placeholder="1985" value="${d.precio||''}"></div>
    </div>
    <div class="fg"><label class="lbl">Financiación</label><input class="finput" type="text" id="v${id}-fin" placeholder="Contado / cuotas" value="${d.fin||''}"></div>
  </div>
  <div class="fg"><label class="lbl">Equipaje</label>
    <div class="chk-grp" id="v${id}-eq">${[['b','Bolso personal'],['c','Carry-on'],['v23','Valija 23kg'],['v32','Valija 32kg'],['2v','2 valijas']].map(([v,l])=>`<div class="chk" onclick="tglChk(this)"><input type="checkbox" value="${v}"><span class="chk-dot"></span>${l}</div>`).join('')}</div>
    <input class="finput" type="text" id="v${id}-eq-x" placeholder="Detalle adicional..." style="margin-top:8px" value="${d.eq_x||''}">
  </div>
  <div class="fg"><label class="lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
    <div class="money-wrap"><div class="money-cur"><select id="v${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
    <input class="money-inp" type="number" id="v${id}-com" placeholder="0" value="${d.comision||''}"></div>
  </div>`;
  document.getElementById('vuelos-cont').appendChild(el);
  // Inicializar autocomplete de aeropuertos
  airportAC('v'+id+'-or','v'+id+'-io');
  airportAC('v'+id+'-de','v'+id+'-id');
  if(d.mod==='idavuelta'){
    airportAC('v'+id+'-or2','v'+id+'-io2');
    airportAC('v'+id+'-de2','v'+id+'-id2');
  }
  if(d.mod) document.getElementById('v'+id+'-mod').value=d.mod;
  if(d.mod==='idavuelta') document.getElementById('v'+id+'-ret-sec').style.display='';
  if(d.tarifa) document.getElementById('v'+id+'-tar').value=d.tarifa;
}
function toggleRet(id){document.getElementById('v'+id+'-ret-sec').style.display=document.getElementById('v'+id+'-mod').value==='idavuelta'?'':'none';}

// ═══════════════════════════════════════════
// HOTEL BLOCK
// ═══════════════════════════════════════════
function addHotel(d){
  d=d||{};const id=++hc;const isD=d.tipo==='disney',isU=d.tipo==='universal';
  const el=document.createElement('div');el.className='rep';el.id='hb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Hotel ${id}</div>
    <button class="btn btn-del btn-xs" onclick="this.closest('.rep').remove()">✕</button></div>
  <div class="g3">
    <div class="fg full"><label class="lbl">Nombre</label><input class="finput" type="text" id="h${id}-nm" placeholder="Disney's All-Star Sports Resort" value="${d.nombre||''}"></div>
    <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="h${id}-tipo" onchange="onHotelType(${id})"><option value="regular">Hotel regular</option><option value="disney">Hotel Disney</option><option value="universal">Hotel Universal</option><option value="airbnb">Airbnb / Apart.</option><option value="crucero">Crucero</option></select></div>
    <div class="fg"><label class="lbl">Estrellas</label><select class="fsel" id="h${id}-est"><option value="">—</option><option value="3">3★</option><option value="4">4★</option><option value="5">5★</option></select></div>
  </div>
  <div class="g4">
    <div class="fg"><label class="lbl">Check-in</label><input class="finput" type="date" id="h${id}-ci" value="${d.ci||''}"></div>
    <div class="fg"><label class="lbl">Check-out</label><input class="finput" type="date" id="h${id}-co" value="${d.co||''}"></div>
    <div class="fg"><label class="lbl">Noches</label><input class="finput" type="number" id="h${id}-nc" placeholder="7" value="${d.noches||''}"></div>
    <div class="fg"><label class="lbl">Precio base</label>
      <div class="money-wrap"><div class="money-cur"><select id="h${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" type="number" id="h${id}-pr" placeholder="2717" value="${d.precio||''}"></div>
    </div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl">Habitación</label><input class="finput" type="text" id="h${id}-hab" placeholder="Standard Room (4 personas)" value="${d.hab||''}"></div>
    <div class="fg"><label class="lbl">Régimen</label><select class="fsel" id="h${id}-reg"><option value="">Sin especificar</option><option>Sin desayuno</option><option>Desayuno incluido</option><option>Media pensión</option><option>Pensión completa</option><option>Todo Incluido</option><option>Ultra Todo Incluido</option></select></div>
  </div>
  <div id="h${id}-pk" style="${isD||isU?'':'display:none'}">
    <div class="disney-sec">
      <div class="disney-badge" id="h${id}-badge">${isU?'Paquete Universal':'Paquete Disney'}</div>
      <div class="g2">
        <div class="fg"><label class="lbl">Tickets incluidos</label><input class="finput" type="text" id="h${id}-tkt" placeholder="4 Park Magic Ticket" value="${d.tickets||''}"></div>
        <div class="fg"><label class="lbl">Días tickets</label><input class="finput" type="number" id="h${id}-tktd" placeholder="4" value="${d.dias_tkt||''}"></div>
      </div>
      <div class="fg"><label class="lbl">Parques</label>
        <div class="chk-grp" id="h${id}-parques">${[['mk','Magic Kingdom'],['ep','EPCOT'],['ak','Animal Kingdom'],['hs','Hollywood Studios'],['us','Universal Studios'],['ia','Islands of Adventure'],['eu','Epic Universe'],['vb','Volcano Bay']].map(([v,l])=>`<div class="chk" onclick="tglChk(this)"><input type="checkbox" value="${v}"><span class="chk-dot"></span>${l}</div>`).join('')}</div>
      </div>
      <div class="fg"><label class="lbl">Beneficios</label>
        <div class="chk-grp" id="h${id}-bens">${[['ep','Early Park Entry'],['tr','Transporte gratuito'],['mm','Memory Maker'],['dl','Entrega en hotel'],['ex','Express Pass'],['sp','Disney Springs'],['wp','Parque acuático gratis'],['me','Magical Extras']].map(([v,l])=>`<div class="chk" onclick="tglChk(this)"><input type="checkbox" value="${v}"><span class="chk-dot"></span>${l}</div>`).join('')}</div>
      </div>
      <div style="background:var(--ink3);border-radius:var(--rs);padding:12px 14px;margin-top:8px;border:1px solid rgba(124,58,237,0.18)">
        <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sky);margin-bottom:10px">Plan de comidas</div>
        <div class="g3">
          <div class="fg"><label class="lbl">Plan</label><select class="fsel" id="h${id}-mp"><option value="">Sin plan</option><option>Quick Service Dining Plan</option><option>Disney Dining Plan</option><option>Deluxe Dining Plan</option></select></div>
          <div class="fg"><label class="lbl">Precio con plan</label>
            <div class="money-wrap"><div class="money-cur"><select id="h${id}-mp-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" type="number" id="h${id}-mp-pr" placeholder="3439" value="${d.mp_pr||''}"></div>
          </div>
          <div class="fg full"><label class="lbl">Descripción del plan</label>
            <textarea class="ftxt" id="h${id}-mp-desc" rows="4" placeholder="Este plan aporta:&#10;• Comodidad total&#10;• Sin pagos en restaurantes&#10;• Abonas en CUOTAS">${d.mp_desc||''}</textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="fg"><label class="lbl">Notas / opcionales</label>
    <textarea class="ftxt" id="h${id}-notes" rows="3" placeholder="Opcionales especiales, notas para el cliente..." value="">${d.notes||''}</textarea>
  </div>
  <div class="fg"><label class="lbl">Amenities</label>
    <div class="chk-grp" id="h${id}-am">${[['wifi','WiFi'],['pool','Piscina'],['gym','Gimnasio'],['spa','Spa'],['bkf','Desayuno buffet'],['rest','Restaurante'],['bar','Bar'],['beach','Playa'],['park','Estacionamiento'],['kids','Área infantil']].map(([v,l])=>`<div class="chk" onclick="tglChk(this)"><input type="checkbox" value="${v}"><span class="chk-dot"></span>${l}</div>`).join('')}</div>
    <input class="finput" type="text" id="h${id}-am-x" placeholder="Otros amenities..." style="margin-top:8px" value="${d.am_x||''}">
  </div>
  <div class="fg"><label class="lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
    <div class="money-wrap"><div class="money-cur"><select id="h${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
    <input class="money-inp" type="number" id="h${id}-com" placeholder="0" value="${d.comision||''}"></div>
  </div>`;
  document.getElementById('hoteles-cont').appendChild(el);
  if(d.tipo) document.getElementById('h'+id+'-tipo').value=d.tipo;
  if(d.regimen) document.getElementById('h'+id+'-reg').value=d.regimen;
  if(d.mp) document.getElementById('h'+id+'-mp').value=d.mp;
}
function onHotelType(id){
  const tipo=document.getElementById('h'+id+'-tipo').value;
  const sec=document.getElementById('h'+id+'-pk');
  const badge=document.getElementById('h'+id+'-badge');
  if(tipo==='disney'||tipo==='universal'){sec.style.display='';badge.className='disney-badge'+(tipo==='universal'?' universal-badge':'');badge.textContent=tipo==='universal'?'Paquete Universal':'Paquete Disney';}
  else sec.style.display='none';
}


// ═══════════════════════════════════════════
// PROVIDER SELECT HELPER
// ═══════════════════════════════════════════
function onProvSel(selId){
  const sel=document.getElementById(selId);
  const inp=document.getElementById(selId.replace('-sel','-inp'));
  if(!inp)return;
  if(sel.value==='__otro__'){inp.style.display='';inp.focus();}
  else{inp.style.display='none';inp.value='';}
}
function getProvVal(baseId){
  const sel=document.getElementById(baseId+'-sel');
  const inp=document.getElementById(baseId+'-inp');
  if(!sel)return'';
  return sel.value==='__otro__'?(inp?inp.value:''):sel.value;
}
// ═══════════════════════════════════════════
// TRASLADO BLOCK
// ═══════════════════════════════════════════
function addTraslado(d){
  d=d||{};const id=++tc;
  const el=document.createElement('div');el.className='rep';el.id='tb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Traslado ${id}</div>
    <button class="btn btn-del btn-xs" onclick="this.closest('.rep').remove()">✕</button></div>
  <div class="g3">
    <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="t${id}-tipo"><option value="in">Aeropuerto → Hotel</option><option value="out">Hotel → Aeropuerto</option><option value="hoteles">Entre hoteles</option><option value="privado">Privado en destino</option><option value="ciudad">A otra ciudad</option></select></div>
    <div class="fg"><label class="lbl">Origen</label><input class="finput" type="text" id="t${id}-or" placeholder="Aeropuerto MCO" value="${d.origen||''}"></div>
    <div class="fg"><label class="lbl">Destino</label><input class="finput" type="text" id="t${id}-de" placeholder="Disney All-Star Sports" value="${d.destino||''}"></div>
  </div>
  <div class="g4">
    <div class="fg"><label class="lbl">Fecha</label><input class="finput" type="date" id="t${id}-fe" value="${d.fecha||''}"></div>
    <div class="fg"><label class="lbl">Hora recogida</label><input class="finput" type="time" id="t${id}-ho" value="${d.hora||''}"></div>
    <div class="fg"><label class="lbl">Vehículo</label><select class="fsel" id="t${id}-veh"><option>Van privada</option><option>Auto privado</option><option>Minibús</option><option>Shuttle compartido</option></select></div>
    <div class="fg"><label class="lbl">Precio</label>
      <div class="money-wrap"><div class="money-cur"><select id="t${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" type="number" id="t${id}-pr" placeholder="65" value="${d.precio||''}"></div>
    </div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl">Proveedor</label>
      <select class="fsel prov-sel" id="t${id}-sel" onchange="onProvSel('t${id}-sel')" data-val=""><option value="">— Elegir proveedor —</option></select>
      <input class="finput" type="text" id="t${id}-inp" placeholder="Nombre del proveedor" style="display:none;margin-top:6px" value="">
    </div>
    <div class="fg"><label class="lbl">Notas</label><input class="finput" type="text" id="t${id}-not" placeholder="Se abona en efectivo al finalizar" value="${d.notas||''}"></div>
  </div>
  <div class="fg"><label class="lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
    <div class="money-wrap"><div class="money-cur"><select id="t${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
    <input class="money-inp" type="number" id="t${id}-com" placeholder="0" value="${d.comision||''}"></div>
  </div>`;
  document.getElementById('traslados-cont').appendChild(el);
  if(d.tipo) document.getElementById('t'+id+'-tipo').value=d.tipo;
  if(d.vehiculo) document.getElementById('t'+id+'-veh').value=d.vehiculo;
  if(d.prov){const ps=document.getElementById('t'+id+'-sel');if(ps){ps.setAttribute('data-val',d.prov);const opt=[...ps.options].find(o=>o.value===d.prov);if(opt){ps.value=d.prov;}else{ps.value='__otro__';const pi=document.getElementById('t'+id+'-inp');if(pi){pi.value=d.prov;pi.style.display='';}}}}
}

// ═══════════════════════════════════════════
// EXCURSIÓN BLOCK
// ═══════════════════════════════════════════
function addExcursion(d){
  d=d||{};const id=++ec;
  const el=document.createElement('div');el.className='rep';el.id='eb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Excursión ${id}</div>
    <button class="btn btn-del btn-xs" onclick="this.closest('.rep').remove()">✕</button></div>
  <div class="g2">
    <div class="fg full"><label class="lbl">Nombre</label><input class="finput" type="text" id="e${id}-nm" placeholder="Excursión a Chichén Itzá" value="${d.nombre||''}"></div>
    <div class="fg"><label class="lbl">Categoría</label><select class="fsel" id="e${id}-cat" onchange="onExcCat(${id},this.value)"><option>Excursión guiada</option><option>Parque temático</option><option>Tour en barco</option><option>Actividad acuática</option><option>Tour cultural</option><option>Show / Espectáculo</option><option>Evento especial</option><option>Actividad de aventura</option><option value="otros">Otros</option></select></div>
    <div class="fg" id="e${id}-cat-otros-wrap" style="display:none"><label class="lbl">Título personalizado</label><input class="finput" type="text" id="e${id}-cat-otros" placeholder="Ej: Ticket de entrada, City Tour..." value="${d.cat_otros||''}"></div>
    <div class="fg"><label class="lbl">Proveedor</label>
      <select class="fsel prov-sel" id="e${id}-sel" onchange="onProvSel('e${id}-sel')" data-val=""><option value="">— Elegir proveedor —</option></select>
      <input class="finput" type="text" id="e${id}-inp" placeholder="Nombre del proveedor" style="display:none;margin-top:6px" value="">
    </div>
  </div>
  <div class="g4">
    <div class="fg"><label class="lbl">Fecha</label><input class="finput" type="date" id="e${id}-fe" value="${d.fecha||''}"></div>
    <div class="fg"><label class="lbl">Hora</label><input class="finput" type="time" id="e${id}-ho" value="${d.hora||''}"></div>
    <div class="fg"><label class="lbl">Duración</label><input class="finput" type="text" id="e${id}-dur" placeholder="12-13 horas" value="${d.dur||''}"></div>
    <div class="fg"><label class="lbl">Precio total</label>
      <div class="money-wrap"><div class="money-cur"><select id="e${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" type="number" id="e${id}-pr" placeholder="0" value="${d.precio||''}"></div>
    </div>
  </div>
  <div class="fg"><label class="lbl">Punto de encuentro</label><input class="finput" type="text" id="e${id}-punto" placeholder="Lobby del hotel 7:00 AM" value="${d.punto||''}"></div>
  <div class="g2">
    <div class="fg"><label class="lbl">¿Qué incluye?</label><textarea class="ftxt" id="e${id}-inc" rows="3" placeholder="Transporte, almuerzo, guía bilingüe...">${d.inc||''}</textarea></div>
    <div class="fg"><label class="lbl">¿Qué NO incluye?</label><textarea class="ftxt" id="e${id}-noinc" rows="3" placeholder="Impuesto arqueológico...">${d.noinc||''}</textarea></div>
  </div>
  <div class="fg"><label class="lbl">Descripción para el cliente</label><textarea class="ftxt" id="e${id}-desc" rows="3" placeholder="Descripción atractiva...">${d.desc||''}</textarea></div>
  <div class="fg"><label class="lbl">Observaciones</label><input class="finput" type="text" id="e${id}-obs" placeholder="Llevar protector solar · Ropa cómoda" value="${d.obs||''}"></div>
  <div class="fg"><label class="lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
    <div class="money-wrap"><div class="money-cur"><select id="e${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
    <input class="money-inp" type="number" id="e${id}-com" placeholder="0" value="${d.comision||''}"></div>
  </div>`;
  document.getElementById('excursiones-cont').appendChild(el);
  if(d.prov){const ps=document.getElementById('e'+id+'-sel');if(ps){ps.setAttribute('data-val',d.prov);const opt=[...ps.options].find(o=>o.value===d.prov);if(opt){ps.value=d.prov;}else{ps.value='__otro__';const pi=document.getElementById('e'+id+'-inp');if(pi){pi.value=d.prov;pi.style.display='';}}}}
}

// ═══════════════════════════════════════════
// AUTO BLOCK
// ═══════════════════════════════════════════
let ac_cnt=0;
function addAuto(d){
  d=d||{};const id=++ac_cnt;
  const el=document.createElement('div');el.className='rep';el.id='ab-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Auto ${id}</div>
    <button class="btn btn-del btn-xs" onclick="this.closest('.rep').remove()">✕</button></div>
  <div class="g3">
    <div class="fg"><label class="lbl">Proveedor</label><input class="finput" type="text" id="au${id}-prov" placeholder="Hertz, Avis, Budget..." value="${d.proveedor||''}"></div>
    <div class="fg"><label class="lbl">Categoría</label>
      <select class="fsel" id="au${id}-cat">
        <option>Económico</option><option>Compacto</option><option>Intermedio</option>
        <option>Full Size</option><option>SUV</option><option>Minivan</option>
        <option>Premium</option><option>Convertible</option>
      </select></div>
    <div class="fg"><label class="lbl">Precio</label>
      <div class="money-wrap"><div class="money-cur"><select id="au${id}-cur"><option>USD</option><option>ARS</option></select></div>
      <input class="money-inp" type="number" id="au${id}-pr" placeholder="0" value="${d.precio||''}"></div>
    </div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl">Lugar de retiro</label><input class="finput" type="text" id="au${id}-or" placeholder="Aeropuerto MCO Terminal B" value="${d.retiro_lugar||''}"></div>
    <div class="fg"><label class="lbl">Lugar de devolución</label><input class="finput" type="text" id="au${id}-de" placeholder="Mismo lugar" value="${d.devolucion_lugar||''}"></div>
    <div class="fg"><label class="lbl">Fecha retiro</label><input class="finput" type="date" id="au${id}-fr" value="${d.retiro_fecha||''}"></div>
    <div class="fg"><label class="lbl">Hora retiro</label><input class="finput" type="time" id="au${id}-hr" value="${d.retiro_hora||''}"></div>
    <div class="fg"><label class="lbl">Fecha devolución</label><input class="finput" type="date" id="au${id}-fd" value="${d.devolucion_fecha||''}"></div>
    <div class="fg"><label class="lbl">Hora devolución</label><input class="finput" type="time" id="au${id}-hd" value="${d.devolucion_hora||''}"></div>
  </div>
  <div class="g3">
    <div class="fg" style="display:flex;align-items:center;gap:10px;padding-top:18px">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.83rem;color:var(--text)">
        <input type="checkbox" id="au${id}-cond" ${d.conductor_adicional?'checked':''} style="width:15px;height:15px;accent-color:var(--primary)"> Conductor adicional
      </label>
    </div>
    <div class="fg" style="display:flex;align-items:center;gap:10px;padding-top:18px">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.83rem;color:var(--text)">
        <input type="checkbox" id="au${id}-seg" ${d.incluye_seguro?'checked':''} style="width:15px;height:15px;accent-color:var(--primary)"> Incluye seguro
      </label>
    </div>
    <div class="fg"><label class="lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
      <div class="money-wrap"><div class="money-cur"><select id="au${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
      <input class="money-inp" type="number" id="au${id}-com" placeholder="0" value="${d.comision||''}"></div>
    </div>
  </div>
  <div class="fg"><label class="lbl">Notas</label><textarea class="ftxt" id="au${id}-not" rows="2" placeholder="Incluye GPS · Se abona con tarjeta · Sin franquicia">${d.notas||''}</textarea></div>`;
  document.getElementById('autos-cont').appendChild(el);
  if(d.categoria) document.getElementById('au'+id+'-cat').value=d.categoria;
  if(d.moneda) document.getElementById('au'+id+'-cur').value=d.moneda;
}

// ═══════════════════════════════════════════
// CRUCERO BLOCK
// ═══════════════════════════════════════════
let crc_cnt=0;
function addCrucero(d){
  d=d||{};const id=++crc_cnt;
  const el=document.createElement('div');el.className='rep';el.id='cb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Crucero ${id}</div>
    <button class="btn btn-del btn-xs" onclick="this.closest('.rep').remove()">✕</button></div>
  <div class="g3">
    <div class="fg"><label class="lbl">Naviera</label><input class="finput" type="text" id="cr${id}-nav" placeholder="MSC, Royal Caribbean, Costa..." value="${d.naviera||''}"></div>
    <div class="fg"><label class="lbl">Nombre del barco</label><input class="finput" type="text" id="cr${id}-barco" placeholder="MSC Seashore" value="${d.barco||''}"></div>
    <div class="fg"><label class="lbl">Tipo de cabina</label>
      <select class="fsel" id="cr${id}-cab">
        <option>Interior</option><option>Oceanview</option><option>Balcón</option>
        <option>Suite</option><option>Suite Deluxe</option>
      </select></div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl">Puerto de embarque</label><input class="finput" type="text" id="cr${id}-pe" placeholder="Miami, FL" value="${d.embarque_puerto||''}"></div>
    <div class="fg"><label class="lbl">Puerto de desembarque</label><input class="finput" type="text" id="cr${id}-pd" placeholder="Miami, FL" value="${d.desembarque_puerto||''}"></div>
    <div class="fg"><label class="lbl">Fecha embarque</label><input class="finput" type="date" id="cr${id}-fe" value="${d.embarque_fecha||''}"></div>
    <div class="fg"><label class="lbl">Hora embarque</label><input class="finput" type="time" id="cr${id}-he" value="${d.embarque_hora||''}"></div>
    <div class="fg"><label class="lbl">Fecha desembarque</label><input class="finput" type="date" id="cr${id}-fd" value="${d.desembarque_fecha||''}"></div>
    <div class="fg"><label class="lbl">Hora desembarque</label><input class="finput" type="time" id="cr${id}-hd" value="${d.desembarque_hora||''}"></div>
  </div>
  <div class="g3">
    <div class="fg"><label class="lbl">Régimen</label>
      <select class="fsel" id="cr${id}-reg">
        <option>Solo cabina</option><option>Pensión completa</option>
        <option>Todo incluido</option><option>Bebidas incluidas</option>
      </select></div>
    <div class="fg"><label class="lbl">Precio por persona</label>
      <div class="money-wrap"><div class="money-cur"><select id="cr${id}-cur"><option>USD</option><option>ARS</option></select></div>
      <input class="money-inp" type="number" id="cr${id}-pp" placeholder="0" value="${d.precio_pp||''}" oninput="calcCruceroTotal(${id})"></div>
    </div>
    <div class="fg"><label class="lbl">Pasajeros</label><input class="finput" type="number" id="cr${id}-pax" placeholder="2" value="${d.pasajeros||''}" oninput="calcCruceroTotal(${id})"></div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl">Precio total</label>
      <div class="money-wrap"><div class="money-cur" style="padding:10px 8px;font-size:.75rem;font-weight:700;color:var(--primary)">TOTAL</div>
      <input class="money-inp" type="number" id="cr${id}-tot" placeholder="Calculado automáticamente" value="${d.precio_total||''}"></div>
    </div>
    <div class="fg"><label class="lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
      <div class="money-wrap"><div class="money-cur"><select id="cr${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
      <input class="money-inp" type="number" id="cr${id}-com" placeholder="0" value="${d.comision||''}"></div>
    </div>
  </div>
  <div class="fg"><label class="lbl">Puertos de escala</label><textarea class="ftxt" id="cr${id}-esc" rows="3" placeholder="Nassau, Bahamas&#10;Cozumel, México&#10;Roatán, Honduras">${d.escalas||''}</textarea></div>
  <div class="fg"><label class="lbl">Notas</label><textarea class="ftxt" id="cr${id}-not" rows="2" placeholder="Incluye propinas · Excursiones opcionales...">${d.notas||''}</textarea></div>`;
  document.getElementById('cruceros-cont').appendChild(el);
  if(d.cabina) document.getElementById('cr'+id+'-cab').value=d.cabina;
  if(d.regimen) document.getElementById('cr'+id+'-reg').value=d.regimen;
  if(d.moneda) document.getElementById('cr'+id+'-cur').value=d.moneda;
}
function calcCruceroTotal(id){
  const pp=parseFloat(document.getElementById('cr'+id+'-pp').value)||0;
  const pax=parseFloat(document.getElementById('cr'+id+'-pax').value)||0;
  if(pp>0&&pax>0) document.getElementById('cr'+id+'-tot').value=pp*pax;
}

// ═══════════════════════════════════════════
// COLLECT FORM
// ═══════════════════════════════════════════
function collectForm(){
  const vuelos=[],hoteles=[],traslados=[],excursiones=[],autos=[],cruceros=[];
  const eqMap={b:'Bolso personal',c:'Carry-on',v23:'Valija 23kg',v32:'Valija 32kg','2v':'2 valijas'};
  const pMap={mk:'Magic Kingdom',ep:'EPCOT',ak:'Animal Kingdom',hs:'Hollywood Studios',us:'Universal Studios',ia:'Islands of Adventure',eu:'Epic Universe',vb:'Volcano Bay'};
  const bMap={ep:'Early Park Entry',tr:'Transporte gratuito',mm:'Memory Maker',dl:'Entrega en hotel',ex:'Express Pass',sp:'Disney Springs',wp:'Parque acuático gratis',me:'Magical Extras'};
  const amMap={wifi:'WiFi',pool:'Piscina',gym:'Gimnasio',spa:'Spa',bkf:'Desayuno buffet',rest:'Restaurante',bar:'Bar',beach:'Playa',park:'Estacionamiento',kids:'Área infantil'};

  document.querySelectorAll('[id^="vb-"]').forEach(blk=>{
    const i=blk.id.replace('vb-','');const or=gv('v'+i+'-or');if(!or)return;
    const mod=gv('v'+i+'-mod');
    const eq=[...blk.querySelectorAll('#v'+i+'-eq input:checked')].map(x=>eqMap[x.value]||x.value);
    const base={mod,aerolinea:gv('v'+i+'-al'),numero:gv('v'+i+'-num'),origen:or,iata_o:gv('v'+i+'-io').toUpperCase(),destino:gv('v'+i+'-de'),iata_d:gv('v'+i+'-id').toUpperCase(),fs:gv('v'+i+'-fs'),hs:gv('v'+i+'-hs'),fl:gv('v'+i+'-fl'),hl:gv('v'+i+'-hl'),escala:gv('v'+i+'-esc'),t_escala:gv('v'+i+'-tesc'),duracion:gv('v'+i+'-dur'),tarifa:gv('v'+i+'-tar'),moneda:gv('v'+i+'-cur'),precio:gn('v'+i+'-pr'),fin:gv('v'+i+'-fin'),equipaje:[...eq,gv('v'+i+'-eq-x')].filter(Boolean).join(' · '),comision:gn('v'+i+'-com'),com_cur:gv('v'+i+'-com-cur')};
    if(mod==='idavuelta'){Object.assign(base,{al2:gv('v'+i+'-al2'),num2:gv('v'+i+'-num2'),or2:gv('v'+i+'-or2'),io2:gv('v'+i+'-io2').toUpperCase(),de2:gv('v'+i+'-de2'),id2:gv('v'+i+'-id2').toUpperCase(),fs2:gv('v'+i+'-fs2'),hs2:gv('v'+i+'-hs2'),fl2:gv('v'+i+'-fl2'),hl2:gv('v'+i+'-hl2'),esc2:gv('v'+i+'-esc2'),tesc2:gv('v'+i+'-tesc2'),dur2:gv('v'+i+'-dur2')});}
    vuelos.push(base);
  });
  document.querySelectorAll('[id^="hb-"]').forEach(blk=>{
    const i=blk.id.replace('hb-','');const nm=gv('h'+i+'-nm');if(!nm)return;
    const tipo=gv('h'+i+'-tipo');
    const parqs=[...blk.querySelectorAll('#h'+i+'-parques input:checked')].map(x=>pMap[x.value]||x.value);
    const bens=[...blk.querySelectorAll('#h'+i+'-bens input:checked')].map(x=>bMap[x.value]||x.value);
    const am=[...blk.querySelectorAll('#h'+i+'-am input:checked')].map(x=>amMap[x.value]||x.value);
    hoteles.push({nombre:nm,tipo,estrellas:gv('h'+i+'-est'),ci:fd(gv('h'+i+'-ci')),co:fd(gv('h'+i+'-co')),noches:gn('h'+i+'-nc'),hab:gv('h'+i+'-hab'),regimen:gv('h'+i+'-reg'),moneda:gv('h'+i+'-cur'),precio:gn('h'+i+'-pr'),tickets:gv('h'+i+'-tkt'),dias_tkt:gv('h'+i+'-tktd'),parques:parqs,beneficios:bens,mp:gv('h'+i+'-mp'),mp_cur:gv('h'+i+'-mp-cur'),mp_pr:gn('h'+i+'-mp-pr'),mp_desc:gv('h'+i+'-mp-desc'),notes:gv('h'+i+'-notes'),amenities:am,am_x:gv('h'+i+'-am-x'),comision:gn('h'+i+'-com'),com_cur:gv('h'+i+'-com-cur')});
  });
  document.querySelectorAll('[id^="tb-"]').forEach(blk=>{
    const i=blk.id.replace('tb-','');const or=gv('t'+i+'-or'),de=gv('t'+i+'-de');if(!or&&!de)return;
    traslados.push({tipo:gv('t'+i+'-tipo'),origen:or,destino:de,fecha:fd(gv('t'+i+'-fe')),hora:gv('t'+i+'-ho'),vehiculo:gv('t'+i+'-veh'),moneda:gv('t'+i+'-cur'),precio:gn('t'+i+'-pr'),prov:getProvVal('t'+i),notas:gv('t'+i+'-not'),comision:gn('t'+i+'-com'),com_cur:gv('t'+i+'-com-cur')});
  });
  document.querySelectorAll('[id^="eb-"]').forEach(blk=>{
    const i=blk.id.replace('eb-','');const nm=gv('e'+i+'-nm');if(!nm)return;
    const cat=gv('e'+i+'-cat');
    excursiones.push({nombre:nm,categoria:cat==='otros'?gv('e'+i+'-cat-otros')||'Otros':cat,prov:getProvVal('e'+i),fecha:fd(gv('e'+i+'-fe')),hora:gv('e'+i+'-ho'),dur:gv('e'+i+'-dur'),moneda:gv('e'+i+'-cur'),precio:gn('e'+i+'-pr'),punto:gv('e'+i+'-punto'),inc:gv('e'+i+'-inc'),noinc:gv('e'+i+'-noinc'),desc:gv('e'+i+'-desc'),obs:gv('e'+i+'-obs'),comision:gn('e'+i+'-com'),com_cur:gv('e'+i+'-com-cur')});
  });
  document.querySelectorAll('[id^="ab-"]').forEach(blk=>{
    const i=blk.id.replace('ab-','');const prov=document.getElementById('au'+i+'-prov')?.value||'';
    if(!prov)return;
    autos.push({proveedor:prov,categoria:gv('au'+i+'-cat'),retiro_lugar:gv('au'+i+'-or'),retiro_fecha:fd(gv('au'+i+'-fr')),retiro_hora:gv('au'+i+'-hr'),devolucion_lugar:gv('au'+i+'-de'),devolucion_fecha:fd(gv('au'+i+'-fd')),devolucion_hora:gv('au'+i+'-hd'),conductor_adicional:document.getElementById('au'+i+'-cond')?.checked||false,incluye_seguro:document.getElementById('au'+i+'-seg')?.checked||false,moneda:gv('au'+i+'-cur'),precio:gn('au'+i+'-pr'),notas:gv('au'+i+'-not'),comision:gn('au'+i+'-com'),com_cur:gv('au'+i+'-com-cur')});
  });
  document.querySelectorAll('[id^="cb-"]').forEach(blk=>{
    const i=blk.id.replace('cb-','');const nav=gv('cr'+i+'-nav');
    if(!nav)return;
    cruceros.push({naviera:nav,barco:gv('cr'+i+'-barco'),cabina:gv('cr'+i+'-cab'),regimen:gv('cr'+i+'-reg'),embarque_puerto:gv('cr'+i+'-pe'),embarque_fecha:fd(gv('cr'+i+'-fe')),embarque_hora:gv('cr'+i+'-he'),desembarque_puerto:gv('cr'+i+'-pd'),desembarque_fecha:fd(gv('cr'+i+'-fd')),desembarque_hora:gv('cr'+i+'-hd'),moneda:gv('cr'+i+'-cur'),precio_pp:gn('cr'+i+'-pp'),pasajeros:gn('cr'+i+'-pax'),precio_total:gn('cr'+i+'-tot'),escalas:gv('cr'+i+'-esc'),notas:gv('cr'+i+'-not'),comision:gn('cr'+i+'-com'),com_cur:gv('cr'+i+'-com-cur')});
  });
  const tickets_arr=[];
  document.querySelectorAll('[id^="tkb-"]').forEach(blk=>{
    const i=blk.id.replace('tkb-','');const nm=gv('tk'+i+'-nm');if(!nm)return;
    tickets_arr.push({nombre:nm,tipo:gv('tk'+i+'-tipo'),prov:getProvVal('tk'+i),fecha:fd(gv('tk'+i+'-fe')),moneda:gv('tk'+i+'-cur'),precio:gn('tk'+i+'-pr'),comision:gn('tk'+i+'-com'),com_cur:gv('tk'+i+'-com-cur'),desc:gv('tk'+i+'-desc')});
  });
  const s=gv('m-sal'),e=gv('m-reg');
  const noches=s&&e?Math.round((new Date(e)-new Date(s))/86400000):0;
  // Si estamos editando, preservar el ref_id original del formulario.
  // Si es cotización NUEVA (editingQuoteId===null), siempre generar uno nuevo
  // para evitar colisiones aunque m-ref tenga un valor residual.
  const refId = editingQuoteId
    ? (gv('m-ref') || Math.floor(Math.random()*90000000+10000000))
    : Math.floor(Math.random()*90000000+10000000);
  // Calcular comisión total (solo valores en USD o numéricas)
  const calcCom=(arr)=>arr.reduce((sum,x)=>sum+(x.comision&&x.com_cur!=='%'?x.comision:0),0);
  const segCom=(gv('seg-com-cur')!=='%'?gn('seg-com'):0);
  const total_comision=calcCom(vuelos)+calcCom(hoteles)+calcCom(traslados)+calcCom(excursiones)+calcCom(tickets_arr)+segCom;
  return{refId,ts:Date.now(),_clientId:document.getElementById('_clientId')?.value||null,
    estado:gv('m-estado')||'borrador',notas_int:gv('m-notas'),
    cliente:{nombre:gv('m-nombre'),celular:gv('m-cel'),email:gv('m-email'),pasajeros:paxStr()},
    viaje:{destino:gv('m-dest'),pais:gv('m-pais'),salida:fd(s),regreso:fd(e),noches},
    vuelos,hoteles,traslados,excursiones,tickets:tickets_arr,autos,cruceros,
    seguro:{nombre:gv('seg-nm'),cobertura_medica:gv('seg-med'),equipaje_seg:gv('seg-eq'),preexistencias:gv('seg-pre'),dias:gv('seg-dias'),moneda:gv('seg-cur'),precio:gn('seg-precio'),fin:gv('seg-fin'),extra:gv('seg-extra'),comision:gn('seg-com'),com_cur:gv('seg-com-cur')},
    precios:{moneda:gv('p-cur'),por_persona:gn('p-pp'),moneda2:gv('p-cur2'),total:gn('p-tot'),moneda3:gv('p-cur3'),reserva:gn('p-res'),cuotas:gv('p-cuo'),cancelacion:gv('p-can'),validez:gv('p-val')||'24 horas',tyc:gv('p-tyc')},
    total_comision};
}

// ═══════════════════════════════════════════
// SAVE QUOTE
// ═══════════════════════════════════════════
async function saveQuote(){
  console.log('click saveQuote — currentUser:', currentUser?.email);
  // Check auth BEFORE disabling buttons
  if(!currentUser){
    toast('Debés iniciar sesión para guardar.',false);
    return;
  }
  let d;
  try{ d=collectForm(); }
  catch(err){ toast('Error al leer formulario: '+err.message,false); console.error('collectForm error:',err); return; }
  qData=d;
  try{ renderPreview(qData); }catch(err){ console.warn('renderPreview warning:',err); }
  const btns=[document.getElementById('btn-save-main'),document.getElementById('btn-save-prev')];
  btns.forEach(b=>{if(b){b.disabled=true;b.innerHTML='<span class="spin" style="display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.35);border-top-color:white;border-radius:50%;vertical-align:middle"></span> Guardando...';}});
  try{
    await dbSaveQuote(qData, editingQuoteId);
    const wasEditing = !!editingQuoteId;
    // ── SIEMPRE limpiar modo edición después de guardar ──────────────
    editingQuoteId = null;
    formDraft = null;
    // Limpiar m-ref para que la próxima cotización genere un ref_id nuevo
    const refField = document.getElementById('m-ref');
    if(refField) refField.value = '';
    _hideEditBanner();
    // Toast según operación
    toast(wasEditing ? '✓ Cotización actualizada en la nube' : '✓ Guardado en la nube');
  }catch(e){
    console.error('saveQuote error:',e);
    toast('Error al guardar: '+(e.message||JSON.stringify(e)),false);
  }
  finally{ 
    const b0=document.getElementById('btn-save-main');
    const b1=document.getElementById('btn-save-prev');
    if(b0){b0.disabled=false;b0.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> Guardar en nube';}
    if(b1){b1.disabled=false;b1.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> Guardar';}
  }
}

// ═══════════════════════════════════════════
// AI
// ═══════════════════════════════════════════
const SYS=`Sos experto en turismo. Extraé la info del texto y devolvé SOLO JSON válido sin backticks.
{"cliente":{"nombre":"","celular":"","email":"","pasajeros":""},"viaje":{"destino":"","pais":"","salida":"DD/MM/YYYY","regreso":"DD/MM/YYYY","noches":0},"vuelos":[{"mod":"simple","aerolinea":"","numero":"","origen":"","iata_o":"","destino":"","iata_d":"","fs":"YYYY-MM-DD","hs":"HH:MM","fl":"YYYY-MM-DD","hl":"HH:MM","escala":"","t_escala":"","duracion":"","al2":"","num2":"","or2":"","io2":"","de2":"","id2":"","fs2":"YYYY-MM-DD","hs2":"HH:MM","fl2":"YYYY-MM-DD","hl2":"HH:MM","esc2":"","tesc2":"","dur2":"","tarifa":"Economy","moneda":"USD","precio":0,"fin":"","equipaje":""}],"hoteles":[{"nombre":"","tipo":"regular","estrellas":0,"ci":"DD/MM/YYYY","co":"DD/MM/YYYY","noches":0,"hab":"","regimen":"","moneda":"USD","precio":0,"tickets":"","parques":[],"beneficios":[],"mp":"","mp_cur":"USD","mp_pr":0,"mp_desc":"","notes":"","amenities":[]}],"traslados":[{"tipo":"in","origen":"","destino":"","fecha":"DD/MM/YYYY","hora":"","vehiculo":"Van privada","moneda":"USD","precio":0,"prov":"","notas":""}],"excursiones":[{"nombre":"","categoria":"","prov":"","fecha":"DD/MM/YYYY","hora":"","dur":"","moneda":"USD","precio":0,"punto":"","inc":"","noinc":"","desc":"","obs":""}],"seguro":{"nombre":"","cobertura_medica":"","equipaje_seg":"","preexistencias":"","moneda":"USD","precio":0,"fin":"","extra":""},"precios":{"moneda":"USD","por_persona":0,"total":0,"reserva":0,"cuotas":"","cancelacion":"","validez":"24 horas","tyc":""}}
Si es ida y vuelta usa mod="idavuelta" y completá campos *2. Disney/Universal: tipo="disney"/"universal".`;
