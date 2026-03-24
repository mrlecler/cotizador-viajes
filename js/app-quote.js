function fmtMoney(n,cur){if(!n||n===0)return'';return(cur||'USD')+' '+Number(n).toLocaleString('es-AR');}

// ── Extraer código IATA de aerolínea para logos ──
function _extractAirlineIata(name,flightNum){
  const map=window.aerolineasMap||{};
  if(name&&map[name.toLowerCase()])return map[name.toLowerCase()];
  if(flightNum){const m=flightNum.trim().match(/^([A-Z]{2})/i);if(m)return m[1].toUpperCase();}
  return'';
}

const PDF_THEMES={
  1:{name:'Turquesa ermix', primary:'#1B9E8F',secondary:'#0BC5B8',accent:'#06B6D4',grad:'linear-gradient(135deg,#1B9E8F,#0BC5B8,#06B6D4)',text:'#ffffff',rgb:'27,158,143',rgb2:'11,197,184'},
  2:{name:'Azul marino',    primary:'#1E3A5F',secondary:'#2E5C8A',accent:'#4A90C4',grad:'linear-gradient(135deg,#1E3A5F,#2E5C8A,#4A90C4)',text:'#ffffff',rgb:'30,58,95',  rgb2:'46,92,138'},
  3:{name:'Negro y dorado', primary:'#1A1A1A',secondary:'#2D2D2D',accent:'#C9A84C',grad:'linear-gradient(135deg,#1A1A1A,#2D2D2D 60%,#C9A84C)',text:'#C9A84C',rgb:'26,26,26',rgb2:'45,45,45'},
  4:{name:'Verde selva',    primary:'#1B4332',secondary:'#2D6A4F',accent:'#52B788',grad:'linear-gradient(135deg,#1B4332,#2D6A4F,#52B788)',text:'#ffffff',rgb:'27,67,50',  rgb2:'45,106,79'},
  5:{name:'Borgoña premium',primary:'#6B1A2A',secondary:'#8B2635',accent:'#C4445A',grad:'linear-gradient(135deg,#6B1A2A,#8B2635,#C4445A)',text:'#ffffff',rgb:'107,26,42',rgb2:'139,38,53'},
};
// ─── Wordmark dinámico — DM Sans 900 + X custom path ─────────────────────────
function buildPdfWordmark(fontSize){
  const X='M8 8 L8 18 L24.5 32 L8 46 L8 56 L20 56 L32 43.5 L44 56 L56 56 L56 46 L39.5 32 L56 18 L56 8 L44 8 L32 20.5 L20 8 Z';
  const G=['#1B9E8F','#0BC5B8','#06B6D4'];
  const c=document.createElement('canvas');const ctx=c.getContext('2d');
  ctx.font=`900 ${fontSize}px "DM Sans"`;
  const ermiW=ctx.measureText('ermi').width;
  const capH=fontSize*0.725,sc=capH/48;
  const baseline=fontSize*0.86,totalH=fontSize;
  const xTop=baseline-capH,xLeft=ermiW-1;
  const totalW=xLeft+48*sc+4;
  const tx=xLeft-8*sc,ty=xTop-8*sc;
  const gid='pdf_wg_'+Date.now();
  return `<svg viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${G[0]}"/>
      <stop offset="45%" stop-color="${G[1]}"/>
      <stop offset="100%" stop-color="${G[2]}"/>
    </linearGradient></defs>
    <text x="0" y="${baseline}" font-family="'DM Sans',sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="-1" fill="white">ermi</text>
    <path transform="translate(${tx},${ty}) scale(${sc})" d="${X}" fill="url(#${gid})"/>
  </svg>`;
}

// ─── Generador HTML del documento de cotización ───────────────────────────────
function buildQuoteHTML(d){
  const ag=agCfg;
  const th=PDF_THEMES[ag.pdf_theme||1]||PDF_THEMES[1];
  const today=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'}).toUpperCase();
  const pr=d.precios||{},cl=d.cliente||{},vi=d.viaje||{};
  const ini=(ag.nm||'M').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'M';

  const _sph=JSON.parse(localStorage.getItem('mp_sec_photos')||'{}');
  const sphBg=(k,fb)=>{const u=(_sph[k]?.url||'').trim(),p=_sph[k]?.pos||'center center';return u?`url('${u}') ${p}/cover no-repeat,${fb}`:fb;};
  const L=(p,sz=15,col=th.primary)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const LI={
    pin:`<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`,
    hotel:`<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M10 6h4"/><path d="M10 10h4"/>`,
    plane:`<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-1-5.5.5L10 6 1.8 6.2c-.5.1-.9.6-.9 1.1l1 4c.1.5.5.8 1 .8L8 12l-2 2-1 1 1 1 2 2 1 1 1-1 2-2 .2 5.1c0 .5.3.9.8 1l4 1c.5.1 1-.3 1.1-.9L17.8 19.2z"/>`,
    ticket:`<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>`,
    bus:`<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`,
    moon:`<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
    shield:`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
    clip:`<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>`,
    luggage:`<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="12" y1="12" x2="12.01" y2="12"/>`,
    check:`<polyline points="20 6 9 17 4 12"/>`,
    xmark:`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
    arrow:`<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`,
    building:`<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    map:`<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15"/><path d="M15 6v15"/>`,
    med:`<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`,
    info:`<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
    car:`<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.6A6 6 0 0 0 2 12.16V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>`,
    ship:`<path d="M2 21c.6.5 1.2 1 2.5 1C7 22 7 21 9.5 21c2.6 0 2.6 1 5.1 1 2.4 0 2.4-1 4.9-1 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.4.8 4.5 2.1 6.2"/><path d="M12 2v7"/>`,
    clock:`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  };
  const gradPrice=(amt,sz=15,gr=th.grad)=>amt?`<div style="font-size:${sz}px;font-weight:900;background:${gr};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2">${amt}</div>`:'';

  // ── Date helpers ──
  const _pd=(s)=>{if(!s)return null;try{if(s.includes('/')){const[dd,mm,yy]=s.split('/');return new Date(yy+'-'+mm.padStart(2,'0')+'-'+dd.padStart(2,'0'));}const dt=new Date(s);return isNaN(dt)?null:dt;}catch{return null;}};
  const _sameDayKey=(dt)=>dt?dt.toISOString().slice(0,10):'';
  const DIAS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  // ── Badge helper ──
  const opBadge=(op)=>{if(!op)return'';const map={'OPCIÓN A':'background:linear-gradient(135deg,#0288D1,#01579B);color:white','OPCIÓN B':'background:linear-gradient(135deg,#546E7A,#263238);color:white',RECOMENDADO:`background:${th.grad};color:${th.text}`,'OPCIONAL':'background:linear-gradient(135deg,#FF8F00,#E65100);color:white','PROMO':'background:linear-gradient(135deg,#E65100,#BF360C);color:white'};const st=map[op.toUpperCase()]||'background:rgba(45,31,20,0.08);color:#2D1F14';return `<span style="font-size:8px;font-weight:800;letter-spacing:1.5px;padding:3px 9px;border-radius:20px;text-transform:uppercase;display:inline-block;margin-bottom:8px;${st}">${op}</span>`;};

  // ── Page-level dark header ──
  const darkHd=(meta,title,sub)=>`<div class="qp-dark-hd">${meta?`<div class="qp-dark-hd-meta">${meta}</div>`:''}<div class="qp-dark-hd-title">${title}</div>${sub?`<div class="qp-dark-hd-sub">${sub}</div>`:''}</div>`;

  // ── Item card (photo left + info right) ──
  const itemCard=(photoUrl,badgeHtml,infoHtml)=>`<div class="qp-item-card">${badgeHtml||''}<div style="display:flex;gap:0;border-radius:10px;overflow:hidden;background:#fff;border:1px solid rgba(45,31,20,0.08)">${photoUrl?`<div style="flex:0 0 200px;position:relative;overflow:hidden"><img src="${photoUrl}" style="width:100%;height:100%;min-height:160px;object-fit:cover;display:block"></div>`:''}<div style="flex:1;padding:14px 16px;min-width:0">${infoHtml}</div></div></div>`;

  // ── Total amount ──
  const totalAmt=pr.total>0?fmtMoney(pr.total,pr.moneda2):pr.por_persona>0?fmtMoney(pr.por_persona,pr.moneda)+' /pax':'';

  // ════════════════════════════════════════════════
  // PAGE 1: PORTADA
  // ════════════════════════════════════════════════
  const dests=[...new Set([vi.destino,vi.pais,...(d.hoteles||[]).map(h=>h.ciudad).filter(Boolean)].filter(Boolean))];
  let H=`<div id="qwrap">
  <div class="qp-cover" style="${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:'background:linear-gradient(160deg,#0D2B1E 0%,#0A1A12 50%,#0D120F 100%)'}">
    <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(13,43,30,0.2) 0%,rgba(10,26,18,0.6) 55%,rgba(13,18,15,0.88) 100%);pointer-events:none"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 105%,rgba(${th.rgb},0.32) 0%,transparent 65%);pointer-events:none"></div>
    <div style="position:absolute;top:0;left:0;right:0;padding:22px 36px;display:flex;justify-content:space-between;align-items:center;z-index:2">
      <div style="display:flex;align-items:center;gap:14px">
        ${buildPdfWordmark(24)}
        ${ag.nm?`<div style="width:1px;height:20px;background:rgba(255,255,255,.18)"></div><div style="line-height:1.3"><div style="font-size:11px;font-weight:700;color:white;letter-spacing:.3px">${ag.nm}</div>${ag.ag?`<div style="font-size:9px;color:rgba(255,255,255,.5)">${ag.ag}</div>`:''}</div>`:''}
      </div>
      ${d.refId?`<div style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:5px 14px;font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:rgba(255,255,255,.75);letter-spacing:.5px">${d.refId}</div>`:''}
    </div>
    <div style="position:absolute;top:50%;left:36px;right:36px;transform:translateY(-55%);z-index:2">
      ${dests.length?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px">${dests.map(dest=>`<span style="background:rgba(${th.rgb},0.22);border:1px solid rgba(${th.rgb},0.45);border-radius:20px;padding:4px 14px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.85)">${dest}</span>`).join('')}</div>`:''}
      ${cl.nombre?`<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:10px">COTIZACIÓN PERSONALIZADA PARA</div><div style="font-size:52px;font-weight:900;letter-spacing:-2px;color:white;line-height:1;margin-bottom:18px;text-shadow:0 2px 20px rgba(0,0,0,.35)">${cl.nombre}</div>`:`<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:14px">PROPUESTA DE VIAJE</div><div style="font-size:52px;font-weight:900;letter-spacing:-2px;color:white;line-height:1;margin-bottom:18px;text-shadow:0 2px 20px rgba(0,0,0,.35)">${vi.destino||'Tu próximo viaje'}</div>`}
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        ${cl.pasajeros?`<div style="display:flex;align-items:center;gap:8px"><div style="width:2px;height:24px;background:${th.primary};flex-shrink:0;border-radius:2px"></div><span style="font-size:12px;font-weight:600;color:rgba(255,255,255,.75)">${cl.pasajeros}</span></div>`:''}
        ${vi.salida&&vi.regreso?`<div style="font-size:11px;color:rgba(255,255,255,.5);font-family:'DM Mono',monospace">${fd(vi.salida)} → ${fd(vi.regreso)}</div>`:''}
        ${vi.noches?`<div style="font-size:11px;color:rgba(255,255,255,.5)">${vi.noches} noches</div>`:''}
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;z-index:2;background:${th.grad};padding:16px 36px;display:flex;align-items:center;gap:0">
      ${totalAmt?`<div style="flex:0 0 auto;padding-right:24px;border-right:1px solid rgba(255,255,255,.25)"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:3px">PRECIO REFERENCIA</div><div style="font-size:18px;font-weight:900;color:white;letter-spacing:-0.5px">${totalAmt}</div></div>`:''}
      ${vi.descripcion?`<div style="flex:1;padding:0 ${totalAmt?'24':'0'}px${ag.nm?';border-right:1px solid rgba(255,255,255,.25)':''}"><div style="font-size:9px;color:rgba(255,255,255,.75);line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${vi.descripcion.trim().substring(0,200)}</div></div>`:`<div style="flex:1"></div>`}
      ${ag.nm?`<div style="flex:0 0 auto;padding-left:24px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:3px">AGENTE</div><div style="font-size:12px;font-weight:700;color:white">${ag.nm}</div><div style="font-size:8px;color:rgba(255,255,255,.5);margin-top:1px">${today}</div></div>`:''}
    </div>
  </div>`;

  // ════════════════════════════════════════════════
  // PAGE 2: ITINERARIO DÍA A DÍA
  // ════════════════════════════════════════════════
  const allDates=[];
  const pushD=(s)=>{const dt=_pd(s);if(dt&&!isNaN(dt))allDates.push(dt);};
  pushD(vi.salida);pushD(vi.regreso);
  (d.hoteles||[]).forEach(h=>{pushD(h.checkin);pushD(h.checkout);});
  (d.vuelos||[]).forEach(v=>{pushD(v.fs);pushD(v.fl);if(v.mod==='idavuelta'){pushD(v.fs2);pushD(v.fl2);}});

  if(allDates.length>=2){
    const minD=new Date(Math.min(...allDates.map(x=>x.getTime())));
    const maxD=new Date(Math.max(...allDates.map(x=>x.getTime())));
    const evMap={};
    const addEv=(s,type,desc,color)=>{let k=s;if(typeof s!=='string')k=_sameDayKey(s);else k=_sameDayKey(_pd(s));if(!k)return;if(!evMap[k])evMap[k]=[];evMap[k].push({type,desc,color});};
    (d.vuelos||[]).forEach(v=>{
      if(v.fs)addEv(v.fs,'VUELO',`${v.origen||''}${v.destino?' → '+v.destino:''}${v.aerolinea?' · '+v.aerolinea:''}`.trim(),th.primary);
      if(v.mod==='idavuelta'&&v.fs2)addEv(v.fs2,'VUELO',`${v.destino||''}${v.origen?' → '+v.origen:''}${(v.al2||v.aerolinea)?' · '+(v.al2||v.aerolinea):''}`.trim(),th.primary);
    });
    (d.traslados||[]).filter(t=>t.origen||t.destino).forEach(t=>{if(t.fecha)addEv(t.fecha,'TRASLADO',`${t.origen||''}${t.destino?' → '+t.destino:''}${t.vehiculo?' · '+t.vehiculo:''}`.trim(),'#E8826A');});
    (d.excursiones||[]).filter(e=>e.nombre).forEach(e=>{if(e.fecha){const cat=(e.categoria||'EXCURSIÓN').toUpperCase();const cc={'PARQUE':'#D4A017','PLAYA':'#0288D1','PASEO':'#6A1B9A','RELAX':'#43A047','NAVIDAD':'#C62828','TOUR':'#E8826A','EXCURSIÓN':'#D4A017'}[cat]||'#D4A017';addEv(e.fecha,cat,e.nombre,cc);}});
    (d.hoteles||[]).filter(h=>h.nombre&&h.checkin&&h.checkout).forEach(h=>{
      const ci=_pd(h.checkin),co=_pd(h.checkout);if(!ci||!co)return;
      let cur=new Date(ci);
      while(cur<co){const k=_sameDayKey(cur);if(!evMap[k])evMap[k]=[{type:'RELAX',desc:`Libre en ${h.ciudad||h.nombre}`,color:'#43A047'}];cur=new Date(cur);cur.setDate(cur.getDate()+1);}
    });
    const rows=[];let cur=new Date(minD);
    while(cur<=maxD){const k=_sameDayKey(cur);rows.push({k,date:new Date(cur),evs:evMap[k]||[{type:'—',desc:vi.destino||'En destino',color:'#9CA3AF'}]});cur=new Date(cur);cur.setDate(cur.getDate()+1);}
    if(rows.length>0&&rows.length<=60){
      H+=`<div class="qp-page" style="break-before:page">${darkHd(`ITINERARIO · ${(vi.destino||'').toUpperCase()}${vi.salida?' · '+fd(vi.salida):''}${vi.regreso?' – '+fd(vi.regreso):''}`,`Día a Día`,vi.noches?vi.noches+' noches'+(vi.destino?' en '+vi.destino:''):'')}
  <div style="padding:0 32px 20px">
    <table class="qp-iti-table">
      <thead><tr><th style="width:80px">FECHA</th><th>ACTIVIDAD</th><th style="width:110px">TIPO</th></tr></thead>
      <tbody>${rows.map((r,ri)=>`<tr class="${ri%2===0?'qp-iti-even':'qp-iti-odd'}"><td class="qp-iti-date"><div style="font-size:15px;font-weight:800;color:#2D1F14;line-height:1">${String(r.date.getDate()).padStart(2,'0')}/${String(r.date.getMonth()+1).padStart(2,'0')}</div><div style="font-size:8px;font-weight:600;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;margin-top:2px">${DIAS[r.date.getDay()]}</div></td><td class="qp-iti-act">${r.evs.map(ev=>`<div style="display:flex;align-items:center;gap:7px;${r.evs.length>1?'margin-bottom:3px':''}"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${ev.color};flex-shrink:0"></span><span style="font-size:10px;color:#374151">${ev.desc}</span></div>`).join('')}</td><td class="qp-iti-type">${r.evs.map(ev=>`<div style="${r.evs.length>1?'margin-bottom:3px':''}"><span style="background:${ev.color};color:white;font-size:7.5px;font-weight:800;letter-spacing:1.5px;padding:2px 7px;border-radius:20px;text-transform:uppercase;white-space:nowrap">${ev.type}</span></div>`).join('')}</td></tr>`).join('')}
      </tbody>
    </table>
  </div></div>`;
    }
  }

  // ════════════════════════════════════════════════
  // PAGES 3..N: SERVICE SECTIONS
  // ════════════════════════════════════════════════

  // ── VUELOS ──
  if((d.vuelos||[]).length){
    const rBP=(label,isRet,or,io,hs,fss,de,id2,hl,fl,al,num,esc,tesc,dur)=>`<div class="q-bp"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#374151">${or} → ${de}</span><span class="q-bp-chip${isRet?' ret':''}">${label}</span></div><div class="q-bp-grid"><div><div class="q-bp-time">${hs||'–'}</div><div class="q-iata">${io||or}</div><div class="q-bp-city">${or}</div>${fss?`<div style="font-size:9px;color:rgba(45,31,20,0.4);margin-top:1px">${fd(fss)}</div>`:''}</div><div class="q-bp-mid"><div class="q-bp-escl">${esc?'con escala':'directo'}</div><div class="q-bp-line"></div>${esc?`<div class="q-bp-via">${L(LI.arrow,8)} ${esc}${tesc?' · '+tesc:''}</div>`:''}${dur?`<div class="q-bp-dur">${dur}</div>`:''}</div><div style="text-align:right"><div class="q-bp-time">${hl||'–'}</div><div class="q-iata">${id2||de}</div><div class="q-bp-city">${de}</div>${fl?`<div style="font-size:9px;color:rgba(45,31,20,0.4);margin-top:1px">${fd(fl)}</div>`:''}</div></div><div class="q-bp-footer"><span class="q-bp-meta">${al||''}${num?' · '+num:''}</span></div></div>`;
    H+=`<div class="qp-page" style="break-before:page">${darkHd('TRANSPORTE AÉREO','Vuelos',d.vuelos.length+' tramo'+( d.vuelos.length>1?'s':''))}<div class="qp-items">`;
    d.vuelos.forEach(v=>{
      const vAiata=v.aerolinea_iata||_extractAirlineIata(v.aerolinea,v.numero);
      let info='';
      if(v.aerolinea)info+=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">${vAiata?`<img src="https://www.gstatic.com/flights/airline_logos/70px/${vAiata}.png" width="28" height="28" style="object-fit:contain;border-radius:6px;background:rgba(${th.rgb},0.07);padding:2px" onerror="this.style.display='none'">`:''}<div><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(45,31,20,0.5)">AEROLÍNEA</div><div style="font-size:13px;font-weight:700;color:#2D1F14">${v.aerolinea}</div></div></div>`;
      info+=rBP(v.mod==='idavuelta'?'IDA':v.mod==='interno'?'INTERNO':'TRAMO',false,v.origen,v.iata_o,v.hs,v.fs,v.destino,v.iata_d,v.hl,v.fl,v.aerolinea,v.numero,v.escala,v.t_escala,v.duracion);
      if(v.mod==='idavuelta'){
        const vOr=v.or2||v.destino||'';const vIo=v.io2||v.iata_d||'';const vDe=v.de2||v.origen||'';const vId=v.id2||v.iata_o||'';
        const retAl=v.al2||v.aerolinea;const retAiata=v.al2_iata||_extractAirlineIata(retAl,v.num2||v.numero);
        if(retAl&&retAl!==v.aerolinea)info+=`<div style="display:flex;align-items:center;gap:10px;margin:8px 0">${retAiata?`<img src="https://www.gstatic.com/flights/airline_logos/70px/${retAiata}.png" width="28" height="28" style="object-fit:contain;border-radius:6px;background:rgba(${th.rgb},0.07);padding:2px" onerror="this.style.display='none'">`:''}<div><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(45,31,20,0.5)">AEROLÍNEA VUELTA</div><div style="font-size:13px;font-weight:700;color:#2D1F14">${retAl}</div></div></div>`;
        info+=rBP('VUELTA',true,vOr,vIo,v.hs2||'',v.fs2||'',vDe,vId,v.hl2||'',v.fl2||'',retAl,v.num2||'',v.esc2||'',v.tesc2||'',v.dur2||'');
      }
      if(v.tarifa||v.equipaje)info+=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${v.tarifa?`<span style="background:${th.primary};color:${th.text};font-size:8px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;text-transform:uppercase">${v.tarifa}</span>`:''}${v.equipaje?`<span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;color:rgba(45,31,20,0.5)">${L(LI.luggage,10,'rgba(45,31,20,0.35)')} ${v.equipaje}</span>`:''}</div>`;
      if(v.precio>0)info+=`<div style="display:flex;justify-content:flex-end;margin-top:10px"><div style="background:rgba(${th.rgb},0.08);border:1px solid rgba(${th.rgb},0.2);border-radius:8px;padding:8px 14px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(${th.rgb},0.7);margin-bottom:2px">PRECIO VUELOS${v.fin?' · '+v.fin:''}</div>${gradPrice(fmtMoney(v.precio,v.moneda),15)}</div></div>`;
      H+=itemCard(null,opBadge(v.opcion),info);
    });
    H+=`</div></div>`;
  }

  // ── HOTELES ──
  const hotOk=(d.hoteles||[]).filter(h=>h.nombre);
  if(hotOk.length){
    const hotCities=[...new Set(hotOk.map(h=>h.ciudad).filter(Boolean))].join(', ');
    const hotDates=hotOk[0]?.checkin?fd(hotOk[0].checkin)+(hotOk[hotOk.length-1].checkout?' – '+fd(hotOk[hotOk.length-1].checkout):''):'';
    H+=`<div class="qp-page" style="break-before:page">${darkHd('ALOJAMIENTO'+(hotCities?' · '+hotCities.toUpperCase():'')+(hotDates?' · '+hotDates:''),'Alojamiento',hotOk.length+' hotel'+(hotOk.length>1?'es':''))}<div class="qp-items">`;
    hotOk.forEach((h)=>{
      const isP=h.tipo==='disney'||h.tipo==='universal';
      const stars=parseInt(h.estrellas)||0;
      const starsHtml=stars>0?`<span style="color:#D4A017">${'★'.repeat(stars)}</span> <span style="font-size:9px;color:rgba(45,31,20,0.45)">${stars} estrellas</span>`:'';
      let info='';
      if(isP){
        info+=`<div style="display:inline-flex;background:${h.tipo==='universal'?'linear-gradient(135deg,#374151,#111827)':'linear-gradient(135deg,#FF8E53,#E65100)'};color:white;font-size:9px;font-weight:800;letter-spacing:1px;padding:3px 10px;border-radius:20px;margin-bottom:8px;text-transform:uppercase">${h.tipo==='universal'?'Universal':'Disney'}</div>`;
        info+=`<div style="font-size:14px;font-weight:700;color:#2D1F14;margin-bottom:8px">${h.nombre}</div>`;
        const chips=[h.hab,h.regimen,stars>0?'★ '+h.estrellas:''].filter(Boolean);
        if(chips.length)info+=`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${chips.map(c=>`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">${c}</span>`).join('')}</div>`;
        if(h.tickets)info+=`<div style="font-size:10px;color:rgba(45,31,20,0.6);margin-bottom:4px">Tickets: ${h.tickets}${h.dias_tkt?' ('+h.dias_tkt+' días)':''}</div>`;
        if(h.parques?.length)info+=`<div style="font-size:10px;color:rgba(45,31,20,0.6);margin-bottom:4px">Parques: ${h.parques.join(', ')}</div>`;
        if(h.beneficios?.length)info+=`<div style="margin-top:6px"><div class="am-grid">${h.beneficios.map(b=>`<span class="am-tag"><span class="ck">✓</span>${b}</span>`).join('')}</div></div>`;
      } else {
        info+=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px"><div><div style="font-size:14px;font-weight:700;color:#2D1F14;line-height:1.2">${h.nombre}</div>${starsHtml?`<div style="margin-top:3px">${starsHtml}</div>`:''}</div>${h.noches?`<div style="background:linear-gradient(135deg,#D4A017,#E8826A);color:white;font-size:9px;font-weight:800;letter-spacing:1px;padding:3px 9px;border-radius:20px;text-transform:uppercase;flex-shrink:0;margin-left:8px;white-space:nowrap">${h.noches} NOCHES</div>`:''}</div>`;
        const chips=[[h.ciudad,h.pais].filter(Boolean).join(', ')?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px;display:inline-flex;align-items:center;gap:3px">${L(LI.pin,9,'rgba(45,31,20,0.4)')} ${[h.ciudad,h.pais].filter(Boolean).join(', ')}</span>`:'',h.ci&&h.co?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">Check-in ${h.ci} · Check-out ${h.co}</span>`:'',h.checkin&&h.checkout&&!h.ci?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">${fd(h.checkin)} → ${fd(h.checkout)}</span>`:'',h.hab?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">${h.hab}</span>`:'',h.regimen?`<span style="font-size:9px;font-weight:600;color:#B45309;background:rgba(212,160,23,0.1);border-radius:4px;padding:2px 8px">${h.regimen}</span>`:''].filter(Boolean);
        if(chips.length)info+=`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${chips.join('')}</div>`;
        const allAm=[...(h.amenities||[]),h.am_x].filter(Boolean);
        if(allAm.length)info+=`<div class="am-grid" style="margin-bottom:8px">${allAm.map(a=>`<span class="am-tag"><span class="ck">✓</span> ${a}</span>`).join('')}</div>`;
      }
      if(h.mp&&h.mp_pr>0){info+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px"><div style="background:#FFF8E3;border:1px solid rgba(212,160,23,0.2);border-radius:8px;padding:10px"><div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(212,160,23,0.7);margin-bottom:4px">Sin plan</div>${gradPrice(fmtMoney(h.precio,h.moneda),14,'linear-gradient(135deg,#D4A017,#E8826A)')}</div><div style="background:#FFF8E3;border:1px solid rgba(212,160,23,0.2);border-radius:8px;padding:10px"><div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(212,160,23,0.7);margin-bottom:4px">${h.mp}</div>${gradPrice(fmtMoney(h.mp_pr,h.mp_cur||h.moneda),14,'linear-gradient(135deg,#D4A017,#E8826A)')}</div></div>`;}
      else if(h.precio>0)info+=`<div style="display:flex;justify-content:flex-end;margin-top:8px"><div style="background:rgba(212,160,23,0.06);border:1px solid rgba(212,160,23,0.2);border-radius:8px;padding:8px 14px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(212,160,23,0.7);margin-bottom:2px">PRECIO ALOJAMIENTO</div>${gradPrice(fmtMoney(h.precio,h.moneda),15,'linear-gradient(135deg,#D4A017,#E8826A)')}</div></div>`;
      if(h.notes){const nl=h.notes.split(/\n/).filter(l=>l.trim());info+=`<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px;margin-top:8px">${nl.map(l=>`<div style="font-size:9px;color:#78350F;display:flex;gap:5px"><span style="color:#D97706">•</span><span>${l.replace(/^\s*[•·\-\*]\s*/,'').trim()}</span></div>`).join('')}</div>`;}
      H+=itemCard(h.foto_url,opBadge(h.opcion),info);
    });
    H+=`</div></div>`;
  }

  // ── TRASLADOS ──
  const trsOk=(d.traslados||[]).filter(t=>t.origen||t.destino);
  if(trsOk.length){
    H+=`<div class="qp-page" style="break-before:page">${darkHd('TRANSFERS Y TRASLADOS','Traslados',trsOk.length+' traslado'+(trsOk.length>1?'s':''))}<div class="qp-items">`;
    trsOk.forEach(t=>{
      let info=`<div style="font-size:14px;font-weight:700;color:#2D1F14;margin-bottom:8px">${t.origen||''}${t.destino?' → '+t.destino:''}</div>`;
      const chips=[t.vehiculo,t.hora?'Recogida: '+t.hora:'',t.prov,t.fecha?fd(t.fecha):''].filter(Boolean);
      if(chips.length)info+=`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${chips.map(c=>`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(232,130,106,0.08);border-radius:4px;padding:2px 8px">${c}</span>`).join('')}</div>`;
      if(t.notas)info+=`<div style="font-size:9px;color:rgba(45,31,20,0.5);margin-bottom:8px">${t.notas}</div>`;
      if(t.precio>0)info+=`<div style="display:flex;justify-content:flex-end"><div style="background:#FFF0EC;border:1px solid rgba(232,130,106,0.2);border-radius:8px;padding:8px 14px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(232,130,106,0.7);margin-bottom:2px">PRECIO</div>${gradPrice(fmtMoney(t.precio,t.moneda),15,'linear-gradient(135deg,#E8826A,#C2185B)')}</div></div>`;
      else info+=`<div style="font-size:10px;font-weight:600;color:#059669">Incluido</div>`;
      H+=itemCard(null,opBadge(t.opcion),info);
    });
    H+=`</div></div>`;
  }

  // ── EXCURSIONES ──
  const excOk=(d.excursiones||[]).filter(e=>e.nombre);
  if(excOk.length){
    H+=`<div class="qp-page" style="break-before:page">${darkHd('EXCURSIONES Y ACTIVIDADES','Excursiones',excOk.length+' actividad'+(excOk.length>1?'es':''))}<div class="qp-items">`;
    excOk.forEach(e=>{
      let info=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px"><div style="font-size:14px;font-weight:700;color:#2D1F14;line-height:1.2">${e.nombre}</div>${e.categoria?`<span style="background:rgba(67,160,71,0.1);color:#43A047;font-size:9px;font-weight:800;letter-spacing:1px;padding:3px 9px;border-radius:20px;text-transform:uppercase;flex-shrink:0;margin-left:8px">${e.categoria}</span>`:''}</div>`;
      const chips=[e.dur?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(67,160,71,0.08);border-radius:4px;padding:2px 8px;display:inline-flex;align-items:center;gap:3px">${L(LI.clock,9,'rgba(67,160,71,0.6)')} ${e.dur}</span>`:'',e.fecha?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">${e.fecha}</span>`:'',e.hora?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">Hora: ${e.hora}</span>`:'',e.prov?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px;display:inline-flex;align-items:center;gap:3px">${L(LI.building,9,'rgba(45,31,20,0.4)')} ${e.prov}</span>`:''].filter(Boolean);
      if(chips.length)info+=`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${chips.join('')}</div>`;
      if(e.desc)info+=`<div style="font-size:10px;line-height:1.7;color:rgba(45,31,20,0.6);margin-bottom:8px">${e.desc}</div>`;
      if(e.punto)info+=`<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:rgba(45,31,20,0.55);margin-bottom:8px">${L(LI.pin,10,'rgba(67,160,71,0.6)')} <strong style="color:#2D1F14">Encuentro:</strong> ${e.punto}</div>`;
      if(e.inc||e.noinc)info+=`<div class="ie-grid" style="margin-top:4px">${e.inc?`<div><div class="ie-ttl" style="color:#059669">${L(LI.check,10,'#059669')} Incluido</div>${e.inc.split(/[,\n]+/).filter(s=>s.trim().length>1).map(x=>`<div class="ie-item"><span>${L(LI.check,9,'#059669')}</span><span>${x.trim()}</span></div>`).join('')}</div>`:``}${e.noinc?`<div><div class="ie-ttl" style="color:#DC2626">${L(LI.xmark,10,'#DC2626')} No incluido</div>${e.noinc.split(/[,\n]+/).filter(s=>s.trim().length>1).map(x=>`<div class="ie-item"><span>${L(LI.xmark,9,'#DC2626')}</span><span>${x.trim()}</span></div>`).join('')}</div>`:``}</div>`;
      if(e.obs)info+=`<div style="font-size:9px;color:rgba(45,31,20,0.5);margin-top:8px;font-style:italic">${e.obs}</div>`;
      if(e.precio>0)info+=`<div style="display:flex;justify-content:flex-end;margin-top:8px"><div style="background:rgba(67,160,71,0.05);border:1px solid rgba(67,160,71,0.2);border-radius:8px;padding:8px 14px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(67,160,71,0.7);margin-bottom:2px">PRECIO TOTAL</div>${gradPrice(fmtMoney(e.precio,e.moneda),15,'linear-gradient(135deg,#43A047,#1B5E20)')}</div></div>`;
      H+=itemCard(e.foto_url,opBadge(e.opcion),info);
    });
    H+=`</div></div>`;
  }

  // ── AUTOS ──
  const autosOk=(d.autos||[]).filter(a=>a.proveedor);
  if(autosOk.length){
    H+=`<div class="qp-page" style="break-before:page">${darkHd('ALQUILER DE AUTOS','Rent a Car',autosOk.length+' vehículo'+(autosOk.length>1?'s':''))}<div class="qp-items">`;
    autosOk.forEach(a=>{
      let info=`<div style="font-size:14px;font-weight:700;color:#2D1F14;margin-bottom:8px">${a.proveedor}${a.categoria?' — '+a.categoria:''}</div>`;
      const retiro=[a.retiro_fecha,a.retiro_hora].filter(Boolean).join(' ');const devol=[a.devolucion_fecha,a.devolucion_hora].filter(Boolean).join(' ');
      const chips=[a.retiro_lugar?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(232,130,106,0.08);border-radius:4px;padding:2px 8px">${'Retiro: '+a.retiro_lugar+(retiro?' '+retiro:'')}</span>`:'',a.devolucion_lugar&&a.devolucion_lugar!==a.retiro_lugar?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">Dev: ${a.devolucion_lugar+(devol?' '+devol:'')}</span>`:'',a.conductor_adicional?`<span class="am-tag"><span class="ck">✓</span> Conductor adicional</span>`:'',a.incluye_seguro?`<span class="am-tag"><span class="ck">✓</span> Seguro incluido</span>`:''].filter(Boolean);
      if(chips.length)info+=`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${chips.join('')}</div>`;
      if(a.notas)info+=`<div style="font-size:9px;color:rgba(45,31,20,0.5);margin-bottom:8px">${a.notas}</div>`;
      if(a.precio>0)info+=`<div style="display:flex;justify-content:flex-end"><div style="background:#FFF0EC;border:1px solid rgba(232,130,106,0.2);border-radius:8px;padding:8px 14px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(232,130,106,0.7);margin-bottom:2px">PRECIO</div>${gradPrice(fmtMoney(a.precio,a.moneda),15,'linear-gradient(135deg,#FF8F00,#E65100)')}</div></div>`;
      H+=itemCard(null,opBadge(a.opcion),info);
    });
    H+=`</div></div>`;
  }

  // ── CRUCEROS ──
  const crucOk=(d.cruceros||[]).filter(c=>c.naviera);
  if(crucOk.length){
    H+=`<div class="qp-page" style="break-before:page">${darkHd('CRUCERO · NAVEGACIÓN','Crucero',crucOk[0].naviera)}<div class="qp-items">`;
    crucOk.forEach(c=>{
      const escalasArr=c.escalas?c.escalas.split(/\n/).filter(s=>s.trim()):[];
      let info=`<div style="font-size:14px;font-weight:700;color:#2D1F14;margin-bottom:8px">${c.naviera}${c.barco?' — '+c.barco:''}</div>`;
      const chips=[c.embarque_puerto&&c.desembarque_puerto?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(14,165,233,0.08);border-radius:4px;padding:2px 8px">${c.embarque_puerto} → ${c.desembarque_puerto}</span>`:'',c.embarque_fecha?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">${c.embarque_fecha}</span>`:'',c.cabina?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">${c.cabina}</span>`:'',c.regimen?`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(45,31,20,0.06);border-radius:4px;padding:2px 8px">${c.regimen}</span>`:''].filter(Boolean);
      if(chips.length)info+=`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${chips.join('')}</div>`;
      if(escalasArr.length)info+=`<div style="margin-bottom:8px"><div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(45,31,20,.4);margin-bottom:4px">PUERTOS DE ESCALA</div><div style="display:flex;flex-wrap:wrap;gap:4px">${escalasArr.map(e=>`<span class="am-tag">${L(LI.pin,9,'#0288D1')} ${e.trim()}</span>`).join('')}</div></div>`;
      if(c.notas)info+=`<div style="font-size:9px;color:rgba(45,31,20,0.4);margin-bottom:8px">${c.notas}</div>`;
      if((c.precio_total||c.precio_pp)>0)info+=`<div style="display:flex;justify-content:flex-end"><div style="background:#E8F4FD;border:1px solid rgba(14,165,233,0.2);border-radius:8px;padding:8px 14px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(14,165,233,0.7);margin-bottom:2px">PRECIO${c.pasajeros>1?' TOTAL':''}</div>${gradPrice(fmtMoney(c.precio_total||c.precio_pp,c.moneda),15,'linear-gradient(135deg,#0288D1,#01579B)')}${c.pasajeros>1&&c.precio_pp>0?`<div style="font-size:8px;color:rgba(45,31,20,.35);margin-top:2px">${fmtMoney(c.precio_pp,c.moneda)}/pax × ${c.pasajeros}</div>`:''}</div></div>`;
      H+=itemCard(null,opBadge(c.opcion),info);
    });
    H+=`</div></div>`;
  }

  // ── SEGURO ──
  if(d.seguro?.nombre){
    H+=`<div class="qp-page" style="break-before:page">${darkHd('ASISTENCIA AL VIAJERO','Cobertura',d.seguro.nombre)}<div class="qp-items"><div class="qp-item-card"><div class="seg-grid">${[[LI.med,'Cobertura médica',d.seguro.cobertura_medica],[LI.luggage,'Equipaje',d.seguro.equipaje_seg],[LI.check,'Preexistencias',d.seguro.preexistencias],[LI.clip,'Beneficios',d.seguro.extra]].filter(r=>r[2]).map(r=>`<div class="seg-cell"><div style="margin-bottom:4px">${L(r[0],14,'#9B7FD4')}</div><div class="lbl2">${r[1]}</div><div class="val">${r[2]}</div></div>`).join('')}</div>${d.seguro.precio>0?`<div class="ptag"><div style="display:inline-flex;flex-direction:column;align-items:flex-end;background:#F0EEF9;border:1px solid rgba(155,127,212,0.2);border-radius:8px;padding:8px 14px"><div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(155,127,212,0.7);margin-bottom:2px">Precio${d.seguro.fin?' · '+d.seguro.fin:''}</div>${gradPrice(fmtMoney(d.seguro.precio,d.seguro.moneda),15,'linear-gradient(135deg,#9B7FD4,#C4B5FD)')}</div></div>`:''}</div></div></div>`;
  }

  // ── TICKETS ──
  const tksOk=(d.tickets||[]).filter(t=>t.nombre);
  if(tksOk.length){
    H+=`<div class="qp-page" style="break-before:page">${darkHd('TICKETS Y ENTRADAS','Tickets',tksOk.length+' entrada'+(tksOk.length>1?'s':''))}<div class="qp-items">`;
    tksOk.forEach(t=>{
      let info=`<div style="font-size:14px;font-weight:700;color:#2D1F14;margin-bottom:8px">${t.nombre}</div>`;
      const chips=[t.tipo,t.prov,t.fecha?fd(t.fecha):''].filter(Boolean);
      if(chips.length)info+=`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${chips.map(c=>`<span style="font-size:9px;color:rgba(45,31,20,0.6);background:rgba(67,160,71,0.08);border-radius:4px;padding:2px 8px">${c}</span>`).join('')}</div>`;
      if(t.desc)info+=`<div style="font-size:9px;color:rgba(45,31,20,0.5);margin-bottom:8px">${t.desc}</div>`;
      if(t.precio>0)info+=`<div style="display:flex;justify-content:flex-end"><div style="background:rgba(67,160,71,0.05);border:1px solid rgba(67,160,71,0.2);border-radius:8px;padding:8px 14px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(67,160,71,0.7);margin-bottom:2px">PRECIO</div>${gradPrice(fmtMoney(t.precio,t.moneda),15)}</div></div>`;
      else info+=`<div style="font-size:10px;font-weight:600;color:#059669">Incluido</div>`;
      H+=itemCard(null,opBadge(t.opcion),info);
    });
    H+=`</div></div>`;
  }

  // ════════════════════════════════════════════════
  // GALERÍA (conditional)
  // ════════════════════════════════════════════════
  const hpKeys=Object.keys(hotelPhotos||{}).filter(k=>(hotelPhotos[k]||[]).some(f=>f?.url));
  if(hpKeys.length){
    const hotNombres=(d.hoteles||[]).map(h=>h.nombre||'Hotel');
    H+=`<div class="qp-page" style="break-before:page">${darkHd('GALERÍA DE FOTOS','Alojamiento','Imágenes de referencia')}<div style="padding:20px 32px">`;
    hpKeys.forEach(hi=>{
      const fotos=(hotelPhotos[hi]||[]).filter(f=>f?.url);
      if(!fotos.length)return;
      H+=`<div style="margin-bottom:20px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(45,31,20,0.4);margin-bottom:10px">${hotNombres[parseInt(hi)]||'Hotel'}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${fotos.map(f=>`<div style="position:relative;aspect-ratio:4/3;overflow:hidden;border-radius:8px"><img src="${f.url}" style="width:100%;height:100%;object-fit:cover;display:block">${f.label?`<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 80%);padding:6px 8px"><span style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.85)">${f.label}</span></div>`:''}</div>`).join('')}</div></div>`;
    });
    H+=`</div></div>`;
  }

  // ════════════════════════════════════════════════
  // RESUMEN ECONÓMICO
  // ════════════════════════════════════════════════
  H+=`<div class="qp-page" style="break-before:page">${darkHd('RESUMEN ECONÓMICO','Condiciones y Precios',pr.validez?'Validez: '+pr.validez:'Válido por 24 horas')}<div style="padding:20px 32px">`;
  const prLines=[
    ...(d.vuelos||[]).filter(v=>v.precio>0).map(v=>`<tr><td style="padding:7px 0;font-size:10px;color:#374151;border-bottom:1px solid rgba(45,31,20,0.05)">Vuelos${v.aerolinea?' · '+v.aerolinea:''}</td><td style="padding:7px 0;text-align:right;font-size:10px;font-weight:700;color:#2D1F14;border-bottom:1px solid rgba(45,31,20,0.05)">${fmtMoney(v.precio,v.moneda)}</td></tr>`),
    ...(d.hoteles||[]).filter(h=>h.nombre&&h.precio>0).map(h=>`<tr><td style="padding:7px 0;font-size:10px;color:#374151;border-bottom:1px solid rgba(45,31,20,0.05)">Alojamiento · ${h.nombre}</td><td style="padding:7px 0;text-align:right;font-size:10px;font-weight:700;color:#2D1F14;border-bottom:1px solid rgba(45,31,20,0.05)">${fmtMoney(h.precio,h.moneda)}</td></tr>`),
    ...(d.traslados||[]).filter(t=>(t.origen||t.destino)&&t.precio>0).map(t=>`<tr><td style="padding:7px 0;font-size:10px;color:#374151;border-bottom:1px solid rgba(45,31,20,0.05)">Traslado: ${t.origen||''}${t.destino?' → '+t.destino:''}</td><td style="padding:7px 0;text-align:right;font-size:10px;font-weight:700;color:#2D1F14;border-bottom:1px solid rgba(45,31,20,0.05)">${fmtMoney(t.precio,t.moneda)}</td></tr>`),
    ...(d.excursiones||[]).filter(e=>e.nombre&&e.precio>0).map(e=>`<tr><td style="padding:7px 0;font-size:10px;color:#374151;border-bottom:1px solid rgba(45,31,20,0.05)">Excursión: ${e.nombre}</td><td style="padding:7px 0;text-align:right;font-size:10px;font-weight:700;color:#2D1F14;border-bottom:1px solid rgba(45,31,20,0.05)">${fmtMoney(e.precio,e.moneda)}</td></tr>`),
    ...(d.autos||[]).filter(a=>a.proveedor&&a.precio>0).map(a=>`<tr><td style="padding:7px 0;font-size:10px;color:#374151;border-bottom:1px solid rgba(45,31,20,0.05)">Auto: ${a.proveedor}${a.categoria?' '+a.categoria:''}</td><td style="padding:7px 0;text-align:right;font-size:10px;font-weight:700;color:#2D1F14;border-bottom:1px solid rgba(45,31,20,0.05)">${fmtMoney(a.precio,a.moneda)}</td></tr>`),
    ...(d.cruceros||[]).filter(c=>c.naviera&&(c.precio_total||c.precio_pp)>0).map(c=>`<tr><td style="padding:7px 0;font-size:10px;color:#374151;border-bottom:1px solid rgba(45,31,20,0.05)">Crucero: ${c.naviera}</td><td style="padding:7px 0;text-align:right;font-size:10px;font-weight:700;color:#2D1F14;border-bottom:1px solid rgba(45,31,20,0.05)">${fmtMoney(c.precio_total||c.precio_pp,c.moneda)}</td></tr>`),
    d.seguro?.precio>0?`<tr><td style="padding:7px 0;font-size:10px;color:#374151;border-bottom:1px solid rgba(45,31,20,0.05)">Asistencia: ${d.seguro.nombre}</td><td style="padding:7px 0;text-align:right;font-size:10px;font-weight:700;color:#2D1F14;border-bottom:1px solid rgba(45,31,20,0.05)">${fmtMoney(d.seguro.precio,d.seguro.moneda)}</td></tr>`:'',
    ...(d.tickets||[]).filter(t=>t.nombre&&t.precio>0).map(t=>`<tr><td style="padding:7px 0;font-size:10px;color:#374151;border-bottom:1px solid rgba(45,31,20,0.05)">Ticket: ${t.nombre}</td><td style="padding:7px 0;text-align:right;font-size:10px;font-weight:700;color:#2D1F14;border-bottom:1px solid rgba(45,31,20,0.05)">${fmtMoney(t.precio,t.moneda)}</td></tr>`),
  ].filter(Boolean);
  if(prLines.length)H+=`<table style="width:100%;border-collapse:collapse;margin-bottom:16px"><thead><tr><th style="text-align:left;padding:0 0 8px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(45,31,20,0.35);border-bottom:2px solid rgba(${th.rgb},0.25)">CONCEPTO</th><th style="text-align:right;padding:0 0 8px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(45,31,20,0.35);border-bottom:2px solid rgba(${th.rgb},0.25)">IMPORTE</th></tr></thead><tbody>${prLines.join('')}</tbody></table>`;
  if(pr.total>0||pr.por_persona>0)H+=`<div style="background:${th.grad};border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.65)">PRECIO TOTAL DEL PAQUETE</div>${pr.cuotas?`<div style="font-size:10px;color:rgba(255,255,255,.75);margin-top:4px">${pr.cuotas}</div>`:''}</div><div style="text-align:right"><div style="font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px">${totalAmt}</div>${pr.por_persona>0&&pr.total>0?`<div style="font-size:9px;color:rgba(255,255,255,.6);margin-top:2px">${fmtMoney(pr.por_persona,pr.moneda)}/pax</div>`:''}</div></div>`;
  if(pr.reserva>0)H+=`<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px"><div style="flex:1;background:#F5F0E8;border:1px solid rgba(45,31,20,0.08);border-radius:10px;padding:12px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(45,31,20,0.4);margin-bottom:4px">RESERVA</div><div style="font-size:14px;font-weight:800;color:#2D1F14">${fmtMoney(pr.reserva,pr.moneda3||pr.moneda)}</div></div>${pr.cancelacion?`<div style="flex:1;background:#F5F0E8;border:1px solid rgba(45,31,20,0.08);border-radius:10px;padding:12px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(45,31,20,0.4);margin-bottom:4px">CANCELACIÓN GRATUITA</div><div style="font-size:14px;font-weight:800;color:#2D1F14">${fd(pr.cancelacion)}</div></div>`:''}</div>`;
  if(pr.tyc){const lines=pr.tyc.split(/\n/).filter(l=>l.trim());H+=`<div class="tyc-box"><div class="tyc-ttl">Aclaraciones y condiciones</div>${lines.map(l=>{const c=l.replace(/^\s*(?:## |=== |[•·\-\*])\s*/,'').trim();if(!c)return'';if(l.match(/^## /))return`<div class="tyc-ttl">${c}</div>`;if(l.match(/^=== /))return`<div class="tyc-cta">${c}</div>`;return`<div class="tyc-item">${L(LI.info,11)}<span>${c}</span></div>`;}).join('')}</div>`;}
  H+=`</div></div>`;

  // ════════════════════════════════════════════════
  // CLOSING PAGE
  // ════════════════════════════════════════════════
  H+=`<div class="qp-closing" style="break-before:page;${closingUrl?`background:url('${closingUrl}') center/cover no-repeat`:''};position:relative">
    ${!closingUrl?`<div style="position:absolute;inset:0;background:linear-gradient(160deg,#0D2B1E 0%,#0A1A12 50%,#0D120F 100%)"></div>`:''}
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.72) 100%);pointer-events:none"></div>
    <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:48px 36px">
      <div style="margin-bottom:36px">${buildPdfWordmark(32)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:40px">
        ${ag.nm?`<div style="text-align:center"><div style="font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${th.accent};margin-bottom:4px">AGENTE</div><div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.3px">${ag.nm}</div></div>`:''}
        ${ag.ag?`<div style="text-align:center"><div style="font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${th.accent};margin-bottom:4px">AGENCIA</div><div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.82)">${ag.ag}</div></div>`:''}
        <div style="width:48px;height:1px;background:rgba(${th.rgb},0.5);margin:4px 0"></div>
        ${ag.em?`<div style="text-align:center"><div style="font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${th.accent};margin-bottom:4px">EMAIL</div><div style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.78)">${ag.em}</div></div>`:''}
        ${ag.tel?`<div style="text-align:center"><div style="font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${th.accent};margin-bottom:4px">WHATSAPP</div><div style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.78)">${ag.tel}</div></div>`:''}
        ${ag.soc?`<div style="text-align:center"><div style="font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${th.accent};margin-bottom:4px">INSTAGRAM</div><div style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.78)">${ag.soc}</div></div>`:''}
      </div>
      <div style="font-size:8px;color:rgba(255,255,255,0.28);text-align:center;letter-spacing:1px;max-width:400px">Esta cotización es confidencial y fue elaborada exclusivamente para ${cl.nombre||'el cliente'}. Precios sujetos a disponibilidad al momento de la reserva.</div>
    </div>
  </div>`;

  H+=`</div>`;
  return H;
}


window.onbeforeprint=()=>{if(qData)document.getElementById('qprint').innerHTML=buildQuoteHTML(qData);};
// ═══════════════════════════════════════════
// TEST DATA LOADER
// ═══════════════════════════════════════════
function loadTestData(){
  if(!confirm('Esto va a reemplazar el contenido actual del formulario con datos de prueba.\n\n¿Continuás?')) return;

  const sv=(id,val)=>{ const e=document.getElementById(id); if(e) e.value=val; };

  // ── CLIENTE ──────────────────────────────
  sv('m-nombre',  'Martínez, Hugo Darío');
  sv('m-cel',     '+54 9 11 5555-7890');
  sv('m-email',   'hugo.martinez@gmail.com');
  sv('m-adu',     '2');
  sv('m-nin',     '1');
  sv('m-inf',     '0');

  // ── VIAJE ─────────────────────────────────
  sv('m-dest',    'Orlando, Florida');
  sv('m-pais',    'USA');
  sv('m-sal',     '2025-09-30');
  sv('m-reg',     '2025-10-13');
  sv('m-estado',  'borrador');
  sv('m-ref',     '88240731');
  sv('m-notas',   'Cliente VIP — solicita habitación piso alto. Niño de 8 años. Viaja por primera vez a Disney.');

  // ── LIMPIAR BLOQUES DINÁMICOS ──────────────
  document.getElementById('vuelos-cont').innerHTML='';     vc=0;
  document.getElementById('hoteles-cont').innerHTML='';    hc=0;
  const tCont=document.getElementById('traslados-cont');   if(tCont){ tCont.innerHTML=''; tc=0; }
  const eCont=document.getElementById('excursiones-cont'); if(eCont){ eCont.innerHTML=''; ec=0; }
  const tkCont=document.getElementById('tickets-cont');    if(tkCont) tkCont.innerHTML='';

  // ── VUELO IDA Y VUELTA ─────────────────────
  addVuelo({
    mod:        'idavuelta',
    aerolinea:  'American Airlines',
    numero:     'AA 930',
    origen:     'Buenos Aires (EZE)',
    iata_o:     'EZE',
    fs:         '2025-09-30',
    hs:         '23:55',
    fl:         '2025-10-01',
    hl:         '08:20',
    destino:    'Orlando (MCO)',
    iata_d:     'MCO',
    escala:     'Miami (MIA)',
    t_escala:   '1h 40min',
    duracion:   '13h 25min',
    tarifa:     'Economy',
    precio:     1985,
    fin:        'Contado / 12 cuotas sin interés',
    comision:   120,
    // vuelta
    al2:        'American Airlines',
    num2:       'AA 931',
    or2:        'Orlando (MCO)',
    io2:        'MCO',
    fs2:        '2025-10-13',
    hs2:        '10:45',
    fl2:        '2025-10-14',
    hl2:        '06:15',
    de2:        'Buenos Aires (EZE)',
    id2:        'EZE',
    esc2:       'Miami (MIA)',
    tesc2:      '2h 05min',
    dur2:       '14h 30min',
  });

  // ── HOTEL ─────────────────────────────────
  addHotel({
    nombre:   "Disney's All-Star Sports Resort",
    tipo:     'disney',
    estrellas:'3',
    ci:       '2025-10-01',
    co:       '2025-10-08',
    noches:   7,
    hab:      'Standard Room (3 personas)',
    regimen:  'Sin desayuno',
    precio:   2717,
    comision: 200,
  });
  // Set hotel extra fields after DOM is created (hc is now 1)
  sv('h1-tkt',  '4 Park Magic Ticket');
  sv('h1-tktd', '4');
  sv('h1-notes','Early Park Entry incluido · Transporte gratuito a todos los parques · Solicitar habitación renovada');

  // ── TRASLADO ──────────────────────────────
  addTraslado({
    tipo:     'in',
    origen:   'Aeropuerto MCO',
    destino:  "Disney's All-Star Sports Resort",
    fecha:    '2025-10-01',
    hora:     '09:00',
    vehiculo: 'Van privada',
    precio:   65,
    notas:    'Proveedor Orlantours · Se abona en efectivo al llegar',
    comision: 10,
  });
  // Set prov as free text (select won't match, use input field)
  const tSel=document.getElementById('t1-sel');
  const tInp=document.getElementById('t1-inp');
  if(tSel && tInp){
    tSel.value='__otro__'; tInp.value='Orlantours'; tInp.style.display='';
  }

  // ── EXCURSIÓN ─────────────────────────────
  addExcursion({
    nombre:   'Kennedy Space Center',
    categoria:'Tour cultural',
    fecha:    '2025-10-05',
    hora:     '09:00',
    dur:      '6-7 horas',
    precio:   180,
    punto:    'Lobby del hotel a las 08:45 AM',
    inc:      'Transporte ida y vuelta desde el hotel · Entrada general al complejo · Guía en español',
    noinc:    'Almuerzo · Experiencias especiales (adicionales en el lugar)',
    desc:     'Visitá las instalaciones de la NASA, el Atlantis Space Shuttle, la sala IMAX y el Apollo Saturn V Center. Una experiencia única para toda la familia.',
    obs:      'Ropa cómoda y calzado deportivo · Protector solar recomendado',
    comision: 20,
  });
  const eInp=document.getElementById('e1-inp');
  const eSel=document.getElementById('e1-sel');
  if(eSel && eInp){ eSel.value='__otro__'; eInp.value='Visit Orlando Tours'; eInp.style.display=''; }

  // ── SEGURO ────────────────────────────────
  sv('seg-nm',     'PAX Assistance Gold');
  sv('seg-med',    'USD 100.000');
  sv('seg-eq',     'USD 2.000');
  sv('seg-pre',    'No cubre');
  sv('seg-dias',   '14');
  sv('seg-cur',    'USD');
  sv('seg-precio', '385');
  sv('seg-fin',    'incluido en el total');
  sv('seg-extra',  'Cobertura COVID · Cancelación por enfermedad · Asistencia telefónica 24hs');
  sv('seg-com',    '35');
  sv('seg-com-cur','USD');

  // ── PRECIOS ───────────────────────────────
  sv('p-cur',  'USD');
  sv('p-pp',   '2176');
  sv('p-cur2', 'USD');
  sv('p-tot',  '4352');
  sv('p-cur3', 'USD');
  sv('p-res',  '500');
  sv('p-cuo',  '12 cuotas sin interés en Visa/Mastercard');
  sv('p-can',  'Sin cargo hasta 45 días antes del viaje · 50% del total entre 44 y 20 días · Sin reembolso con menos de 20 días');
  sv('p-val',  '48 horas');
  sv('p-tyc',  'Precios sujetos a disponibilidad y variación de tipo de cambio al momento del abono. Cotización incluye impuestos de embarque. No incluye tasas de ingreso a parques adicionales ni gastos personales.');

  // ── LIMPIAR DRAFT Y ESTADO DE EDICIÓN ─────
  formDraft = null;
  editingQuoteId = null;
  // Limpiar m-ref para que genere un ref nuevo al guardar
  const refInput = document.getElementById('m-ref');
  if(refInput) refInput.value = '';
  _hideEditBanner();

  toast('Datos de prueba cargados — revisá el formulario');
  // Scroll to top of form
  document.getElementById('tab-form')?.scrollIntoView({behavior:'smooth', block:'start'});
}

