// ═══════════════════════════════════════════
// AUTOCOMPLETE — AEROPUERTOS Y CIUDADES
// ═══════════════════════════════════════════
let airportsList=[];
let citiesList=[];
window._hFotos={}; // fotos de galería por bloque hotel: {'hb-1':[{url,label},...], ...}
fetch('data/airports.json').then(r=>r.json()).then(d=>{airportsList=d;}).catch(()=>{});
fetch('data/cities.json').then(r=>r.json()).then(d=>{citiesList=d;_initStaticCityAC();}).catch(()=>{});
// Mapa aerolínea→IATA y lista completa para autocomplete (carga asíncrona silenciosa)
(async()=>{try{if(typeof sb!=='undefined'){const{data}=await sb.from('aerolineas').select('nombre,codigo_iata');if(data){window.aerolineasMap=Object.fromEntries(data.filter(a=>a.codigo_iata).map(a=>[a.nombre.toLowerCase(),a.codigo_iata.toUpperCase()]));window.aerolineasList=data.filter(a=>a.nombre).map(a=>({nombre:a.nombre,codigo_iata:(a.codigo_iata||'').toUpperCase()}));}}}catch(e){}})();

// Convierte DD/MM/YYYY o YYYY-MM-DD a YYYY-MM-DD (para inputs type=date)
// Las fechas se almacenan como DD/MM/YYYY en datos JSONB (via fd()), pero
// los inputs type=date solo aceptan YYYY-MM-DD.
function _toDateInput(s){if(!s)return'';if(s.includes('-'))return s;const[d,m,y]=s.split('/');return(y&&m&&d)?`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`:''}

// ── Estilos compartidos del dropdown ──
// Fondo siempre oscuro — en light-mode var(--ink2) se redefine como blanco y haría ilegible el texto
const AC_DROP_CSS='position:absolute;z-index:9999;left:0;right:0;top:100%;background:#0D2420;border:1px solid rgba(27,158,143,0.3);border-radius:10px;box-shadow:0 8px 24px rgba(27,158,143,0.18);max-height:260px;overflow-y:auto;display:none;';
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
      return `<div style="${AC_ITEM_BASE}" onmouseover="this.style.background='rgba(27,158,143,0.12)'" onmouseout="this.style.background=''" onmousedown="event.preventDefault();_selAirport('${inputCiudadId}','${inputIataId||''}','${safe_iata}','${safe_label}')"><span style="font-size:11px;font-weight:800;color:#0BC5B8;min-width:38px;font-family:'DM Mono',monospace;letter-spacing:.05em">${a.iata}</span><span style="font-size:12px;color:rgba(255,255,255,.9);flex:1;line-height:1.3">${a.city}<span style="display:block;font-size:10px;color:rgba(255,255,255,.4);margin-top:1px">${a.name} · ${a.country}</span></span></div>`;
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
      return `<div style="${AC_ITEM_BASE}" onmouseover="this.style.background='rgba(27,158,143,0.12)'" onmouseout="this.style.background=''" onmousedown="event.preventDefault();_selCity('${inputId}','${safe}')"><span style="font-size:12px;color:rgba(255,255,255,.9);flex:1;line-height:1.3">${label}${sub}</span></div>`;
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

// ── Fetch de proveedores para selects ──
(async()=>{try{if(typeof sb!=='undefined'){const{data}=await sb.from('proveedores').select('nombre,tipo,tipos,ciudad,comision,comision_tipo,notas');if(data){window.provsList=data.filter(p=>p.nombre).map(p=>({nombre:p.nombre,tipo:p.tipo||'',tipos:p.tipos||[p.tipo||'otro'],ciudad:p.ciudad||'',comision:p.comision||null,comision_tipo:p.comision_tipo||'porcentaje',notas:p.notas||''}));
document.querySelectorAll('.prov-sel').forEach(sel=>{_populateProvSel(sel.id,sel.getAttribute('data-val')||'',sel.getAttribute('data-filter')||'');});
// Poblar seg-nm con proveedores de tipo seguro O asistencia (no usan clase prov-sel)
const _segSel=document.getElementById('seg-nm');
if(_segSel){const _segs=(window.provsList||[]).filter(p=>(p.tipos||[p.tipo||'']).some(t=>t==='seguro'||t==='asistencia'));_segSel.innerHTML='<option value="">— Elegir aseguradora —</option>';_segs.forEach(p=>{const o=document.createElement('option');o.value=p.nombre;o.textContent=p.nombre+(p.ciudad?' ('+p.ciudad+')':'');_segSel.appendChild(o);});}}}}catch(e){console.warn('[provs]',e);}})();

// Poblar un select de proveedor — filterType filtra por tipo de servicio
function _populateProvSel(selId,savedVal,filterType){
  const sel=document.getElementById(selId);
  if(!sel)return;
  const all=window.provsList||[];
  const list=filterType?all.filter(p=>(p.tipos||[p.tipo]).includes(filterType)):all;
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
  _initDestCards();
  // Rebuild itinerary when travel dates change
  ['m-sal','m-reg'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change',()=>{
      if(!document.getElementById('itinerario-card')?.classList.contains('collapsed'))_buildItinerario();
    });
  });
  // Auto-build when itinerary section is first expanded
  document.getElementById('iti-sec-hd')?.addEventListener('click',()=>{
    setTimeout(()=>{
      if(!document.getElementById('itinerario-card')?.classList.contains('collapsed')){
        const cont=document.getElementById('itinerario-cont');
        if(cont&&!cont.querySelector('table'))_buildItinerario();
      }
    },60);
  });
});

// ── Franja de destinos populares ──
const _DEST_LIST=[
  {nm:'Orlando',    grad:'linear-gradient(135deg,#0EA5E9,#1565C0)', img:'https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=200&q=60'},
  {nm:'Miami',      grad:'linear-gradient(135deg,#F43F5E,#E11D48)', img:'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=200&q=60'},
  {nm:'Nueva York', grad:'linear-gradient(135deg,#1B9E8F,#0BC5B8)', img:'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200&q=60'},
  {nm:'Las Vegas',  grad:'linear-gradient(135deg,#F43F5E,#B91C1C)', img:'https://images.unsplash.com/photo-1605833556294-ea5c2a5e4b35?w=200&q=60'},
  {nm:'Cancún',     grad:'linear-gradient(135deg,#06B6D4,#0891B2)', img:'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=200&q=60'},
  {nm:'París',      grad:'linear-gradient(135deg,#D4A017,#B7791F)', img:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200&q=60'},
  {nm:'España',     grad:'linear-gradient(135deg,#E8826A,#C2185B)', img:'https://images.unsplash.com/photo-1543785734-4b6e564642f8?w=200&q=60'},
  {nm:'Roma',       grad:'linear-gradient(135deg,#FF8E53,#E65100)', img:'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=200&q=60'},
  {nm:'Dubai',      grad:'linear-gradient(135deg,#F59E0B,#B45309)', img:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=200&q=60'},
  {nm:'Río',        grad:'linear-gradient(135deg,#43A047,#1B5E20)', img:'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=200&q=60'},
];

function _initDestCards(){
  // Inyectar en pantalla Inicio (NO en el formulario)
  const strip=document.getElementById('inicio-dest-strip');
  if(!strip) return;
  if(strip.children.length>0) return; // ya inicializado
  strip.innerHTML=_DEST_LIST.map(d=>`
    <button class="dest-card" onclick="_selectDest('${d.nm.replace(/'/g,"\\'")}')">
      <img class="dest-card-img" src="${d.img}" alt="${d.nm}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <svg class="dest-card-grad" style="display:none" viewBox="0 0 90 64" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="64" fill="url(#g${d.nm.replace(/\s/g,'')})" /><defs><linearGradient id="g${d.nm.replace(/\s/g,'')}" x1="0%" y1="0%" x2="100%" y2="100%">${_gradStops(d.grad)}</linearGradient></defs></svg>
      <span class="dest-card-lbl">${d.nm}</span>
    </button>
  `).join('');
}

function _gradStops(grad){
  const m=grad.match(/#[0-9A-Fa-f]{6}/g)||['#1B9E8F','#0BC5B8'];
  return `<stop offset="0%" stop-color="${m[0]}"/><stop offset="100%" stop-color="${m[m.length-1]}"/>`;
}

function _selectDest(nm){
  // Mapa IATA por destino
  const IATA={
    'Orlando':'MCO','Miami':'MIA','Nueva York':'JFK',
    'Las Vegas':'LAS','Cancún':'CUN','París':'CDG',
    'España':'MAD','Roma':'FCO','Dubai':'DXB','Río':'GIG'
  };
  // Mapa ciudad para hotel/traslado
  const CIUDAD={
    'Orlando':'Orlando','Miami':'Miami','Nueva York':'Nueva York',
    'Las Vegas':'Las Vegas','Cancún':'Cancún','París':'París',
    'España':'Madrid','Roma':'Roma','Dubai':'Dubai','Río':'Río de Janeiro'
  };
  const PAISES={
    'Orlando':'Estados Unidos','Miami':'Estados Unidos','Nueva York':'Estados Unidos',
    'Las Vegas':'Estados Unidos','Cancún':'México','París':'Francia','España':'España',
    'Roma':'Italia','Dubai':'Emiratos Árabes Unidos','Río':'Brasil'
  };

  // Rellenar campo destino principal
  const dest=document.getElementById('m-dest');
  if(dest&&!dest.value) dest.value=nm;

  // Rellenar país
  const pais=document.getElementById('m-pais');
  if(pais&&!pais.value&&PAISES[nm]) pais.value=PAISES[nm];

  // Rellenar ciudad destino del primer vuelo (v1-de e v1-id)
  const iata=IATA[nm];
  const ciudad=CIUDAD[nm]||nm;
  if(iata){
    const vDe=document.getElementById('v1-de');
    const vId=document.getElementById('v1-id');
    if(vDe&&!vDe.value){ vDe.value=ciudad+' ('+iata+')'; }
    if(vId&&!vId.value){ vId.value=iata; }
  }

  // Rellenar ciudad y país del primer hotel (h1-ciu, h1-pai)
  const hCiu=document.getElementById('h1-ciu');
  const hPai=document.getElementById('h1-pai');
  if(hCiu&&!hCiu.value&&ciudad) hCiu.value=ciudad;
  if(hPai&&!hPai.value&&PAISES[nm]) hPai.value=PAISES[nm];
  // Navegar al formulario
  if(typeof switchTab==='function') switchTab('form');
}

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
      return `<div style="${AC_ITEM_BASE}" onmouseover="this.style.background='rgba(27,158,143,0.12)'" onmouseout="this.style.background=''" onmousedown="event.preventDefault();_selAirline('${inputId}','${logoId}','${safe_n}','${iata}')">${logo}<span style="font-size:12px;color:rgba(255,255,255,.9);flex:1;line-height:1.3">${a.nombre}</span><span style="font-size:10px;color:#0BC5B8;font-family:'DM Mono',monospace;letter-spacing:.05em;flex-shrink:0">${iata}</span></div>`;
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
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Vuelo ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(27,158,143,0.1);border:1px solid rgba(27,158,143,0.25);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)" aria-label="Eliminar">✕</button></div></div>
  <div class="g3" style="margin-bottom:4px">
    <div class="fg"><label class="lbl" for="v${id}-mod">Modalidad</label>
      <select class="fsel" id="v${id}-mod" onchange="toggleRet(${id})">
        <option value="simple">Tramo único</option>
        <option value="idavuelta">Ida y vuelta (precio combinado)</option>
        <option value="interno">Vuelo interno</option>
      </select></div>
    <div class="fg"><label class="lbl" for="v${id}-al">Aerolínea IDA</label>
      <div style="position:relative">
        <img id="v${id}-al-logo" src="" width="24" height="24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);object-fit:contain;display:none;border-radius:3px;pointer-events:none;z-index:1" onerror="this.style.display='none'">
        <input class="finput" type="text" id="v${id}-al" placeholder="American Airlines" value="${d.aerolinea||''}">
      </div>
    </div>
    <div class="fg"><label class="lbl" for="v${id}-num">N° vuelo IDA</label><input class="finput" type="text" id="v${id}-num" placeholder="AA 930" value="${d.numero||''}"></div>
  </div>
  <div style="background:var(--g1);border-radius:var(--rs);padding:14px;margin-bottom:12px">
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g4);margin-bottom:12px">TRAMO IDA</div>
    <div class="g4">
      <div class="fg"><label class="lbl" for="v${id}-or">Ciudad origen</label><input class="finput" type="text" id="v${id}-or" placeholder="Buenos Aires (EZE)" value="${d.origen||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-io">IATA</label><input class="finput" type="text" id="v${id}-io" placeholder="EZE" maxlength="3" style="text-transform:uppercase" value="${d.iata_o||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-fs">Fecha salida</label><input class="finput" type="date" id="v${id}-fs" value="${d.fs||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-hs">Hora salida</label><input class="finput" type="time" id="v${id}-hs" value="${d.hs||''}"></div>
    </div>
    <div class="g4">
      <div class="fg"><label class="lbl" for="v${id}-de">Ciudad destino</label><input class="finput" type="text" id="v${id}-de" placeholder="Orlando (MCO)" value="${d.destino||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-id">IATA</label><input class="finput" type="text" id="v${id}-id" placeholder="MCO" maxlength="3" style="text-transform:uppercase" value="${d.iata_d||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-fl">Fecha llegada</label><input class="finput" type="date" id="v${id}-fl" value="${d.fl||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-hl">Hora llegada</label><input class="finput" type="time" id="v${id}-hl" value="${d.hl||''}"></div>
    </div>
    <div class="g3">
      <div class="fg"><label class="lbl" for="v${id}-esc">Escala (ciudad)</label><input class="finput" type="text" id="v${id}-esc" placeholder="Miami (MIA) — vacío si directo" value="${d.escala||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-tesc">Tiempo escala</label><input class="finput" type="text" id="v${id}-tesc" placeholder="2h 5min" value="${d.t_escala||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-dur">Duración total</label><input class="finput" type="text" id="v${id}-dur" placeholder="17h 19min" value="${d.duracion||''}"></div>
    </div>
  </div>
  <div id="v${id}-ret-sec" style="display:none;background:rgba(27,158,143,0.06);border:1px solid rgba(27,158,143,0.2);border-radius:var(--rs);padding:14px;margin-bottom:12px">
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--primary3);margin-bottom:12px">↩ TRAMO VUELTA</div>
    <div class="g3">
      <div class="fg"><label class="lbl" for="v${id}-al2">Aerolínea vuelta</label>
        <div style="position:relative">
          <img id="v${id}-al2-logo" src="" width="24" height="24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);object-fit:contain;display:none;border-radius:3px;pointer-events:none;z-index:1" onerror="this.style.display='none'">
          <input class="finput" type="text" id="v${id}-al2" placeholder="Avianca" value="${d.al2||''}">
        </div>
      </div>
      <div class="fg"><label class="lbl" for="v${id}-num2">N° vuelo vuelta</label><input class="finput" type="text" id="v${id}-num2" placeholder="AV 123" value="${d.num2||''}"></div>
      <div class="fg"></div>
    </div>
    <div class="g4">
      <div class="fg"><label class="lbl" for="v${id}-or2">Origen vuelta</label><input class="finput" type="text" id="v${id}-or2" placeholder="Orlando (MCO)" value="${d.or2||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-io2">IATA</label><input class="finput" type="text" id="v${id}-io2" placeholder="MCO" maxlength="3" style="text-transform:uppercase" value="${d.io2||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-fs2">Fecha salida</label><input class="finput" type="date" id="v${id}-fs2" value="${d.fs2||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-hs2">Hora salida</label><input class="finput" type="time" id="v${id}-hs2" value="${d.hs2||''}"></div>
    </div>
    <div class="g4">
      <div class="fg"><label class="lbl" for="v${id}-de2">Destino vuelta</label><input class="finput" type="text" id="v${id}-de2" placeholder="Buenos Aires (EZE)" value="${d.de2||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-id2">IATA</label><input class="finput" type="text" id="v${id}-id2" placeholder="EZE" maxlength="3" style="text-transform:uppercase" value="${d.id2||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-fl2">Fecha llegada</label><input class="finput" type="date" id="v${id}-fl2" value="${d.fl2||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-hl2">Hora llegada</label><input class="finput" type="time" id="v${id}-hl2" value="${d.hl2||''}"></div>
    </div>
    <div class="g3">
      <div class="fg"><label class="lbl" for="v${id}-esc2">Escala vuelta</label><input class="finput" type="text" id="v${id}-esc2" placeholder="Bogotá (BOG)" value="${d.esc2||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-tesc2">Tiempo escala</label><input class="finput" type="text" id="v${id}-tesc2" placeholder="2h" value="${d.tesc2||''}"></div>
      <div class="fg"><label class="lbl" for="v${id}-dur2">Duración total</label><input class="finput" type="text" id="v${id}-dur2" placeholder="14h 30min" value="${d.dur2||''}"></div>
    </div>
  </div>
  <div class="g3">
    <div class="fg"><label class="lbl" for="v${id}-tar">Tarifa / Clase</label>
      <select class="fsel" id="v${id}-tar"><option>Economy Basic</option><option>Economy</option><option>Economy Flex</option><option>Premium Economy</option><option>Business</option><option>First Class</option></select></div>
    <div class="fg"><label class="lbl" for="v${id}-pr">Precio</label>
      <div class="money-wrap"><div class="money-cur"><select id="v${id}-cur"><option>USD</option><option>ARS</option></select></div>
      <input class="money-inp" data-precio type="number" inputmode="decimal" id="v${id}-pr" placeholder="1985" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
    </div>
    <div class="fg"><label class="lbl" for="v${id}-fin">Financiación</label><input class="finput" type="text" id="v${id}-fin" placeholder="Contado / cuotas" value="${d.fin||''}"></div>
  </div>
  <div class="fg"><label class="lbl" for="v${id}-eq-x">Equipaje</label>
    <div class="chk-grp" id="v${id}-eq">${[['b','Bolso personal'],['c','Carry-on'],['v23','Valija 23kg'],['v32','Valija 32kg'],['2v','2 valijas']].map(([v,l])=>`<div class="chk" onclick="tglChk(this)"><input type="checkbox" value="${v}"><span class="chk-dot"></span>${l}</div>`).join('')}</div>
    <input class="finput" type="text" id="v${id}-eq-x" placeholder="Detalle adicional..." style="margin-top:8px" value="${d.eq_x||''}">
  </div>
  <div class="fg"><label class="lbl" for="v${id}-com"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
    <div class="money-wrap"><div class="money-cur"><select id="v${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
    <input class="money-inp" type="number" inputmode="decimal" id="v${id}-com" placeholder="0" value="${d.comision||''}"></div>
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
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Hotel ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(27,158,143,0.1);border:1px solid rgba(27,158,143,0.25);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)" aria-label="Eliminar">✕</button></div></div>
  <div class="g3">
    <div class="fg full"><label class="lbl" for="h${id}-nm">Nombre</label><input class="finput" type="text" id="h${id}-nm" placeholder="Disney's All-Star Sports Resort" value="${d.nombre||''}"></div>
    <div class="fg"><label class="lbl" for="h${id}-tipo">Tipo</label><select class="fsel" id="h${id}-tipo" onchange="onHotelType(${id})"><option value="regular">Hotel regular</option><option value="disney">Hotel Disney</option><option value="universal">Hotel Universal</option><option value="airbnb">Airbnb / Apart.</option><option value="crucero">Crucero</option></select></div>
    <div class="fg"><label class="lbl" for="h${id}-est">Estrellas</label><select class="fsel" id="h${id}-est"><option value="">—</option><option value="3">3★</option><option value="4">4★</option><option value="5">5★</option></select></div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl" for="h${id}-ciu">Ciudad</label><input class="finput" type="text" id="h${id}-ciu" placeholder="Orlando" value="${d.ciudad||''}"></div>
    <div class="fg"><label class="lbl" for="h${id}-pai">País</label><input class="finput" type="text" id="h${id}-pai" placeholder="Estados Unidos" value="${d.pais||''}"></div>
  </div>
  <div class="g4">
    <div class="fg"><label class="lbl" for="h${id}-ci">Check-in</label><input class="finput" type="date" id="h${id}-ci" value="${_toDateInput(d.ci)}"></div>
    <div class="fg"><label class="lbl" for="h${id}-co">Check-out</label><input class="finput" type="date" id="h${id}-co" value="${_toDateInput(d.co)}"></div>
    <div class="fg"><label class="lbl" for="h${id}-nc">Noches</label><input class="finput" type="number" inputmode="numeric" id="h${id}-nc" placeholder="7" value="${d.noches||''}"></div>
    <div class="fg"><label class="lbl" for="h${id}-pr">Precio base</label>
      <div class="money-wrap"><div class="money-cur"><select id="h${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" data-precio type="number" inputmode="decimal" id="h${id}-pr" placeholder="2717" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
    </div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl" for="h${id}-hab">Habitación</label><input class="finput" type="text" id="h${id}-hab" placeholder="Standard Room (4 personas)" value="${d.hab||''}"></div>
    <div class="fg"><label class="lbl" for="h${id}-reg">Régimen</label><select class="fsel" id="h${id}-reg"><option value="">Sin especificar</option><option>Sin desayuno</option><option>Desayuno incluido</option><option>Media pensión</option><option>Pensión completa</option><option>Todo Incluido</option><option>Ultra Todo Incluido</option></select></div>
  </div>
  <div id="h${id}-pk" style="${isD||isU?'':'display:none'}">
    <div class="disney-sec">
      <div class="disney-badge" id="h${id}-badge">${isU?'Paquete Universal':'Paquete Disney'}</div>
      <div class="g2">
        <div class="fg"><label class="lbl" for="h${id}-tkt">Tickets incluidos</label><input class="finput" type="text" id="h${id}-tkt" placeholder="4 Park Magic Ticket" value="${d.tickets||''}"></div>
        <div class="fg"><label class="lbl" for="h${id}-tktd">Días tickets</label><input class="finput" type="number" inputmode="numeric" id="h${id}-tktd" placeholder="4" value="${d.dias_tkt||''}"></div>
      </div>
      <div class="fg"><label class="lbl">Parques</label>
        <div class="chk-grp" id="h${id}-parques">${[['mk','Magic Kingdom'],['ep','EPCOT'],['ak','Animal Kingdom'],['hs','Hollywood Studios'],['us','Universal Studios'],['ia','Islands of Adventure'],['eu','Epic Universe'],['vb','Volcano Bay']].map(([v,l])=>`<div class="chk" onclick="tglChk(this)"><input type="checkbox" value="${v}"><span class="chk-dot"></span>${l}</div>`).join('')}</div>
      </div>
      <div class="fg"><label class="lbl">Beneficios</label>
        <div class="chk-grp" id="h${id}-bens">${[['ep','Early Park Entry'],['tr','Transporte gratuito'],['mm','Memory Maker'],['dl','Entrega en hotel'],['ex','Express Pass'],['sp','Disney Springs'],['wp','Parque acuático gratis'],['me','Magical Extras']].map(([v,l])=>`<div class="chk" onclick="tglChk(this)"><input type="checkbox" value="${v}"><span class="chk-dot"></span>${l}</div>`).join('')}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--rs);padding:12px 14px;margin-top:8px;border:1px solid rgba(27,158,143,0.18)">
        <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--primary3);margin-bottom:10px">Plan de comidas</div>
        <div class="g3">
          <div class="fg"><label class="lbl" for="h${id}-mp">Plan</label><select class="fsel" id="h${id}-mp"><option value="">Sin plan</option><option>Quick Service Dining Plan</option><option>Disney Dining Plan</option><option>Deluxe Dining Plan</option></select></div>
          <div class="fg"><label class="lbl" for="h${id}-mp-pr">Precio con plan</label>
            <div class="money-wrap"><div class="money-cur"><select id="h${id}-mp-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" type="number" inputmode="decimal" id="h${id}-mp-pr" placeholder="3439" value="${d.mp_pr||''}"></div>
          </div>
          <div class="fg full"><label class="lbl" for="h${id}-mp-desc">Descripción del plan</label>
            <textarea class="ftxt" id="h${id}-mp-desc" rows="4" placeholder="Este plan aporta:&#10;• Comodidad total&#10;• Sin pagos en restaurantes&#10;• Abonas en CUOTAS">${d.mp_desc||''}</textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="fg"><label class="lbl" for="h${id}-notes">Notas / opcionales</label>
    <textarea class="ftxt" id="h${id}-notes" rows="3" placeholder="Opcionales especiales, notas para el cliente..." value="">${d.notes||''}</textarea>
  </div>
  <div class="fg"><label class="lbl" for="h${id}-am-x">Amenities</label>
    <div class="chk-grp" id="h${id}-am">${[['wifi','WiFi'],['pool','Piscina'],['gym','Gimnasio'],['spa','Spa'],['bkf','Desayuno buffet'],['rest','Restaurante'],['bar','Bar'],['beach','Playa'],['park','Estacionamiento'],['kids','Área infantil']].map(([v,l])=>`<div class="chk" onclick="tglChk(this)"><input type="checkbox" value="${v}"><span class="chk-dot"></span>${l}</div>`).join('')}</div>
    <input class="finput" type="text" id="h${id}-am-x" placeholder="Otros amenities..." style="margin-top:8px" value="${d.am_x||''}">
  </div>
  <div class="fg"><label class="lbl" for="h${id}-foto">Foto del hotel (URL opcional)</label><input class="finput" type="url" id="h${id}-foto" placeholder="https://..." value="${d.foto_url||''}"></div>
  <div class="fg"><label class="lbl" for="h${id}-com"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
    <div class="money-wrap"><div class="money-cur"><select id="h${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
    <input class="money-inp" type="number" inputmode="decimal" id="h${id}-com" placeholder="0" value="${d.comision||''}"></div>
  </div>
  <div class="fg">
    <label class="lbl">Fotos de galería</label>
    <div id="h${id}-fotos-strip" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px"></div>
    <input type="file" id="h${id}-fotos-inp" accept="image/*" multiple style="display:none" onchange="_addHotelFotos(${id},this)">
    <button type="button" class="btn btn-out btn-sm" onclick="document.getElementById('h${id}-fotos-inp').click()">+ Agregar fotos</button>
  </div>`;
  window._hFotos['hb-'+id]=Array.isArray(d.fotos)?d.fotos.slice():[];
  document.getElementById('hoteles-cont').appendChild(el);
  _renderHotelFotoStrip(id);
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
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Traslado ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(27,158,143,0.1);border:1px solid rgba(27,158,143,0.25);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)" aria-label="Eliminar">✕</button></div></div>
  <div class="g3">
    <div class="fg"><label class="lbl" for="t${id}-tipo">Tipo</label><select class="fsel" id="t${id}-tipo"><option value="in">Aeropuerto → Hotel</option><option value="out">Hotel → Aeropuerto</option><option value="hoteles">Entre hoteles</option><option value="privado">Privado en destino</option><option value="ciudad">A otra ciudad</option></select></div>
    <div class="fg"><label class="lbl" for="t${id}-or">Origen</label><input class="finput" type="text" id="t${id}-or" placeholder="Aeropuerto MCO" value="${d.origen||''}"></div>
    <div class="fg"><label class="lbl" for="t${id}-de">Destino</label><input class="finput" type="text" id="t${id}-de" placeholder="Disney All-Star Sports" value="${d.destino||''}"></div>
  </div>
  <div class="g4">
    <div class="fg"><label class="lbl" for="t${id}-fe">Fecha</label><input class="finput" type="date" id="t${id}-fe" value="${_toDateInput(d.fecha)}"></div>
    <div class="fg"><label class="lbl" for="t${id}-ho">Hora recogida</label><input class="finput" type="time" id="t${id}-ho" value="${d.hora||''}"></div>
    <div class="fg"><label class="lbl" for="t${id}-veh">Vehículo</label><select class="fsel" id="t${id}-veh"><option>Van privada</option><option>Auto privado</option><option>Minibús</option><option>Shuttle compartido</option></select></div>
    <div class="fg"><label class="lbl" for="t${id}-pr">Precio</label>
      <div class="money-wrap"><div class="money-cur"><select id="t${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" data-precio type="number" inputmode="decimal" id="t${id}-pr" placeholder="65" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
    </div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl" for="t${id}-sel">Proveedor</label>
      <select class="fsel prov-sel" id="t${id}-sel" onchange="onProvSel('t${id}-sel')" data-val=""><option value="">— Elegir proveedor —</option></select>
      <input class="finput" type="text" id="t${id}-inp" placeholder="Nombre del proveedor" style="display:none;margin-top:6px" value="">
    </div>
    <div class="fg"><label class="lbl" for="t${id}-not">Notas</label><input class="finput" type="text" id="t${id}-not" placeholder="Se abona en efectivo al finalizar" value="${d.notas||''}"></div>
  </div>
  <div class="fg"><label class="lbl" for="t${id}-com"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
    <div class="money-wrap"><div class="money-cur"><select id="t${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
    <input class="money-inp" type="number" inputmode="decimal" id="t${id}-com" placeholder="0" value="${d.comision||''}"></div>
  </div>`;
  document.getElementById('traslados-cont').appendChild(el);
  // Autocomplete aeropuertos para origen/destino (IATA null — son lugares, no solo aeropuertos)
  initAirportAutocomplete('t'+id+'-or',null);
  initAirportAutocomplete('t'+id+'-de',null);
  _populateProvSel('t'+id+'-sel',d.prov||'','traslado');
  if(d.tipo) document.getElementById('t'+id+'-tipo').value=d.tipo;
  if(d.vehiculo) document.getElementById('t'+id+'-veh').value=d.vehiculo;
  if(d.comision_moneda){const cm=document.getElementById('t'+id+'-com-cur');if(cm)cm.value=d.comision_moneda;}
  _onPriceChange('traslados-cont','TRASLADOS');
}

// ═══════════════════════════════════════════
// EXCURSIÓN BLOCK
// ═══════════════════════════════════════════
function addExcursion(d){
  d=d||{};const id=++ec;
  const el=document.createElement('div');el.className='rep';el.id='eb-'+id;
  el.innerHTML=`
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Excursión ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(27,158,143,0.1);border:1px solid rgba(27,158,143,0.25);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)" aria-label="Eliminar">✕</button></div></div>
  <div class="g2">
    <div class="fg full"><label class="lbl" for="e${id}-nm">Nombre</label><input class="finput" type="text" id="e${id}-nm" placeholder="Excursión a Chichén Itzá" value="${d.nombre||''}"></div>
    <div class="fg"><label class="lbl" for="e${id}-cat">Categoría</label><select class="fsel" id="e${id}-cat" onchange="onExcCat(${id},this.value)"><option>Excursión guiada</option><option>Parque temático</option><option>Tour en barco</option><option>Actividad acuática</option><option>Tour cultural</option><option>Show / Espectáculo</option><option>Evento especial</option><option>Actividad de aventura</option><option value="otros">Otros</option></select></div>
    <div class="fg" id="e${id}-cat-otros-wrap" style="display:none"><label class="lbl" for="e${id}-cat-otros">Título personalizado</label><input class="finput" type="text" id="e${id}-cat-otros" placeholder="Ej: Ticket de entrada, City Tour..." value="${d.cat_otros||''}"></div>
    <div class="fg"><label class="lbl" for="e${id}-sel">Proveedor</label>
      <select class="fsel prov-sel" id="e${id}-sel" onchange="onProvSel('e${id}-sel')" data-val=""><option value="">— Elegir proveedor —</option></select>
      <input class="finput" type="text" id="e${id}-inp" placeholder="Nombre del proveedor" style="display:none;margin-top:6px" value="">
    </div>
  </div>
  <div class="g4">
    <div class="fg"><label class="lbl" for="e${id}-fe">Fecha</label><input class="finput" type="date" id="e${id}-fe" value="${_toDateInput(d.fecha)}"></div>
    <div class="fg"><label class="lbl" for="e${id}-ho">Hora</label><input class="finput" type="time" id="e${id}-ho" value="${d.hora||''}"></div>
    <div class="fg"><label class="lbl" for="e${id}-dur">Duración</label><input class="finput" type="text" id="e${id}-dur" placeholder="12-13 horas" value="${d.dur||''}"></div>
    <div class="fg"><label class="lbl" for="e${id}-pr">Precio total</label>
      <div class="money-wrap"><div class="money-cur"><select id="e${id}-cur"><option>USD</option><option>ARS</option></select></div><input class="money-inp" data-precio type="number" inputmode="decimal" id="e${id}-pr" placeholder="0" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
    </div>
  </div>
  <div class="fg"><label class="lbl" for="e${id}-punto">Punto de encuentro</label><input class="finput" type="text" id="e${id}-punto" placeholder="Lobby del hotel 7:00 AM" value="${d.punto||''}"></div>
  <div class="g2">
    <div class="fg"><label class="lbl" for="e${id}-inc">¿Qué incluye?</label><textarea class="ftxt" id="e${id}-inc" rows="3" placeholder="Transporte, almuerzo, guía bilingüe...">${d.inc||''}</textarea></div>
    <div class="fg"><label class="lbl" for="e${id}-noinc">¿Qué NO incluye?</label><textarea class="ftxt" id="e${id}-noinc" rows="3" placeholder="Impuesto arqueológico...">${d.noinc||''}</textarea></div>
  </div>
  <div class="fg"><label class="lbl" for="e${id}-desc">Descripción para el cliente</label><textarea class="ftxt" id="e${id}-desc" rows="3" placeholder="Descripción atractiva...">${d.desc||''}</textarea></div>
  <div class="fg"><label class="lbl" for="e${id}-foto">Foto de la excursión (URL opcional)</label><input class="finput" type="url" id="e${id}-foto" placeholder="https://..." value="${d.foto_url||''}"></div>
  <div class="fg"><label class="lbl" for="e${id}-obs">Observaciones</label><input class="finput" type="text" id="e${id}-obs" placeholder="Llevar protector solar · Ropa cómoda" value="${d.obs||''}"></div>
  <div class="fg"><label class="lbl" for="e${id}-com"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
    <div class="money-wrap"><div class="money-cur"><select id="e${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
    <input class="money-inp" type="number" inputmode="decimal" id="e${id}-com" placeholder="0" value="${d.comision||''}"></div>
  </div>`;
  document.getElementById('excursiones-cont').appendChild(el);
  initCityAutocomplete('e'+id+'-punto');
  _populateProvSel('e'+id+'-sel',d.prov||'','excursion');
  if(d.comision_moneda){const cm=document.getElementById('e'+id+'-com-cur');if(cm)cm.value=d.comision_moneda;}
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
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Auto ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(27,158,143,0.1);border:1px solid rgba(27,158,143,0.25);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)" aria-label="Eliminar">✕</button></div></div>
  <div class="g3">
    <div class="fg"><label class="lbl" for="au${id}-prov">Proveedor</label><input class="finput" type="text" id="au${id}-prov" placeholder="Hertz, Avis, Budget..." value="${d.proveedor||''}"></div>
    <div class="fg"><label class="lbl" for="au${id}-cat">Categoría</label>
      <select class="fsel" id="au${id}-cat">
        <option>Económico</option><option>Compacto</option><option>Intermedio</option>
        <option>Full Size</option><option>SUV</option><option>Minivan</option>
        <option>Premium</option><option>Convertible</option>
      </select></div>
    <div class="fg"><label class="lbl" for="au${id}-pr">Precio</label>
      <div class="money-wrap"><div class="money-cur"><select id="au${id}-cur"><option>USD</option><option>ARS</option></select></div>
      <input class="money-inp" data-precio type="number" inputmode="decimal" id="au${id}-pr" placeholder="0" value="${d.precio||''}" oninput="_onItemPriceChange(this)"></div>
    </div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl" for="au${id}-or">Lugar de retiro</label><input class="finput" type="text" id="au${id}-or" placeholder="Aeropuerto MCO Terminal B" value="${d.retiro_lugar||''}"></div>
    <div class="fg"><label class="lbl" for="au${id}-de">Lugar de devolución</label><input class="finput" type="text" id="au${id}-de" placeholder="Mismo lugar" value="${d.devolucion_lugar||''}"></div>
    <div class="fg"><label class="lbl" for="au${id}-fr">Fecha retiro</label><input class="finput" type="date" id="au${id}-fr" value="${_toDateInput(d.retiro_fecha)}"></div>
    <div class="fg"><label class="lbl" for="au${id}-hr">Hora retiro</label><input class="finput" type="time" id="au${id}-hr" value="${d.retiro_hora||''}"></div>
    <div class="fg"><label class="lbl" for="au${id}-fd">Fecha devolución</label><input class="finput" type="date" id="au${id}-fd" value="${_toDateInput(d.devolucion_fecha)}"></div>
    <div class="fg"><label class="lbl" for="au${id}-hd">Hora devolución</label><input class="finput" type="time" id="au${id}-hd" value="${d.devolucion_hora||''}"></div>
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
    <div class="fg"><label class="lbl" for="au${id}-com"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
      <div class="money-wrap"><div class="money-cur"><select id="au${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
      <input class="money-inp" type="number" inputmode="decimal" id="au${id}-com" placeholder="0" value="${d.comision||''}"></div>
    </div>
  </div>
  <div class="fg"><label class="lbl" for="au${id}-not">Notas</label><textarea class="ftxt" id="au${id}-not" rows="2" placeholder="Incluye GPS · Se abona con tarjeta · Sin franquicia">${d.notas||''}</textarea></div>`;
  document.getElementById('autos-cont').appendChild(el);
  initCityAutocomplete('au'+id+'-or');
  initCityAutocomplete('au'+id+'-de');
  if(d.categoria) document.getElementById('au'+id+'-cat').value=d.categoria;
  if(d.moneda) document.getElementById('au'+id+'-cur').value=d.moneda;
  if(d.comision_moneda){const cm=document.getElementById('au'+id+'-com-cur');if(cm)cm.value=d.comision_moneda;}
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
  <div class="rep-hd"><div class="rep-ttl"><span class="rep-n">${id}</span>Crucero ${id}<span class="opcion-badge" style="display:inline-flex;align-items:center;background:rgba(27,158,143,0.1);border:1px solid rgba(27,158,143,0.25);border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:var(--primary);margin-left:8px">?</span></div>
    <div style="display:flex;align-items:center;gap:10px"><label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--g3);white-space:nowrap"><input type="checkbox" class="incluir-en-total" ${d.incluir_en_total===false?'':'checked'} style="accent-color:var(--primary);width:13px;height:13px" onchange="_onIncluirChange(this)"> Incluir en total</label><button class="btn btn-del btn-xs" onclick="_removeRep(this)" aria-label="Eliminar">✕</button></div></div>
  <div class="g3">
    <div class="fg"><label class="lbl" for="cr${id}-nav">Naviera</label><input class="finput" type="text" id="cr${id}-nav" placeholder="MSC, Royal Caribbean, Costa..." value="${d.naviera||''}"></div>
    <div class="fg"><label class="lbl" for="cr${id}-barco">Nombre del barco</label><input class="finput" type="text" id="cr${id}-barco" placeholder="MSC Seashore" value="${d.barco||''}"></div>
    <div class="fg"><label class="lbl" for="cr${id}-cab">Tipo de cabina</label>
      <select class="fsel" id="cr${id}-cab">
        <option>Interior</option><option>Oceanview</option><option>Balcón</option>
        <option>Suite</option><option>Suite Deluxe</option>
      </select></div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl" for="cr${id}-pe">Puerto de embarque</label><input class="finput" type="text" id="cr${id}-pe" placeholder="Miami, FL" value="${d.embarque_puerto||''}"></div>
    <div class="fg"><label class="lbl" for="cr${id}-pd">Puerto de desembarque</label><input class="finput" type="text" id="cr${id}-pd" placeholder="Miami, FL" value="${d.desembarque_puerto||''}"></div>
    <div class="fg"><label class="lbl" for="cr${id}-fe">Fecha embarque</label><input class="finput" type="date" id="cr${id}-fe" value="${_toDateInput(d.embarque_fecha)}"></div>
    <div class="fg"><label class="lbl" for="cr${id}-he">Hora embarque</label><input class="finput" type="time" id="cr${id}-he" value="${d.embarque_hora||''}"></div>
    <div class="fg"><label class="lbl" for="cr${id}-fd">Fecha desembarque</label><input class="finput" type="date" id="cr${id}-fd" value="${_toDateInput(d.desembarque_fecha)}"></div>
    <div class="fg"><label class="lbl" for="cr${id}-hd">Hora desembarque</label><input class="finput" type="time" id="cr${id}-hd" value="${d.desembarque_hora||''}"></div>
  </div>
  <div id="cr${id}-dur-info" style="font-size:11px;font-weight:700;color:var(--primary);text-align:right;padding:0 4px;margin-top:-6px;min-height:16px"></div>
  <div class="g3">
    <div class="fg"><label class="lbl" for="cr${id}-reg">Régimen</label>
      <select class="fsel" id="cr${id}-reg">
        <option>Solo cabina</option><option>Pensión completa</option>
        <option>Todo incluido</option><option>Bebidas incluidas</option>
      </select></div>
    <div class="fg"><label class="lbl" for="cr${id}-pp">Precio por persona</label>
      <div class="money-wrap"><div class="money-cur"><select id="cr${id}-cur"><option>USD</option><option>ARS</option></select></div>
      <input class="money-inp" type="number" inputmode="decimal" id="cr${id}-pp" placeholder="0" value="${d.precio_pp||''}" oninput="calcCruceroTotal(${id})"></div>
    </div>
    <div class="fg"><label class="lbl" for="cr${id}-pax">Pasajeros</label><input class="finput" type="number" inputmode="numeric" id="cr${id}-pax" placeholder="2" value="${d.pasajeros||''}" oninput="calcCruceroTotal(${id})"></div>
  </div>
  <div class="g2">
    <div class="fg"><label class="lbl" for="cr${id}-tot">Precio total</label>
      <div class="money-wrap"><div class="money-cur" style="padding:10px 8px;font-size:.75rem;font-weight:700;color:var(--primary)">TOTAL</div>
      <input class="money-inp" data-precio type="number" inputmode="decimal" id="cr${id}-tot" placeholder="Calculado automáticamente" value="${d.precio_total||''}"></div>
    </div>
    <div class="fg"><label class="lbl" for="cr${id}-com"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Comisión agente</label>
      <div class="money-wrap"><div class="money-cur"><select id="cr${id}-com-cur"><option>USD</option><option>ARS</option><option>%</option></select></div>
      <input class="money-inp" type="number" inputmode="decimal" id="cr${id}-com" placeholder="0" value="${d.comision||''}"></div>
    </div>
  </div>
  <div class="fg"><label class="lbl" for="cr${id}-esc">Puertos de escala</label><textarea class="ftxt" id="cr${id}-esc" rows="3" placeholder="Nassau, Bahamas&#10;Cozumel, México&#10;Roatán, Honduras">${d.escalas||''}</textarea></div>
  <div class="fg"><label class="lbl" for="cr${id}-not">Notas</label><textarea class="ftxt" id="cr${id}-not" rows="2" placeholder="Incluye propinas · Excursiones opcionales...">${d.notas||''}</textarea></div>`;
  document.getElementById('cruceros-cont').appendChild(el);
  initCityAutocomplete('cr'+id+'-pe');
  initCityAutocomplete('cr'+id+'-pd');
  if(d.cabina) document.getElementById('cr'+id+'-cab').value=d.cabina;
  if(d.regimen) document.getElementById('cr'+id+'-reg').value=d.regimen;
  if(d.moneda) document.getElementById('cr'+id+'-cur').value=d.moneda;
  if(d.comision_moneda){const cm=document.getElementById('cr'+id+'-com-cur');if(cm)cm.value=d.comision_moneda;}
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
    hoteles.push({nombre:nm,tipo,ciudad:gv('h'+i+'-ciu'),pais:gv('h'+i+'-pai'),estrellas:gv('h'+i+'-est'),ci:fd(gv('h'+i+'-ci')),co:fd(gv('h'+i+'-co')),noches:gn('h'+i+'-nc'),hab:gv('h'+i+'-hab'),regimen:gv('h'+i+'-reg'),moneda:gv('h'+i+'-cur'),precio:gn('h'+i+'-pr'),tickets:gv('h'+i+'-tkt'),dias_tkt:gv('h'+i+'-tktd'),parques:parqs,beneficios:bens,mp:gv('h'+i+'-mp'),mp_cur:gv('h'+i+'-mp-cur'),mp_pr:gn('h'+i+'-mp-pr'),mp_desc:gv('h'+i+'-mp-desc'),notes:gv('h'+i+'-notes'),amenities:am,am_x:gv('h'+i+'-am-x'),foto_url:gv('h'+i+'-foto'),fotos:window._hFotos['hb-'+i]||[],comision:gn('h'+i+'-com'),com_cur:gv('h'+i+'-com-cur'),incluir_en_total:_getIncluir(blk),opcion:_getOpcion(blk)});
  });
  document.querySelectorAll('[id^="tb-"]').forEach(blk=>{
    const i=blk.id.replace('tb-','');const or=gv('t'+i+'-or'),de=gv('t'+i+'-de');if(!or&&!de)return;
    traslados.push({tipo:gv('t'+i+'-tipo'),origen:or,destino:de,fecha:fd(gv('t'+i+'-fe')),hora:gv('t'+i+'-ho'),vehiculo:gv('t'+i+'-veh'),moneda:gv('t'+i+'-cur'),precio:gn('t'+i+'-pr'),prov:getProvVal('t'+i),notas:gv('t'+i+'-not'),comision:gn('t'+i+'-com'),com_cur:gv('t'+i+'-com-cur'),incluir_en_total:_getIncluir(blk),opcion:_getOpcion(blk)});
  });
  document.querySelectorAll('[id^="eb-"]').forEach(blk=>{
    const i=blk.id.replace('eb-','');const nm=gv('e'+i+'-nm');if(!nm)return;
    const cat=gv('e'+i+'-cat');
    excursiones.push({nombre:nm,categoria:cat==='otros'?gv('e'+i+'-cat-otros')||'Otros':cat,prov:getProvVal('e'+i),fecha:fd(gv('e'+i+'-fe')),hora:gv('e'+i+'-ho'),dur:gv('e'+i+'-dur'),moneda:gv('e'+i+'-cur'),precio:gn('e'+i+'-pr'),punto:gv('e'+i+'-punto'),inc:gv('e'+i+'-inc'),noinc:gv('e'+i+'-noinc'),desc:gv('e'+i+'-desc'),foto_url:gv('e'+i+'-foto'),obs:gv('e'+i+'-obs'),comision:gn('e'+i+'-com'),com_cur:gv('e'+i+'-com-cur'),incluir_en_total:_getIncluir(blk),opcion:_getOpcion(blk)});
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
  // Si estamos editando, preservar el ref_id original.
  // Si es cotización NUEVA, dejar null para que dbSaveQuote genere el ID estructurado.
  const refId = gv('m-ref') || null;
  // Calcular comisión total (solo valores en USD o numéricas)
  const calcCom=(arr)=>arr.reduce((sum,x)=>sum+(x.comision&&x.com_cur!=='%'?x.comision:0),0);
  const segCom=(gv('seg-com-cur')!=='%'?gn('seg-com'):0);
  const total_comision=calcCom(vuelos)+calcCom(hoteles)+calcCom(traslados)+calcCom(excursiones)+calcCom(tickets_arr)+segCom;
  const markup_pct=gn('p-markup')||null;
  const markup_base=gn('p-base-cost')||null;
  const markup_comision=markup_pct&&markup_base?Math.round(markup_base*(markup_pct/100)*100)/100:null;
  return{refId,ts:Date.now(),_clientId:document.getElementById('_clientId')?.value||null,
    estado:gv('m-estado')||'borrador',notas_int:gv('m-notas'),
    cliente:{nombre:gv('m-nombre'),celular:gv('m-cel'),email:gv('m-email'),pasajeros:paxStr()},
    viaje:{destino:gv('m-dest'),pais:gv('m-pais'),salida:fd(s),regreso:fd(e),noches,descripcion:gv('m-desc')},
    itinerario:_itiCollect(),
    vuelos,hoteles,traslados,excursiones,tickets:tickets_arr,autos,cruceros,
    seguro:{nombre:gv('seg-nm'),cobertura_medica:gv('seg-med'),equipaje_seg:gv('seg-eq'),preexistencias:gv('seg-pre'),dias:gv('seg-dias'),moneda:gv('seg-cur'),precio:gn('seg-precio'),fin:gv('seg-fin'),extra:gv('seg-extra'),comision:gn('seg-com'),com_cur:gv('seg-com-cur')},
    precios:{moneda:gv('p-cur'),por_persona:gn('p-pp'),moneda2:gv('p-cur2'),total:gn('p-tot'),moneda3:gv('p-cur3'),reserva:gn('p-res'),cuotas:gv('p-cuo'),cancelacion:gv('p-can'),validez:gv('p-val')||'24 horas',tyc:gv('p-tyc')},
    total_comision,markup_pct,markup_base,markup_comision};
}

// ═══════════════════════════════════════════
// CALCULADORA DE MARKUP (comision interna)
// ═══════════════════════════════════════════
function _calcMarkup(){
  const pct=parseFloat(document.getElementById('p-markup')?.value)||0;
  const base=parseFloat(document.getElementById('p-base-cost')?.value)||0;
  const amtEl=document.getElementById('markup-amount');
  const lblEl=document.getElementById('markup-label');
  const bdEl=document.getElementById('markup-breakdown');
  if(!amtEl) return;
  if(!pct||!base){amtEl.textContent='—';if(lblEl)lblEl.textContent='';if(bdEl)bdEl.style.display='none';return;}
  const com=Math.round(base*(pct/100)*100)/100;
  const venta=Math.round((base+com)*100)/100;
  amtEl.textContent='USD '+com.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(lblEl) lblEl.textContent='sobre costo de USD '+base.toLocaleString('es-AR');
  if(bdEl){
    bdEl.style.display='';
    bdEl.innerHTML=`Costo base: <strong>USD ${base.toLocaleString('es-AR')}</strong> + Markup ${pct}% = Precio de venta: <strong>USD ${venta.toLocaleString('es-AR')}</strong>`;
  }
}

// ═══════════════════════════════════════════
// VERSIONES DE COTIZACIÓN
// ═══════════════════════════════════════════
// ref_id base (sin sufijo -Vn)
function _vBaseRef(r){return (r||'').replace(/-V\d+$/,'');}
// Número de versión (1 si no tiene sufijo)
function _vNum(r){const m=(r||'').match(/-V(\d+)$/);return m?parseInt(m[1]):1;}
// Próximo ref_id de versión
function _vNextRef(r){return _vBaseRef(r)+'-V'+(_vNum(r)+1);}

async function saveAsNewVersion(){
  if(typeof _tienePlan==='function'&&!_tienePlan('nueva_version')){_openUpgradeModal('profesional');return;}
  if(!editingQuoteId){toast('Guardá primero la cotización para poder crear versiones',false);return;}
  const currRef=document.getElementById('m-ref')?.value||'';
  if(!currRef){toast('Sin referencia — guardá primero',false);return;}

  const nextRef=_vNextRef(currRef);
  const vNum=_vNum(nextRef);

  if(!confirm('¿Crear '+nextRef+' como nueva versión?\n\nSe guardará una copia independiente. La versión anterior no se modifica.'))return;

  let d;
  try{d=collectForm();}catch(err){toast('Error al procesar el formulario',false);return;}

  d.refId=nextRef;
  const prevEditId=editingQuoteId;
  editingQuoteId=null; // forzar INSERT

  const btns=[document.getElementById('btn-save-main'),document.getElementById('btn-save-prev')];
  btns.forEach(b=>{if(b){b.disabled=true;b.textContent='Guardando v'+vNum+'...';}});
  try{
    await dbSaveQuote(d,null);
    const {data:saved}=await sb.from('cotizaciones').select('id').eq('ref_id',nextRef).maybeSingle();
    if(saved)editingQuoteId=saved.id;
    const refEl=document.getElementById('m-ref');if(refEl)refEl.value=nextRef;
    qData=d;
    if(editingQuoteId){_showEditBanner(nextRef);_startAutosave();}
    toast('V'+vNum+' creada — ahora editás '+nextRef);
  }catch(e){
    editingQuoteId=prevEditId;
    console.error('saveAsNewVersion:',e);
    toast('No se pudo crear la versión',false);
  }finally{
    btns.forEach(b=>{if(b){b.disabled=false;b.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> Guardar';}});
  }
}

// ═══════════════════════════════════════════
// CATÁLOGO DE PROVEEDORES — inserción one-click
// ═══════════════════════════════════════════
function _showProvCatalog(event, tipo, addFn){
  event.stopPropagation();
  const btn=event.currentTarget;

  // Crear o reusar dropdown global
  let drop=document.getElementById('pcat-global-drop');
  if(!drop){
    drop=document.createElement('div');
    drop.id='pcat-global-drop';
    drop.style.cssText='position:fixed;z-index:9999;background:var(--surface);border:1px solid var(--border2);border-radius:12px;box-shadow:var(--sh2);min-width:240px;max-width:360px;max-height:300px;overflow-y:auto;padding:4px 0;display:none';
    document.body.appendChild(drop);
    document.addEventListener('click',function(){drop.style.display='none';},{passive:true});
  }

  const all=window.provsList||[];
  const list=all.filter(p=>(p.tipos||[p.tipo||'']).some(t=>t===tipo||(tipo==='seguro'&&t==='asistencia')));

  if(!list.length){
    drop.innerHTML=`<div style="padding:16px 14px;text-align:center;color:var(--muted);font-size:.83rem;line-height:1.5">Sin proveedores de tipo <strong>${tipo}</strong>.<br><span style="font-size:.75rem">Agregá desde Mi Agencia.</span></div>`;
  } else {
    const bkItem='padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;';
    drop.innerHTML=`<div style="padding:8px 14px 6px;font-size:.7rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--g3);border-bottom:1px solid var(--border)">Proveedores · ${tipo.toUpperCase()}</div>`+
    list.map((p,i)=>`
      <div style="${bkItem}" onmouseover="this.style.background='var(--g1)'" onmouseout="this.style.background=''" onclick="event.stopPropagation();_insertProvCatalog(${i})">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.85rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.nombre}</div>
          ${p.ciudad?`<div style="font-size:.72rem;color:var(--muted);margin-top:1px">${p.ciudad}</div>`:''}
        </div>
        ${p.comision?`<div style="font-size:.72rem;font-weight:700;color:var(--primary);white-space:nowrap">${p.comision}${p.comision_tipo==='fijo_usd'?' USD':'%'}</div>`:''}
      </div>`).join('');
  }

  // Posicionar relativo al botón
  drop.style.display='block';
  const rect=btn.getBoundingClientRect();
  const dropH=Math.min(300,list.length*46+40);
  const spaceBelow=window.innerHeight-rect.bottom;
  drop.style.top=(spaceBelow>=dropH?(rect.bottom+4):(rect.top-dropH-4))+'px';
  drop.style.left=Math.min(rect.left,window.innerWidth-370)+'px';

  // Guardar contexto para onclick
  window._pcatCtx={list,addFn,tipo};
}

function _insertProvCatalog(idx){
  const drop=document.getElementById('pcat-global-drop');
  if(drop) drop.style.display='none';
  const ctx=window._pcatCtx;
  if(!ctx) return;
  const p=ctx.list[idx];
  if(!p) return;

  const com=p.comision||null;
  const comMon=p.comision_tipo==='fijo_usd'?'USD':'%';
  const notas=p.notas||'';

  if(ctx.tipo==='traslado'){
    ctx.addFn({prov:p.nombre, notas, comision:com, comision_moneda:comMon});
  } else if(ctx.tipo==='excursion'){
    ctx.addFn({prov:p.nombre, notas, comision:com, comision_moneda:comMon});
  } else if(ctx.tipo==='auto'){
    ctx.addFn({proveedor:p.nombre, notas, comision:com, comision_moneda:comMon});
  } else if(ctx.tipo==='crucero'){
    ctx.addFn({naviera:p.nombre, notas, comision:com, comision_moneda:comMon});
  } else if(ctx.tipo==='seguro'){
    // Seguros: seleccionar directamente en el dropdown existente
    const sel=document.getElementById('seg-nm');
    if(sel){
      const opt=[...sel.options].find(o=>o.value===p.nombre);
      if(opt){sel.value=p.nombre;if(typeof toast==='function')toast('Aseguradora: '+p.nombre);}
      else{if(typeof toast==='function')toast('"'+p.nombre+'" no está en la lista. Actualizá la sección Seguros.',false);}
    }
    return;
  } else {
    ctx.addFn({prov:p.nombre, notas, comision:com, comision_moneda:comMon});
  }
  if(typeof toast==='function') toast(p.nombre+' agregado');
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
  const _inPreview = document.querySelector('.panel.on')?.id === 'tab-preview';
  if(_inPreview && qData){
    d = qData; // en preview: usar datos ya cargados, no leer formulario vacío
  } else {
    try{ d=collectForm(); }
    catch(err){ toast('Hubo un error al procesar el formulario, revisá los campos',false); console.error('collectForm error:',err); return; }
    qData=d;
    try{ renderPreview(qData); }catch(err){ console.warn('renderPreview warning:',err); }
  }
  const btns=[document.getElementById('btn-save-main'),document.getElementById('btn-save-prev')];
  btns.forEach(b=>{if(b){b.disabled=true;b.innerHTML='<span class="spin" style="display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.35);border-top-color:white;border-radius:50%;vertical-align:middle"></span> Guardando...';}});
  try{
    const _recoveredId = await dbSaveQuote(qData, editingQuoteId);
    // dbSaveQuote retorna el id recuperado cuando hizo dup-recovery (editingQuoteId se había perdido)
    if(_recoveredId && !editingQuoteId) editingQuoteId=_recoveredId;
    const wasEditing = !!editingQuoteId;
    _stopAutosave();
    // Para cotizaciones nuevas: buscar el ID insertado para quedarnos en modo edicion
    if(!editingQuoteId && d.refId){
      const {data:saved}=await sb.from('cotizaciones').select('id').eq('ref_id',d.refId).maybeSingle();
      if(saved) editingQuoteId=saved.id;
    }
    // Mantener en modo edicion con banner visible
    const currentRef=document.getElementById('m-ref')?.value||d.refId||'';
    if(editingQuoteId){
      _showEditBanner(currentRef);
      _startAutosave();
    } else {
      _hideEditBanner();
    }
    toast(wasEditing ? 'Cotizacion actualizada en la nube' : 'Guardado en la nube');
  }catch(e){
    console.error('saveQuote error:',e);
    if(typeof _captureError==='function') _captureError('saveQuote', e);
    toast('No se pudo guardar la cotización, intentá de nuevo',false);
  }
  finally{ 
    const b0=document.getElementById('btn-save-main');
    const b1=document.getElementById('btn-save-prev');
    if(b0){b0.disabled=false;b0.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> Guardar en nube';}
    if(b1){b1.disabled=false;b1.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> Guardar';}
  }
}

// ═══════════════════════════════════════════
// AUTOSAVE — guarda automáticamente cada 30s si hay cambios
// ═══════════════════════════════════════════
let _autosaveTimer=null, _autosaveSnapshot='', _autosaving=false;

function _startAutosave(){
  if(_autosaveTimer) return; // ya está corriendo
  _autosaveSnapshot=_formFingerprint();
  _autosaveTimer=setInterval(_autosaveTick, 30000); // cada 30 segundos
  console.log('[AUTOSAVE] iniciado');
}

function _stopAutosave(){
  if(_autosaveTimer){clearInterval(_autosaveTimer);_autosaveTimer=null;}
  _autosaveSnapshot='';
  _autosaving=false;
  console.log('[AUTOSAVE] detenido');
}

function _formFingerprint(){
  // Hash rápido del formulario para detectar cambios
  try{
    const d=collectForm();
    return JSON.stringify(d);
  }catch(e){return '';}
}

async function _autosaveTick(){
  if(_autosaving) return; // ya está guardando
  if(!currentUser) return; // no logueado
  // Solo autoguardar si estamos en el tab del formulario
  const formTab=document.getElementById('tab-form');
  if(!formTab||!formTab.classList.contains('on')) return;
  // Verificar si hay contenido mínimo (al menos destino o cliente)
  const dest=document.getElementById('m-dest')?.value?.trim()||'';
  const cli=document.getElementById('m-nm')?.value?.trim()||'';
  if(!dest&&!cli) return; // formulario vacío, no guardar
  // Comparar fingerprint
  const current=_formFingerprint();
  if(!current||current===_autosaveSnapshot) return; // sin cambios
  _autosaving=true;
  try{
    const d=collectForm();
    qData=d;
    const _asRecoveredId=await dbSaveQuote(d, editingQuoteId);
    if(_asRecoveredId&&!editingQuoteId) editingQuoteId=_asRecoveredId;
    // Si era nueva, guardar el ID para futuros autosaves
    if(!editingQuoteId&&d.refId){
      // Buscar la cotización recién creada para obtener su ID
      const {data}=await sb.from('cotizaciones').select('id').eq('ref_id',d.refId).maybeSingle();
      if(data){
        editingQuoteId=data.id;
        // Reflejar el ref_id en el campo del formulario para que próximos collectForm() lo lean
        const refEl=document.getElementById('m-ref');
        if(refEl&&!refEl.value) refEl.value=d.refId;
      }
    }
    _autosaveSnapshot=current;
    // Indicador visual sutil
    _showAutosaveIndicator();
    console.log('[AUTOSAVE] guardado OK');
  }catch(e){
    console.warn('[AUTOSAVE] error:',e);
    // No mostrar toast de error para no molestar — solo log
  }finally{
    _autosaving=false;
  }
}

function _showAutosaveIndicator(){
  // Pequeño texto que aparece brevemente
  let ind=document.getElementById('autosave-ind');
  if(!ind){
    ind=document.createElement('div');
    ind.id='autosave-ind';
    ind.style.cssText='position:fixed;bottom:70px;right:20px;font-size:.72rem;color:var(--primary);background:var(--surface);padding:4px 12px;border-radius:20px;border:1px solid var(--border);box-shadow:var(--sh);opacity:0;transition:opacity .3s;z-index:100;font-weight:600;pointer-events:none';
    document.body.appendChild(ind);
  }
  ind.textContent='Guardado automatico';
  ind.style.opacity='1';
  setTimeout(()=>{ind.style.opacity='0';},2000);
}

// Iniciar autosave cuando se entra al tab del formulario
// Se engancha al switchTab existente
(function(){
  const _origSwitchTab=window.switchTab;
  if(_origSwitchTab){
    window.switchTab=function(id){
      _origSwitchTab(id);
      if(id==='form') _startAutosave();
      else _stopAutosave();
    };
  }
  // También iniciar si ya estamos en el form (ej: al cargar desde historial)
  document.addEventListener('DOMContentLoaded',()=>{
    const formTab=document.getElementById('tab-form');
    if(formTab&&formTab.style.display!=='none') _startAutosave();
  });
})();

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
      badge.style.background=on?'rgba(27,158,143,0.1)':'rgba(0,0,0,0.04)';
      badge.style.borderColor=on?'rgba(27,158,143,0.25)':'var(--border2)';
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
function _addHotelFotos(hid,inp){
  [...inp.files].forEach(f=>{
    const r=new FileReader();
    r.onload=e=>{
      const key='hb-'+hid;
      if(!window._hFotos[key])window._hFotos[key]=[];
      window._hFotos[key].push({url:e.target.result,label:f.name.replace(/\.[^.]+$/,'')});
      _renderHotelFotoStrip(hid);
    };
    r.readAsDataURL(f);
  });
  inp.value='';
}
function _removeHotelFoto(hid,idx){
  const key='hb-'+hid;
  if(window._hFotos[key])window._hFotos[key].splice(idx,1);
  _renderHotelFotoStrip(hid);
}
function _renderHotelFotoStrip(hid){
  const strip=document.getElementById('h'+hid+'-fotos-strip');
  if(!strip)return;
  const fotos=window._hFotos['hb-'+hid]||[];
  strip.innerHTML=fotos.map((f,i)=>f?.url?`<div style="position:relative"><img src="${f.url}" style="width:72px;height:54px;object-fit:cover;border-radius:6px;border:1px solid var(--border2)" title="${f.label||''}"><button type="button" onclick="_removeHotelFoto(${hid},${i})" style="position:absolute;top:-5px;right:-5px;background:var(--text);color:var(--surface);border:none;border-radius:50%;width:16px;height:16px;font-size:9px;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center">✕</button></div>`:'').join('');
}
function _removeRep(btn){
  const rep=btn.closest('.rep');
  const cont=rep?.closest('[id$="-cont"]');
  const contId=cont?.id;
  if(rep?.id) delete window._hFotos[rep.id];
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
    chip.style.background=isAuto?'rgba(27,158,143,0.1)':'var(--g1)';
    chip.style.borderColor=isAuto?'rgba(27,158,143,0.2)':'var(--border)';
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
        ` <span id="${chipId}" style="font-size:10px;background:rgba(27,158,143,0.1);border:1px solid rgba(27,158,143,0.2);border-radius:10px;padding:2px 8px;color:var(--primary);vertical-align:middle">AUTO</span>` +
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

// ═══════════════════════════════════════════════════════════════
// ITINERARIO DÍA A DÍA
// ═══════════════════════════════════════════════════════════════
const _ITI_TIPOS=[
  {k:'VUELO',c:'#1B9E8F'},{k:'LLEGADA',c:'#1B9E8F'},{k:'TRASLADO',c:'#E8826A'},
  {k:'PARQUE',c:'#D4A017'},{k:'EXCURSIÓN',c:'#43A047'},{k:'PLAYA',c:'#0288D1'},
  {k:'COMPRAS',c:'#2E7D32'},{k:'RELAX',c:'#78909C'},{k:'CASA',c:'#66BB6A'},
  {k:'NAVIDAD',c:'#C62828'},{k:'EVENTO ESPECIAL',c:'#FF8F00'},{k:'LIBRE',c:'#9CA3AF'},
];
let _itiData=[];

function _itiTipoColor(t){return(_ITI_TIPOS.find(x=>x.k===t)||{c:'#9CA3AF'}).c;}
function _itiFromStr(s){if(!s)return null;if(s.includes('/')){const[dd,mm,yy]=s.split('/');return yy+'-'+mm.padStart(2,'0')+'-'+dd.padStart(2,'0');}return s;}

function _buildItinerario(){
  // Forzar que la sección quede expandida al regenerar
  const itiCard=document.getElementById('itinerario-card');
  if(itiCard) itiCard.classList.remove('collapsed');
  const salida=document.getElementById('m-sal')?.value;
  const regreso=document.getElementById('m-reg')?.value;
  const cont=document.getElementById('itinerario-cont');
  if(!cont)return;
  if(!salida||!regreso||salida>=regreso){
    cont.innerHTML='<div style="padding:14px 18px;color:var(--g3);font-size:.82rem">Ingresá las fechas de salida y regreso para generar el itinerario automáticamente.</div>';
    return;
  }
  // Preserve existing manual entries
  const prevManual={};
  _itiData.forEach(day=>{if(day.manual&&(day.manual.actividad||day.manual.tipo!=='LIBRE'))prevManual[day.k]=day.manual;});
  // Build locked events from form
  const evMap={};
  const addEv=(dateStr,tipo,actividad)=>{const k=_itiFromStr(dateStr);if(!k||k.length!==10)return;if(!evMap[k])evMap[k]=[];evMap[k].push({actividad,tipo});};
  // Vuelos
  document.querySelectorAll('[id^="vb-"]').forEach(blk=>{
    const i=blk.id.replace('vb-','');
    const or=(document.getElementById('v'+i+'-or')?.value||'').trim();
    const de=(document.getElementById('v'+i+'-de')?.value||'').trim();
    const fs=(document.getElementById('v'+i+'-fs')?.value||'').trim();
    const mod=(document.getElementById('v'+i+'-mod')?.value||'simple');
    if(fs&&(or||de))addEv(fs,'VUELO',[or,de].filter(Boolean).join(' → '));
    if(mod==='idavuelta'){const fs2=(document.getElementById('v'+i+'-fs2')?.value||'').trim();if(fs2)addEv(fs2,'VUELO',[de||or,or||de].filter(Boolean).join(' → '));}
  });
  // Hoteles (each night)
  document.querySelectorAll('[id^="hb-"]').forEach(blk=>{
    const i=blk.id.replace('hb-','');
    const nm=(document.getElementById('h'+i+'-nm')?.value||'').trim();
    const ci=(document.getElementById('h'+i+'-ci')?.value||'').trim();
    const co=(document.getElementById('h'+i+'-co')?.value||'').trim();
    if(!nm||!ci||!co)return;
    let cur=new Date(ci);const end=new Date(co);
    while(cur<end){addEv(cur.toISOString().slice(0,10),'RELAX','Alojamiento: '+nm);cur.setDate(cur.getDate()+1);}
  });
  // Traslados
  document.querySelectorAll('[id^="tb-"]').forEach(blk=>{
    const i=blk.id.replace('tb-','');
    const or=(document.getElementById('t'+i+'-or')?.value||'').trim();
    const de=(document.getElementById('t'+i+'-de')?.value||'').trim();
    const fe=(document.getElementById('t'+i+'-fe')?.value||'').trim();
    if(fe&&(or||de))addEv(fe,'TRASLADO',[or,de].filter(Boolean).join(' → '));
  });
  // Excursiones
  document.querySelectorAll('[id^="eb-"]').forEach(blk=>{
    const i=blk.id.replace('eb-','');
    const nm=(document.getElementById('e'+i+'-nm')?.value||'').trim();
    const fe=(document.getElementById('e'+i+'-fe')?.value||'').trim();
    if(fe&&nm)addEv(fe,'EXCURSIÓN',nm);
  });
  // Tickets / Parques / Shows
  document.querySelectorAll('[id^="tkb-"]').forEach(blk=>{
    const i=blk.id.replace('tkb-','');
    const nm=(document.getElementById('tk'+i+'-nm')?.value||'').trim();
    const fe=(document.getElementById('tk'+i+'-fe')?.value||'').trim();
    const tipo=(document.getElementById('tk'+i+'-tipo')?.value||'PARQUE').toUpperCase();
    if(fe&&nm)addEv(fe,tipo==='PARQUE'?'PARQUE':tipo==='SHOW'?'EVENTO ESPECIAL':'PARQUE',nm);
  });
  // Build days array
  _itiData=[];
  let cur=new Date(salida);const end=new Date(regreso);
  while(cur<=end){
    const k=cur.toISOString().slice(0,10);
    _itiData.push({k,date:new Date(cur),locked:evMap[k]||[],manual:prevManual[k]||{actividad:'',tipo:'LIBRE'}});
    cur.setDate(cur.getDate()+1);
  }
  _renderItinerario();
}

function _renderItinerario(){
  const cont=document.getElementById('itinerario-cont');
  if(!cont)return;
  if(!_itiData.length){cont.innerHTML='<div style="padding:14px 18px;color:var(--g3);font-size:.82rem">Sin días generados.</div>';return;}
  const DIAS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const fmt2=(d)=>String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');
  const LOCK='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  const opts=_ITI_TIPOS.map(t=>`<option value="${t.k}">${t.k}</option>`).join('');
  let html='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.82rem">';
  html+='<thead><tr><th style="width:76px;padding:8px 12px 6px;text-align:left;font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--g3);border-bottom:2px solid var(--border2)">FECHA</th><th style="padding:8px 12px 6px;text-align:left;font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--g3);border-bottom:2px solid var(--border2)">ACTIVIDAD</th><th style="width:155px;padding:8px 12px 6px;text-align:left;font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--g3);border-bottom:2px solid var(--border2)">TIPO</th></tr></thead><tbody>';
  _itiData.forEach((day,idx)=>{
    const bg=idx%2===0?'':'background:var(--g1);';
    const nonTriv=[...day.locked.filter(l=>l.tipo!=='RELAX'&&l.tipo!=='LIBRE'),...(day.manual.actividad&&day.manual.tipo!=='LIBRE'&&day.manual.tipo!=='RELAX'?[day.manual]:[])];
    const conflict=nonTriv.length>1;
    const totalRows=day.locked.length+1;
    const dateCell=`<td style="${bg}padding:8px 12px;border-bottom:1px solid var(--border);vertical-align:middle" rowspan="${totalRows}"><div style="font-size:.9rem;font-weight:800;color:var(--text);line-height:1">${fmt2(day.date)}</div><div style="font-size:.65rem;font-weight:600;color:var(--g3);letter-spacing:.5px;text-transform:uppercase;margin-top:2px">${DIAS[day.date.getDay()]}</div>${conflict?'<span title="Este día tiene más de una actividad" style="color:#E8826A;font-size:.75rem;display:block;margin-top:3px">⚠</span>':''}</td>`;
    let first=true;
    day.locked.forEach(lk=>{
      const c=_itiTipoColor(lk.tipo);
      html+=`<tr>${first?dateCell:''}<td style="${bg}padding:5px 12px;border-bottom:1px solid var(--border);opacity:.65"><div style="display:flex;align-items:center;gap:6px"><span style="color:var(--g3)">${LOCK}</span><span style="color:var(--g4);font-size:.8rem">${lk.actividad}</span></div></td><td style="${bg}padding:5px 12px;border-bottom:1px solid var(--border);opacity:.65"><span style="background:${c};color:white;font-size:.62rem;font-weight:700;letter-spacing:1px;padding:2px 7px;border-radius:12px;text-transform:uppercase;white-space:nowrap">${lk.tipo}</span></td></tr>`;
      first=false;
    });
    const sel=opts.replace(`value="${day.manual.tipo||'LIBRE'}"`,`value="${day.manual.tipo||'LIBRE'}" selected`);
    html+=`<tr>${first?dateCell:''}<td style="${bg}padding:5px 12px;border-bottom:1px solid var(--border)"><input class="finput" type="text" style="width:100%;font-size:.82rem;min-height:34px;padding:4px 10px" value="${(day.manual.actividad||'').replace(/"/g,'&quot;')}" placeholder="${day.locked.length?'Nota adicional...':'Actividad del día...'}" onchange="_itiSetManual('${day.k}','actividad',this.value)"></td><td style="${bg}padding:5px 12px;border-bottom:1px solid var(--border)"><select class="fsel" style="width:100%;font-size:.82rem;min-height:34px" onchange="_itiSetManual('${day.k}','tipo',this.value)">${sel}</select></td></tr>`;
  });
  html+='</tbody></table></div>';
  cont.innerHTML=html;
}

function _itiSetManual(k,field,value){
  const day=_itiData.find(d=>d.k===k);
  if(!day)return;
  if(!day.manual)day.manual={actividad:'',tipo:'LIBRE'};
  day.manual[field]=value;
}

function _itiCollect(){
  if(!_itiData.length)return null;
  const result=[];
  const fmt3=(d)=>String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
  _itiData.forEach(day=>{
    day.locked.forEach(lk=>{result.push({fecha:fmt3(day.date),actividad:lk.actividad,tipo:lk.tipo,locked:true});});
    if(day.manual.actividad||(day.manual.tipo&&day.manual.tipo!=='LIBRE')){
      result.push({fecha:fmt3(day.date),actividad:day.manual.actividad||'',tipo:day.manual.tipo||'LIBRE',locked:false});
    } else if(!day.locked.length){
      // Guardar días sin actividad como "LIBRE" para que el PDF muestre todos los días
      result.push({fecha:fmt3(day.date),actividad:'Día libre',tipo:'LIBRE',locked:false});
    }
  });
  return result.length?result:null;
}

function _itiRestore(itinerario){
  if(!itinerario?.length)return;
  _buildItinerario();
  itinerario.filter(r=>!r.locked).forEach(r=>{
    const k=_itiFromStr(r.fecha);
    const day=_itiData.find(d=>d.k===k);
    if(day)day.manual={actividad:r.actividad||'',tipo:r.tipo||'LIBRE'};
  });
  _renderItinerario();
}
