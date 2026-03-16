function fmtMoney(n,cur){if(!n||n===0)return'';return(cur||'USD')+' '+Number(n).toLocaleString('es-AR');}

// ─── Wordmark dinámico — DM Sans 900 + X custom path ─────────────────────────
function buildPdfWordmark(fontSize){
  const X='M8 8 L8 18 L24.5 32 L8 46 L8 56 L20 56 L32 43.5 L44 56 L56 56 L56 46 L39.5 32 L56 18 L56 8 L44 8 L32 20.5 L20 8 Z';
  const G=['#4F46E5','#7C3AED','#F43F5E'];
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
  const today=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'}).toUpperCase();
  const pr=d.precios||{},cl=d.cliente||{},vi=d.viaje||{};
  const ini=(ag.nm||'M').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'M';

  // Helper Lucide SVG: L(pathContent, size, stroke)
  const L=(p,sz=15,col='#7C3AED')=>`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const LI={
    pin:     `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`,
    hotel:   `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>`,
    plane:   `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-1-5.5.5L10 6 1.8 6.2c-.5.1-.9.6-.9 1.1l1 4c.1.5.5.8 1 .8L8 12l-2 2-1 1 1 1 2 2 1 1 1-1 2-2 .2 5.1c0 .5.3.9.8 1l4 1c.5.1 1-.3 1.1-.9L17.8 19.2z"/>`,
    ticket:  `<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>`,
    bus:     `<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`,
    moon:    `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
    shield:  `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
    clip:    `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>`,
    luggage: `<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="12" y1="12" x2="12.01" y2="12"/>`,
    check:   `<polyline points="20 6 9 17 4 12"/>`,
    xmark:   `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
    arrow:   `<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`,
    building:`<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    map:     `<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15"/><path d="M15 6v15"/>`,
    med:     `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`,
    info:    `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
  };

  // Helper: precio en gradiente (inline — para evitar conflictos con dark theme)
  const gradPrice=(amt,sz=15)=>amt?`<div style="font-size:${sz}px;font-weight:900;background:linear-gradient(90deg,#818CF8,#A855F7,#F43F5E);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2">${amt}</div>`:'';

  // Gloss items
  const gloss=[
    {n:vi.destino?1:0,         l:'Destinos',      i:LI.pin},
    {n:(d.hoteles||[]).filter(h=>h.nombre).length, l:'Alojamientos',i:LI.hotel},
    {n:(d.vuelos||[]).length,  l:'Vuelos',         i:LI.plane},
    {n:(d.excursiones||[]).filter(e=>e.nombre).length,l:'Excursiones',i:LI.ticket},
    {n:(d.tickets||[]).filter(t=>t.nombre).length, l:'Tickets',     i:LI.ticket},
    {n:(d.traslados||[]).filter(t=>t.origen||t.destino).length,l:'Transfers',i:LI.bus},
    {n:vi.noches||0,           l:'Noches',         i:LI.moon},
    {n:d.seguro?.nombre?1:0,   l:'Seguros',        i:LI.shield},
  ].filter(g=>g.n>0);

  // ── PORTADA ────────────────────────────────────────────────────────────────
  let H=`<div id="qwrap">
  <div class="q-cover">
    ${coverUrl?`<img class="q-cover-img" src="${coverUrl}" alt="">`:''}
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(9,0,15,.2) 0%,rgba(9,0,15,.5) 50%,rgba(9,0,15,.92) 100%);pointer-events:none"></div>
    <div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 50% 100%,rgba(79,70,229,.2) 0%,transparent 60%)"></div>
    <div style="position:absolute;top:0;left:0;right:0;padding:20px 32px;display:flex;justify-content:space-between;align-items:center;z-index:1">
      <div>${buildPdfWordmark(22)}</div>
      <div style="display:flex;align-items:center;gap:9px">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#4F46E5,#F43F5E);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white;flex-shrink:0">${ini}</div>
        ${ag.ag||ag.nm?`<span style="font-size:11px;font-weight:600;color:white;opacity:.85">${ag.ag||ag.nm}</span>`:''}
      </div>
    </div>
    <div style="position:absolute;bottom:28px;left:32px;right:32px;z-index:1">
      ${cl.nombre?`<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:100px;padding:5px 14px;margin-bottom:14px;font-size:11px;font-weight:700;color:white;letter-spacing:0.5px">COTIZACIÓN PARA &nbsp;<span style="color:#C4B5FD;font-weight:800">${cl.nombre}</span></div>`:''}
      <div style="font-size:8px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:8px">SU VIAJE A</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:44px;font-weight:900;letter-spacing:-2px;color:#FFFFFF;line-height:1">${vi.destino||'Destino'}${vi.pais?', '+vi.pais:''}</div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.35);margin-top:8px">Ref ID: ${d.refId||'—'} · ${today}</div>
    </div>
  </div>

  <!-- ── BARRA DE DATOS ── -->
  <div class="q-bar">
    <div>
      <div class="qb-l">PRESUPUESTO</div>
      ${cl.nombre?`<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.9);margin-bottom:2px">${cl.nombre}</div>`:''}
      <div class="qb-v">${cl.pasajeros||'—'}</div>
      ${vi.salida&&vi.regreso?`<div style="font-size:9px;color:rgba(255,255,255,.35);margin-top:1px">${vi.salida} – ${vi.regreso}${vi.noches?' ('+vi.noches+' noches)':''}</div>`:''}
    </div>
    <div>
      <div class="qb-l">VALIDEZ</div>
      <div class="qb-v">${pr.validez||'24 horas'}</div>
    </div>
    <div>
      <div class="qb-l">REF</div>
      <div class="qb-v q-ref-val">${d.refId||'—'}</div>
    </div>
  </div>`;

  // ── GLOSS ──────────────────────────────────────────────────────────────────
  if(gloss.length){
    H+=`<div class="q-gloss">
      <span class="q-gloss-l">INCLUYE:</span>
      ${gloss.map(g=>`<div class="qg-item">${L(g.i,11)}<span class="qg-n">&nbsp;${g.n}&nbsp;</span><span class="qg-l">${g.l}</span></div>`).join('')}
    </div>`;
  }

  // ── DESCRIPCIÓN ────────────────────────────────────────────────────────────
  H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">${L(LI.clip)}</div><div><div class="q-sec-ttl">Descripción del viaje</div></div></div>`;
  if((d.vuelos||[]).length)H+=`<div class="desc-item">${L(LI.plane,12,'rgba(0,0,0,.35)')}<span><strong style="color:#09000F">Transporte aéreo:</strong> ${d.vuelos[0].origen} → ${d.vuelos[d.vuelos.length-1].destino||d.vuelos[0].destino}</span></div>`;
  (d.hoteles||[]).filter(h=>h.nombre).forEach(h=>H+=`<div class="desc-item">${L(LI.hotel,12,'rgba(0,0,0,.35)')}<span><strong style="color:#09000F">${h.noches?h.noches+' noches':'Hotel'}:</strong> ${h.nombre}${h.regimen?', '+h.regimen:''}.</span></div>`);
  (d.excursiones||[]).filter(e=>e.nombre).forEach(e=>H+=`<div class="desc-item">${L(LI.ticket,12,'rgba(0,0,0,.35)')}<span><strong style="color:#09000F">Excursión:</strong> ${e.nombre}</span></div>`);
  (d.tickets||[]).filter(t=>t.nombre).forEach(t=>H+=`<div class="desc-item">${L(LI.ticket,12,'rgba(0,0,0,.35)')}<span><strong style="color:#09000F">Ticket:</strong> ${t.nombre}</span></div>`);
  (d.traslados||[]).filter(t=>t.origen||t.destino).forEach(t=>H+=`<div class="desc-item">${L(LI.bus,12,'rgba(0,0,0,.35)')}<span><strong style="color:#09000F">Traslado:</strong> ${t.origen||''}${t.destino?' → '+t.destino:''}${t.vehiculo?' en '+t.vehiculo:''}.</span></div>`);
  if(d.seguro?.nombre)H+=`<div class="desc-item">${L(LI.shield,12,'rgba(0,0,0,.35)')}<span><strong style="color:#09000F">Seguro:</strong> ${d.seguro.nombre}</span></div>`;
  H+=`</div>`;

  // ── VUELOS ─────────────────────────────────────────────────────────────────
  if((d.vuelos||[]).length){
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">${L(LI.plane)}</div><div><div class="q-sec-ttl">Vuelos</div></div></div>`;
    const rBP=(label,isRet,or,io,hs,fs,de,id2,hl,fl,al,num,esc,tesc,dur)=>`
    <div class="q-bp">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:10px;font-weight:700;color:#374151">${or} → ${de}</span>
        <span class="q-bp-chip${isRet?' ret':''}">${label}</span>
      </div>
      <div class="q-bp-grid">
        <div>
          <div class="q-bp-time">${hs||'–'}</div>
          <div class="q-iata">${io||or}</div>
          <div class="q-bp-city">${or}</div>
          ${fs?`<div style="font-size:9px;color:rgba(0,0,0,.35);margin-top:1px">${fd(fs)}</div>`:''}
        </div>
        <div class="q-bp-mid">
          <div class="q-bp-escl">${esc?'con escala':'directo'}</div>
          <div class="q-bp-line"></div>
          ${esc?`<div class="q-bp-via">${L(LI.arrow,8)} ${esc}${tesc?' · '+tesc:''}</div>`:''}
          ${dur?`<div class="q-bp-dur">${dur}</div>`:''}
        </div>
        <div style="text-align:right">
          <div class="q-bp-time">${hl||'–'}</div>
          <div class="q-iata">${id2||de}</div>
          <div class="q-bp-city">${de}</div>
          ${fl?`<div style="font-size:9px;color:rgba(0,0,0,.35);margin-top:1px">${fd(fl)}</div>`:''}
        </div>
      </div>
      <div class="q-bp-footer">
        <span class="q-bp-meta">${al||''}${num?' · '+num:''}</span>
        ${gradPrice('',0)}
      </div>
    </div>`;
    d.vuelos.forEach(v=>{
      H+=rBP(v.mod==='idavuelta'?'IDA':v.mod==='interno'?'INTERNO':'TRAMO',false,v.origen,v.iata_o,v.hs,v.fs,v.destino,v.iata_d,v.hl,v.fl,v.aerolinea,v.numero,v.escala,v.t_escala,v.duracion);
      if(v.mod==='idavuelta'){
        const vOr=v.or2||v.destino||'';const vIo=v.io2||v.iata_d||'';
        const vDe=v.de2||v.origen||'';const vId=v.id2||v.iata_o||'';
        H+=rBP('VUELTA',true,vOr,vIo,v.hs2||'',v.fs2||'',vDe,vId,v.hl2||'',v.fl2||'',v.al2||v.aerolinea,v.num2||'',v.esc2||'',v.tesc2||'',v.dur2||'');
      }
      if(v.tarifa||v.equipaje)H+=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${v.tarifa?`<span style="background:#7C3AED;color:white;font-size:7px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;text-transform:uppercase">${v.tarifa}</span>`:''}
        ${v.equipaje?`<span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;color:rgba(0,0,0,.45)">${L(LI.luggage,10,'rgba(0,0,0,.35)')} ${v.equipaje}</span>`:''}
      </div>`;
      if(v.precio>0)H+=`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio vuelos${v.fin?' · '+v.fin:''}</div><div class="ptag-v">${fmtMoney(v.precio,v.moneda)}</div></div></div>`;
    });
    H+=`</div>`;
  }

  // ── HOTELES ────────────────────────────────────────────────────────────────
  (d.hoteles||[]).filter(h=>h.nombre).forEach(h=>{
    const isP=h.tipo==='disney'||h.tipo==='universal';
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">${L(isP?LI.building:LI.hotel)}</div><div><div class="q-sec-ttl">${h.nombre}</div><div class="q-sec-sub">${[h.ci&&h.co?h.ci+' – '+h.co:'',h.noches?h.noches+' noches':''].filter(Boolean).join(' · ')}</div></div></div>`;
    if(isP){
      H+=`<div style="display:inline-flex;align-items:center;gap:5px;background:${h.tipo==='universal'?'#111':'linear-gradient(135deg,#4F46E5,#7C3AED)'};color:white;font-size:7px;font-weight:800;letter-spacing:1px;padding:3px 10px;border-radius:20px;margin-bottom:10px;text-transform:uppercase">${h.tipo==='universal'?'Paquete Universal':'Paquete Disney'}</div>`;
      H+=`<div class="q-card" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          ${h.hab?`<span style="font-size:10px;font-weight:600;color:#374151">${h.hab}</span>`:''}
          ${h.regimen?`<span class="am-tag">${h.regimen}</span>`:''}
          ${h.estrellas&&h.estrellas!=='—'?`<span style="font-size:10px">⭐ ${h.estrellas}</span>`:''}
        </div>`;
      if(h.tickets)H+=`<div class="desc-item">${L(LI.ticket,11,'rgba(0,0,0,.35)')}<span><strong style="color:#09000F">Tickets:</strong> ${h.tickets}${h.dias_tkt?' ('+h.dias_tkt+' días)':''}</span></div>`;
      if(h.parques?.length)H+=`<div class="desc-item">${L(LI.map,11,'rgba(0,0,0,.35)')}<span><strong style="color:#09000F">Parques:</strong> ${h.parques.join(', ')}</span></div>`;
      if(h.beneficios?.length)H+=`<div style="margin-top:8px"><div class="am-grid">${h.beneficios.map(b=>`<span class="am-tag"><span class="ck">✓</span>${b}</span>`).join('')}</div></div>`;
      H+=`</div>`;
      if(h.mp&&h.mp_pr>0){
        H+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
          <div style="background:#F7F4FF;border:1px solid #EDE9FE;border-radius:8px;padding:12px">
            <div style="font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(0,0,0,.3);margin-bottom:4px">Sin plan de comidas</div>
            ${gradPrice(fmtMoney(h.precio,h.moneda))}
          </div>
          <div style="background:#F7F4FF;border:1px solid #EDE9FE;border-radius:8px;padding:12px">
            <div style="font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(0,0,0,.3);margin-bottom:4px">${h.mp}</div>
            ${gradPrice(fmtMoney(h.mp_pr,h.mp_cur||h.moneda))}
          </div>
        </div>`;
        if(h.mp_desc){const lines=h.mp_desc.split(/\n/).filter(l=>l.trim());H+=`<div style="background:#F7F4FF;border-radius:0 8px 8px 0;border-left:2px solid #7C3AED;padding:12px;margin-top:8px">${lines.map(l=>{const c=l.replace(/^\s*[•·\-\*]\s*/,'').trim();return l.match(/^[🎃👉]/)?`<div style="font-size:11px;font-weight:700;color:#09000F;margin:8px 0 4px">${c}</div>`:`<div style="font-size:10px;color:rgba(0,0,0,.5);margin-bottom:2px;display:flex;gap:6px"><span style="color:#7C3AED;font-weight:700">✓</span><span>${c}</span></div>`;}).join('')}</div>`;}
      } else if(h.precio>0){
        H+=`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio</div><div class="ptag-v">${fmtMoney(h.precio,h.moneda)}</div></div></div>`;
      }
      if(h.notes){const nl=h.notes.split(/\n/).filter(l=>l.trim());H+=`<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px;margin-top:8px">${nl.map(l=>{const c=l.replace(/^\s*[•·\-\*]\s*/,'').trim();return l.match(/^[🎃👉🎪✨]/)?`<div style="font-size:11px;font-weight:700;color:#09000F;margin:6px 0 4px">${c}</div>`:`<div style="font-size:10px;color:#78350F;margin-bottom:2px;display:flex;gap:5px"><span style="color:#D97706">•</span><span>${c}</span></div>`;}).join('')}</div>`;}
    } else {
      const allAm=[...(h.amenities||[]),h.am_x].filter(Boolean);
      H+=`<div class="q-card">
        <div class="q-card-l">
          <div class="q-card-nm">${h.nombre}</div>
          <div class="q-card-dt">${[h.hab,h.regimen,h.noches?h.noches+' noches':'',h.ci&&h.co?h.ci+' – '+h.co:''].filter(Boolean).join(' · ')}</div>
          ${h.estrellas&&h.estrellas!=='—'?`<div style="font-size:9px;margin-top:4px">⭐ ${h.estrellas} estrellas</div>`:''}
          ${allAm.length?`<div class="am-grid">${allAm.map(a=>`<span class="am-tag"><span class="ck">✓</span> ${a}</span>`).join('')}</div>`:''}
        </div>
        ${h.precio>0?`<div class="q-card-r"><div class="q-card-pl">Precio</div>${gradPrice(fmtMoney(h.precio,h.moneda),15)}</div>`:''}
      </div>`;
    }
    H+=`</div>`;
  });

  // ── EXCURSIONES ────────────────────────────────────────────────────────────
  (d.excursiones||[]).filter(e=>e.nombre).forEach(e=>{
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">${L(LI.ticket)}</div><div><div class="q-sec-ttl">${e.nombre}</div><div class="q-sec-sub">${[e.categoria,e.fecha,e.dur].filter(Boolean).join(' · ')}</div></div></div>`;
    H+=`<div class="q-card" style="flex-direction:column;align-items:stretch">
      ${e.desc?`<div style="font-size:10px;line-height:1.65;color:rgba(0,0,0,.55);margin-bottom:10px">${e.desc}</div>`:''}
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:${(e.inc||e.noinc)?'0':'0'}">
        ${e.prov?`<div style="font-size:9px;color:rgba(0,0,0,.45);display:flex;align-items:center;gap:4px">${L(LI.building,10,'rgba(0,0,0,.3)')} ${e.prov}</div>`:''}
        ${e.punto?`<div style="font-size:9px;color:rgba(0,0,0,.45);display:flex;align-items:center;gap:4px">${L(LI.pin,10,'rgba(0,0,0,.3)')} ${e.punto}</div>`:''}
      </div>`;
    if(e.inc||e.noinc){
      H+=`<div class="ie-grid" style="margin-top:10px">
        ${e.inc?`<div><div class="ie-ttl" style="color:#059669">${L(LI.check,10,'#059669')} Incluido</div>${e.inc.split(/[,\n]+/).filter(s=>s.trim().length>1).map(x=>`<div class="ie-item"><span>${L(LI.check,9,'#059669')}</span><span>${x.trim()}</span></div>`).join('')}</div>`:``}
        ${e.noinc?`<div><div class="ie-ttl" style="color:#DC2626">${L(LI.xmark,10,'#DC2626')} No incluido</div>${e.noinc.split(/[,\n]+/).filter(s=>s.trim().length>1).map(x=>`<div class="ie-item"><span>${L(LI.xmark,9,'#DC2626')}</span><span>${x.trim()}</span></div>`).join('')}</div>`:``}
      </div>`;
    }
    if(e.precio>0)H+=`<div style="display:flex;justify-content:flex-end;margin-top:8px"><div class="ptag-box"><div class="ptag-l">Precio total</div><div class="ptag-v">${fmtMoney(e.precio,e.moneda)}</div></div></div>`;
    H+=`</div></div>`;
  });

  // ── TRASLADOS ──────────────────────────────────────────────────────────────
  const trsOk=(d.traslados||[]).filter(t=>t.origen||t.destino);
  if(trsOk.length){
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">${L(LI.bus)}</div><div><div class="q-sec-ttl">Traslados</div></div></div>`;
    trsOk.forEach(t=>{
      H+=`<div class="q-card">
        <div class="q-card-l">
          <div class="q-card-nm">${t.origen||''}${t.destino?' → '+t.destino:''}</div>
          <div class="q-card-dt">${[t.vehiculo,t.hora?'Recogida: '+t.hora:'',t.prov].filter(Boolean).join(' · ')}</div>
          ${t.notas?`<div style="font-size:9px;color:rgba(0,0,0,.4);margin-top:2px">${t.notas}</div>`:''}
        </div>
        <div class="q-card-r">
          ${t.precio>0?`<div class="q-card-pl">Precio</div>${gradPrice(fmtMoney(t.precio,t.moneda),14)}`:`<div style="font-size:10px;font-weight:600;color:#059669">Incluido</div>`}
        </div>
      </div>`;
    });
    H+=`</div>`;
  }

  // ── SEGURO ─────────────────────────────────────────────────────────────────
  if(d.seguro?.nombre){
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">${L(LI.shield)}</div><div><div class="q-sec-ttl">Asistencia al viajero — ${d.seguro.nombre}</div></div></div>
    <div class="seg-grid">${[
      [LI.med,'Cobertura médica',d.seguro.cobertura_medica],
      [LI.luggage,'Equipaje',d.seguro.equipaje_seg],
      [LI.check,'Preexistencias',d.seguro.preexistencias],
      [LI.clip,'Beneficios',d.seguro.extra]
    ].filter(r=>r[2]).map(r=>`<div class="seg-cell"><div style="margin-bottom:4px">${L(r[0],14,'#7C3AED')}</div><div class="lbl2">${r[1]}</div><div class="val">${r[2]}</div></div>`).join('')}</div>
    ${d.seguro.precio>0?`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio${d.seguro.fin?' · '+d.seguro.fin:''}</div><div class="ptag-v">${fmtMoney(d.seguro.precio,d.seguro.moneda)}</div></div></div>`:''}
    </div>`;
  }

  // ── TICKETS ────────────────────────────────────────────────────────────────
  const tksOk=(d.tickets||[]).filter(t=>t.nombre);
  if(tksOk.length){
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">${L(LI.ticket)}</div><div><div class="q-sec-ttl">Tickets y Entradas</div></div></div>`;
    tksOk.forEach(t=>{
      H+=`<div class="q-card">
        <div class="q-card-l">
          <div class="q-card-nm">${t.nombre}</div>
          <div class="q-card-dt">${[t.tipo,t.prov,t.fecha?fd(t.fecha):''].filter(Boolean).join(' · ')}</div>
          ${t.desc?`<div style="font-size:9px;color:rgba(0,0,0,.4);margin-top:2px">${t.desc}</div>`:''}
        </div>
        <div class="q-card-r">
          ${t.precio>0?`<div class="q-card-pl">Precio</div>${gradPrice(fmtMoney(t.precio,t.moneda),14)}`:`<div style="font-size:10px;font-weight:600;color:#059669">Incluido</div>`}
        </div>
      </div>`;
    });
    H+=`</div>`;
  }

  // ── T&C ────────────────────────────────────────────────────────────────────
  if(pr.tyc){
    const lines=pr.tyc.split(/\n/).filter(l=>l.trim());
    H+=`<div class="tyc-box">
      <div class="tyc-ttl">Aclaraciones y condiciones</div>
      ${lines.map(l=>{
        const c=l.replace(/^\s*[•·\-\*📄✨]\s*/,'').trim();
        if(!c)return'';
        if(l.match(/^📄/))return`<div class="tyc-ttl">${c}</div>`;
        if(l.match(/^✨/))return`<div class="tyc-cta">${c}</div>`;
        return`<div class="tyc-item">${L(LI.info,11)}<span>${c}</span></div>`;
      }).join('')}
    </div>`;
  }

  // ── TOTAL ──────────────────────────────────────────────────────────────────
  const totalAmt=pr.total>0?fmtMoney(pr.total,pr.moneda2):pr.por_persona>0?fmtMoney(pr.por_persona,pr.moneda)+'/pax':'—';
  H+=`<div class="q-total">
    <div class="q-total-l">
      <div class="tl">Precio total del paquete</div>
      ${pr.reserva>0?`<div class="detail">Reserva: ${fmtMoney(pr.reserva,pr.moneda3)}${pr.cuotas?' · '+pr.cuotas:''}</div>`:''}
      ${pr.cancelacion?`<div class="detail">Cancelación gratuita hasta: ${fd(pr.cancelacion)}</div>`:''}
      <div class="detail">Válida por ${pr.validez||'24 horas'}</div>
    </div>
    <div class="q-total-r">
      <div class="q-total-amt">${totalAmt}</div>
      ${pr.cuotas?`<div class="q-total-cuotas">${pr.cuotas}</div>`:''}
    </div>
  </div>

  <!-- ── FOOTER AGENTE ── -->
  <div class="q-agent">
    ${logoUrl?`<img src="${logoUrl}" style="height:40px;max-width:100px;object-fit:contain;border-radius:50%;flex-shrink:0" alt="logo">`:`<div class="q-agent-av">${ini}</div>`}
    <div>
      <div class="q-agent-nm">${ag.nm||'Tu Agente'}</div>
      ${ag.ag?`<div class="q-agent-ag">${ag.ag}</div>`:''}
      <div class="q-agent-ct">${[ag.em,ag.tel,ag.soc].filter(Boolean).join('  ·  ')}</div>
    </div>
    <div style="margin-left:auto;text-align:right;opacity:.55">
      <div style="font-size:7px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(0,0,0,.3);margin-bottom:3px">powered by</div>
      <div style="font-size:11px;font-weight:800;color:#7C3AED;letter-spacing:-.3px">ermix</div>
    </div>
  </div>
  </div>`;
  return H;
}

window.onbeforeprint=()=>{if(qData)document.getElementById('qprint').innerHTML=buildQuoteHTML(qData);};
// ═══════════════════════════════════════════
// TEST DATA LOADER
// ═══════════════════════════════════════════
function loadTestData(){
  if(!confirm('⚠️ Esto va a reemplazar el contenido actual del formulario con datos de prueba.\n\n¿Continuás?')) return;

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

  toast('🎲 Datos de prueba cargados — revisá el formulario');
  // Scroll to top of form
  document.getElementById('tab-form')?.scrollIntoView({behavior:'smooth', block:'start'});
}

