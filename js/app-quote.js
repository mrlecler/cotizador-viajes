function fmtMoney(n,cur){if(!n||n===0)return'';return(cur||'USD')+' '+Number(n).toLocaleString('es-AR');}

// ── Extraer código IATA de aerolínea para logos ──
function _extractAirlineIata(name,flightNum){
  const map=window.aerolineasMap||{};
  if(name&&map[name.toLowerCase()])return map[name.toLowerCase()];
  if(flightNum){const m=flightNum.trim().match(/^([A-Z]{2})/i);if(m)return m[1].toUpperCase();}
  return'';
}

const PDF_THEMES={
  1:{name:'Turquesa',      layout:'cinematic',primary:'#1B9E8F',secondary:'#0BC5B8',accent:'#06B6D4',grad:'linear-gradient(135deg,#1B9E8F,#0BC5B8,#06B6D4)',text:'#ffffff',rgb:'27,158,143', rgb2:'11,197,184'},
  2:{name:'Azul Glaciar',  layout:'glaciar',  primary:'#2979B0',secondary:'#1E3A5F',accent:'#7EC8E3',grad:'linear-gradient(135deg,#1E3A5F,#2979B0,#7EC8E3)',text:'#ffffff',rgb:'126,200,227',rgb2:'41,121,176'},
  3:{name:'Ámbar Dorado',  layout:'ambar',    primary:'#C9860A',secondary:'#7C4A00',accent:'#E8C77D',grad:'linear-gradient(135deg,#1A0A00,#7C4A00,#E8C77D)',text:'#E8C77D',rgb:'232,199,125',rgb2:'201,134,10'},
  4:{name:'Negro Violeta', layout:'noir',     primary:'#7B2FBE',secondary:'#9B59B6',accent:'#D7BDE2',grad:'linear-gradient(135deg,#0A0A0A,#1A0A2E,#7B2FBE)',text:'#ffffff',rgb:'123,47,190', rgb2:'155,89,182'},
  5:{name:'Rojo Coral',    layout:'postal',   primary:'#C84B31',secondary:'#E8826A',accent:'#F5A623',grad:'linear-gradient(135deg,#C84B31,#E8826A,#F5A623)',text:'#ffffff',rgb:'200,75,49',  rgb2:'232,130,106'},
  6:{name:'Azul Marino',   layout:'magia',    primary:'#1A2E8A',secondary:'#0F1B5C',accent:'#FFD700',grad:'linear-gradient(135deg,#0F1B5C,#1A2E8A,#FFD700)',text:'#FFD700',rgb:'255,215,0',  rgb2:'26,46,138'},
  7:{name:'Negro Naranja', layout:'epic',     primary:'#FF4500',secondary:'#CC3700',accent:'#FF6B35',grad:'linear-gradient(135deg,#0A0A0A,#1C0500,#FF4500)',text:'#FF4500',rgb:'255,69,0',   rgb2:'204,55,0'},
  8:{name:'Rosa Fucsia',   layout:'rosa',     primary:'#C4426A',secondary:'#8B1A4A',accent:'#F7C5D8',grad:'linear-gradient(135deg,#8B1A4A,#C4426A,#F7C5D8)',text:'#ffffff',rgb:'196,66,106', rgb2:'139,26,74'},
  9:{name:'Cyan Profundo', layout:'aqua',     primary:'#00D4E8',secondary:'#0A1F5C',accent:'#00E5FF',grad:'linear-gradient(135deg,#050E2D,#0A1F5C,#00E5FF)',text:'#ffffff',rgb:'0,229,255',  rgb2:'10,31,92'},
 10:{name:'Rojo Carmín',   layout:'rojo',     primary:'#B22222',secondary:'#8B0000',accent:'#FF6B6B',grad:'linear-gradient(135deg,#8B0000,#B22222,#FF6B6B)',text:'#ffffff',rgb:'255,107,107',rgb2:'178,34,34'},
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

// ─── Layout CSS overrides por template ──────────────────────────────────────
function _layoutCSS(layout,th){
  if(layout==='minimal') return `
    .qp-cover{min-height:auto!important;padding:80px 48px 40px!important;position:relative!important;background:#FFFFFF!important}
    .qp-dark-hd{background:${th.primary}!important;padding:20px 28px!important;border-radius:10px!important;margin:28px 0 20px!important}
    .qp-item-card{border:1px solid #E5E2DC!important}
    #qwrap{background:#FAFAF8!important}
  `;
  if(layout==='bold') return `
    .qp-cover{min-height:60vh!important}
    .qp-dark-hd{background:${th.grad}!important;padding:24px 32px!important;border-radius:0!important;margin:0 -32px 24px!important;width:calc(100% + 64px)!important}
    .qp-dark-hd-title{font-size:1.4rem!important;letter-spacing:1px!important}
    .qp-item-card{border:2px solid rgba(${th.rgb},0.2)!important;border-radius:14px!important}
  `;
  if(layout==='magazine'||layout==='postal') return `
    .qp-cover{min-height:auto!important;display:grid!important;grid-template-columns:1fr 1fr!important;padding:0!important;position:relative!important}
    .qp-dark-hd{background:linear-gradient(135deg,rgba(${th.rgb},0.08),rgba(${th.rgb},0.03))!important;color:${th.primary}!important;border-left:4px solid ${th.primary}!important;border-radius:0!important;padding:18px 24px!important;margin:24px 0 20px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title,.qp-dark-hd-sub{color:${th.primary}!important}
  `;
  if(layout==='corporate') return `
    .qp-cover{min-height:auto!important;padding:60px 48px 36px!important;position:relative!important;background:linear-gradient(160deg,${th.primary} 0%,${th.secondary} 100%)!important}
    .qp-dark-hd{background:#F8F6F2!important;color:#2D1F14!important;border:1px solid #E5E2DC!important;border-radius:8px!important;padding:16px 22px!important;margin:24px 0 16px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title,.qp-dark-hd-sub{color:#2D1F14!important}
    .qp-item-card{border-radius:8px!important}
    #qwrap{font-size:13px!important}
  `;
  if(layout==='glaciar') return `
    .qp-dark-hd{background:linear-gradient(135deg,rgba(${th.rgb},0.1),rgba(${th.rgb},0.04))!important;border-left:3px solid ${th.primary}!important;border-radius:8px!important;padding:16px 22px!important;margin:24px 0 16px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title,.qp-dark-hd-sub{color:${th.primary}!important}
    .qp-item-card{border-color:rgba(${th.rgb},0.18)!important}
  `;
  if(layout==='ambar') return `
    .qp-dark-hd{background:linear-gradient(135deg,rgba(232,199,125,0.1),rgba(232,199,125,0.04))!important;border-left:3px solid ${th.accent}!important;border-radius:8px!important;padding:16px 22px!important;margin:24px 0 16px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title,.qp-dark-hd-sub{color:${th.primary}!important}
    #qwrap{background:#FDFBF7!important}
  `;
  if(layout==='magia') return `
    .qp-dark-hd{background:linear-gradient(135deg,rgba(15,27,92,0.08),rgba(26,46,138,0.04))!important;border-left:3px solid ${th.secondary}!important;border-radius:8px!important;padding:16px 22px!important;margin:24px 0 16px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title{color:${th.secondary}!important}
    .qp-dark-hd-sub{color:rgba(15,27,92,0.6)!important}
  `;
  if(layout==='epic') return `
    .qp-dark-hd{background:linear-gradient(135deg,rgba(255,69,0,0.1),rgba(255,69,0,0.04))!important;border-left:3px solid ${th.accent}!important;border-radius:0!important;padding:16px 22px!important;margin:24px 0 16px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title,.qp-dark-hd-sub{color:${th.accent}!important}
    .qp-item-card{border-color:rgba(255,69,0,0.15)!important;border-radius:8px!important}
  `;
  if(layout==='rosa') return `
    .qp-dark-hd{background:linear-gradient(135deg,rgba(${th.rgb},0.08),rgba(${th.rgb},0.03))!important;border-left:3px solid ${th.primary}!important;border-radius:8px!important;padding:16px 22px!important;margin:24px 0 16px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title,.qp-dark-hd-sub{color:${th.primary}!important}
    #qwrap{background:#FFF8FA!important}
  `;
  if(layout==='aqua') return `
    .qp-dark-hd{background:linear-gradient(135deg,rgba(0,229,255,0.1),rgba(0,229,255,0.04))!important;border-left:3px solid ${th.primary}!important;border-radius:8px!important;padding:16px 22px!important;margin:24px 0 16px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title,.qp-dark-hd-sub{color:${th.primary}!important}
    .qp-item-card{border-color:rgba(0,229,255,0.15)!important}
  `;
  if(layout==='rojo'||layout==='noir') return `
    .qp-dark-hd{background:linear-gradient(135deg,rgba(${th.rgb},0.1),rgba(${th.rgb},0.04))!important;border-left:3px solid ${th.primary}!important;border-radius:8px!important;padding:16px 22px!important;margin:24px 0 16px!important}
    .qp-dark-hd-meta,.qp-dark-hd-title,.qp-dark-hd-sub{color:${th.primary}!important}
  `;
  return ''; // cinematic = default, no overrides
}

// ─── Cover builder por layout ──────────────────────────────────────────────
function _buildCoverByLayout(layout,th,ag,d,coverUrl,totalAmt,today,buildPdfWordmarkFn){
  const cl=d.cliente||{},vi=d.viaje||{};
  const dests=[...new Set([vi.destino,vi.pais,...(d.hoteles||[]).map(h=>h.ciudad).filter(Boolean)].filter(Boolean))];
  const destChips=dests.map(dest=>`<span style="background:rgba(${th.rgb},0.22);border:1px solid rgba(${th.rgb},0.45);border-radius:20px;padding:4px 14px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.85)">${dest}</span>`).join('');
  const clientBlock=cl.nombre
    ?`<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:10px">COTIZACIÓN PERSONALIZADA PARA</div><div style="font-size:52px;font-weight:900;letter-spacing:-2px;color:white;line-height:1;margin-bottom:18px;text-shadow:0 2px 20px rgba(0,0,0,.35)">${cl.nombre}</div>`
    :`<div style="font-size:52px;font-weight:900;letter-spacing:-2px;color:white;line-height:1;margin-bottom:18px;text-shadow:0 2px 20px rgba(0,0,0,.35)">${vi.destino||'Tu próximo viaje'}</div>`;
  const paxLine=`<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
    ${cl.pasajeros?`<div style="display:flex;align-items:center;gap:8px"><div style="width:2px;height:24px;background:${th.primary};flex-shrink:0;border-radius:2px"></div><span style="font-size:12px;font-weight:600;color:rgba(255,255,255,.75)">${cl.pasajeros}</span></div>`:''}
    ${vi.salida&&vi.regreso?`<div style="font-size:11px;color:rgba(255,255,255,.5);font-family:'DM Mono',monospace">${fd(vi.salida)} → ${fd(vi.regreso)}</div>`:''}
    ${vi.noches?`<div style="font-size:11px;color:rgba(255,255,255,.5)">${vi.noches} noches</div>`:''}
  </div>`;

  // Minimal: white cover, no photo
  if(layout==='minimal'){
    return `<div class="qp-cover">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
        <div style="display:flex;align-items:center;gap:14px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:36px;max-width:120px">`:''}<div>${ag.nm?`<div style="font-size:13px;font-weight:700;color:#2D1F14">${ag.nm}</div>`:''}<div style="font-size:10px;color:#9B8C80">${ag.ag||''}</div></div></div>
        ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:10px;color:#9B8C80;border:1px solid #E5E2DC;border-radius:20px;padding:4px 12px">${d.refId}</div>`:''}
      </div>
      ${dests.length?`<div style="display:flex;gap:8px;margin-bottom:16px">${dests.map(dest=>`<span style="background:rgba(${th.rgb},0.1);border:1px solid rgba(${th.rgb},0.3);border-radius:20px;padding:4px 14px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${th.primary}">${dest}</span>`).join('')}</div>`:''}
      ${cl.nombre?`<div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#9B8C80;margin-bottom:8px">COTIZACIÓN PARA</div><div style="font-size:42px;font-weight:900;letter-spacing:-2px;color:#2D1F14;line-height:1;margin-bottom:20px">${cl.nombre}</div>`:`<div style="font-size:42px;font-weight:900;letter-spacing:-2px;color:#2D1F14;line-height:1;margin-bottom:20px">${vi.destino||'Propuesta de viaje'}</div>`}
      <div style="display:flex;align-items:center;gap:20px;color:#6B5E52;font-size:12px">${cl.pasajeros||''}${vi.salida&&vi.regreso?` · ${fd(vi.salida)} → ${fd(vi.regreso)}`:''}${vi.noches?` · ${vi.noches} noches`:''}</div>
      ${totalAmt?`<div style="margin-top:24px;padding:20px 0;border-top:2px solid ${th.primary}"><div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#9B8C80;text-transform:uppercase;margin-bottom:4px">Total estimado</div><div style="font-size:28px;font-weight:900;color:${th.primary};letter-spacing:-1px">${totalAmt}</div></div>`:''}
    </div>`;
  }

  // Corporate: colored header, no photo, formal
  if(layout==='corporate'){
    return `<div class="qp-cover">
      <div style="position:relative;z-index:2">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px">
          <div style="display:flex;align-items:center;gap:14px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:32px;max-width:100px">`:buildPdfWordmarkFn(20)}<div>${ag.nm?`<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.9)">${ag.nm}</div>`:''}<div style="font-size:9px;color:rgba(255,255,255,.5)">${ag.ag||''}</div></div></div>
          ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:4px 12px">${d.refId}</div>`:''}
        </div>
        ${cl.nombre?`<div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:8px">PROPUESTA COMERCIAL PARA</div><div style="font-size:36px;font-weight:800;color:white;line-height:1.1;margin-bottom:16px">${cl.nombre}</div>`:`<div style="font-size:36px;font-weight:800;color:white;line-height:1.1;margin-bottom:16px">${vi.destino||'Propuesta de viaje'}</div>`}
        <div style="color:rgba(255,255,255,.6);font-size:11px">${cl.pasajeros||''}${vi.salida&&vi.regreso?` · ${fd(vi.salida)} — ${fd(vi.regreso)}`:''}${vi.noches?` · ${vi.noches} noches`:''}</div>
        ${totalAmt?`<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.15);display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.5);text-transform:uppercase">Inversión estimada</div><div style="font-size:22px;font-weight:800;color:white;margin-top:2px">${totalAmt}</div></div><div style="text-align:right;font-size:9px;color:rgba(255,255,255,.4)">${today}</div></div>`:''}
      </div>
    </div>`;
  }

  // Magazine / Postal Mediterránea: split layout
  if(layout==='magazine'||layout==='postal'){
    return `<div class="qp-cover">
      <div style="min-height:420px;position:relative;overflow:hidden;${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:`background:${th.grad}`}"><div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.1),rgba(0,0,0,.35))"></div></div>
      <div style="padding:40px 36px;display:flex;flex-direction:column;justify-content:center;background:#FAFAF8">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:28px;max-width:100px">`:''}<div><div style="font-size:11px;font-weight:700;color:${th.primary}">${ag.nm||''}</div><div style="font-size:9px;color:#9B8C80">${ag.ag||''}</div></div></div>
        ${cl.nombre?`<div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${th.primary};margin-bottom:8px">VIAJE DE</div><div style="font-size:32px;font-weight:900;letter-spacing:-1.5px;color:#2D1F14;line-height:1.05;margin-bottom:12px">${cl.nombre}</div>`:`<div style="font-size:32px;font-weight:900;letter-spacing:-1.5px;color:#2D1F14;line-height:1.05;margin-bottom:12px">${vi.destino||'Propuesta'}</div>`}
        <div style="font-size:11px;color:#6B5E52;line-height:1.6">${vi.destino?vi.destino+(vi.pais?', '+vi.pais:''):''}${vi.salida?'<br>'+fd(vi.salida)+(vi.regreso?' — '+fd(vi.regreso):''):''}${vi.noches?'<br>'+vi.noches+' noches':''}</div>
        ${totalAmt?`<div style="margin-top:auto;padding-top:20px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${th.primary};text-transform:uppercase;margin-bottom:3px">Total</div><div style="font-size:26px;font-weight:900;color:#2D1F14;letter-spacing:-1px">${totalAmt}</div></div>`:''}
      </div>
    </div>`;
  }

  // ── Glaciar: full-bleed photo + glassmorphism card ──
  if(layout==='glaciar'){
    return `<div class="qp-cover" style="${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:`background:linear-gradient(160deg,#0D1F3A 0%,#1E3A5F 60%,#0A2A4A 100%)`};position:relative;min-height:520px;display:flex;flex-direction:column">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(5,14,45,0.15) 0%,rgba(5,14,45,0.55) 55%,rgba(5,14,45,0.85) 100%);pointer-events:none;z-index:0"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(126,200,227,0.1) 0%,transparent 60%);pointer-events:none;z-index:0"></div>
      <div style="position:relative;padding:22px 36px;display:flex;justify-content:space-between;align-items:center;z-index:2;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:14px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:28px;max-width:90px">`:buildPdfWordmarkFn(22)}${ag.nm?`<div style="width:1px;height:16px;background:rgba(255,255,255,.2);margin:0 4px"></div><div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.8)">${ag.nm}</div>`:''}</div>
        ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(126,200,227,.7);border:1px solid rgba(126,200,227,.25);border-radius:20px;padding:4px 12px">${d.refId}</div>`:''}
      </div>
      <div style="flex:1"></div>
      <div class="qp-glass-card" style="position:relative;margin:0 28px 28px;background:rgba(255,255,255,0.08);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.18);border-radius:16px;padding:26px 30px;z-index:2;flex-shrink:0">
        ${dests.length?`<div style="display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap">${dests.map(dest=>`<span style="background:rgba(126,200,227,0.18);border:1px solid rgba(126,200,227,0.38);border-radius:20px;padding:3px 12px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7EC8E3">${dest}</span>`).join('')}</div>`:''}
        ${clientBlock}
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px">
          <div style="font-size:11px;color:rgba(255,255,255,.55);line-height:1.8">${cl.pasajeros||''}${vi.salida&&vi.regreso?`<br>${fd(vi.salida)} → ${fd(vi.regreso)}`:''}${vi.noches?`<br>${vi.noches} noches`:''}</div>
          ${totalAmt?`<div style="text-align:right"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(126,200,227,.6);margin-bottom:2px">TOTAL</div><div style="font-size:22px;font-weight:900;letter-spacing:-1px;color:white">${totalAmt}</div></div>`:''}
        </div>
      </div>
    </div>`;
  }

  // ── Ámbar Imperial: photo top + dark amber panel bottom ──
  if(layout==='ambar'){
    return `<div class="qp-cover" style="display:grid;grid-template-rows:55% 45%;padding:0;min-height:500px;overflow:hidden">
      <div style="position:relative;overflow:hidden;${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:`background:linear-gradient(135deg,#1A0A00 0%,#5C3300 60%,#7C4A00 100%)`}">
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(26,10,0,0.1) 0%,rgba(26,10,0,0.65) 100%);pointer-events:none"></div>
        <div style="position:absolute;top:0;left:0;right:0;padding:20px 28px;display:flex;justify-content:space-between;align-items:center;z-index:2">
          <div style="display:flex;align-items:center;gap:12px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:26px">`:buildPdfWordmarkFn(20)}</div>
          ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(232,199,125,.65);border:1px solid rgba(232,199,125,.28);border-radius:20px;padding:3px 10px">${d.refId}</div>`:''}
        </div>
        ${dests.length?`<div style="position:absolute;bottom:14px;left:28px;display:flex;gap:7px;flex-wrap:wrap;z-index:2">${dests.map(dest=>`<span style="background:rgba(232,199,125,0.18);border:1px solid rgba(232,199,125,0.4);border-radius:20px;padding:3px 12px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#E8C77D">${dest}</span>`).join('')}</div>`:''}
      </div>
      <div style="background:linear-gradient(135deg,#120600 0%,#1A0A00 50%,#2D1400 100%);padding:26px 32px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,199,125,0.5),transparent)"></div>
        <div style="position:absolute;bottom:-40px;right:-40px;width:200px;height:200px;background:radial-gradient(ellipse,rgba(232,199,125,0.07) 0%,transparent 65%);pointer-events:none"></div>
        ${cl.nombre?`<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(232,199,125,0.45);margin-bottom:6px">PROPUESTA PARA</div><div style="font-size:34px;font-weight:900;letter-spacing:-1.5px;color:#E8C77D;line-height:1.05;margin-bottom:10px">${cl.nombre}</div>`:`<div style="font-size:34px;font-weight:900;letter-spacing:-1.5px;color:#E8C77D;line-height:1.05;margin-bottom:10px">${vi.destino||'Tu próximo viaje'}</div>`}
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="font-size:11px;color:rgba(232,199,125,.5);line-height:1.6">${cl.pasajeros||''}${vi.salida&&vi.regreso?` · ${fd(vi.salida)} — ${fd(vi.regreso)}`:''}${vi.noches?` · ${vi.noches} noches`:''}</div>
          ${totalAmt?`<div style="font-size:24px;font-weight:900;letter-spacing:-1px;color:#E8C77D">${totalAmt}</div>`:''}
        </div>
        ${ag.nm?`<div style="margin-top:8px;font-size:9px;color:rgba(232,199,125,.3);font-weight:700;letter-spacing:1px;text-transform:uppercase">${ag.nm}${ag.ag?' · '+ag.ag:''}</div>`:''}
      </div>
    </div>`;
  }

  // ── Magia Encantada: Disney deep blue + gold stars ──
  if(layout==='magia'){
    const stars=Array.from({length:28},(_,i)=>{const x=Math.round((i*47+13)%98),y=Math.round((i*71+29)%85),s=i%3+1;return `<div style="position:absolute;left:${x}%;top:${y}%;width:${s}px;height:${s}px;background:#FFD700;border-radius:50%;opacity:${0.25+s*0.12};z-index:1"></div>`;}).join('');
    return `<div class="qp-cover" style="${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:`background:linear-gradient(160deg,#050F3A 0%,#0F1B5C 45%,#0A0D2E 100%)`};position:relative;min-height:520px;display:flex;flex-direction:column">
      <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(5,15,58,0.2) 0%,rgba(15,27,92,0.5) 50%,rgba(10,13,46,0.88) 100%);pointer-events:none;z-index:0"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 50% 110%,rgba(255,215,0,0.16) 0%,transparent 60%);pointer-events:none;z-index:0"></div>
      ${stars}
      <div style="position:relative;padding:22px 36px;display:flex;justify-content:space-between;align-items:center;z-index:2;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:14px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:28px">`:buildPdfWordmarkFn(22)}${ag.nm?`<div style="width:1px;height:16px;background:rgba(255,215,0,.2);margin:0 4px"></div><div style="font-size:10px;font-weight:700;color:rgba(255,215,0,.8)">${ag.nm}</div>`:''}</div>
        ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,215,0,.6);border:1px solid rgba(255,215,0,.2);border-radius:20px;padding:4px 12px">${d.refId}</div>`:''}
      </div>
      <div style="flex:1"></div>
      <div style="position:relative;padding:36px;z-index:2;flex-shrink:0">
        ${dests.length?`<div style="display:flex;gap:7px;margin-bottom:16px;flex-wrap:wrap">${dests.map(dest=>`<span style="background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.35);border-radius:20px;padding:3px 12px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FFD700">${dest}</span>`).join('')}</div>`:''}
        ${clientBlock}
        ${paxLine}
        ${totalAmt?`<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,215,0,0.2);display:flex;justify-content:space-between;align-items:center"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,215,0,.5)">INVERSIÓN TOTAL</div><div style="font-size:22px;font-weight:900;color:#FFD700;letter-spacing:-1px">${totalAmt}</div></div>`:''}
      </div>
    </div>`;
  }

  // ── Epic Adventure: cinematic dark + bold orange glow ──
  if(layout==='epic'){
    return `<div class="qp-cover" style="background:linear-gradient(160deg,#080808 0%,#0A0A0A 50%,#0F0300 100%);position:relative;min-height:520px;display:flex;flex-direction:column">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 115%,rgba(255,69,0,0.26) 0%,transparent 60%);pointer-events:none;z-index:0"></div>
      <div style="position:absolute;top:-30%;right:-10%;width:70%;height:70%;background:radial-gradient(ellipse,rgba(255,69,0,0.06) 0%,transparent 65%);pointer-events:none;z-index:0"></div>
      ${coverUrl?`<div style="position:absolute;inset:0;opacity:0.12;background:url('${coverUrl}') center/cover no-repeat;pointer-events:none;z-index:0"></div>`:''}
      <div style="position:relative;padding:22px 36px;display:flex;justify-content:space-between;align-items:center;z-index:2;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:14px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:28px">`:buildPdfWordmarkFn(22)}${ag.nm?`<div style="width:1px;height:16px;background:rgba(255,69,0,.3);margin:0 4px"></div><div style="font-size:10px;font-weight:700;color:rgba(255,69,0,.9)">${ag.nm}</div>`:''}</div>
        ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,69,0,.6);border:1px solid rgba(255,69,0,.25);border-radius:20px;padding:4px 12px">${d.refId}</div>`:''}
      </div>
      <div style="flex:1"></div>
      <div style="position:relative;padding:36px;z-index:2;flex-shrink:0">
        ${dests.length?`<div style="display:flex;gap:7px;margin-bottom:20px;flex-wrap:wrap">${dests.map(dest=>`<span style="background:rgba(255,69,0,0.15);border:1px solid rgba(255,69,0,0.32);border-radius:4px;padding:3px 12px;font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#FF4500">${dest}</span>`).join('')}</div>`:''}
        ${cl.nombre?`<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:8px">PROPUESTA PARA</div><div style="font-size:52px;font-weight:900;letter-spacing:-3px;color:white;line-height:1;margin-bottom:16px;text-shadow:0 0 40px rgba(255,69,0,.35)">${cl.nombre}</div>`:`<div style="font-size:52px;font-weight:900;letter-spacing:-3px;color:white;line-height:1;margin-bottom:16px;text-shadow:0 0 40px rgba(255,69,0,.35)">${vi.destino||'Tu próximo viaje'}</div>`}
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          ${cl.pasajeros?`<div style="font-size:12px;font-weight:600;color:rgba(255,69,0,.85)">${cl.pasajeros}</div>`:''}
          ${vi.salida&&vi.regreso?`<div style="font-size:11px;color:rgba(255,255,255,.4);font-family:'DM Mono',monospace">${fd(vi.salida)} → ${fd(vi.regreso)}</div>`:''}
          ${vi.noches?`<div style="font-size:11px;color:rgba(255,255,255,.4)">${vi.noches} noches</div>`:''}
          ${totalAmt?`<div style="margin-left:auto;font-size:22px;font-weight:900;color:#FF4500;letter-spacing:-1px">${totalAmt}</div>`:''}
        </div>
      </div>
    </div>`;
  }

  // ── Rosa Botánica: photo with rose glassmorphism card ──
  if(layout==='rosa'){
    return `<div class="qp-cover" style="${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:`background:linear-gradient(160deg,#5C0A2A 0%,#8B1A4A 45%,#C4426A 100%)`};position:relative;min-height:520px;display:flex;flex-direction:column">
      <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(92,10,42,0.1) 0%,rgba(139,26,74,0.45) 50%,rgba(139,26,74,0.82) 100%);pointer-events:none;z-index:0"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 65% 50% at 50% 105%,rgba(247,197,216,0.18) 0%,transparent 60%);pointer-events:none;z-index:0"></div>
      <div style="position:relative;padding:22px 36px;display:flex;justify-content:space-between;align-items:center;z-index:2;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:14px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:28px">`:buildPdfWordmarkFn(22)}${ag.nm?`<div style="width:1px;height:16px;background:rgba(247,197,216,.25);margin:0 4px"></div><div style="font-size:10px;font-weight:700;color:rgba(247,197,216,.9)">${ag.nm}</div>`:''}</div>
        ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(247,197,216,.7);border:1px solid rgba(247,197,216,.25);border-radius:20px;padding:4px 12px">${d.refId}</div>`:''}
      </div>
      <div style="flex:1"></div>
      <div class="qp-glass-card" style="position:relative;margin:0 28px 28px;background:rgba(139,26,74,0.45);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(247,197,216,0.18);border-radius:16px;padding:26px 30px;z-index:2;flex-shrink:0">
        ${dests.length?`<div style="display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap">${dests.map(dest=>`<span style="background:rgba(247,197,216,0.15);border:1px solid rgba(247,197,216,0.28);border-radius:20px;padding:3px 12px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F7C5D8">${dest}</span>`).join('')}</div>`:''}
        ${clientBlock}
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px">
          <div style="font-size:11px;color:rgba(255,255,255,.55);line-height:1.8">${cl.pasajeros||''}${vi.salida&&vi.regreso?`<br>${fd(vi.salida)} → ${fd(vi.regreso)}`:''}${vi.noches?`<br>${vi.noches} noches`:''}</div>
          ${totalAmt?`<div style="text-align:right"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(247,197,216,.6);margin-bottom:2px">TOTAL</div><div style="font-size:22px;font-weight:900;letter-spacing:-1px;color:white">${totalAmt}</div></div>`:''}
        </div>
      </div>
    </div>`;
  }

  // ── Aqua Profundo: deep navy + electric cyan glow ──
  if(layout==='aqua'){
    return `<div class="qp-cover" style="${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:`background:linear-gradient(160deg,#020817 0%,#050E2D 50%,#020817 100%)`};position:relative;min-height:520px;display:flex;flex-direction:column">
      <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(2,8,23,0.1) 0%,rgba(5,14,45,0.5) 55%,rgba(5,14,45,0.88) 100%);pointer-events:none;z-index:0"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 50% 110%,rgba(0,229,255,0.2) 0%,transparent 60%);pointer-events:none;z-index:0"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 40% 40% at 78% 18%,rgba(0,229,255,0.07) 0%,transparent 55%);pointer-events:none;z-index:0"></div>
      <div style="position:relative;padding:22px 36px;display:flex;justify-content:space-between;align-items:center;z-index:2;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:14px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:28px">`:buildPdfWordmarkFn(22)}${ag.nm?`<div style="width:1px;height:16px;background:rgba(0,229,255,.2);margin:0 4px"></div><div style="font-size:10px;font-weight:700;color:rgba(0,229,255,.8)">${ag.nm}</div>`:''}</div>
        ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(0,229,255,.6);border:1px solid rgba(0,229,255,.2);border-radius:20px;padding:4px 12px">${d.refId}</div>`:''}
      </div>
      <div style="flex:1"></div>
      <div style="position:relative;padding:36px;z-index:2;flex-shrink:0">
        ${dests.length?`<div style="display:flex;gap:7px;margin-bottom:16px;flex-wrap:wrap">${dests.map(dest=>`<span style="background:rgba(0,229,255,0.1);border:1px solid rgba(0,229,255,0.28);border-radius:20px;padding:3px 12px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#00E5FF">${dest}</span>`).join('')}</div>`:''}
        ${clientBlock}
        ${paxLine}
        ${totalAmt?`<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(0,229,255,0.15);display:flex;justify-content:space-between;align-items:center"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(0,229,255,.5)">INVERSIÓN TOTAL</div><div style="font-size:22px;font-weight:900;color:white;letter-spacing:-1px">${totalAmt}</div></div>`:''}
      </div>
    </div>`;
  }

  // ── Rojo Flamante: crimson full-bleed cover ──
  if(layout==='rojo'){
    return `<div class="qp-cover" style="${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:`background:linear-gradient(160deg,#4A0000 0%,#8B0000 45%,#600000 100%)`};position:relative;min-height:520px;display:flex;flex-direction:column">
      <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(74,0,0,0.15) 0%,rgba(139,0,0,0.55) 55%,rgba(96,0,0,0.88) 100%);pointer-events:none;z-index:0"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 65% 50% at 50% 105%,rgba(255,107,107,0.16) 0%,transparent 60%);pointer-events:none;z-index:0"></div>
      <div style="position:relative;padding:22px 36px;display:flex;justify-content:space-between;align-items:center;z-index:2;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:14px">${ag.logo_url?`<img src="${ag.logo_url}" style="max-height:28px">`:buildPdfWordmarkFn(22)}${ag.nm?`<div style="width:1px;height:16px;background:rgba(255,245,235,.2);margin:0 4px"></div><div style="font-size:10px;font-weight:700;color:rgba(255,245,235,.9)">${ag.nm}</div>`:''}</div>
        ${d.refId?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,245,235,.65);border:1px solid rgba(255,245,235,.2);border-radius:20px;padding:4px 12px">${d.refId}</div>`:''}
      </div>
      <div style="flex:1"></div>
      <div style="position:relative;padding:36px;z-index:2;flex-shrink:0">
        ${dests.length?`<div style="display:flex;gap:7px;margin-bottom:16px;flex-wrap:wrap">${dests.map(dest=>`<span style="background:rgba(255,245,235,0.12);border:1px solid rgba(255,245,235,0.28);border-radius:20px;padding:3px 12px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FFF5EB">${dest}</span>`).join('')}</div>`:''}
        ${cl.nombre?`<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,245,235,.4);margin-bottom:8px">COTIZACIÓN PARA</div><div style="font-size:52px;font-weight:900;letter-spacing:-2px;color:#FFF5EB;line-height:1;margin-bottom:16px;text-shadow:0 2px 20px rgba(0,0,0,.4)">${cl.nombre}</div>`:`<div style="font-size:52px;font-weight:900;letter-spacing:-2px;color:#FFF5EB;line-height:1;margin-bottom:16px;text-shadow:0 2px 20px rgba(0,0,0,.4)">${vi.destino||'Tu próximo viaje'}</div>`}
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          ${cl.pasajeros?`<div style="display:flex;align-items:center;gap:8px"><div style="width:2px;height:20px;background:#FF6B6B;border-radius:2px"></div><span style="font-size:12px;font-weight:600;color:rgba(255,245,235,.8)">${cl.pasajeros}</span></div>`:''}
          ${vi.salida&&vi.regreso?`<div style="font-size:11px;color:rgba(255,245,235,.45);font-family:'DM Mono',monospace">${fd(vi.salida)} → ${fd(vi.regreso)}</div>`:''}
          ${vi.noches?`<div style="font-size:11px;color:rgba(255,245,235,.45)">${vi.noches} noches</div>`:''}
          ${totalAmt?`<div style="margin-left:auto;font-size:22px;font-weight:900;color:#FFF5EB;letter-spacing:-1px">${totalAmt}</div>`:''}
        </div>
      </div>
    </div>`;
  }

  // Default: cinematic + noir + bold use full-bleed cover (color palette differs via th)
  return null; // signals: use original cover code in buildQuoteHTML
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
  // PAGE 1: PORTADA (por layout)
  // ════════════════════════════════════════════════
  const _layout=th.layout||'cinematic';
  const _altCover=_buildCoverByLayout(_layout,th,ag,d,coverUrl,totalAmt,today,buildPdfWordmark);
  const _layoutStyle=_layoutCSS(_layout,th);
  const dests=[...new Set([vi.destino,vi.pais,...(d.hoteles||[]).map(h=>h.ciudad).filter(Boolean)].filter(Boolean))];
  let H=`<div id="qwrap">${_layoutStyle?`<style>${_layoutStyle}</style>`:''}`;
  if(_altCover){
    H+=_altCover;
  } else {
  H+=`<div class="qp-cover" style="${coverUrl?`background:url('${coverUrl}') center/cover no-repeat`:'background:linear-gradient(160deg,#0D2B1E 0%,#0A1A12 50%,#0D120F 100%)'};display:flex;flex-direction:column">
    <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(13,43,30,0.2) 0%,rgba(10,26,18,0.6) 55%,rgba(13,18,15,0.88) 100%);pointer-events:none;z-index:0"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 105%,rgba(${th.rgb},0.32) 0%,transparent 65%);pointer-events:none;z-index:0"></div>
    <div style="position:relative;z-index:2;padding:22px 36px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:14px">
        ${buildPdfWordmark(24)}
        ${ag.nm?`<div style="width:1px;height:20px;background:rgba(255,255,255,.18)"></div><div style="line-height:1.3"><div style="font-size:11px;font-weight:700;color:white;letter-spacing:.3px">${ag.nm}</div>${ag.ag?`<div style="font-size:9px;color:rgba(255,255,255,.5)">${ag.ag}</div>`:''}</div>`:''}
      </div>
      ${d.refId?`<div style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:5px 14px;font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:rgba(255,255,255,.75);letter-spacing:.5px">${d.refId}</div>`:''}
    </div>
    <div style="position:relative;z-index:2;flex:1;display:flex;align-items:center;padding:0 36px">
      <div>
        ${dests.length?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px">${dests.map(dest=>`<span style="background:rgba(${th.rgb},0.22);border:1px solid rgba(${th.rgb},0.45);border-radius:20px;padding:4px 14px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.85)">${dest}</span>`).join('')}</div>`:''}
        ${cl.nombre?`<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:10px">COTIZACIÓN PERSONALIZADA PARA</div><div style="font-size:52px;font-weight:900;letter-spacing:-2px;color:white;line-height:1;margin-bottom:18px;text-shadow:0 2px 20px rgba(0,0,0,.35)">${cl.nombre}</div>`:`<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:14px">PROPUESTA DE VIAJE</div><div style="font-size:52px;font-weight:900;letter-spacing:-2px;color:white;line-height:1;margin-bottom:18px;text-shadow:0 2px 20px rgba(0,0,0,.35)">${vi.destino||'Tu próximo viaje'}</div>`}
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          ${cl.pasajeros?`<div style="display:flex;align-items:center;gap:8px"><div style="width:2px;height:24px;background:${th.primary};flex-shrink:0;border-radius:2px"></div><span style="font-size:12px;font-weight:600;color:rgba(255,255,255,.75)">${cl.pasajeros}</span></div>`:''}
          ${vi.salida&&vi.regreso?`<div style="font-size:11px;color:rgba(255,255,255,.5);font-family:'DM Mono',monospace">${fd(vi.salida)} → ${fd(vi.regreso)}</div>`:''}
          ${vi.noches?`<div style="font-size:11px;color:rgba(255,255,255,.5)">${vi.noches} noches</div>`:''}
        </div>
      </div>
    </div>
    <div style="position:relative;z-index:2;background:${th.grad};padding:16px 36px;display:flex;align-items:center;gap:0;flex-shrink:0">
      ${totalAmt?`<div style="flex:0 0 auto;padding-right:24px;border-right:1px solid rgba(255,255,255,.25)"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:3px">PRECIO REFERENCIA</div><div style="font-size:18px;font-weight:900;color:white;letter-spacing:-0.5px">${totalAmt}</div></div>`:''}
      ${vi.descripcion?`<div style="flex:1;padding:0 ${totalAmt?'24':'0'}px${ag.nm?';border-right:1px solid rgba(255,255,255,.25)':''}"><div style="font-size:9px;color:rgba(255,255,255,.75);line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${vi.descripcion.trim().substring(0,200)}</div></div>`:`<div style="flex:1"></div>`}
      ${ag.nm?`<div style="flex:0 0 auto;padding-left:24px;text-align:right"><div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:3px">AGENTE</div><div style="font-size:12px;font-weight:700;color:white">${ag.nm}</div><div style="font-size:8px;color:rgba(255,255,255,.5);margin-top:1px">${today}</div></div>`:''}
    </div>
    ${window._unsplashCredit?(()=>{const _uc=window._unsplashCredit;const _pb=_uc.link||'https://unsplash.com';const _pu=_pb+(_pb.includes('?')?'&':'?')+'utm_source=ermix&utm_medium=referral';return`<div style="position:absolute;bottom:92px;left:12px;z-index:3;font-size:7px;color:rgba(255,255,255,.55);background:rgba(0,0,0,.32);padding:2px 7px;border-radius:6px">Foto de <a href="https://unsplash.com/@${_uc.username}?utm_source=ermix&utm_medium=referral" target="_blank" style="color:rgba(255,255,255,.75);text-decoration:underline">${_uc.name}</a> en <a href="${_pu}" target="_blank" style="color:rgba(255,255,255,.75);text-decoration:underline">Unsplash</a></div>`})():''}
  </div>`;
  } // end else (cinematic/bold cover)

  // ════════════════════════════════════════════════
  // PAGE 2: ITINERARIO DÍA A DÍA
  // ════════════════════════════════════════════════
  if(d.itinerario?.length>0){
    const _tipoC={VUELO:'#1B9E8F',LLEGADA:'#1B9E8F',TRASLADO:'#E8826A',PARQUE:'#D4A017','EXCURSIÓN':'#43A047',PLAYA:'#0288D1',COMPRAS:'#2E7D32',RELAX:'#78909C',CASA:'#66BB6A',NAVIDAD:'#C62828','EVENTO ESPECIAL':'#FF8F00',LIBRE:'#9CA3AF'};
    const _pd3=(s)=>{if(!s)return null;if(s.includes('/')){const[dd,mm,yy]=s.split('/');const dt=new Date(yy+'-'+mm.padStart(2,'0')+'-'+dd.padStart(2,'0'));return isNaN(dt)?null:dt;}const dt=new Date(s);return isNaN(dt)?null:dt;};
    // Group by fecha preserving order
    const _iGrp={};const _iOrd=[];
    d.itinerario.forEach(r=>{if(!_iGrp[r.fecha]){_iGrp[r.fecha]=[];_iOrd.push(r.fecha);}_iGrp[r.fecha].push(r);});
    const itiRows=_iOrd.map(f=>({fecha:f,date:_pd3(f),evs:_iGrp[f]})).filter(r=>r.date).sort((a,b)=>a.date-b.date);
    if(itiRows.length>0){
      H+=`<div class="qp-page" style="break-before:page">${darkHd(`ITINERARIO · ${(vi.destino||'').toUpperCase()}${vi.salida?' · '+fd(vi.salida):''}${vi.regreso?' – '+fd(vi.regreso):''}`,`Día a Día`,vi.noches?vi.noches+' noches'+(vi.destino?' en '+vi.destino:''):'')}<div style="padding:0 32px 20px"><table class="qp-iti-table"><thead><tr><th style="width:80px">FECHA</th><th>ACTIVIDAD</th><th style="width:110px">TIPO</th></tr></thead><tbody>${itiRows.map((r,ri)=>r.evs.map((ev,ei)=>{const c=_tipoC[ev.tipo]||'#9CA3AF';const dc=ei===0?`<td class="qp-iti-date" rowspan="${r.evs.length}"><div style="font-size:15px;font-weight:800;color:#2D1F14;line-height:1">${String(r.date.getDate()).padStart(2,'0')}/${String(r.date.getMonth()+1).padStart(2,'0')}</div><div style="font-size:8px;font-weight:600;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;margin-top:2px">${DIAS[r.date.getDay()]}</div></td>`:'';return`<tr class="${ri%2===0?'qp-iti-even':'qp-iti-odd'}">${dc}<td class="qp-iti-act"><div style="display:flex;align-items:center;gap:7px"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${c};flex-shrink:0"></span><span style="font-size:10px;color:#374151">${ev.actividad||ev.tipo}</span></div></td><td class="qp-iti-type"><span style="background:${c};color:white;font-size:7.5px;font-weight:800;letter-spacing:1.5px;padding:2px 7px;border-radius:20px;text-transform:uppercase;white-space:nowrap">${ev.tipo}</span></td></tr>`;}).join('')).join('')}</tbody></table></div></div>`;
    }
  } else {
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
  } // end else (auto-computed itinerary)

  // ════════════════════════════════════════════════
  // PAGES 3..N: SERVICE SECTIONS
  // ════════════════════════════════════════════════

  // ── VUELOS ──
  if((d.vuelos||[]).length){
    const rBP=(label,isRet,or,io,hs,fss,de,id2,hl,fl,al,num,esc,tesc,dur)=>`<div class="q-bp"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#374151">${or} → ${de}</span><span class="q-bp-chip${isRet?' ret':''}">${label}</span></div><div class="q-bp-grid"><div><div class="q-bp-time">${hs||'–'}</div><div class="q-iata">${io||or}</div><div class="q-bp-city">${or}</div>${fss?`<div style="font-size:9px;color:rgba(45,31,20,0.4);margin-top:1px">${fd(fss)}</div>`:''}</div><div class="q-bp-mid"><div class="q-bp-escl">${esc?'con escala':'directo'}</div><div class="q-bp-line"></div>${esc?`<div class="q-bp-via">${L(LI.arrow,8)} ${esc}${tesc?' · '+tesc:''}</div>`:''}${dur?`<div class="q-bp-dur">${dur}</div>`:''}</div><div style="text-align:right"><div class="q-bp-time">${hl||'–'}</div><div class="q-iata">${id2||de}</div><div class="q-bp-city">${de}</div>${fl?`<div style="font-size:9px;color:rgba(45,31,20,0.4);margin-top:1px">${fd(fl)}</div>`:''}</div></div><div class="q-bp-footer"><span class="q-bp-meta">${al||''}${num?' · '+num:''}</span></div></div>`;
    H+=`<div class="qp-page">${darkHd('TRANSPORTE AÉREO','Vuelos',d.vuelos.length+' tramo'+( d.vuelos.length>1?'s':''))}<div class="qp-items">`;
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
    H+=`<div class="qp-page">${darkHd('ALOJAMIENTO'+(hotCities?' · '+hotCities.toUpperCase():'')+(hotDates?' · '+hotDates:''),'Alojamiento',hotOk.length+' hotel'+(hotOk.length>1?'es':''))}<div class="qp-items">`;
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

  // ── GALERIA (right after hotels) — fotos por hotel guardadas en datos ──
  {
    const hotelesConFotos=(d.hoteles||[]).map((h,i)=>({h,i,fotos:(h.fotos||[]).filter(f=>f?.url)})).filter(x=>x.fotos.length);
    if(hotelesConFotos.length){
      H+=`<div class="qp-page">${darkHd('GALERÍA DE FOTOS','Alojamiento','Imágenes de referencia')}<div style="padding:20px 32px">`;
      hotelesConFotos.forEach(({h,fotos})=>{
        H+=`<div style="margin-bottom:20px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(45,31,20,0.4);margin-bottom:10px">${h.nombre||'Hotel'}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${fotos.map(f=>`<div style="position:relative;aspect-ratio:4/3;overflow:hidden;border-radius:8px"><img src="${f.url}" style="width:100%;height:100%;object-fit:cover;display:block">${f.label?`<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 80%);padding:6px 8px"><span style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.85)">${f.label}</span></div>`:''}</div>`).join('')}</div></div>`;
      });
      H+=`</div></div>`;
    }
  }

  // ── TRASLADOS ──
  const trsOk=(d.traslados||[]).filter(t=>t.origen||t.destino);
  if(trsOk.length){
    H+=`<div class="qp-page">${darkHd('TRANSFERS Y TRASLADOS','Traslados',trsOk.length+' traslado'+(trsOk.length>1?'s':''))}<div class="qp-items">`;
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
    H+=`<div class="qp-page">${darkHd('EXCURSIONES Y ACTIVIDADES','Excursiones',excOk.length+' actividad'+(excOk.length>1?'es':''))}<div class="qp-items">`;
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
    H+=`<div class="qp-page">${darkHd('ALQUILER DE AUTOS','Rent a Car',autosOk.length+' vehículo'+(autosOk.length>1?'s':''))}<div class="qp-items">`;
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
    H+=`<div class="qp-page">${darkHd('CRUCERO · NAVEGACIÓN','Crucero',crucOk[0].naviera)}<div class="qp-items">`;
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
    H+=`<div class="qp-page">${darkHd('ASISTENCIA AL VIAJERO','Cobertura',d.seguro.nombre)}<div class="qp-items"><div class="qp-item-card"><div class="seg-grid">${[[LI.med,'Cobertura médica',d.seguro.cobertura_medica],[LI.luggage,'Equipaje',d.seguro.equipaje_seg],[LI.check,'Preexistencias',d.seguro.preexistencias],[LI.clip,'Beneficios',d.seguro.extra]].filter(r=>r[2]).map(r=>`<div class="seg-cell"><div style="margin-bottom:4px">${L(r[0],14,'#9B7FD4')}</div><div class="lbl2">${r[1]}</div><div class="val">${r[2]}</div></div>`).join('')}</div>${d.seguro.precio>0?`<div class="ptag"><div style="display:inline-flex;flex-direction:column;align-items:flex-end;background:#F0EEF9;border:1px solid rgba(155,127,212,0.2);border-radius:8px;padding:8px 14px"><div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(155,127,212,0.7);margin-bottom:2px">Precio${d.seguro.fin?' · '+d.seguro.fin:''}</div>${gradPrice(fmtMoney(d.seguro.precio,d.seguro.moneda),15,'linear-gradient(135deg,#9B7FD4,#C4B5FD)')}</div></div>`:''}</div></div></div>`;
  }

  // ── TICKETS ──
  const tksOk=(d.tickets||[]).filter(t=>t.nombre);
  if(tksOk.length){
    H+=`<div class="qp-page">${darkHd('TICKETS Y ENTRADAS','Tickets',tksOk.length+' entrada'+(tksOk.length>1?'s':''))}<div class="qp-items">`;
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
      ${(ag.logo_url||logoUrl)?`<div style="margin-bottom:28px"><img src="${ag.logo_url||logoUrl}" style="max-height:72px;max-width:200px;object-fit:contain;border-radius:8px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))"></div>`:`<div style="margin-bottom:36px">${buildPdfWordmark(32)}</div>`}
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

