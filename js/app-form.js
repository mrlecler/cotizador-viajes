// ═══════════════════════════════════════════
// AUTOCOMPLETE — AEROPUERTOS Y CIUDADES
// ═══════════════════════════════════════════
let airportsList=[];
let citiesList=[];
fetch('data/airports.json').then(r=>r.json()).then(d=>{airportsList=d;}).catch(()=>{});
fetch('data/cities.json').then(r=>r.json()).then(d=>{citiesList=d;_initStaticCityAC();}).catch(()=>{});
// Mapa aerolínea→IATA y lista completa para autocomplete (carga asíncrona silenciosa)
(async()=>{try{if(typeof sb!=='undefined'){const{data}=await sb.from('aerolineas').select('nombre,codigo_iata');if(data){window.aerolineasMap=Object.fromEntries(data.filter(a=>a.codigo_iata).map(a=>[a.nombre.toLowerCase(),a.codigo_iata.toUpperCase()]));window.aerolineasList=data.filter(a=>a.nombre).map(a=>({nombre:a.nombre,codigo_iata:(a.codigo_iata||'').toUpperCase()}));}}}catch(e){}})();

// ── Estilos compartidos del dropdown ──
// Fondo siempre oscuro — en light-mode var(--ink2) se redefine como blanco y haría ilegible el texto
const AC_DROP_CSS='position:absolute;z-index:9999;left:0;right:0;top:100%;background:#160024;border:1px solid rgba(124,58,237,0.3);border-radius:10px;box-shadow:0 8px 24px rgba(79,70,229,0.22);max-height:260px;overflow-y:auto;display:none;';
const AC_ITEM_BASE='padding:9px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:10px;transition:background .15s;';

// ── Función genérica base ──
function _createDrop(inputId){
  const inp=document.getElementById(inputId);
  if(!inp)return null;
  const old=document.getElementById('ac-drop-'+inputId);
  if(old)old.remove();
  const drop=document.createElement('div');
  drop.id='ac-drop-'+inputId;
  drop.style.cssText=AC_DROP_CSS;
  const wrap=inp.closest('.fg')||inp.parentElement;
  wrap.style.position='relative';
  wrap.appendChild(drop);
  inp.addEventListener('blur',function(){setTimeout(()=>drop.style.display='none',200);});
  inp.addEventListener('keydown',function(e){if(e.key==='Escape')drop.style.display='none';});
  return {inp,drop};
}

// ── FUNCIÓN A — Autocomplete de aeropuerto ──
// inputCiudadId: campo de texto ciudad/aeropuerto
// inputIataId: campo IATA asociado (puede ser null)
function initAirportAutocomplete(inputCiudadId,inputIataId){
  const obj=_createDrop(inputCiudadId);
  if(!obj)return;
  const {inp,drop}=obj;
  function show(q){
    if(!q||q.length<2){drop.style.display='none';return;}
    const qu=q.toUpperCase();
    const exact=airportsList.filter(a=>a.iata===qu);
    const sw=airportsList.filter(a=>a.iata!==qu&&(a.iata.startsWith(qu)||a.city.toUpperCase().startsWith(qu)||a.name.toUpperCase().startsWith(qu)));
    const cont=airportsList.filter(a=>a.iata!==qu&&!a.iata.startsWith(qu)&&!a.city.toUpperCase().startsWith(qu)&&!a.name.toUpperCase().startsWith(qu)&&(a.city.toUpperCase().includes(qu)||a.name.toUpperCase().includes(qu)));
    const res=[...exact,...sw,...cont].slice(0,8);
    if(!res.length){drop.style.display='none';return;}
    drop.innerHTML=res.map(a=>{
      const safe_iata=a.iata.replace(/'/g,"\\'");
      const safe_label=(a.city+' ('+a.iata+')').replace(/'/g,"\\'");
      return `<div style="${AC_ITEM_BASE}" onmouseover="this.style.background='rgba(124,58,237,0.1)'" onmouseout="this.style.background=''" onmousedown="event.preventDefault();_selAirport('${inputCiudadId}','${inputIataId||''}','${safe_iata}','${safe_label}')"><span style="font-size:11px;font-weight:800;color:#C4B5FD;min-width:38px;font-family:'DM Mono',monospace;letter-spacing:.05em">${a.iata}</span><span style="font-size:12px;color:rgba(255,255,255,.9);flex:1;line-height:1.3">${a.city}<span style="display:block;font-size:10px;color:rgba(255,255,255,.4);margin-top:1px">${a.name} · ${a.country}</span></span></div>`;
    }).join('');
    drop.style.display='block';
  }
  inp.addEventListener('input',function(){show(this.value);});
  inp.addEventListener('focus',function(){if(this.value.length>=2)show(this.value);});
}
function _selAirport(cityId,iataId,iata,label){
  const ci=document.getElementById(cityId);
  const ii=iataId?document.getElementById(iataId):null;
  if(ci)ci.value=label;
  if(ii)ii.value=iata;
  const d=document.getElementById('ac-drop-'+cityId);
  if(d)d.style.display='none';
}
// Alias para compatibilidad con llamadas anteriores
function airportAC(inputId,iataId){initAirportAutocomplete(inputId,iataId);}
function selectAirport(inputId,iataId,iata,cityLabel){_selAirport(inputId,iataId,iata,cityLabel);}

// ── FUNCIÓN B — Autocomplete de ciudad genérica ──
// inputId: campo de texto
// onlyCountries: true → muestra solo países únicos
function initCityAutocomplete(inputId,onlyCountries){
  const obj=_createDrop(inputId);
  if(!obj)return;
  const {inp,drop}=obj;
  // Mapa de códigos de país a nombre legible
  const CNAMES={AR:'Argentina',BR:'Brasil',UY:'Uruguay',PY:'Paraguay',BO:'Bolivia',CL:'Chile',PE:'Perú',CO:'Colombia',EC:'Ecuador',VE:'Venezuela',MX:'México',GT:'Guatemala',SV:'El Salvador',HN:'Honduras',NI:'Nicaragua',CR:'Costa Rica',PA:'Panamá',BZ:'Belice',CU:'Cuba',DO:'Rep. Dominicana',PR:'Puerto Rico',JM:'Jamaica',BB:'Barbados',TT:'Trinidad y Tobago',BS:'Bahamas',GD:'Granada',VC:'San Vicente',LC:'Santa Lucía',AG:'Antigua',KN:'St. Kitts',AW:'Aruba',CW:'Curazao',SX:'Sint Maarten',MF:'Saint Martin',BL:'San Bartolomé',VG:'Islas Vírgenes Británicas',VI:'Islas Vírgenes EEUU',KY:'Islas Caimán',GP:'Guadalupe',MQ:'Martinica',HT:'Haití',GY:'Guyana',SR:'Surinam',GF:'Guayana Francesa',ES:'España',PT:'Portugal',FR:'Francia',IT:'Italia',DE:'Alemania',GB:'Reino Unido',NL:'Países Bajos',BE:'Bélgica',CH:'Suiza',AT:'Austria',DK:'Dinamarca',SE:'Suecia',NO:'Noruega',FI:'Finlandia',GR:'Grecia',TR:'Turquía',PL:'Polonia',CZ:'Chequia',SK:'Eslovaquia',HU:'Hungría',RO:'Rumanía',BG:'Bulgaria',HR:'Croacia',SI:'Eslovenia',RS:'Serbia',ME:'Montenegro',BA:'Bosnia',MK:'Macedonia',AL:'Albania',XK:'Kosovo',EE:'Estonia',LV:'Letonia',LT:'Lituania',IE:'Irlanda',IS:'Islandia',LU:'Luxemburgo',MC:'Mónaco',AD:'Andorra',SM:'San Marino',LI:'Liechtenstein',MT:'Malta',RU:'Rusia',UA:'Ucrania',BY:'Bielorrusia',MD:'Moldavia',GE:'Georgia',AM:'Armenia',AZ:'Azerbaiyán',US:'Estados Unidos',CA:'Canadá',JP:'Japón',KR:'Corea del Sur',CN:'China',HK:'Hong Kong',MO:'Macao',TW:'Taiwán',IN:'India',SG:'Singapur',MY:'Malasia',TH:'Tailandia',VN:'Vietnam',KH:'Camboya',LA:'Laos',MM:'Myanmar',ID:'Indonesia',PH:'Filipinas',LK:'Sri Lanka',NP:'Nepal',MV:'Maldivas',BD:'Bangladesh',PK:'Pakistán',UZ:'Uzbekistán',KZ:'Kazajistán',MN:'Mongolia',AE:'Emiratos Árabes',QA:'Catar',SA:'Arabia Saudita',JO:'Jordania',LB:'Líbano',IL:'Israel',KW:'Kuwait',OM:'Omán',BH:'Baréin',IR:'Irán',IQ:'Irak',EG:'Egipto',ZA:'Sudáfrica',KE:'Kenia',TZ:'Tanzania',UG:'Uganda',RW:'Ruanda',ET:'Etiopía',MZ:'Mozambique',MG:'Madagascar',MU:'Mauricio',SC:'Seychelles',RE:'Reunión',NG:'Nigeria',GH:'Ghana',SN:'Senegal',CI:'Costa de Marfil',AO:'Angola',NA:'Namibia',ZM:'Zambia',ZW:'Zimbabue',BW:'Botsuana',TN:'Túnez',DZ:'Argelia',MA:'Marruecos',AU:'Australia',NZ:'Nueva Zelanda',FJ:'Fiyi',PF:'Polinesia Francesa',CK:'Islas Cook',WS:'Samoa',PG:'Papúa Nueva Guinea',SB:'Islas Salomón',VU:'Vanuatu',NC:'Nueva Caledonia',GU:'Guam'};
  function show(q){
    if(!q||q.length<2){drop.style.display='none';return;}
    const qu=q.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let src=citiesList;
    if(onlyCountries){
      // Construir lista única de países
      const seen=new Set();
      src=[];
      citiesList.forEach(c=>{
        const cn=CNAMES[c.country]||c.country;
        if(!seen.has(cn)){seen.add(cn);src.push({name:cn,country:c.country,region:''});}
      });
    }
    const norm=s=>s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const sw=src.filter(c=>norm(c.name).startsWith(qu));
    const cont=src.filter(c=>!norm(c.name).startsWith(qu)&&norm(c.name).includes(qu));
    const res=[...sw,...cont].slice(0,8);
    if(!res.length){drop.style.display='none';return;}
    drop.innerHTML=res.map(c=>{
      const safe=c.name.replace(/'/g,"\\'");
      const label=onlyCountries?c.name:`${c.name}${c.region?', '+c.region:''}`;
      const sub=onlyCountries?'':`<span style="display:block;font-size:10px;opacity:.45;margin-top:1px">${CNAMES[c.country]||c.country}</span>`;
      return `<div style="${AC_ITEM_BASE}" onmouseover="this.style.background='rgba(124,58,237,0.1)'" onmouseout="this.style.background=''" onmousedown="event.preventDefault();_selCity('${inputId}','${safe}')"><span style="font-size:12px;color:rgba(255,255,255,.9);flex:1;line-height:1.3">${label}${sub}</span></div>`;
    }).join('');
    drop.style.display='block';
  }
  inp.addEventListener('input',function(){show(this.value);});
  inp.addEventListener('focus',function(){if(this.value.length>=2)show(this.value);});
}
function _selCity(inputId,val){
  const inp=document.getElementById(inputId);
  if(inp)inp.value=val;
  const d=document.getElementById('ac-drop-'+inputId);
  if(d)d.style.display='none';
}

// ── Fetch de proveedores para selects de traslados/excursiones ──
(async()=>{try{if(typeof sb!=='undefined'){const{data}=await sb.from('proveedores').select('nombre,tipo,ciudad');if(data){window.provsList=data.filter(p=>p.nombre).map(p=>({nombre:p.nombre,tipo:p.tipo||'',ciudad:p.ciudad||''}));// Poblar cualquier prov-sel ya renderizado (ej: al cargar historial)
document.querySelectorAll('.prov-sel').forEach(sel=>{_populateProvSel(sel.id,sel.getAttribute('data-val')||'');});}}}catch(e){}})();

// Poblar un select de proveedor específico con la lista global
function _populateProvSel(selId,savedVal){
  const sel=document.getElementById(selId);
  if(!sel)return;
  const list=window.provsList||[];
  sel.innerHTML='<option value="">— Elegir proveedor —</option>';
  list.forEach(p=>{
    const opt=document.createElement('option');
    opt.value=p.nombre;
    opt.textContent=p.nombre+(p.ciudad?' ('+p.ciudad+')':'');
    sel.appendChild(opt);
  });
  const otro=document.createElement('option');
  otro.value='__otro__';
  otro.textContent='Otro...';
  sel.appendChild(otro);
  if(savedVal){
    const found=[...sel.options].find(o=>o.value===savedVal);
    if(found){sel.value=savedVal;}
    else{sel.value='__otro__';const inp=document.getElementById(selId.replace('-sel','-inp'));if(inp){inp.value=savedVal;inp.style.display='';}}
  }
}

// ── Inicializar campos estáticos del formulario principal ──
function _initStaticCityAC(){
  initCityAutocomplete('m-dest');
  initCityAutocomplete('m-pais',true);
}
// Si el DOM ya está listo cuando cities carga, _initStaticCityAC se llama arriba;
// si no, usar DOMContentLoaded como respaldo
document.addEventListener('DOMContentLoaded',function(){
  if(citiesList.length>0)_initStaticCityAC();
  _initAutoTotal();
});

// ── Logos de aerolíneas — CDN Google Flights ──
function _getAirlineIata(name,flightNum){
  if(!name)return'';
  const map=window.aerolineasMap||{};
  const fromMap=map[name.toLowerCase()];if(fromMap)return fromMap;
  if(flightNum){const m=flightNum.trim().match(/^([A-Z]{2})/i);if(m)return m[1].toUpperCase();}
  const m2=name.match(/\(([A-Z]{2})\)/i);if(m2)return m2[1].toUpperCase();
  return'';
}
function _updateAirlineLogo(inputId,logoId,numId){
  const inp=document.getElementById(inputId);const img=document.getElementById(logoId);
  if(!inp||!img)return;
  const iata=_getAirlineIata(inp.value.trim(),numId?document.getElementById(numId)?.value||'':'');
  if(iata){img.src=`https://www.gstatic.com/flights/airline_logos/70px/${iata}.png`;img.style.display='block';inp.style.paddingLeft='42px';}
  else{img.src='';img.style.display='none';inp.style.paddingLeft='';}
}
function _initAirlineLogo(inputId,logoId,numId){
  const inp=document.getElementById(inputId);if(!inp)return;
  inp.addEventListener('input',()=>_updateAirlineLogo(inputId,logoId,numId));
  inp.addEventListener('change',()=>_updateAirlineLogo(inputId,logoId,numId));
  if(numId){const ni=document.getElementById(numId);if(ni)ni.addEventListener('input',()=>_updateAirlineLogo(inputId,logoId,numId));}
}

// ── Autocomplete de aerolínea con dropdown custom (logo + nombre + IATA) ──
function initAirlineAutocomplete(inputId,logoId,numId){
  const obj=_createDrop(inputId);
  if(!obj)return;
  const {inp,drop}=obj;
  function show(q){
    if(!q||q.length<2){drop.style.display='none';return;}
    const list=window.aerolineasList||[];
    if(!list.length){drop.style.display='none';return;}
    const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const qu=norm(q);
    const sw=list.filter(a=>norm(a.nombre).startsWith(qu));
    const cont=list.filter(a=>!norm(a.nombre).startsWith(qu)&&norm(a.nombre).includes(qu));
    const res=[...sw,...cont].slice(0,8);
    if(!res.length){drop.style.display='none';return;}
    drop.innerHTML=res.map(a=>{
      const safe_n=a.nombre.replace(/'/g,"\\'");
      const iata=a.codigo_iata||'';
      const logo=iata?`<img src="https://www.gstatic.com/flights/airline_logos/70px/${iata}.png" width="20" height="20" style="object-fit:contain;border-radius:3px;flex-shrink:0" onerror="this.style.display='none'">`:'<span style="width:20px;flex-shrink:0"></span>';
      return `<div style="${AC_ITEM_BASE}" onmouseover="this.style.background='rgba(124,58,237,0.1)'" onmouseout="this.style.background=''" onmousedown="event.preventDefault();_selAirline('${inputId}','${logoId}','${safe_n}','${iata}')">${logo}<span style="font-size:12px;color:rgba(255,255,255,.9);flex:1;line-height:1.3">${a.nombre}</span><span style="font-size:10px;color:#C4B5FD;font-family:'DM Mono',monospace;letter-spacing:.05em;flex-shrink:0">${iata}</span></div>`;
    }).join('');
    drop.style.display='block';
  }
  inp.addEventListener('input',function(){show(this.value);});
  inp.addEventListener('focus',function(){if(this.value.length>=2)show(this.value);});
  // Mantener el número de vuelo como fuente de IATA (listener secundario)
  if(numId){const ni=document.getElementById(numId);if(ni)ni.addEventListener('input',()=>_updateAirlineLogo(inputId,logoId,numId));}
}
function _selAirline(inputId,logoId,nombre,iata){
  const inp=document.getElementById(inputId);
  if(inp)inp.value=nombre;
  const d=document.getElementById('ac-drop-'+inputId);
  if(d)d.style.display='none';
  if(logoId){
    const img=document.getElementById(logoId);
    if(iata&&img){img.src=`https://www.gstatic.com/flights/airline_logos/70px/${iata}.png`;img.style.display='block';if(inp)inp.style.paddingLeft='42px';}
    else if(img){img.src='';img.style.display='none';if(inp)inp.style.paddingLeft='';}
  }
}

function addVuelo(d){
  d=d||{};const id=++vc;
  const el=document.createElement('div');el.className='rep';el.id='vb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Vuelo ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)">✕</button></div></div>
  <div class="g3" style="margin-bottom:4px">
    <div class="fg"><label class="lbl">Modalidad</label>
      <select class="fsel" id="v${id}-mod" onchange="toggleRet(${id})">
        <option value="simple">Tramo único</option>
        <option value="idavuelta">Ida y vuelta (precio combinado)</option>
        <option value="interno">Vuelo interno</option>
      </select></div>
    <div class="fg"><label class="lbl">Aerolínea IDA</label>
      <div style="position:relative">
        <img id="v${id}-al-logo" src="" width="24" height="24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);object-fit:contain;display:none;border-radius:3px;pointer-events:none;z-index:1" onerror="this.style.display='none'">
        <input class="finput" type="text" id="v${id}-al" placeholder="American Airlines" value="${d.aerolinea||''}">
      </div>
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
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--violet-light);margin-bottom:12px">↩ TRAMO VUELTA</div>
    <div class="g3">
      <div class="fg"><label class="lbl">Aerolínea vuelta</label>
        <div style="position:relative">
          <img id="v${id}-al2-logo" src="" width="24" height="24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);object-fit:contain;display:none;border-radius:3px;pointer-events:none;z-index:1" onerror="this.style.display='none'">
          <input class="finput" type="text" id="v${id}-al2" placeholder="Avianca" value="${d.al2||''}">
        </div>
      </div>
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
      <input class="money-inp" data-precio type="number" id="v${id}-pr" placeholder="1985" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
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
  // Autocomplete aeropuertos — tramo ida
  initAirportAutocomplete('v'+id+'-or','v'+id+'-io');
  initAirportAutocomplete('v'+id+'-de','v'+id+'-id');
  initAirportAutocomplete('v'+id+'-esc',null);
  // Autocomplete tramo vuelta (solo si ya es idavuelta al cargar)
  if(d.mod==='idavuelta'){
    initAirportAutocomplete('v'+id+'-or2','v'+id+'-io2');
    initAirportAutocomplete('v'+id+'-de2','v'+id+'-id2');
    initAirportAutocomplete('v'+id+'-esc2',null);
  }
  // Autocomplete aerolíneas — Surface 1
  initAirlineAutocomplete('v'+id+'-al','v'+id+'-al-logo','v'+id+'-num');
  if(d.aerolinea)_updateAirlineLogo('v'+id+'-al','v'+id+'-al-logo','v'+id+'-num');
  if(d.mod==='idavuelta'){
    initAirlineAutocomplete('v'+id+'-al2','v'+id+'-al2-logo','v'+id+'-num2');
    if(d.al2)_updateAirlineLogo('v'+id+'-al2','v'+id+'-al2-logo','v'+id+'-num2');
  }
  if(d.mod) document.getElementById('v'+id+'-mod').value=d.mod;
  if(d.mod==='idavuelta') document.getElementById('v'+id+'-ret-sec').style.display='';
  if(d.tarifa) document.getElementById('v'+id+'-tar').value=d.tarifa;
  _onPriceChange('vuelos-cont','VUELOS');
}
function toggleRet(id){
  const isIV=document.getElementById('v'+id+'-mod').value==='idavuelta';
  document.getElementById('v'+id+'-ret-sec').style.display=isIV?'':'none';
  // Inicializar autocomplete del tramo vuelta al activarlo
  if(isIV){
    initAirportAutocomplete('v'+id+'-or2','v'+id+'-io2');
    initAirportAutocomplete('v'+id+'-de2','v'+id+'-id2');
    initAirportAutocomplete('v'+id+'-esc2',null);
    initAirlineAutocomplete('v'+id+'-al2','v'+id+'-al2-logo','v'+id+'-num2');
  }
}

// ═══════════════════════════════════════════
// HOTEL BLOCK
// ═══════════════════════════════════════════
function addHotel(d){
  d=d||{};const id=++hc;const isD=d.tipo==='disney',isU=d.tipo==='universal';
  const el=document.createElement('div');el.className='rep';el.id='hb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Hotel ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)">✕</button></div></div>
  <div class="g3">
    <div class="fg full"><label class="lbl">Nombre</label><input class="finput" type="text" id="h${id}-nm" placeholder="Disney's All-Star Sports Resort" value="${d.nombre||''}"></div>
    <div class="fg"><label class="lbl">Tipo</label><select class="fsel" id="h${id}-tipo" onchange="onHotelType(${id})"><option value="regular">Hotel regular</option><option value="disney">Hotel Disney</option><option value="universal">Hotel Universal</option><option value="airbnb">Airbnb / Apart.</option><option value="crucero">Crucero</option></select></div>
    <div class="fg"><label class="lbl">Estrellas</label><select class="fsel" id="h${id}-est"><option value="">—</option><option value="3">3★</option><option value="4">4★</option><option value="5">5★</option></select></div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl">Ciudad</label><input class="finput" type="text" id="h${id}-ciu" placeholder="Orlando" value="${d.ciudad||''}"></div>
    <div class="fg"><label class="lbl">País</label><input class="finput" type="text" id="h${id}-pai" placeholder="Estados Unidos" value="${d.pais||''}"></div>
  </div>
  <div class="g4">
    <div class="fg"><label class="lbl">Check-in</label><input class="finput" type="date" id="h${id}-ci" value="${d.ci||''}"></div>
    <div class="fg"><label class="lbl">Check-out</label><input class="finput" type="date" id="h${id}-co" value="${d.co||''}"></div>
    <div class="fg"><label class="lbl">Noches</label><input class="finput" type="number" id="h${id}-nc" placeholder="7" value="${d.noches||''}"></div>
    <div class="fg"><label class="lbl">Precio base</label>
      <div class="money-wrap"><div class="money-cur"><select id="h${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" data-precio type="number" id="h${id}-pr" placeholder="2717" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
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
        <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--violet-light);margin-bottom:10px">Plan de comidas</div>
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
  // Autocomplete ciudad y país del hotel
  initCityAutocomplete('h'+id+'-ciu');
  initCityAutocomplete('h'+id+'-pai',true);
  if(d.tipo) document.getElementById('h'+id+'-tipo').value=d.tipo;
  if(d.regimen) document.getElementById('h'+id+'-reg').value=d.regimen;
  if(d.mp) document.getElementById('h'+id+'-mp').value=d.mp;
  _initNochesCalc('h'+id+'-ci','h'+id+'-co','h'+id+'-nc');
  _onPriceChange('hoteles-cont','HOTELES');
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
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Traslado ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)">✕</button></div></div>
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
      <div class="money-wrap"><div class="money-cur"><select id="t${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" data-precio type="number" id="t${id}-pr" placeholder="65" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
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
  // Autocomplete aeropuertos para origen/destino (IATA null — son lugares, no solo aeropuertos)
  initAirportAutocomplete('t'+id+'-or',null);
  initAirportAutocomplete('t'+id+'-de',null);
  _populateProvSel('t'+id+'-sel',d.prov||'');
  if(d.tipo) document.getElementById('t'+id+'-tipo').value=d.tipo;
  if(d.vehiculo) document.getElementById('t'+id+'-veh').value=d.vehiculo;
  _onPriceChange('traslados-cont','TRASLADOS');
}

// ═══════════════════════════════════════════
// EXCURSIÓN BLOCK
// ═══════════════════════════════════════════
function addExcursion(d){
  d=d||{};const id=++ec;
  const el=document.createElement('div');el.className='rep';el.id='eb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Excursión ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)">✕</button></div></div>
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
      <div class="money-wrap"><div class="money-cur"><select id="e${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" data-precio type="number" id="e${id}-pr" placeholder="0" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
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
  initCityAutocomplete('e'+id+'-punto');
  _populateProvSel('e'+id+'-sel',d.prov||'');
  _onPriceChange('excursiones-cont','EXCURSIONES');
}

// ═══════════════════════════════════════════
// AUTO BLOCK
// ═══════════════════════════════════════════
let ac_cnt=0;
function addAuto(d){
  d=d||{};const id=++ac_cnt;
  const el=document.createElement('div');el.className='rep';el.id='ab-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Auto ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)">✕</button></div></div>
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
      <input class="money-inp" data-precio type="number" id="au${id}-pr" placeholder="0" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
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
  <div id="au${id}-dur-info" style="font-size:11px;font-weight:700;color:var(--primary);text-align:right;padding:0 4px;margin-top:-6px;min-height:16px"></div>
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
  initCityAutocomplete('au'+id+'-or');
  initCityAutocomplete('au'+id+'-de');
  if(d.categoria) document.getElementById('au'+id+'-cat').value=d.categoria;
  if(d.moneda) document.getElementById('au'+id+'-cur').value=d.moneda;
  _initDurInfo('au'+id+'-fr','au'+id+'-fd','au'+id+'-dur-info','días');
  _onPriceChange('autos-cont','AUTOS');
}

// ═══════════════════════════════════════════
// CRUCERO BLOCK
// ═══════════════════════════════════════════
let crc_cnt=0;
function addCrucero(d){
  d=d||{};const id=++crc_cnt;
  const el=document.createElement('div');el.className='rep';el.id='cb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Crucero ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)">✕</button></div></div>
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
  <div id="cr${id}-dur-info" style="font-size:11px;font-weight:700;color:var(--primary);text-align:right;padding:0 4px;margin-top:-6px;min-height:16px"></div>
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
      <input class="money-inp" data-precio type="number" id="cr${id}-tot" placeholder="Calculado automáticamente" value="${d.precio_total||''}"></div>
    </div>
    <div class="fg"><label class="lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
      <div class="money-wrap"><div class="money-cur"><select id="cr${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
      <input class="money-inp" type="number" id="cr${id}-com" placeholder="0" value="${d.comision||''}"></div>
    </div>
  </div>
  <div class="fg"><label class="lbl">Puertos de escala</label><textarea class="ftxt" id="cr${id}-esc" rows="3" placeholder="Nassau, Bahamas&#10;Cozumel, México&#10;Roatán, Honduras">${d.escalas||''}</textarea></div>
  <div class="fg"><label class="lbl">Notas</label><textarea class="ftxt" id="cr${id}-not" rows="2" placeholder="Incluye propinas · Excursiones opcionales...">${d.notas||''}</textarea></div>`;
  document.getElementById('cruceros-cont').appendChild(el);
  initCityAutocomplete('cr'+id+'-pe');
  initCityAutocomplete('cr'+id+'-pd');
  if(d.cabina) document.getElementById('cr'+id+'-cab').value=d.cabina;
  if(d.regimen) document.getElementById('cr'+id+'-reg').value=d.regimen;
  if(d.moneda) document.getElementById('cr'+id+'-cur').value=d.moneda;
  _initDurInfo('cr'+id+'-fe','cr'+id+'-fd','cr'+id+'-dur-info','noches');
  _onPriceChange('cruceros-cont','CRUCEROS');
}
function calcCruceroTotal(id){
  const pp=parseFloat(document.getElementById('cr'+id+'-pp').value)||0;
  const pax=parseFloat(document.getElementById('cr'+id+'-pax').value)||0;
  if(pp>0&&pax>0) document.getElementById('cr'+id+'-tot').value=pp*pax;
  _onPriceChange('cruceros-cont','CRUCEROS');
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
    const base={mod,aerolinea:gv('v'+i+'-al'),numero:gv('v'+i+'-num'),origen:or,iata_o:gv('v'+i+'-io').toUpperCase(),destino:gv('v'+i+'-de'),iata_d:gv('v'+i+'-id').toUpperCase(),fs:gv('v'+i+'-fs'),hs:gv('v'+i+'-hs'),fl:gv('v'+i+'-fl'),hl:gv('v'+i+'-hl'),escala:gv('v'+i+'-esc'),t_escala:gv('v'+i+'-tesc'),duracion:gv('v'+i+'-dur'),tarifa:gv('v'+i+'-tar'),moneda:gv('v'+i+'-cur'),precio:gn('v'+i+'-pr'),fin:gv('v'+i+'-fin'),equipaje:[...eq,gv('v'+i+'-eq-x')].filter(Boolean).join(' · '),comision:gn('v'+i+'-com'),com_cur:gv('v'+i+'-com-cur'),aerolinea_iata:_getAirlineIata(gv('v'+i+'-al'),gv('v'+i+'-num'))};
    if(mod==='idavuelta'){Object.assign(base,{al2:gv('v'+i+'-al2'),num2:gv('v'+i+'-num2'),or2:gv('v'+i+'-or2'),io2:gv('v'+i+'-io2').toUpperCase(),de2:gv('v'+i+'-de2'),id2:gv('v'+i+'-id2').toUpperCase(),fs2:gv('v'+i+'-fs2'),hs2:gv('v'+i+'-hs2'),fl2:gv('v'+i+'-fl2'),hl2:gv('v'+i+'-hl2'),esc2:gv('v'+i+'-esc2'),tesc2:gv('v'+i+'-tesc2'),dur2:gv('v'+i+'-dur2'),al2_iata:_getAirlineIata(gv('v'+i+'-al2'),gv('v'+i+'-num2'))});}
    base.incluir_en_total=_getIncluir(blk);base.opcion=_getOpcion(blk);
    vuelos.push(base);
  });
  document.querySelectorAll('[id^="hb-"]').forEach(blk=>{
    const i=blk.id.replace('hb-','');const nm=gv('h'+i+'-nm');if(!nm)return;
    const tipo=gv('h'+i+'-tipo');
    const parqs=[...blk.querySelectorAll('#h'+i+'-parques input:checked')].map(x=>pMap[x.value]||x.value);
    const bens=[...blk.querySelectorAll('#h'+i+'-bens input:checked')].map(x=>bMap[x.value]||x.value);
    const am=[...blk.querySelectorAll('#h'+i+'-am input:checked')].map(x=>amMap[x.value]||x.value);
    hoteles.push({nombre:nm,tipo,ciudad:gv('h'+i+'-ciu'),pais:gv('h'+i+'-pai'),estrellas:gv('h'+i+'-est'),ci:fd(gv('h'+i+'-ci')),co:fd(gv('h'+i+'-co')),noches:gn('h'+i+'-nc'),hab:gv('h'+i+'-hab'),regimen:gv('h'+i+'-reg'),moneda:gv('h'+i+'-cur'),precio:gn('h'+i+'-pr'),tickets:gv('h'+i+'-tkt'),dias_tkt:gv('h'+i+'-tktd'),parques:parqs,beneficios:bens,mp:gv('h'+i+'-mp'),mp_cur:gv('h'+i+'-mp-cur'),mp_pr:gn('h'+i+'-mp-pr'),mp_desc:gv('h'+i+'-mp-desc'),notes:gv('h'+i+'-notes'),amenities:am,am_x:gv('h'+i+'-am-x'),comision:gn('h'+i+'-com'),com_cur:gv('h'+i+'-com-cur'),incluir_en_total:_getIncluir(blk),opcion:_getOpcion(blk)});
  });
  document.querySelectorAll('[id^="tb-"]').forEach(blk=>{
    const i=blk.id.replace('tb-','');const or=gv('t'+i+'-or'),de=gv('t'+i+'-de');if(!or&&!de)return;
    traslados.push({tipo:gv('t'+i+'-tipo'),origen:or,destino:de,fecha:fd(gv('t'+i+'-fe')),hora:gv('t'+i+'-ho'),vehiculo:gv('t'+i+'-veh'),moneda:gv('t'+i+'-cur'),precio:gn('t'+i+'-pr'),prov:getProvVal('t'+i),notas:gv('t'+i+'-not'),comision:gn('t'+i+'-com'),com_cur:gv('t'+i+'-com-cur'),incluir_en_total:_getIncluir(blk),opcion:_getOpcion(blk)});
  });
  document.querySelectorAll('[id^="eb-"]').forEach(blk=>{
    const i=blk.id.replace('eb-','');const nm=gv('e'+i+'-nm');if(!nm)return;
    const cat=gv('e'+i+'-cat');
    excursiones.push({nombre:nm,categoria:cat==='otros'?gv('e'+i+'-cat-otros')||'Otros':cat,prov:getProvVal('e'+i),fecha:fd(gv('e'+i+'-fe')),hora:gv('e'+i+'-ho'),dur:gv('e'+i+'-dur'),moneda:gv('e'+i+'-cur'),precio:gn('e'+i+'-pr'),punto:gv('e'+i+'-punto'),inc:gv('e'+i+'-inc'),noinc:gv('e'+i+'-noinc'),desc:gv('e'+i+'-desc'),obs:gv('e'+i+'-obs'),comision:gn('e'+i+'-com'),com_cur:gv('e'+i+'-com-cur'),incluir_en_total:_getIncluir(blk),opcion:_getOpcion(blk)});
  });
  document.querySelectorAll('[id^="ab-"]').forEach(blk=>{
    const i=blk.id.replace('ab-','');const prov=document.getElementById('au'+i+'-prov')?.value||'';
    if(!prov)return;
    autos.push({proveedor:prov,categoria:gv('au'+i+'-cat'),retiro_lugar:gv('au'+i+'-or'),retiro_fecha:fd(gv('au'+i+'-fr')),retiro_hora:gv('au'+i+'-hr'),devolucion_lugar:gv('au'+i+'-de'),devolucion_fecha:fd(gv('au'+i+'-fd')),devolucion_hora:gv('au'+i+'-hd'),conductor_adicional:document.getElementById('au'+i+'-cond')?.checked||false,incluye_seguro:document.getElementById('au'+i+'-seg')?.checked||false,moneda:gv('au'+i+'-cur'),precio:gn('au'+i+'-pr'),notas:gv('au'+i+'-not'),comision:gn('au'+i+'-com'),com_cur:gv('au'+i+'-com-cur'),incluir_en_total:_getIncluir(blk),opcion:_getOpcion(blk)});
  });
  document.querySelectorAll('[id^="cb-"]').forEach(blk=>{
    const i=blk.id.replace('cb-','');const nav=gv('cr'+i+'-nav');
    if(!nav)return;
    cruceros.push({naviera:nav,barco:gv('cr'+i+'-barco'),cabina:gv('cr'+i+'-cab'),regimen:gv('cr'+i+'-reg'),embarque_puerto:gv('cr'+i+'-pe'),embarque_fecha:fd(gv('cr'+i+'-fe')),embarque_hora:gv('cr'+i+'-he'),desembarque_puerto:gv('cr'+i+'-pd'),desembarque_fecha:fd(gv('cr'+i+'-fd')),desembarque_hora:gv('cr'+i+'-hd'),moneda:gv('cr'+i+'-cur'),precio_pp:gn('cr'+i+'-pp'),pasajeros:gn('cr'+i+'-pax'),precio_total:gn('cr'+i+'-tot'),escalas:gv('cr'+i+'-esc'),notas:gv('cr'+i+'-not'),comision:gn('cr'+i+'-com'),com_cur:gv('cr'+i+'-com-cur'),incluir_en_total:_getIncluir(blk),opcion:_getOpcion(blk)});
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

// ══════════════════════════════════════════════════════════════
// COMPONENTES TRANSVERSALES
// C1: Auto-cálculo de noches/días
// C2: Subtotales por sección
// C3: Sistema de opciones A/B/C con checkbox "Incluir en total"
// C4: Total automático en Precios y Condiciones
// ══════════════════════════════════════════════════════════════
const OPCION_LETRAS='ABCDEFGHIJ';

// ── Diferencia en días entre dos fechas ISO (YYYY-MM-DD) ──
function _diffDays(f1,f2){
  if(!f1||!f2)return 0;
  const d=Math.round((new Date(f2)-new Date(f1))/86400000);
  return d>0?d:0;
}

// ── C1: Calcular noches hotel automáticamente al cambiar fechas ──
function _initNochesCalc(f1Id,f2Id,ncId){
  function calc(){
    const f1=document.getElementById(f1Id)?.value;
    const f2=document.getElementById(f2Id)?.value;
    const nc=_diffDays(f1,f2);
    if(nc>0){const el=document.getElementById(ncId);if(el)el.value=nc;}
  }
  const e1=document.getElementById(f1Id),e2=document.getElementById(f2Id);
  if(e1)e1.addEventListener('change',calc);
  if(e2)e2.addEventListener('change',calc);
  calc();// Si ya hay fechas al cargar, calcular de inmediato
}

// ── C1: Mostrar días/noches como texto informativo (autos y cruceros) ──
function _initDurInfo(f1Id,f2Id,infoId,unit){
  function calc(){
    const f1=document.getElementById(f1Id)?.value;
    const f2=document.getElementById(f2Id)?.value;
    const d=_diffDays(f1,f2);
    const el=document.getElementById(infoId);
    if(el)el.textContent=d>0?d+' '+unit:'';
  }
  const e1=document.getElementById(f1Id),e2=document.getElementById(f2Id);
  if(e1)e1.addEventListener('change',calc);
  if(e2)e2.addEventListener('change',calc);
  calc();
}

// ── C3: Actualizar badges de opción en un contenedor ──
function _updateBadges(contId){
  const cont=document.getElementById(contId);
  if(!cont)return;
  [...cont.querySelectorAll('.rep')].forEach((item,idx)=>{
    const badge=item.querySelector('.opcion-badge');
    const cb=item.querySelector('.incluir-en-total');
    const on=!cb||cb.checked;
    if(badge){
      badge.textContent='Opción '+(OPCION_LETRAS[idx]||String(idx+1));
      badge.style.background=on?'rgba(124,58,237,0.12)':'rgba(255,255,255,0.06)';
      badge.style.borderColor=on?'rgba(124,58,237,0.3)':'rgba(255,255,255,0.12)';
      badge.style.color=on?'var(--primary)':'var(--g3)';
    }
    item.style.opacity=on?'':'0.55';
    item.style.transition='opacity .2s';
  });
}

// ── C2: Actualizar subtotal de sección (solo si hay 2+ ítems) ──
function _updateSubtotal(contId,label){
  const cont=document.getElementById(contId);
  if(!cont)return;
  const items=[...cont.querySelectorAll('.rep')];
  const subId='sub-'+contId;
  let sub=document.getElementById(subId);
  if(items.length<2){if(sub)sub.style.display='none';return;}
  let total=0;
  items.forEach(item=>{
    const cb=item.querySelector('.incluir-en-total');
    if(cb&&!cb.checked)return;
    const pi=item.querySelector('[data-precio]');
    if(pi)total+=parseFloat(pi.value)||0;
  });
  if(!sub){
    sub=document.createElement('div');sub.id=subId;
    const nxt=cont.nextElementSibling;
    cont.parentElement.insertBefore(sub,nxt||null);
  }
  sub.style.display='';
  sub.innerHTML=`<div style="display:flex;align-items:center;justify-content:flex-end;padding:8px 16px;margin-bottom:4px;border-top:1px solid var(--border)"><span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--g3);margin-right:12px">SUBTOTAL ${label}</span><span style="font-size:14px;font-weight:700;color:var(--primary)">${total.toLocaleString('es-AR')}</span></div>`;
}

// ── Callback genérico para onchange del checkbox "Incluir en total" ──
function _onIncluirChange(cb){
  const rep=cb.closest('.rep');
  const cont=rep?.closest('[id$="-cont"]');
  if(!cont)return;
  const labels={
    'vuelos-cont':'VUELOS','hoteles-cont':'HOTELES','traslados-cont':'TRASLADOS',
    'excursiones-cont':'EXCURSIONES','autos-cont':'AUTOS','cruceros-cont':'CRUCEROS'
  };
  _onPriceChange(cont.id,labels[cont.id]||'');
}

// ── Callback genérico para oninput de campos de precio ──
function _onItemPriceChange(el){
  const rep=el.closest('.rep');
  const cont=rep?.closest('[id$="-cont"]');
  if(!cont)return;
  const labels={
    'vuelos-cont':'VUELOS','hoteles-cont':'HOTELES','traslados-cont':'TRASLADOS',
    'excursiones-cont':'EXCURSIONES','autos-cont':'AUTOS','cruceros-cont':'CRUCEROS'
  };
  _onPriceChange(cont.id,labels[cont.id]||'');
}

// ── Trigger central: badges + subtotales + total ──
function _onPriceChange(contId,label){
  _updateBadges(contId);
  _updateSubtotal(contId,label);
  _recalcTotal();
}

// ── Función unificada para el botón ✕ ──
function _removeRep(btn){
  const rep=btn.closest('.rep');
  const cont=rep?.closest('[id$="-cont"]');
  const contId=cont?.id;
  rep?.remove();
  if(contId){
    const labels={
      'vuelos-cont':'VUELOS','hoteles-cont':'HOTELES','traslados-cont':'TRASLADOS',
      'excursiones-cont':'EXCURSIONES','autos-cont':'AUTOS','cruceros-cont':'CRUCEROS'
    };
    _onPriceChange(contId,labels[contId]||'');
  }
}

// ── Helpers para collectForm ──
function _getOpcion(blk){
  const b=blk.querySelector('.opcion-badge');
  return b?b.textContent.replace('Opción','').trim():'A';
}
function _getIncluir(blk){
  const cb=blk.querySelector('.incluir-en-total');return cb?cb.checked:true;
}

// ── C4: Suma total de todos los ítems incluidos ──
function _calcAutoTotal(){
  let total=0;
  ['vuelos-cont','hoteles-cont','traslados-cont','excursiones-cont','autos-cont','cruceros-cont'].forEach(cid=>{
    const c=document.getElementById(cid);if(!c)return;
    c.querySelectorAll('.rep').forEach(item=>{
      const cb=item.querySelector('.incluir-en-total');
      if(cb&&!cb.checked)return;
      const pi=item.querySelector('[data-precio]');
      if(pi)total+=parseFloat(pi.value)||0;
    });
  });
  // Seguro (campo fuera de .rep)
  const seg=document.getElementById('seg-precio');if(seg)total+=parseFloat(seg.value)||0;
  return total;
}

// ── C4: Variables de modo AUTO/MANUAL ──
let _totalIsAuto=true,_ppIsAuto=true;

function _recalcTotal(){
  if(!_totalIsAuto)return;
  const field=document.getElementById('p-tot');
  if(field){
    const t=_calcAutoTotal();
    field.value=t>0?t:'';
  }
  _recalcPP();
}

function _recalcPP(){
  if(!_ppIsAuto)return;
  const tot=parseFloat(document.getElementById('p-tot')?.value)||0;
  const a=parseInt(gv('m-adu'))||0,n=parseInt(gv('m-nin'))||0,inf=parseInt(gv('m-inf'))||0;
  const pax=Math.max(a+n+inf,1);
  const field=document.getElementById('p-pp');
  if(field)field.value=tot>0?Math.round(tot/pax):'';
}

function recalcularTotal(){
  _totalIsAuto=true;
  _setChip('p-tot-chip','p-tot-reset',true);
  _recalcTotal();
}

function recalcularPP(){
  _ppIsAuto=true;
  _setChip('p-pp-chip','p-pp-reset',true);
  _recalcPP();
}

// ── C4: Cambiar chip AUTO ↔ MANUAL ──
function _setChip(chipId,resetId,isAuto){
  const chip=document.getElementById(chipId);const reset=document.getElementById(resetId);
  if(chip){
    chip.textContent=isAuto?'AUTO':'MANUAL';
    chip.style.background=isAuto?'rgba(124,58,237,0.1)':'rgba(255,255,255,0.05)';
    chip.style.borderColor=isAuto?'rgba(124,58,237,0.2)':'var(--border)';
    chip.style.color=isAuto?'var(--primary)':'var(--g3)';
  }
  if(reset)reset.style.display=isAuto?'none':'';
}

// SVG recalcular reutilizable
const _RECAP_SVG=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor:pointer;vertical-align:middle"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;

// ── C4: Inyectar chips AUTO en los labels de p-tot y p-pp ──
function _initAutoTotal(){
  const _patchLabel=(fieldId,chipId,resetId,onManual)=>{
    const fg=document.getElementById(fieldId)?.closest('.fg');
    if(!fg||document.getElementById(chipId))return;
    const lbl=fg.querySelector('.lbl');
    if(lbl){
      lbl.insertAdjacentHTML('beforeend',
        ` <span id="${chipId}" style="font-size:10px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:10px;padding:2px 8px;color:var(--primary);vertical-align:middle">AUTO</span>` +
        ` <span id="${resetId}" style="display:none;cursor:pointer;vertical-align:middle;margin-left:2px" onclick="${onManual==='total'?'recalcularTotal()':'recalcularPP()'}" title="Volver a cálculo automático">${_RECAP_SVG}</span>`
      );
    }
    document.getElementById(fieldId)?.addEventListener('input',function(){
      if(onManual==='total'){_totalIsAuto=false;_setChip(chipId,resetId,false);_recalcPP();}
      else{_ppIsAuto=false;_setChip(chipId,resetId,false);}
    });
  };
  _patchLabel('p-tot','p-tot-chip','p-tot-reset','total');
  _patchLabel('p-pp','p-pp-chip','p-pp-reset','pp');
  // Recalc PP cuando cambian pasajeros
  ['m-adu','m-nin','m-inf'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.addEventListener('input',_recalcPP);
  });
  // Recalc total cuando cambia el seguro
  const seg=document.getElementById('seg-precio');
  if(seg)seg.addEventListener('input',_recalcTotal);
}
