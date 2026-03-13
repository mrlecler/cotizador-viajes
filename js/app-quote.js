function fmtMoney(n,cur){if(!n||n===0)return'';return(cur||'USD')+' '+Number(n).toLocaleString('es-AR');}
function buildQuoteHTML(d){
  const ag=agCfg;const today=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'}).toUpperCase();
  const pr=d.precios||{},cl=d.cliente||{},vi=d.viaje||{};
  const ini=(ag.nm||'M').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'M';
  const gloss=[{n:vi.destino?1:0,l:'Destinos',i:'📍'},{n:(d.hoteles||[]).filter(h=>h.nombre).length,l:'Alojamientos',i:'🏨'},{n:(d.vuelos||[]).length,l:'Vuelos',i:'✈️'},{n:(d.excursiones||[]).filter(e=>e.nombre).length,l:'Excursiones',i:'🎟️'},{n:(d.tickets||[]).filter(t=>t.nombre).length,l:'Tickets',i:'🎫'},{n:(d.traslados||[]).filter(t=>t.origen||t.destino).length,l:'Transfers',i:'🚐'},{n:vi.noches||0,l:'Noches',i:'🌙'},{n:d.seguro?.nombre?1:0,l:'Seguros',i:'🛡️'}].filter(g=>g.n>0);

  let H=`<div id="qwrap" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 6px 40px rgba(12,30,60,.15);max-width:900px;margin:0 auto">
  <div class="q-cover">
    ${coverUrl?`<img class="q-cover-img" src="${coverUrl}" alt="">`:''}
    <div class="q-cover-ov"></div>
    <div class="q-topbar">
      <div>
        <div style="font-size:.58rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4)">SU VIAJE A</div>
        <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:1.1rem;font-weight:700;color:white;line-height:1.1;margin-top:2px">${(vi.destino||'')+(vi.pais?', '+vi.pais:'')}</div>
      </div>
      ${logoUrl?`<img class="q-logo-img" src="${logoUrl}" alt="logo">`:`<div class="q-logo-txt">${ag.ag||ag.nm||'Magic Planner'}</div>`}
    </div>
    <div class="q-cover-bot">
      ${cl.nombre?`<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(124,58,237,0.75);border:1px solid #A78BFA;border-radius:20px;padding:5px 14px;margin-bottom:14px"><span style="font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:white">Cotización para</span><span style="font-size:.82rem;font-weight:700;color:white">${cl.nombre}</span></div><br>`:''}
      <div class="q-dest">${vi.destino||'Destino'}${vi.pais?', '+vi.pais:''}</div>
      <div class="q-ref">Ref ID: ${d.refId||'—'} · ${today}</div>
    </div>
  </div>
  <div class="q-bar">
    <div><div class="qb-l">PRESUPUESTO</div><div class="qb-v">${cl.pasajeros||cl.nombre||'—'}</div>${vi.salida&&vi.regreso?`<div style="font-size:.75rem;color:rgba(255,255,255,.5);margin-top:1px">${vi.salida} – ${vi.regreso}${vi.noches?' ('+vi.noches+' noches)':''}</div>`:''}</div>
    <div><div class="qb-l">VALIDEZ</div><div class="qb-v">${pr.validez||'24 horas'}</div></div>
    <div><div class="qb-l">REF</div><div class="qb-v">${d.refId||'—'}</div></div>
  </div>`;

  if(gloss.length)H+=`<div class="q-gloss"><span class="q-gloss-l">INCLUYE:</span>${gloss.map(g=>`<div class="qg-item"><span>${g.i}</span><span class="qg-n">${g.n}</span><span class="qg-l">${g.l}</span></div>`).join('')}</div>`;

  // Descripción
  H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">📋</div><div><div class="q-sec-ttl">Descripción del viaje</div></div></div>`;
  if((d.vuelos||[]).length)H+=`<div class="desc-item"><span>✈️</span><span><strong>Transporte aéreo:</strong> ${d.vuelos[0].origen} → ${d.vuelos[d.vuelos.length-1].destino||d.vuelos[0].destino}</span></div>`;
  (d.hoteles||[]).filter(h=>h.nombre).forEach(h=>H+=`<div class="desc-item"><span>🏨</span><span><strong>${h.noches?h.noches+' noches':'Hotel'}:</strong> ${h.nombre}${h.regimen?', '+h.regimen:''}.</span></div>`);
  (d.excursiones||[]).filter(e=>e.nombre).forEach(e=>H+=`<div class="desc-item"><span>🎟️</span><span><strong>Excursión:</strong> ${e.nombre}</span></div>`);
  (d.tickets||[]).filter(t=>t.nombre).forEach(t=>H+=`<div class="desc-item"><span>🎫</span><span><strong>Ticket:</strong> ${t.nombre}</span></div>`);
  (d.traslados||[]).filter(t=>t.origen||t.destino).forEach(t=>H+=`<div class="desc-item"><span>🚐</span><span><strong>Traslado:</strong> ${t.origen||''}${t.destino?' → '+t.destino:''}${t.vehiculo?' en '+t.vehiculo:''}.</span></div>`);
  if(d.seguro?.nombre)H+=`<div class="desc-item"><span>🛡️</span><span><strong>Seguro:</strong> ${d.seguro.nombre}</span></div>`;
  H+=`</div>`;

  // Vuelos
  if((d.vuelos||[]).length){
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">✈️</div><div><div class="q-sec-ttl">Vuelos</div></div></div>`;
    const rBP=(label,isRet,or,io,hs,fs,de,id2,hl,fl,al,num,esc,tesc,dur)=>`
      <div class="q-bp" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:.78rem;font-weight:700;color:var(--g4)">${or} → ${de}</span>
          <span class="q-bp-chip${isRet?' ret':''}">${label}</span>
        </div>
        <div class="q-bp-grid">
          <div><div class="q-bp-time">${hs||'–'}</div><div class="q-bp-code">${io||or}</div><div class="q-bp-city">${or}</div>${fs?`<div style="font-size:.67rem;color:var(--g3);margin-top:2px">${fd(fs)}</div>`:''}</div>
          <div class="q-bp-mid">
            <div class="q-bp-escl">${esc?'con escala':'directo'}</div>
            <div class="q-bp-line"></div>
            ${esc?`<div class="q-bp-via">✦ ${esc}${tesc?' · '+tesc:''}</div>`:''}
            ${dur?`<div class="q-bp-dur">${dur}</div>`:''}
          </div>
          <div style="text-align:right"><div class="q-bp-time">${hl||'–'}</div><div class="q-bp-code">${id2||de}</div><div class="q-bp-city">${de}</div>${fl?`<div style="font-size:.67rem;color:var(--g3);margin-top:2px">${fd(fl)}</div>`:''}</div>
        </div>
        <div class="q-bp-footer">
          ${al?`<span class="q-bp-meta"><b>${al}</b>${num?' · '+num:''}</span>`:''}
          ${al?`<span class="q-bp-meta">${al.tarifa||''}</span>`:''}
        </div>
      </div>`;
    d.vuelos.forEach(v=>{
      H+=rBP(v.mod==='idavuelta'?'IDA':v.mod==='interno'?'INTERNO':'TRAMO',false,v.origen,v.iata_o,v.hs,v.fs,v.destino,v.iata_d,v.hl,v.fl,v.aerolinea,v.numero,v.escala,v.t_escala,v.duracion);
      if(v.mod==='idavuelta'){
        // Show VUELTA tramo: use or2 or fallback to destino of ida leg
        const vOr=v.or2||v.destino||'';const vIo=v.io2||v.iata_d||'';
        const vDe=v.de2||v.origen||'';const vId=v.id2||v.iata_o||'';
        H+=rBP('VUELTA',true,vOr,vIo,v.hs2||'',v.fs2||'',vDe,vId,v.hl2||'',v.fl2||'',v.al2||v.aerolinea,v.num2||'',v.esc2||'',v.tesc2||'',v.dur2||'');
      }
      if(v.tarifa||v.equipaje)H+=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${v.tarifa?`<span style="background:var(--primary2);color:white;font-size:.65rem;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase">${v.tarifa}</span>`:''}${v.equipaje?`<span style="font-size:.75rem;color:var(--g4)">🧳 ${v.equipaje}</span>`:''}</div>`;
      if(v.precio>0)H+=`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio vuelos${v.fin?' · '+v.fin:''}</div><div class="ptag-v">${fmtMoney(v.precio,v.moneda)}</div></div></div>`;
    });
    H+=`</div>`;
  }

  // Hoteles
  (d.hoteles||[]).filter(h=>h.nombre).forEach(h=>{
    const isP=h.tipo==='disney'||h.tipo==='universal';
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">🏨</div><div><div class="q-sec-ttl">${h.nombre}</div><div class="q-sec-sub">${[h.ci&&h.co?h.ci+' – '+h.co:'',h.noches?h.noches+' noches':''].filter(Boolean).join(' · ')}</div></div></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px 20px;margin-bottom:14px">
      ${h.estrellas&&h.estrellas!=='—'?`<div style="display:flex;gap:6px;align-items:center"><span style="font-size:.64rem;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.08em">Cat.</span><span>${'⭐'.repeat(parseInt(h.estrellas)||0)}</span></div>`:''}
      ${h.hab?`<div style="font-size:.84rem;font-weight:600">${h.hab}</div>`:''}
      ${h.regimen?`<span style="background:var(--g1);border-radius:6px;padding:3px 10px;font-size:.76rem;font-weight:600">${h.regimen}</span>`:''}
    </div>`;
    if(isP){
      H+=`<div style="background:rgba(0,87,168,.04);border:1px solid rgba(0,87,168,.16);border-radius:10px;padding:16px;margin-bottom:14px">
        <div style="display:inline-flex;align-items:center;gap:6px;background:${h.tipo==='universal'?'linear-gradient(135deg,#111,#2a2a2a)':'linear-gradient(135deg,var(--primary),#003D7A)'};color:white;font-size:.68rem;font-weight:700;padding:4px 12px;border-radius:20px;margin-bottom:12px">${h.tipo==='universal'?'🎬 Paquete Universal':'🏰 Paquete Disney'}</div>`;
      if(h.tickets)H+=`<div class="desc-item">🎟️ <span><strong>Tickets:</strong> ${h.tickets}${h.dias_tkt?' ('+h.dias_tkt+' días)':''}</span></div>`;
      if(h.parques?.length)H+=`<div class="desc-item">🎢 <span><strong>Parques:</strong> ${h.parques.join(', ')}</span></div>`;
      if(h.beneficios?.length)H+=`<div style="margin-top:12px"><div style="font-size:.64rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Beneficios</div><div class="am-grid">${h.beneficios.map(b=>`<div class="am-tag"><span class="ck">✓</span>${b}</div>`).join('')}</div></div>`;
      H+=`</div>`;
      if(h.mp&&h.mp_pr>0){
        H+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:var(--g1);border-radius:10px;padding:14px;text-align:center"><div style="font-size:.62rem;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Sin plan de comidas</div><div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:1.4rem;font-weight:700;color:var(--primary)">${fmtMoney(h.precio,h.moneda)}</div></div>
          <div style="background:linear-gradient(135deg,rgba(0,87,168,.08),rgba(0,87,168,.04));border:1px solid rgba(0,87,168,.18);border-radius:10px;padding:14px;text-align:center"><div style="font-size:.62rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">${h.mp}</div><div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:1.4rem;font-weight:700;color:var(--primary)">${fmtMoney(h.mp_pr,h.mp_cur||h.moneda)}</div></div>
        </div>`;
        if(h.mp_desc){const lines=h.mp_desc.split(/\n/).filter(l=>l.trim());H+=`<div style="background:var(--g1);border-radius:9px;padding:14px;margin-bottom:12px;border-left:3px solid var(--primary)">${lines.map(l=>{const c=l.replace(/^\s*[•·\-\*]\s*/,'').trim();return l.match(/^[🎃👉]/)?`<div style="font-size:.82rem;font-weight:700;color:var(--text);margin:10px 0 6px">${c}</div>`:`<div style="font-size:.78rem;color:var(--muted);margin-bottom:3px;display:flex;gap:7px"><span style="color:var(--primary);font-weight:700">✓</span><span>${c}</span></div>`;}).join('')}</div>`;}
      } else if(h.precio>0)H+=`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio</div><div class="ptag-v">${fmtMoney(h.precio,h.moneda)}</div></div></div>`;
      if(h.notes){const nl=h.notes.split(/\n/).filter(l=>l.trim());H+=`<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:9px;padding:14px;margin-top:10px">${nl.map(l=>{const c=l.replace(/^\s*[•·\-\*]\s*/,'').trim();return l.match(/^[🎃👉🎪✨]/)?`<div style="font-size:.82rem;font-weight:700;color:var(--text);margin:8px 0 5px">${c}</div>`:`<div style="font-size:.78rem;color:#78350F;margin-bottom:3px;display:flex;gap:7px"><span style="color:var(--amber2)">•</span><span>${c}</span></div>`;}).join('')}</div>`;}
    } else {
      const allAm=[...(h.amenities||[]),h.am_x].filter(Boolean);
      if(allAm.length)H+=`<div style="margin-bottom:14px"><div class="am-grid">${allAm.map(a=>`<div class="am-tag"><span class="ck">✓</span>${a}</div>`).join('')}</div></div>`;
      if(h.precio>0)H+=`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio</div><div class="ptag-v">${fmtMoney(h.precio,h.moneda)}</div></div></div>`;
    }
    H+=`</div>`;
  });

  // Excursiones
  (d.excursiones||[]).filter(e=>e.nombre).forEach(e=>{
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">🎟️</div><div><div class="q-sec-ttl">${e.nombre}</div><div class="q-sec-sub">${[e.categoria,e.fecha,e.dur].filter(Boolean).join(' · ')}</div></div></div>
    ${e.desc?`<div style="font-size:.84rem;line-height:1.8;color:var(--muted);margin-bottom:14px">${e.desc}</div>`:''}
    ${e.prov?`<div class="desc-item">🏢 <span><strong>Proveedor:</strong> ${e.prov}</span></div>`:''}
    ${e.punto?`<div class="desc-item">📍 <span><strong>Encuentro:</strong> ${e.punto}</span></div>`:''}`;
    if(e.inc||e.noinc)H+=`<div class="ie-grid">${e.inc?`<div><div class="ie-ttl" style="color:var(--green)">✓ Incluido</div>${e.inc.split(/[,\n]+/).filter(s=>s.trim().length>1).map(x=>`<div class="ie-item"><span style="color:var(--green)">✓</span>${x.trim()}</div>`).join('')}</div>`:''} ${e.noinc?`<div><div class="ie-ttl" style="color:var(--red)">✕ No incluido</div>${e.noinc.split(/[,\n]+/).filter(s=>s.trim().length>1).map(x=>`<div class="ie-item"><span style="color:var(--red)">✕</span>${x.trim()}</div>`).join('')}</div>`:''}</div>`;
    if(e.precio>0)H+=`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio total</div><div class="ptag-v">${fmtMoney(e.precio,e.moneda)}</div></div></div>`;
    H+=`</div>`;
  });

  // Traslados
  const trsOk=(d.traslados||[]).filter(t=>t.origen||t.destino);
  if(trsOk.length){
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">🚐</div><div><div class="q-sec-ttl">Traslados</div></div></div>`;
    trsOk.forEach((t,i)=>{H+=`<div class="tr-row" ${i===trsOk.length-1?'style="border:none;padding-bottom:0"':''}><div style="width:38px;height:38px;background:var(--g1);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">🚐</div><div style="flex:1"><div style="font-weight:700;font-size:.88rem">${t.origen||''}${t.destino?' → '+t.destino:''}</div><div style="font-size:.76rem;color:var(--g4);margin-top:2px">${[t.vehiculo,t.hora?'Recogida: '+t.hora:'',t.prov].filter(Boolean).join(' · ')}</div>${t.notas?`<div style="font-size:.72rem;color:var(--g3);margin-top:1px">${t.notas}</div>`:''}</div></div>`;if(t.precio>0)H+=`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio traslado</div><div class="ptag-v">${fmtMoney(t.precio,t.moneda)}</div></div></div>`;else H+=`<div style="text-align:right;margin-top:4px;font-size:.76rem;font-weight:600;color:var(--g3)">Incluido</div>`;});
    H+=`</div>`;
  }

  // Seguro
  if(d.seguro?.nombre){
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">🛡️</div><div><div class="q-sec-ttl">Asistencia al viajero — ${d.seguro.nombre}</div></div></div>
    <div class="seg-cards">${[['🏥','Cobertura médica',d.seguro.cobertura_medica],['🧳','Equipaje',d.seguro.equipaje_seg],['💊','Preexistencias',d.seguro.preexistencias],['📋','Beneficios',d.seguro.extra]].filter(r=>r[2]).map(r=>`<div class="seg-card"><div class="ico">${r[0]}</div><div class="lbl2">${r[1]}</div><div class="val">${r[2]}</div></div>`).join('')}</div>
    ${d.seguro.precio>0?`<div class="ptag"><div class="ptag-box"><div class="ptag-l">Precio${d.seguro.fin?' · '+d.seguro.fin:''}</div><div class="ptag-v">${fmtMoney(d.seguro.precio,d.seguro.moneda)}</div></div></div>`:''}
    </div>`;
  }

  // Tickets
  const tksOk=(d.tickets||[]).filter(t=>t.nombre);
  if(tksOk.length){
    H+=`<div class="q-sec"><div class="q-sec-hd"><div class="q-sec-ico">🎫</div><div><div class="q-sec-ttl">Tickets y Entradas</div></div></div>`;
    tksOk.forEach(t=>{
      H+=`<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--g1)">
        <div style="width:36px;height:36px;background:var(--g1);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">🎫</div>
        <div style="flex:1"><div style="font-weight:700;font-size:.88rem">${t.nombre}</div>
          <div style="font-size:.75rem;color:var(--g4);margin-top:2px">${[t.tipo,t.prov,t.fecha?fd(t.fecha):''].filter(Boolean).join(' · ')}</div>
          ${t.desc?`<div style="font-size:.72rem;color:var(--g3);margin-top:1px">${t.desc}</div>`:''}
        </div>
        <div style="font-weight:700;font-size:.86rem;color:${t.precio>0?'var(--primary)':'var(--g3)'};white-space:nowrap">${t.precio>0?fmtMoney(t.precio,t.moneda):'Incluido'}</div>
      </div>`;
    });
    H+=`</div>`;
  }

  // T&C
  if(pr.tyc){
    const lines=pr.tyc.split(/\n/).filter(l=>l.trim());
    H+=`<div class="q-sec"><div class="tyc-box">${lines.map(l=>{const c=l.replace(/^\s*[•·\-\*]\s*/,'').trim();return l.match(/^📄/)?`<div class="tyc-ttl">${c}</div>`:l.match(/^✨/)?`<div class="tyc-cta">${c}</div>`:`<div class="tyc-item"><span style="flex-shrink:0">${l.match(/^[^\w\s]/)?l[0]:'•'}</span><span>${c}</span></div>`;}).join('')}</div></div>`;
  }

  // Total + agente
  H+=`<div class="q-sec">
    <div class="q-total">
      <div class="q-total-l">
        <div class="tl">Precio total del paquete</div>
        ${pr.reserva>0?`<div class="detail">Reserva: ${fmtMoney(pr.reserva,pr.moneda3)}${pr.cuotas?' · '+pr.cuotas:''}</div>`:''}
        ${pr.cancelacion?`<div class="detail">Cancelación gratuita hasta: ${fd(pr.cancelacion)}</div>`:''}
        <div class="detail">Válida por ${pr.validez||'24 horas'}</div>
      </div>
      <div class="q-total-amt">${pr.total>0?fmtMoney(pr.total,pr.moneda2):pr.por_persona>0?fmtMoney(pr.por_persona,pr.moneda)+'/pax':'—'}</div>
    </div>
    <div class="q-agent">
      ${logoUrl?`<img src="${logoUrl}" style="height:40px;max-width:110px;object-fit:contain" alt="logo">`:`<div class="q-agent-av">${ini}</div>`}
      <div><div class="q-agent-nm">${ag.nm||'Tu Agente'}${ag.ag?' · '+ag.ag:''}</div><div class="q-agent-ct">${[ag.em,ag.tel,ag.soc].filter(Boolean).join('  ·  ')}</div></div>
    </div>
  </div></div>
  <div style="text-align:center;padding:18px 0 8px;border-top:1px solid #EDE9FE;margin-top:4px">
    <span style="font-size:.62rem;font-weight:500;color:#A78BFA;letter-spacing:.08em;opacity:.8">powered by </span><span style="font-size:.62rem;font-weight:800;color:#7C3AED;letter-spacing:.04em">ERMIX</span><span style="font-size:.62rem;font-weight:400;color:#C4B5FD;margin-left:6px;opacity:.7">· www.ermix.com</span>
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

