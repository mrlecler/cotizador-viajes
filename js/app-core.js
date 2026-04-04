// ═══════════════════════════════════════════
// VERSION
// ═══════════════════════════════════════════
const APP_VERSION = '0.25.32';

// ═══════════════════════════════════════════
// PLANES
// ═══════════════════════════════════════════
const PLANES = {
  explorador: {
    nombre: 'Explorador',
    precio: 9,
    features: ['cotizar','historial_20','clientes_basico','proveedores','soporte']
  },
  profesional: {
    nombre: 'Profesional',
    precio: 12,
    features: [
      'cotizar','historial_ilimitado','clientes_basico','proveedores','soporte',
      'enviar_email','fotos_unsplash','seguimiento','ingresos',
      'crm_avanzado','nueva_version','ia_parser','promos'
    ]
  },
  elite: {
    nombre: 'Elite',
    precio: 19,
    features: [
      'cotizar','historial_ilimitado','clientes_basico','proveedores','soporte',
      'enviar_email','fotos_unsplash','seguimiento','ingresos',
      'crm_avanzado','nueva_version','ia_parser','promos',
      'prioridad','multi_agente'
    ]
  }
};

// Retorna true si el agente tiene acceso a la feature en su plan actual
// Durante trial: acceso completo al plan explorador + features seleccionadas
function _tienePlan(feature){
  const plan   = window._planActual  || 'explorador';
  const estado = window._planEstado  || 'trial';
  const vence  = window._planVence   ? new Date(window._planVence) : null;
  // Trial vencido — solo features del explorador, sin trial extras
  const trialVencido = (estado === 'trial') && vence && (vence < new Date());
  if(trialVencido){
    return (PLANES.explorador.features || []).includes(feature);
  }
  // Trial activo — mismo acceso que profesional
  if(estado === 'trial'){
    return (PLANES.profesional.features || []).includes(feature);
  }
  // Plan activo
  const features = PLANES[plan]?.features || PLANES.explorador.features;
  return features.includes(feature);
}

// Bloquea un elemento/botón si el agente no tiene la feature
// el: elemento DOM | feature: string | planRequerido: 'profesional'|'elite'
function _bloquearFeature(el, feature, planRequerido){
  if(!el) return;
  if(_tienePlan(feature)) return; // tiene acceso — no hacer nada
  // Bloquear
  el.style.position = 'relative';
  el.style.pointerEvents = 'none';
  el.style.opacity = '0.5';
  el.title = 'Disponible en plan ' + (PLANES[planRequerido]?.nombre || 'Profesional');
  // Agregar badge lock si no tiene
  if(!el.querySelector('._plan-lock')){
    const lock = document.createElement('span');
    lock.className = '_plan-lock';
    lock.style.cssText = 'position:absolute;top:4px;right:4px;background:#FF6B35;color:white;border-radius:4px;font-size:.55rem;font-weight:700;letter-spacing:.05em;padding:2px 5px;pointer-events:auto;cursor:pointer';
    lock.textContent = 'PRO';
    lock.onclick = (e) => { e.stopPropagation(); _openUpgradeModal(planRequerido); };
    el.appendChild(lock);
  }
}

// Abre modal de upgrade
function _openUpgradeModal(planRequerido){
  const reqs = planRequerido || 'profesional';
  const nm   = PLANES[reqs]?.nombre || 'Profesional';
  const old  = document.getElementById('_upgrade-modal');
  if(old) old.remove();
  const m = document.createElement('div');
  m.id = '_upgrade-modal';
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(45,31,20,.55);backdrop-filter:blur(8px)';
  m.innerHTML = `
    <div style="background:var(--surface);border-radius:20px;padding:32px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative">
      <button onclick="document.getElementById('_upgrade-modal').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;color:var(--g4);font-size:1.2rem;line-height:1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div style="text-align:center;margin-bottom:24px">
        <div style="width:56px;height:56px;background:linear-gradient(135deg,#FF6B35,#E85A25);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(255,107,53,.3)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--text);letter-spacing:-.02em">Funcion ${nm}</div>
        <div style="font-size:.82rem;color:var(--muted);margin-top:6px">Esta funcion requiere el plan ${nm} o superior</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
        ${Object.entries(PLANES).map(([key,p])=>`
          <div style="border-radius:12px;padding:14px 10px;text-align:center;border:1.5px solid ${key===reqs?'var(--primary)':'var(--border)'};background:${key===reqs?'rgba(27,158,143,.06)':'var(--bg)'}">
            <div style="font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${key===reqs?'var(--primary)':'var(--muted)'};">${p.nombre}</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--text);margin-top:4px;letter-spacing:-.02em">$${p.precio}<span style="font-size:.65rem;font-weight:500;color:var(--muted)">/mo</span></div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;font-size:.8rem;color:var(--muted)">Contacta a tu administrador ermix para actualizar tu plan</div>
    </div>`;
  document.body.appendChild(m);
  m.onclick = (e) => { if(e.target===m) m.remove(); };
}

// Banner de trial en el topbar
function _initTrialBanner(){
  const estado = window._planEstado || '';
  const vence  = window._planVence  ? new Date(window._planVence) : null;
  if(estado !== 'trial' || !vence) return;
  const now      = new Date();
  const diffMs   = vence - now;
  const diffDias = Math.ceil(diffMs / (1000*60*60*24));
  // Trial vencido — mostrar modal bloqueante
  if(diffDias <= 0){
    _showTrialVencidoModal();
    return;
  }
  // Banner normal o urgente
  const urgente = diffDias <= 3;
  const old = document.getElementById('_trial-banner');
  if(old) old.remove();
  const bar = document.createElement('div');
  bar.id = '_trial-banner';
  bar.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;z-index:900;
    padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:12px;
    font-size:.78rem;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;
    background:${urgente?'linear-gradient(90deg,#C84B31,#E8826A)':'linear-gradient(90deg,var(--primary),var(--primary2))'};
    color:white;box-shadow:0 -4px 16px ${urgente?'rgba(200,75,49,.3)':'rgba(27,158,143,.2)'};
  `;
  bar.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ${urgente
      ? `Tu prueba gratuita vence en <strong>&nbsp;${diffDias} dia${diffDias===1?'':'s'}</strong>&nbsp;— Actualiza tu plan para no perder el acceso`
      : `Estas en prueba gratuita &mdash; ${diffDias} dia${diffDias===1?'':'s'} restantes`
    }
    <button onclick="document.getElementById('_trial-banner').remove()" style="background:rgba(255,255,255,.2);border:none;border-radius:6px;width:20px;height:20px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center;font-size:.8rem;padding:0;margin-left:6px">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  document.body.appendChild(bar);
}

// Modal bloqueante cuando el trial venció
function _showTrialVencidoModal(){
  const old = document.getElementById('_trial-vencido-modal');
  if(old) return;
  const m = document.createElement('div');
  m.id = '_trial-vencido-modal';
  m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(13,18,15,.92);backdrop-filter:blur(12px)';
  m.innerHTML = `
    <div style="background:var(--surface);border-radius:24px;padding:40px 36px;max-width:520px;width:92%;box-shadow:0 24px 80px rgba(0,0,0,.4);text-align:center">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,rgba(200,75,49,.15),rgba(232,130,106,.08));border:1.5px solid rgba(200,75,49,.25);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C84B31" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div style="font-size:1.4rem;font-weight:900;color:var(--text);letter-spacing:-.02em;margin-bottom:8px">Tu prueba gratuita vencio</div>
      <div style="font-size:.85rem;color:var(--muted);line-height:1.6;margin-bottom:28px;max-width:360px;margin-left:auto;margin-right:auto">
        Para seguir usando ermix, selecciona el plan que mejor se adapta a tu negocio. Sin contrato — cancelas cuando quieras.
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
        ${Object.entries(PLANES).map(([key,p],i)=>`
          <div style="border-radius:14px;padding:18px 12px;border:1.5px solid ${i===1?'var(--primary)':'var(--border)'};background:${i===1?'rgba(27,158,143,.07)':'var(--bg)'}">
            ${i===1?'<div style="font-size:.58rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--primary);margin-bottom:8px">Recomendado</div>':'<div style="margin-bottom:20px"></div>'}
            <div style="font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${i===1?'var(--primary)':'var(--muted)'};">${p.nombre}</div>
            <div style="font-size:1.5rem;font-weight:800;color:var(--text);margin-top:4px;letter-spacing:-.02em">$${p.precio}<span style="font-size:.65rem;font-weight:500;color:var(--muted)">/mo</span></div>
          </div>
        `).join('')}
      </div>
      <div style="font-size:.8rem;color:var(--muted);margin-bottom:16px">Contacta a tu administrador ermix para activar tu plan</div>
      <button onclick="doLogout()" style="background:none;border:1px solid var(--border);border-radius:10px;padding:10px 20px;font-size:.8rem;color:var(--muted);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">Cerrar sesion</button>
    </div>
  `;
  document.body.appendChild(m);
}

// ═══════════════════════════════════════════
// SUPABASE — credenciales en js/config.js
// ═══════════════════════════════════════════
// storageKey separada por env — prod y test no comparten sesión en el mismo browser
const sb = supabase.createClient(ERMIX_CONFIG.supabaseUrl, ERMIX_CONFIG.supabaseKey,
  ERMIX_CONFIG.env==='test' ? {auth:{storageKey:'ermix-auth-test'}} : {}
);

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let coverUrl=null, closingUrl=null, hotelPhotos={}, logoUrl=null;
let agCfg={};
function _cfgKey(){return 'mp_cfg_'+(currentUser?.id||'default');}
function _loadAgCfg(){agCfg=JSON.parse(localStorage.getItem(_cfgKey())||'{}');return agCfg;}
function _saveAgCfg(){localStorage.setItem(_cfgKey(),JSON.stringify(agCfg));}
let qData=null, currentUser=null, isAdmin=false, currentRol='agente';
let vc=0,hc=0,tc=0,ec=0;
let allClients=[], allQuotes=[];
let _crmActiveTab='history'; // CRM panel active sub-tab

// ── Sound system (Web Audio API) ─────────────────────
const _SOUNDS={
  aprobado:{
    chime:(ac)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';g.gain.setValueAtTime(0,ac.currentTime);g.gain.linearRampToValueAtTime(0.35,ac.currentTime+0.02);o.frequency.setValueAtTime(880,ac.currentTime);o.frequency.setValueAtTime(1100,ac.currentTime+0.12);o.frequency.setValueAtTime(1320,ac.currentTime+0.24);g.gain.linearRampToValueAtTime(0,ac.currentTime+0.5);o.start(ac.currentTime);o.stop(ac.currentTime+0.55);},
    bell:(ac)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=1046;g.gain.setValueAtTime(0.4,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+1.2);o.start(ac.currentTime);o.stop(ac.currentTime+1.25);},
    success:(ac)=>{[523,659,784,1047].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,ac.currentTime+i*0.11);g.gain.linearRampToValueAtTime(0.28,ac.currentTime+i*0.11+0.04);g.gain.linearRampToValueAtTime(0,ac.currentTime+i*0.11+0.2);o.start(ac.currentTime+i*0.11);o.stop(ac.currentTime+i*0.11+0.25);});},
    coins:(ac)=>{for(let i=0;i<5;i++){const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=1200+Math.random()*400;const t=ac.currentTime+i*0.08;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.22,t+0.01);g.gain.linearRampToValueAtTime(0,t+0.12);o.start(t);o.stop(t+0.15);}},
    marimba:(ac)=>{[523,659,784].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=f;const t=ac.currentTime+i*0.15;g.gain.setValueAtTime(0.35,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.5);o.start(t);o.stop(t+0.55);});},
    none:null
  },
  soporte:{
    alert:(ac)=>{[660,550].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.18,ac.currentTime+i*0.18);g.gain.linearRampToValueAtTime(0,ac.currentTime+i*0.18+0.15);o.start(ac.currentTime+i*0.18);o.stop(ac.currentTime+i*0.18+0.18);});},
    ping:(ac)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=1480;g.gain.setValueAtTime(0.3,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.6);o.start(ac.currentTime);o.stop(ac.currentTime+0.65);},
    notification:(ac)=>{[880,1100].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=f;const t=ac.currentTime+i*0.14;g.gain.setValueAtTime(0.28,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.35);o.start(t);o.stop(t+0.38);});},
    buzz:(ac)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sawtooth';o.frequency.value=220;g.gain.setValueAtTime(0.2,ac.currentTime);g.gain.linearRampToValueAtTime(0,ac.currentTime+0.25);o.start(ac.currentTime);o.stop(ac.currentTime+0.28);},
    none:null
  }
};
let _audioCtx=null;
function _playSound(category,soundId){
  try{
    // Prioridad: parámetro > preferencia del agente > config del sistema (admin) > default
    const sysDefault=localStorage.getItem('mp_sys_snd_'+category)||'chime';
    const id=soundId||agCfg['sound_'+category]||agCfg['adm_snd_'+category]||sysDefault;
    if(id==='none') return;
    const fn=_SOUNDS[category]?.[id];
    if(!fn) return;
    if(!_audioCtx||_audioCtx.state==='closed') _audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(_audioCtx.state==='suspended') _audioCtx.resume().then(()=>fn(_audioCtx));
    else fn(_audioCtx);
  }catch(e){console.warn('[sound]',e);}
}

// ── Error log global (debug) ──────────────────────────
window._appLog = window._appLog || [];
function _captureError(ctx, err){
  const entry={ts:new Date().toISOString(),ctx,msg:err?.message||String(err),code:err?.code||'',details:err?.details||''};
  window._appLog.unshift(entry);
  if(window._appLog.length>100) window._appLog.length=100;
  console.error('[appLog]',ctx,err);
  // Si el panel de admin está abierto, refrescar el log
  if(document.getElementById('admin-log') && typeof loadAdminLog==='function'){
    loadAdminLog();
  }
}
let formDraft=null; // BUG3 — draft en memoria para preservar el formulario entre tabs
let editingQuoteId=null; // MEJORA3 — ID de la cotización que se está editando (null = nueva)

// ═══════════════════════════════════════════
// PERMISOS — helpers centralizados
// ═══════════════════════════════════════════
function _canEdit(record){
  if(currentRol==='admin'||currentRol==='agencia') return false; // admin y agencia son solo lectura
  return record.agente_id===window._agenteId;
}
function _canView(record){
  if(record.agente_id===window._agenteId) return true;
  if(currentRol==='admin') return true;
  if(currentRol==='agencia') return true; // RLS ya filtra por agencia
  return false;
}

// ═══════════════════════════════════════════
// WORDMARK — función compartida ermix
// ═══════════════════════════════════════════
function buildWordmark(targetId, fontSize, textCol, xType) {
  const X='M8 8 L8 18 L24.5 32 L8 46 L8 56 L20 56 L32 43.5 L44 56 L56 56 L56 46 L39.5 32 L56 18 L56 8 L44 8 L32 20.5 L20 8 Z';
  const G=['#1B9E8F','#0BC5B8','#06B6D4'];
  const c=document.createElement('canvas'),ctx=c.getContext('2d');
  ctx.font='900 '+fontSize+'px "DM Sans"';
  const ermiW=ctx.measureText('ermi').width;
  const capH=fontSize*0.725,sc=capH/48;
  const baseline=fontSize*0.86,totalH=fontSize;
  const xTop=baseline-capH,xLeft=ermiW-1;
  const totalW=xLeft+48*sc+4;
  const tx=xLeft-8*sc,ty=xTop-8*sc;
  const gid='wm_'+Date.now();
  const xFill=xType==='grad'?'url(#'+gid+')':(xType||'#1B9E8F');
  const svgInner='<defs><linearGradient id="'+gid+'" x1="0%" y1="0%" x2="100%" y2="100%">'
    +'<stop offset="0%" stop-color="'+G[0]+'"/>'
    +'<stop offset="45%" stop-color="'+G[1]+'"/>'
    +'<stop offset="100%" stop-color="'+G[2]+'"/>'
    +'</linearGradient></defs>'
    +'<text x="0" y="'+baseline+'" font-family="\'DM Sans\',sans-serif" font-weight="900" font-size="'+fontSize+'" letter-spacing="-1" fill="'+(textCol||'white')+'">ermi</text>'
    +'<path transform="translate('+tx+','+ty+') scale('+sc+')" d="'+X+'" fill="'+xFill+'"/>';
  const target=document.getElementById(targetId);
  if(!target)return;
  if(target.tagName&&target.tagName.toLowerCase()==='svg'){
    target.setAttribute('viewBox','0 0 '+totalW+' '+totalH);
    target.setAttribute('width',totalW);
    target.setAttribute('height',totalH);
    target.innerHTML=svgInner;
  } else {
    target.innerHTML='<svg viewBox="0 0 '+totalW+' '+totalH+'" width="'+totalW+'" height="'+totalH+'" xmlns="http://www.w3.org/2000/svg">'+svgInner+'</svg>';
  }
}

// Inicialización de wordmarks cuando las fuentes están listas
function _initWordmarks(){
  buildWordmark('login-wm',42,'white','grad');
  buildWordmark('tk-hd-wm',28,'white','grad');
  buildWordmark('hdr-wm',22,'currentColor','grad');
}

// Login: random photo + random route
const _loginPhotos=[
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80',
  'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200&q=80'
];
const _loginRoutes=[
  {to:'BCN',city:'Barcelona'},{to:'CDG',city:'Paris'},{to:'FCO',city:'Roma'},
  {to:'MIA',city:'Miami'},{to:'CUN',city:'Cancun'},{to:'NRT',city:'Tokyo'},
  {to:'LHR',city:'Londres'},{to:'JFK',city:'New York'},{to:'SYD',city:'Sydney'},
  {to:'MAD',city:'Madrid'},{to:'DXB',city:'Dubai'},{to:'IST',city:'Estambul'},
  {to:'GIG',city:'Rio de Janeiro'},{to:'LIS',city:'Lisboa'},{to:'AMS',city:'Amsterdam'}
];
function _initLoginScreen(){
  const img=document.getElementById('login-bg');
  if(img) img.src=_loginPhotos[Math.floor(Math.random()*_loginPhotos.length)];
  const r=_loginRoutes[Math.floor(Math.random()*_loginRoutes.length)];
  const toEl=document.getElementById('tk-to');if(toEl)toEl.textContent=r.to;
  const cityEl=document.getElementById('tk-to-city');if(cityEl)cityEl.textContent=r.city;
}
function _tryInitWordmarks(attempt){
  if(document.fonts.check('900 48px "DM Sans"')){
    _initWordmarks();
  } else if(attempt<10){
    setTimeout(()=>_tryInitWordmarks(attempt+1), 300);
  } else {
    // Después de 3s, construir igual con lo que haya
    _initWordmarks();
  }
}
document.fonts.ready.then(()=>{_tryInitWordmarks(0);_initLoginScreen();});

function _buildSbLogo(){
  const el=document.getElementById('sb-logo');
  if(!el) return;
  // Wordmark compacto: solo la X (18px height) en blanco
  const X='M8 8 L8 18 L24.5 32 L8 46 L8 56 L20 56 L32 43.5 L44 56 L56 56 L56 46 L39.5 32 L56 18 L56 8 L44 8 L32 20.5 L20 8 Z';
  const sz=18, sc=sz/48;
  el.innerHTML='<svg viewBox="0 0 18 18" width="18" height="18" xmlns="http://www.w3.org/2000/svg">'
    +'<path transform="scale('+sc+')" d="'+X+'" fill="white"/>'
    +'</svg>';
}

// ═══════════════════════════════════════════
// TEMA — Dark / Light toggle
// ═══════════════════════════════════════════
function toggleTheme(){
  const current=document.documentElement.getAttribute('data-theme');
  const next=current==='light'?'dark':'light';
  document.documentElement.setAttribute('data-theme',next);
  localStorage.setItem('ermix-theme',next);
  // Legacy login icons
  const di=document.getElementById('theme-icon-dark');
  const li=document.getElementById('theme-icon-light');
  if(di) di.style.display=next==='light'?'block':'none';
  if(li) li.style.display=next==='dark'?'block':'none';
  // Topbar toggle icons
  const moon=document.getElementById('theme-ico-moon');
  const sun=document.getElementById('theme-ico-sun');
  if(moon) moon.style.display=next==='light'?'':'none';
  if(sun) sun.style.display=next==='dark'?'':'none';
  const lbl=document.getElementById('login-theme-lbl');
  if(lbl) lbl.textContent='Tema al ingresar: '+(next==='light'?'claro':'oscuro');
}

(function initTheme(){
  // v3: default es light
  const saved=localStorage.getItem('ermix-theme')||'light';
  document.documentElement.setAttribute('data-theme',saved);
  document.addEventListener('DOMContentLoaded',function(){
    const di=document.getElementById('theme-icon-dark');
    const li=document.getElementById('theme-icon-light');
    if(di) di.style.display=saved==='light'?'block':'none';
    if(li) li.style.display=saved==='dark'?'block':'none';
    // Topbar toggle icons
    const moon=document.getElementById('theme-ico-moon');
    const sun=document.getElementById('theme-ico-sun');
    if(moon) moon.style.display=saved==='light'?'':'none';
    if(sun) sun.style.display=saved==='dark'?'':'none';
    const lbl=document.getElementById('login-theme-lbl');
    if(lbl) lbl.textContent='Tema al ingresar: '+(saved==='light'?'claro':'oscuro');
  });
})();

// ═══════════════════════════════════════════
// SIDEBAR — Toggle expandible
// ═══════════════════════════════════════════
function _toggleSidebar(){
  const sb=document.getElementById('sidebar');
  const ui=document.getElementById('ui');
  if(!sb||!ui) return;
  const isOpen=sb.classList.toggle('open');
  ui.classList.toggle('sb-open',isOpen);
  localStorage.setItem('sb-open',isOpen?'1':'');
  // Mostrar/ocultar label expandido del perfil
  const pl=document.getElementById('sb-prof-label');
  if(pl) pl.style.display=isOpen?'':'none';
}

// ═══════════════════════════════════════════
// AUTH — NETLIFY IDENTITY
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// AUTH — SUPABASE NATIVE
// ═══════════════════════════════════════════
function setLoginStatus(msg, color){
  const s=document.getElementById('login-status');
  if(s){s.textContent=msg;s.style.color=color||'rgba(255,255,255,.5)';}
}

async function doLogin(){
  const email=document.getElementById('li-email').value.trim();
  const pass=document.getElementById('li-pass').value;
  const btn=document.getElementById('li-btn');
  if(!email||!pass){setLoginStatus('Ingresá email y contraseña','var(--amber)');return;}
  btn.disabled=true;btn.innerHTML='<span class="spin" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;vertical-align:middle"></span> Verificando...';
  setLoginStatus('');
  try{
    const {data,error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error) throw error;
    showApp(data.user);
  }catch(e){
    let msg=e.message||'Error';
    if(msg.includes('Invalid login')) msg='Email o contraseña incorrectos';
    if(msg.includes('Email not confirmed')) msg='Confirmá tu email primero (revisá tu casilla)';
    setLoginStatus(msg,'var(--red)');
  }
  btn.disabled=false;btn.textContent='Embarcar';
}

async function doLoginGoogle(){
  const {error}=await sb.auth.signInWithOAuth({
    provider:'google',
    options:{redirectTo:window.location.origin+window.location.pathname}
  });
  if(error) setLoginStatus('No se pudo iniciar sesión con Google, intentá de nuevo','var(--red)');
}

async function showForgot(){
  const email=document.getElementById('li-email').value.trim();
  if(!email){setLoginStatus('Ingresa tu email primero','var(--amber)');return;}
  setLoginStatus('Enviando enlace...','rgba(255,255,255,.5)');
  // Sin SMTP: intentar reset via Supabase (funciona si SMTP está configurado)
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname+'?reset=1'});
  if(error){
    // Si falla, mostrar instrucciones de contacto
    setLoginStatus('No se pudo enviar el email. Contacta al administrador de tu agencia para restablecer tu contrasena.','var(--amber)');
  } else {
    setLoginStatus('Si el servicio de email esta activo, recibiras un enlace. Si no, contacta a tu administrador.','var(--primary)');
  }
}

async function doLogout(){
  await sb.auth.signOut();
  currentUser=null;window._agenteId=null;window._agenciaId=null;isAdmin=false;currentRol='agente';localStorage.removeItem('mp_admin');localStorage.removeItem('mp_rol');
  document.getElementById('ui').style.display='none';
  document.getElementById('login-wall').style.display='block';
  // Ocultar sidebar y bottom-nav
  const _sbOut=document.getElementById('sidebar');if(_sbOut)_sbOut.style.display='none';
  const _bnavOut=document.getElementById('bottom-nav');if(_bnavOut)_bnavOut.classList.remove('active');
  // Cerrar drawer si estaba abierto
  const _drw=document.getElementById('drawer-reserva');if(_drw)_drw.classList.remove('open');
  const _drwOv=document.getElementById('drawer-overlay');if(_drwOv)_drwOv.classList.remove('open');
  document.getElementById('li-pass').value='';
  setLoginStatus('Sesión cerrada.','var(--muted)');
}

// Check existing session + listen to auth changes
sb.auth.onAuthStateChange(async(event,session)=>{
  if(event==='SIGNED_IN'&&session?.user){
    await _completeGoogleInvite(session.user);
    showApp(session.user);
  } else if(event==='PASSWORD_RECOVERY'){
    document.getElementById('li-pass').placeholder='Nueva contraseña';
    document.getElementById('li-btn').onclick=doResetPassword;
    document.getElementById('li-btn').innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Guardar nueva contraseña';
    setLoginStatus('Ingresá tu nueva contraseña','var(--amber)');
    document.getElementById('login-wall').style.display='block';
    document.getElementById('ui').style.display='none';
  }
});

async function doResetPassword(){
  const pass=document.getElementById('li-pass').value;
  if(pass.length<6){setLoginStatus('Mínimo 6 caracteres','var(--red)');return;}
  const {error}=await sb.auth.updateUser({password:pass});
  if(error) setLoginStatus('No se pudo actualizar la contraseña, intentá de nuevo','var(--red)');
  else { setLoginStatus('Contraseña actualizada','var(--green)'); setTimeout(()=>{ document.getElementById('li-btn').onclick=doLogin; document.getElementById('li-btn').innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Iniciar sesion'; document.getElementById('li-pass').placeholder='Contraseña'; },1500); }
}

// ═══════════════════════════════════════════
// INVITE FLOW
// ═══════════════════════════════════════════
let _inviteData=null;

async function _checkInviteToken(){
  const params=new URLSearchParams(window.location.search);
  const token=params.get('invite');
  if(!token)return false;
  // Look up invite in invitaciones table
  const {data:invite,error}=await sb.from('invitaciones').select('*').eq('token',token).eq('tipo','invite').maybeSingle();
  if(error||!invite){
    document.getElementById('login-wall').style.display='block';
    setLoginStatus('Enlace de invitacion invalido o expirado','var(--red)');
    return true;
  }
  if(invite.usado){
    document.getElementById('login-wall').style.display='block';
    setLoginStatus('Esta invitacion ya fue usada. Inicia sesion con tu cuenta.','var(--amber)');
    return true;
  }
  // Show invite screen — hide everything else
  _inviteData={invite,token};
  document.getElementById('login-wall').style.display='none';
  document.getElementById('ui').style.display='none';
  const _sb=document.getElementById('sidebar');if(_sb)_sb.style.display='none';
  const _bn=document.getElementById('bottom-nav');if(_bn)_bn.classList.remove('active');
  document.getElementById('invite-wall').style.display='flex';
  document.getElementById('inv-accept-nm').value=invite.nombre||'';
  document.getElementById('inv-accept-em').value=invite.email||'';
  const rolLbl={agente:'Agente',agencia:'Agencia',admin:'Administrador'}[invite.rol]||invite.rol;
  document.getElementById('invite-rol-badge').textContent=rolLbl;
  if(typeof buildWordmark==='function') buildWordmark('invite-wm',56,'white','grad');
  return true;
}

async function acceptInvite(){
  if(!_inviteData){toast('Error: datos de invitacion no encontrados',false);return;}
  const nm=document.getElementById('inv-accept-nm')?.value?.trim();
  const pass=document.getElementById('inv-accept-pass')?.value;
  const pass2=document.getElementById('inv-accept-pass2')?.value;
  const em=_inviteData.invite.email;
  const statusEl=document.getElementById('invite-status');
  const setStatus=(msg,color)=>{if(statusEl)statusEl.innerHTML=`<div style="font-size:.78rem;color:${color};text-align:center">${msg}</div>`;};

  if(!pass||pass.length<6){setStatus('La contrasena debe tener al menos 6 caracteres','var(--red)');return;}
  if(pass!==pass2){setStatus('Las contrasenas no coinciden','var(--red)');return;}

  const btn=document.getElementById('inv-accept-btn');
  if(btn){btn.disabled=true;btn.textContent='Creando cuenta...';}

  // Create auth user via signUp
  const {data,error}=await sb.auth.signUp({email:em,password:pass});
  if(error){
    setStatus('Error: '+error.message,'var(--red)');
    if(btn){btn.disabled=false;btn.innerHTML='Crear cuenta';}
    return;
  }

  // INSERT agentes row with id = auth.uid() (garantizado)
  if(data.user){
    const agenteRow={id:data.user.id,email:em,rol:_inviteData.invite.rol||'agente',activo:true};
    if(nm) agenteRow.nombre=nm;
    if(_inviteData.invite.agencia_id) agenteRow.agencia_id=_inviteData.invite.agencia_id;
    await sb.from('agentes').insert(agenteRow);
    await sb.from('invitaciones').update({usado:true}).eq('token',_inviteData.token);
  }

  if(data.user&&!data.session){
    setStatus('Cuenta creada. Revisa tu email para confirmar y luego inicia sesion.','var(--primary)');
    setTimeout(()=>{window.location.href=window.location.pathname;},3000);
    return;
  }
  setStatus('Cuenta creada. Ingresando...','var(--primary)');
  setTimeout(()=>{window.location.href=window.location.pathname;},1500);
}

async function acceptInviteGoogle(){
  if(!_inviteData)return;
  // Store invite token in localStorage so we can complete after OAuth redirect
  localStorage.setItem('mp_pending_invite',_inviteData.token);
  await sb.auth.signInWithOAuth({
    provider:'google',
    options:{redirectTo:window.location.origin+window.location.pathname}
  });
}

// ═══════════════════════════════════════════
// MANUAL PASSWORD RESET (sin SMTP)
// ═══════════════════════════════════════════
let _resetData=null;

async function _checkResetToken(){
  const params=new URLSearchParams(window.location.search);
  const token=params.get('reset_token');
  if(!token)return false;
  // Look up reset token in agentes table
  const {data:agent,error}=await sb.from('agentes').select('*').eq('reset_token',token).single();
  if(error||!agent){
    document.getElementById('login-wall').style.display='block';
    setLoginStatus('Enlace de restablecimiento invalido o expirado','var(--red)');
    return true;
  }
  // Show reset screen
  _resetData={agent,token};
  document.getElementById('login-wall').style.display='none';
  document.getElementById('ui').style.display='none';
  const _sb2=document.getElementById('sidebar');if(_sb2)_sb2.style.display='none';
  const _bn2=document.getElementById('bottom-nav');if(_bn2)_bn2.classList.remove('active');
  document.getElementById('reset-wall').style.display='flex';
  document.getElementById('reset-user-name').textContent=agent.nombre||'Usuario';
  document.getElementById('reset-user-email').textContent=agent.email;
  // Logo wordmark en reset screen
  if(typeof buildWordmark==='function') buildWordmark('reset-wm',56,'white','grad');
  return true;
}

async function doManualReset(){
  if(!_resetData){toast('Error: datos de reset no encontrados',false);return;}
  const pass=document.getElementById('reset-pass')?.value;
  const pass2=document.getElementById('reset-pass2')?.value;
  const statusEl=document.getElementById('reset-status');
  const setStatus=(msg,color)=>{if(statusEl)statusEl.innerHTML=`<div style="font-size:.78rem;color:${color};text-align:center">${msg}</div>`;};
  if(!pass||pass.length<6){setStatus('La contrasena debe tener al menos 6 caracteres','var(--red)');return;}
  if(pass!==pass2){setStatus('Las contrasenas no coinciden','var(--red)');return;}
  const btn=document.getElementById('reset-btn');
  if(btn){btn.disabled=true;btn.textContent='Guardando...';}
  // Sign in with email to get session, then update password
  // First try to sign in with a temp approach — use Supabase admin updateUser
  // Since we can't call admin API from client, we sign in and update
  const {data:signInData,error:signInErr}=await sb.auth.signInWithPassword({email:_resetData.agent.email,password:pass});
  if(!signInErr&&signInData?.session){
    // Already has this password — nothing to change
    setStatus('Contrasena guardada. Ingresando...','var(--primary)');
    // Clear reset token
    await sb.from('agentes').update({reset_token:null}).eq('id',_resetData.agent.id);
    setTimeout(()=>{window.location.href=window.location.pathname;},1500);
    return;
  }
  // Can't sign in with old password — try signUp update flow
  // The cleanest way: use the existing auth user and updateUser
  // But we need a session. Since we don't have SMTP, the admin needs to use Supabase Dashboard
  // Alternative: create a new auth user with this password (if user was invited but never set password)
  const {data:signUpData,error:signUpErr}=await sb.auth.signUp({email:_resetData.agent.email,password:pass});
  if(signUpErr){
    // User probably already exists — try password recovery approach
    // Show manual instructions
    setStatus('No se pudo actualizar la contrasena automaticamente. El administrador debe restablecerla desde el panel de Supabase.','var(--amber)');
    if(btn){btn.disabled=false;btn.textContent='Guardar contrasena';}
    return;
  }
  // Clear reset token and activate
  await sb.from('agentes').update({reset_token:null,activo:true}).eq('id',_resetData.agent.id);
  if(signUpData?.user?.id){
    await sb.from('agentes').update({id:signUpData.user.id}).eq('email',_resetData.agent.email);
  }
  setStatus('Contrasena guardada. Ingresando...','var(--primary)');
  setTimeout(()=>{window.location.href=window.location.pathname;},1500);
}

async function generateResetLink(agentId){
  const token=crypto.randomUUID();
  const {error}=await sb.from('agentes').update({reset_token:token}).eq('id',agentId);
  if(error){toast('Error: '+error.message,false);return;}
  const url=window.location.origin+window.location.pathname+'?reset_token='+token;
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:16px">Enlace para restablecer contrasena</div>
    <div style="font-size:.82rem;color:var(--g4);margin-bottom:12px">Comparti este enlace con el usuario. Al abrirlo podra elegir una nueva contrasena:</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input class="finput" id="reset-link-url" value="${url}" readonly style="flex:1;font-size:.78rem;font-family:'DM Mono',monospace">
      <button class="btn btn-pri btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('reset-link-url').value);toast('Enlace copiado')">Copiar</button>
    </div>
    <div style="margin-top:16px;text-align:right"><button class="btn btn-out" onclick="closeModal()">Cerrar</button></div>`;
  openModal();
}

async function _completeGoogleInvite(user){
  const token=localStorage.getItem('mp_pending_invite');
  if(!token)return;
  localStorage.removeItem('mp_pending_invite');
  const {data:invite}=await sb.from('invitaciones').select('*').eq('token',token).maybeSingle();
  if(!invite||invite.usado)return;
  // INSERT agentes row with id = auth.uid()
  const agenteRow={id:user.id,email:user.email,rol:invite.rol||'agente',activo:true};
  if(user.user_metadata?.full_name)agenteRow.nombre=user.user_metadata.full_name;
  if(invite.agencia_id)agenteRow.agencia_id=invite.agencia_id;
  await sb.from('agentes').insert(agenteRow);
  await sb.from('invitaciones').update({usado:true}).eq('token',token);
}

window.addEventListener('DOMContentLoaded',async()=>{
  // Vista pública ?q=TOKEN — no requiere login, reemplaza toda la UI
  if(typeof _initPublicView==='function'){const isPublic=await _initPublicView();if(isPublic)return;}
  // Check invite or reset token first
  const isInvite=await _checkInviteToken();
  if(isInvite)return;
  const isReset=await _checkResetToken();
  if(isReset)return;
  const {data:{session}}=await sb.auth.getSession();
  if(session?.user){
    // Check if there's a pending Google invite to complete
    await _completeGoogleInvite(session.user);
    showApp(session.user);
  }
});

async function showApp(user){
  window._agenteId = user.id; // identidad garantizada — auth.uid() === agentes.id
  currentUser = user;
  // Migrar config vieja mp_cfg_<email> → mp_cfg_<uid> (una sola vez)
  const _oldKey='mp_cfg_'+(user.email||'');
  const _newKey='mp_cfg_'+user.id;
  if(!localStorage.getItem(_newKey)&&localStorage.getItem(_oldKey)){
    localStorage.setItem(_newKey,localStorage.getItem(_oldKey));
    localStorage.removeItem(_oldKey);
  }
  _loadAgCfg(); // cargar config per-user
  // Sync inicial: cache agCfg → localStorage (Supabase sobrescribirá más abajo)
  if(agCfg._unsplash_key) localStorage.setItem('mp_unsplash_key',agCfg._unsplash_key);
  if(agCfg._ia_key){localStorage.setItem('mp_ia_key',agCfg._ia_key);localStorage.setItem('mp_key',agCfg._ia_key);}
  if(agCfg._resend_key) localStorage.setItem('mp_resend_key',agCfg._resend_key);
  editingQuoteId = null;
  formDraft = null;
  // Mostrar app, sidebar y bottom nav
  document.getElementById('login-wall').style.display='none';
  document.getElementById('ui').style.display='block';
  document.getElementById('sidebar').style.display='flex';
  const _bnav=document.getElementById('bottom-nav');if(_bnav)_bnav.classList.add('active');
  // Restaurar estado expandido del sidebar
  if(localStorage.getItem('sb-open')){
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('ui').classList.add('sb-open');
    const _pl=document.getElementById('sb-prof-label');if(_pl)_pl.style.display='';
  }
  document.getElementById('hdr-user').textContent = user.user_metadata?.full_name || user.email;
  // Version label
  const _verEl=document.getElementById('sb-version');
  if(_verEl){
    const _isTest=(typeof ERMIX_CONFIG!=='undefined')&&ERMIX_CONFIG.env!=='production';
    _verEl.textContent='v'+APP_VERSION+(_isTest?' · TEST':'');
    if(_isTest) _verEl.style.cssText='color:#FF6B35;font-weight:700';
  }
  // Banner de entorno TEST — visible en topbar
  if((typeof ERMIX_CONFIG!=='undefined')&&ERMIX_CONFIG.env!=='production'){
    let _envBar=document.getElementById('env-test-bar');
    if(!_envBar){
      _envBar=document.createElement('div');
      _envBar.id='env-test-bar';
      _envBar.style.cssText='position:fixed;top:0;left:0;right:0;height:3px;background:repeating-linear-gradient(90deg,#FF6B35 0,#FF6B35 8px,transparent 8px,transparent 16px);z-index:9999;pointer-events:none';
      document.body.appendChild(_envBar);
    }
    // Tooltip al hacer hover en la versión
    if(_verEl) _verEl.title='Entorno de TEST — no es producción';
  }
  // Restaurar rol del caché — se confirma/deniega cuando llega Supabase
  const _cachedRol=localStorage.getItem('mp_rol')||'agente';
  currentRol=_cachedRol;
  isAdmin=(_cachedRol==='admin');
  _applyRolUI();
  // Saludo en pantalla Inicio
  const _saludoEl=document.getElementById('inicio-saludo');
  if(_saludoEl){
    const _nm=user.user_metadata?.full_name||user.email?.split('@')[0]||'';
    _saludoEl.textContent='Hola'+(_nm?', '+_nm.split(' ')[0]:'')+'.';
  }
  // Iniciales en el avatar del sidebar
  const av=document.getElementById('sb-avatar');
  if(av){
    const nm=user.user_metadata?.full_name||user.email||'';
    const parts=nm.trim().split(/\s+/);
    av.textContent=(parts.length>=2
      ? parts[0][0]+parts[1][0]
      : nm.substring(0,2)
    ).toUpperCase();
  }
  try{ init(); }catch(e){ console.warn('init() error (non-fatal):',e.message); }
  // Then load Supabase data in background (non-blocking)
  try {
    // select('*') evita fallar si alguna columna específica no existe en la DB
    const {data, error:agErr} = await sb.from('agentes').select('*').eq('id', user.id).maybeSingle();
    if(agErr) console.warn('agentes query error:', agErr.message, agErr.details);
    if(!data) console.warn('agentes: sin registro para uid:', user.id, '— verificar DB');
    console.log('[showApp] auth.uid:', user.id, '| agentes.rol:', data?.rol, '| data:', data?.id, data?.email);
    // Bloquear acceso si el usuario fue desactivado
    if(data && data.activo===false){
      await sb.auth.signOut();
      currentUser=null;
      document.getElementById('ui').style.display='none';
      document.getElementById('sidebar').style.display='none';
      const _bnBlk=document.getElementById('bottom-nav');if(_bnBlk)_bnBlk.classList.remove('active');
      document.getElementById('login-wall').style.display='block';
      setLoginStatus('Tu cuenta ha sido desactivada. Contacta al administrador.','var(--red)');
      return;
    }
    if(data){
      currentRol = data.rol || 'agente';
      isAdmin = currentRol === 'admin';
      window._agenteId = data.id;
      localStorage.setItem('mp_rol', currentRol);
      // Supabase es la fuente de verdad — != null permite 0 y '' como valores validos
      if(data.nombre!=null)    agCfg.nm        = data.nombre;
      if(data.agencia!=null)   agCfg.ag        = data.agencia;
      if(data.telefono!=null)  agCfg.tel       = data.telefono;
      // soc no existe en tabla agentes — solo vive en agCfg (localStorage)
      if(data.pais_cod!=null)  agCfg.pais_cod  = data.pais_cod;
      if(data.pdf_theme!=null) agCfg.pdf_theme = data.pdf_theme;
      if(data.logo_url!=null)  agCfg.logo_url  = data.logo_url;
      console.log('[showApp] pdf_theme from Supabase:', data.pdf_theme, '→ agCfg:', agCfg.pdf_theme);
      agCfg.em = user.email;
      if(data.agente_num) window._agenteNum = data.agente_num;
      if(data.pais_cod) window._agentePaisCod = data.pais_cod;
      if(data.agencia_id) window._agenciaId = data.agencia_id;
      // Independiente = agente sin agencia
      window._esIndependiente = (currentRol === 'agente' && !data.agencia_id);
      // Plan info
      window._planActual  = data.plan         || 'explorador';
      window._planEstado  = data.plan_estado  || 'trial';
      window._planVence   = data.plan_vence   || null;
      window._trialInicio = data.trial_inicio || null;
      _initTrialBanner();
      // Siempre leer logo desde Supabase — fuente de verdad por usuario
      logoUrl = data.logo_url || null;
      agCfg.logo_url = logoUrl;
      if(typeof updateLogoPreview==='function') updateLogoPreview();
      // Cargar agencia: nombre + config con API keys globales
      let _agenciaCfg={};
      if(data.agencia_id){
        try{
          const{data:ag}=await sb.from('agencias').select('*').eq('id',data.agencia_id).maybeSingle();
          if(ag?.nombre) agCfg.ag=ag.nombre;
          if(ag?.config && typeof ag.config==='object') _agenciaCfg=ag.config;
          console.log('[showApp] agencias.config:',_agenciaCfg);
        }catch(e){console.warn('[showApp] agencias fetch:',e.message);}
      }
      // Si el agente tiene config JSONB en Supabase, fusionarla en agCfg (fallback)
      if(data.config && typeof data.config==='object') Object.assign(agCfg, data.config);
      // API keys: agencia es fuente de verdad (las hereda todo el equipo)
      // Si la agencia tiene la key, sobrescribe la del agente
      if(_agenciaCfg._resend_key)   agCfg._resend_key   = _agenciaCfg._resend_key;
      if(_agenciaCfg._unsplash_key) agCfg._unsplash_key = _agenciaCfg._unsplash_key;
      if(_agenciaCfg._ia_key)       agCfg._ia_key       = _agenciaCfg._ia_key;
      if(_agenciaCfg.resend_from)   agCfg.resend_from   = _agenciaCfg.resend_from;
      console.log('[showApp] agCfg keys → resend:',!!agCfg._resend_key,'ia:',!!agCfg._ia_key,'unsplash:',!!agCfg._unsplash_key);
      _saveAgCfg();
      // Supabase es fuente de verdad — sobrescribir localStorage siempre (no "solo si vacío")
      if(agCfg._unsplash_key) localStorage.setItem('mp_unsplash_key',agCfg._unsplash_key);
      else localStorage.removeItem('mp_unsplash_key');
      if(agCfg._ia_key){localStorage.setItem('mp_ia_key',agCfg._ia_key);localStorage.setItem('mp_key',agCfg._ia_key);}
      else {localStorage.removeItem('mp_ia_key');localStorage.removeItem('mp_key');}
      if(agCfg._resend_key) localStorage.setItem('mp_resend_key',agCfg._resend_key);
      else localStorage.removeItem('mp_resend_key');
      loadCfg();
      // Actualizar avatar del sidebar y saludo con nombre real
      if(data.nombre){
        const av=document.getElementById('sb-avatar');
        if(av){
          const parts=data.nombre.trim().split(/\s+/);
          av.textContent=(parts.length>=2?parts[0][0]+parts[1][0]:data.nombre.substring(0,2)).toUpperCase();
        }
        const sal=document.getElementById('inicio-saludo');
        if(sal) sal.textContent='Hola, '+data.nombre.trim().split(/\s+/)[0]+'.';
        // Update header with real name
        const hdrU=document.getElementById('hdr-user');
        if(hdrU) hdrU.textContent=data.nombre;
      }
    }
    // (upsert eliminado — RLS bloquea con 403 y el registro ya existe)
  } catch(e) {
    console.warn('Supabase init warning (non-fatal):', e.message);
  }
  // Aplicar UI de rol — fuera del try/catch para que siempre se ejecute
  _applyRolUI();
  // Cargar métricas y promociones de la pantalla Inicio
  loadDashboardMetrics();
  if(typeof renderHomePromos==='function') renderHomePromos();
}

// ═══════════════════════════════════════════
// ROL UI
// ═══════════════════════════════════════════
function _applyRolUI(){
  // Badge de rol en header
  const badge=document.getElementById('hdr-role-badge');
  if(badge){
    const lbl={admin:'ADMIN',agencia:'AGENCIA',agente:''};
    let txt=lbl[currentRol]||'';
    // INDIE badge: agente independiente (sin agencia)
    if(!txt && currentRol==='agente' && window._esIndependiente) txt='INDIE';
    badge.textContent=txt;
    badge.style.display=txt?'':'none';
  }
  // Perfil dropdown — reconstruir contenido según rol
  _buildProfileDropdown();
  // Sidebar: mostrar/ocultar items segun data-role
  document.querySelectorAll('#sidebar [data-role]').forEach(el=>{
    const roles=(el.dataset.role||'').split(' ');
    el.style.display=roles.includes(currentRol)?'':'none';
  });
  // Bottom nav: misma logica
  document.querySelectorAll('#bottom-nav [data-role]').forEach(el=>{
    const roles=(el.dataset.role||'').split(' ');
    el.style.display=roles.includes(currentRol)?'':'none';
  });
  // Boton nuevo proveedor: ocultar para admin
  const btnNewProv=document.getElementById('btn-new-prov');
  if(btnNewProv) btnNewProv.style.display=currentRol==='admin'?'none':'';
  // Preview toolbar: admin/agencia solo ven la cotizacion sin botones
  const prevToolbar=document.getElementById('prev-toolbar');
  if(prevToolbar) prevToolbar.style.display=(currentRol==='admin'||currentRol==='agencia')?'none':'';
  // Guardar en localStorage
  if(currentRol!=='agente') localStorage.setItem('mp_rol',currentRol);
  if(currentRol==='admin') localStorage.setItem('mp_admin','1');
  else localStorage.removeItem('mp_admin');
}

function _buildProfileDropdown(){
  const wrap=document.getElementById('sb-prof-menu');
  if(!wrap) return;
  const nm=agCfg.nm||currentUser?.email||'';
  // Update sidebar expanded labels
  const nmEl=document.getElementById('sb-prof-nm');
  const rolEl=document.getElementById('sb-prof-rolbadge');
  const rolLblMap={admin:'Administrador',agencia:'Agencia',agente:'Agente'};
  if(nmEl) nmEl.textContent=nm;
  if(rolEl) rolEl.textContent=rolLblMap[currentRol]||'Agente';
  const email=currentUser?.email||'';
  const rolLbl={admin:'Administrador',agencia:'Agencia',agente:'Agente'}[currentRol]||'Agente';
  // Dropdown: Mi perfil + Cerrar sesion (no duplicar items del sidebar)
  wrap.innerHTML=`
    <div class="prof-dd-header">
      <div class="prof-dd-nm">${nm||email}</div>
      <div class="prof-dd-rol">${rolLbl}</div>
    </div>
    <div class="prof-dd-sep"></div>
    <button class="prof-dd-item" onclick="_closeProfDD();switchTab('config')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      Mi perfil
    </button>
    <div class="prof-dd-sep"></div>
    <button class="prof-dd-item prof-dd-danger" onclick="_closeProfDD();doLogout()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Cerrar sesi\u00f3n
    </button>`;
}
function _toggleProfDD(e){
  e.stopPropagation();
  const menu=document.getElementById('sb-prof-menu');
  if(!menu) return;
  const isOpen=menu.classList.toggle('open');
  if(isOpen){
    setTimeout(()=>document.addEventListener('click',_closeProfDD,{once:true}),150);
  }
}
function _closeProfDD(){
  document.getElementById('sb-prof-menu')?.classList.remove('open');
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
function init(){
  loadCfg(); updateHeader();
  const k=document.getElementById('api-key'); if(k) k.value=localStorage.getItem('mp_key')||'';
  if(logoUrl) updateLogoPreview();
  addVuelo(); addHotel(); addTraslado(); addExcursion(); addTicket();
  loadClients();
  // Cargar seguros para el select del formulario
  if(typeof loadSeguros==='function') loadSeguros();
}

// ═══════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════
async function dbSaveQuote(d, supabaseId){
  if(!currentUser) throw new Error('No hay sesión activa. Iniciá sesión para guardar.');
  // Save/update client
  let clientId = d._clientId;
  if(!clientId && d.cliente?.nombre){
    const agIdForClient = window._agenteId || null;
    const {data:existing} = await sb.from('clientes').select('id').eq('nombre',d.cliente.nombre).eq('agente_id',agIdForClient).maybeSingle();
    if(existing){ clientId = existing.id; }
    else{
      const {data:nc,error:cliErr} = await sb.from('clientes').insert({nombre:d.cliente.nombre,celular:d.cliente.celular||'',email:d.cliente.email||'',agente_id:agIdForClient}).select().single();
      if(cliErr) console.warn('[dbSaveQuote] client insert error:',cliErr.message);
      if(nc) clientId = nc.id;
    }
  }
  // agente_id viene de window._agenteId = user.id (garantizado en showApp)
  const agId = window._agenteId || null;
  if(!agId) throw new Error('agente_id no disponible — cerrá sesión y volvé a entrar');
  // Generate structured ref_id for NEW quotes: {pais_cod}-{agente_num_4d}-{seq_5d}
  if(!d.refId && !supabaseId){
    // Incremento atómico via RPC — garantiza unicidad aunque se borren cotizaciones
    const { data: seqData, error: seqError } = await sb.rpc('increment_cotizacion_seq', { agente_uuid: agId });
    if(seqError) console.warn('[seq]', seqError);
    const seq = seqData || 1;
    const pais = window._agentePaisCod || agCfg.pais_cod || 'AR';
    const num = window._agenteNum || 1;
    d.refId = `${pais}-${String(num).padStart(4,'0')}-${String(seq).padStart(5,'0')}`;
  }
  // Embeber cover/logo en datos para que el link público pueda renderizarlos
  // (el link público solo tiene acceso a datos JSONB, no a columnas separadas)
  const _cUrl=typeof coverUrl!=='undefined'?coverUrl:null;
  const _lUrl=(typeof logoUrl!=='undefined'?logoUrl:null)||(typeof agCfg!=='undefined'?agCfg.logo_url:null)||null;
  const _uCredit=(typeof window!=='undefined'&&window._unsplashCredit)||null;
  const _agentInfo=(typeof agCfg!=='undefined'&&(agCfg.nm||agCfg.ag))?{nm:agCfg.nm||'',ag:agCfg.ag||'',logo_url:agCfg.logo_url||null,tel:agCfg.tel||'',soc:agCfg.soc||'',pdf_theme:agCfg.pdf_theme||1,resend_from:agCfg.resend_from||''}:null;
  const _resendKey=(typeof agCfg!=='undefined'?agCfg._resend_key:'')||localStorage.getItem('mp_resend_key')||'';
  const _datosConMedia={...d,_cover_url:_cUrl,_logo_url:_lUrl,_unsplash_credit:_uCredit||undefined};
  if(_resendKey) _datosConMedia._resend_key=_resendKey;
  if(!_cUrl) delete _datosConMedia._cover_url;
  if(!_lUrl) delete _datosConMedia._logo_url;
  if(!_uCredit) delete _datosConMedia._unsplash_credit;
  if(_agentInfo) _datosConMedia._agent=_agentInfo; else delete _datosConMedia._agent;
  const baseRow = {
    ref_id: String(d.refId),
    cliente_id: clientId||null,
    destino: d.viaje?.destino||'',
    fecha_sal: d.viaje?.salida ? parseDateArg(d.viaje.salida) : null,
    fecha_reg: d.viaje?.regreso ? parseDateArg(d.viaje.regreso) : null,
    noches: d.viaje?.noches||0,
    pasajeros: d.cliente?.pasajeros||'',
    estado: d.estado||'borrador',
    datos: _datosConMedia,
    cover_url: _cUrl||null,
    precio_total: d.precios?.total||d.precios?.por_persona||null,
    moneda: d.precios?.moneda||'USD',
    notas_int: d.notas_int||''
    // total_comision NO es columna en DB — vive dentro de datos JSONB
  };
  let error;
  if(supabaseId){
    // UPDATE — no re-enviar ref_id (inmutable) ni agente_id para evitar 23505/RLS
    const {ref_id:_rid, ...updateRow} = baseRow;
    ({error} = await sb.from('cotizaciones').update(updateRow).eq('id', supabaseId));
    // Si falla con columna inexistente, intentar con payload mínimo garantizado
    if(error && (error.code==='42703'||error.message?.includes('column'))){
      _captureError('dbSaveQuote:update:fallback', error);
      const safeRow={destino:baseRow.destino,fecha_sal:baseRow.fecha_sal,fecha_reg:baseRow.fecha_reg,noches:baseRow.noches,pasajeros:baseRow.pasajeros,estado:baseRow.estado,datos:baseRow.datos};
      ({error} = await sb.from('cotizaciones').update(safeRow).eq('id', supabaseId));
    }
  } else {
    // INSERT — incluir agente_id en el registro nuevo
    const row = {...baseRow, agente_id: agId||null};
    ({error} = await sb.from('cotizaciones').insert(row));
    // Si falla con columna inexistente, intentar con payload mínimo garantizado
    if(error && (error.code==='42703'||error.message?.includes('column'))){
      _captureError('dbSaveQuote:insert:fallback', error);
      const safeRow={ref_id:baseRow.ref_id,destino:baseRow.destino,fecha_sal:baseRow.fecha_sal,fecha_reg:baseRow.fecha_reg,noches:baseRow.noches,pasajeros:baseRow.pasajeros,estado:baseRow.estado,datos:baseRow.datos,agente_id:agId||null};
      ({error} = await sb.from('cotizaciones').insert(safeRow));
    }
    // Si falla con clave duplicada (ref_id ya existe) — editingQuoteId se perdió de memoria
    // Buscar la fila existente y hacer UPDATE en vez de fallar
    if(error && (error.code==='23505'||error.message?.includes('duplicate key'))){
      _captureError('dbSaveQuote:insert:dup-recovery', error);
      const {data:existing}=await sb.from('cotizaciones').select('id').eq('ref_id',String(d.refId)).maybeSingle();
      if(existing?.id){
        // Usar safe row mínima para evitar fallo por columnas inexistentes
        const safeUpd={destino:baseRow.destino,fecha_sal:baseRow.fecha_sal,fecha_reg:baseRow.fecha_reg,noches:baseRow.noches,pasajeros:baseRow.pasajeros,estado:baseRow.estado,datos:baseRow.datos};
        ({error} = await sb.from('cotizaciones').update(safeUpd).eq('id', existing.id));
        // Restaurar editingQuoteId para que próximas operaciones funcionen
        if(!error) supabaseId = existing.id;
      }
    }
  }
  if(error){
    console.error('dbSaveQuote error:', error);
    _captureError('dbSaveQuote', error);
    throw new Error(error.message||(error.details||JSON.stringify(error)));
  }
  await loadClients();
  // Retornar id recuperado en caso de dup-recovery para que saveQuote actualice editingQuoteId
  return supabaseId||null;
}

async function dbLoadQuotes(){
  // RLS filtra por rol. Para agente: filtrar explícitamente por agente_id (belt+suspenders)
  let q=sb.from('cotizaciones').select('*').order('creado_en',{ascending:false}).limit(200);
  if(currentRol==='agente'&&window._agenteId) q=q.eq('agente_id',window._agenteId);
  const {data,error}=await q;
  if(error){
    console.warn('dbLoadQuotes error:', error);
    let q2=sb.from('cotizaciones').select('*').limit(200);
    if(currentRol==='agente'&&window._agenteId) q2=q2.eq('agente_id',window._agenteId);
    const {data:d2,error:e2}=await q2;
    if(e2){ console.error('dbLoadQuotes fallback error:',e2); return []; }
    return (d2||[]).sort((a,b)=>new Date(b.creado_en||b.updated_at||0)-new Date(a.creado_en||a.updated_at||0));
  }
  return data||[];
}

async function dbLoadClients(){
  // RLS filtra por rol. Para agente: filtrar explícitamente por agente_id
  let q=sb.from('clientes').select('*').order('nombre');
  if(currentRol==='agente'&&window._agenteId) q=q.eq('agente_id',window._agenteId);
  const {data}=await q;
  return data||[];
}

function parseDateArg(s){ // "DD/MM/YYYY" → "YYYY-MM-DD"
  if(!s) return null;
  if(s.includes('-')) return s;
  const [d,m,y] = s.split('/');
  return y&&m&&d ? `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` : null;
}

// ═══════════════════════════════════════════
// DASHBOARD METRICS (Inicio)
// ═══════════════════════════════════════════
let _dashPeriod='month';
function _setDashPeriod(p,btn){
  _dashPeriod=p;
  document.querySelectorAll('.date-tab').forEach(b=>b.classList.remove('on'));
  if(btn) btn.classList.add('on');
  loadDashboardMetrics();
}

async function loadDashboardMetrics(){
  // Toggle admin vs agent dashboard
  const admDash=document.getElementById('inicio-admin');
  const agtDash=document.getElementById('inicio-agent');
  if(currentRol==='admin'){
    if(admDash)admDash.style.display='';
    if(agtDash)agtDash.style.display='none';
    // Update admin saludo
    const sal=document.getElementById('inicio-saludo-admin');
    if(sal){const nm=agCfg.nm||currentUser?.email?.split('@')[0]||'';sal.textContent='Hola'+(nm?', '+nm.split(' ')[0]:'')+'.'}
    _loadAdminDashboard();
    return;
  } else if(currentRol==='agencia'){
    if(admDash)admDash.style.display='none';
    if(agtDash)agtDash.style.display='none';
    const agcDash=document.getElementById('inicio-agencia');
    if(agcDash)agcDash.style.display='';
    const sal=document.getElementById('inicio-saludo-agencia');
    if(sal){const nm=agCfg.nm||currentUser?.email?.split('@')[0]||'';sal.textContent='Hola'+(nm?', '+nm.split(' ')[0]:'')+'.'}
    _loadAgenciaDashboard();
    return;
  } else {
    if(admDash)admDash.style.display='none';
    if(agtDash)agtDash.style.display='';
    const agcDash=document.getElementById('inicio-agencia');
    if(agcDash)agcDash.style.display='none';
  }
  // Skeleton
  ['met-cot','met-conf','met-act','met-com','met-com-conf','met-com-pend','met-clients'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.textContent='...';
  });
  try{
    if(!window._agenteId){['met-cot','met-conf','met-act','met-com','met-com-conf','met-com-pend','met-clients'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='0';});return;}

    // Date filter
    let since=null;
    const now=new Date();
    if(_dashPeriod==='month'){since=new Date(now.getFullYear(),now.getMonth(),1).toISOString();}
    else if(_dashPeriod==='year'){since=new Date(now.getFullYear(),0,1).toISOString();}

    // Quotes — filtrar explícitamente por agente_id para agente (belt+suspenders sobre RLS)
    let qQuery=sb.from('cotizaciones').select('id,ref_id,agente_id,destino,estado,datos,creado_en,updated_at');
    if(currentRol==='agente'&&window._agenteId) qQuery=qQuery.eq('agente_id',window._agenteId);
    const {data:allQ,error:allErr}=await qQuery;
    let quotes=allQ||[];
    if(allErr){
      let q2=sb.from('cotizaciones').select('id,ref_id,agente_id,destino,estado,datos');
      if(currentRol==='agente'&&window._agenteId) q2=q2.eq('agente_id',window._agenteId);
      const {data:qf}=await q2;
      quotes=qf||[];
    }
    // Segunda línea de defensa: filtro JS (misma lógica que renderHistory)
    if(currentRol==='agente'&&window._agenteId){
      quotes=quotes.filter(q=>!q.agente_id||q.agente_id===window._agenteId);
    }

    // Filtrar por fecha en JS
    if(since){
      const sinceDate=new Date(since);
      quotes=quotes.filter(q=>{
        const d=new Date(q.creado_en||q.updated_at||0);
        return d>=sinceDate;
      });
    }

    // Clients count — filtrar por agente_id para agente
    let cQuery=sb.from('clientes').select('id');
    if(currentRol==='agente'&&window._agenteId) cQuery=cQuery.eq('agente_id',window._agenteId);
    const {data:cliData}=await cQuery;
    const totalClients=(cliData||[]).length;

    // Calculations
    const total=quotes.length;
    const conf=quotes.filter(q=>q.estado==='confirmada').length;
    const env=quotes.filter(q=>q.estado==='enviada').length;
    const borr=quotes.filter(q=>q.estado==='borrador'||!q.estado).length;
    const canc=quotes.filter(q=>q.estado==='cancelada').length;
    const getCom=q=>Number(q.datos?.total_comision||q.total_comision)||0;
    const comTotal=quotes.reduce((s,q)=>s+getCom(q),0);
    const comConf=quotes.filter(q=>q.estado==='confirmada').reduce((s,q)=>s+getCom(q),0);
    const comPend=quotes.filter(q=>q.estado==='enviada').reduce((s,q)=>s+getCom(q),0);
    const fmtUSD=n=>n>=1000?'$'+(n/1000).toFixed(1)+'k':'$'+n.toLocaleString('es-AR');

    // Update metric cards
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    const setBar=(id,pct)=>{const el=document.getElementById(id);if(el)el.style.width=Math.min(100,pct)+'%';};
    set('met-cot',total||'0');
    set('met-cot-sub',_dashPeriod==='month'?'este mes':_dashPeriod==='year'?'este año':'histórico');
    set('met-conf',conf||'0');
    set('met-conf-sub',conf===1?'viaje confirmado':'viajes confirmados');
    set('met-act',env||'0');
    set('met-clients',totalClients||'0');
    set('met-com',comTotal>0?fmtUSD(comTotal):'—');
    set('met-com-conf',comConf>0?fmtUSD(comConf):'—');
    set('met-com-pend',comPend>0?fmtUSD(comPend):'—');

    // Progress bars (relative to total)
    if(total>0){
      setBar('met-cot-bar',100);
      setBar('met-conf-bar',conf/total*100);
      setBar('met-act-bar',env/total*100);
    }
    setBar('met-clients-bar',Math.min(100,totalClients/50*100));

    // Revision notifications — cotizaciones donde el cliente pidió cambios
    const revQuotes=quotes.filter(q=>q.estado==='revision');
    const revEl=document.getElementById('dash-revision-alert');
    if(revQuotes.length>0){
      const revHtml=revQuotes.map(q=>{
        const nm=q.datos?.cliente?.nombre||'Cliente';
        const dest=q.destino||q.datos?.viaje?.destino||'';
        const lastReq=Array.isArray(q.datos?._mod_requests)&&q.datos._mod_requests.length?q.datos._mod_requests[q.datos._mod_requests.length-1]:null;
        const msg=lastReq?lastReq.msg:'';
        return `<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)">
          <div style="width:8px;height:8px;border-radius:50%;background:#FF6B35;flex-shrink:0;margin-top:5px"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:.85rem;font-weight:700;color:var(--text);margin-bottom:4px">${nm} — ${dest}</div>
            ${msg?`<div style="font-size:.78rem;color:var(--g4);margin-bottom:8px;line-height:1.5">"${msg.length>120?msg.slice(0,120)+'...':msg}"</div>`:''}
            <div><button class="btn btn-pri btn-xs" onclick="editFromHistory('${q.ref_id||''}','${q.id}')">Revisar cotización</button></div>
          </div>
        </div>`;
      }).join('');
      if(revEl){revEl.style.display='';revEl.innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,107,53,0.2)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span style="font-size:.8rem;font-weight:700;color:#FF6B35">${revQuotes.length} cotización${revQuotes.length>1?'es':''} con modificaciones solicitadas</span></div>${revHtml}`;}
    } else if(revEl){revEl.style.display='none';}

    // Aprobadas alert — cotizaciones aprobadas por el pasajero que el agente no confirmó aún
    const aprQuotes=quotes.filter(q=>q.estado==='aprobado');
    const aprEl=document.getElementById('dash-aprobadas-alert');
    if(aprQuotes.length>0){
      // Sound: solo 1 vez por sesión por quote
      aprQuotes.forEach(q=>{
        const skey='_snd_apr_'+q.id;
        if(!sessionStorage.getItem(skey)){
          sessionStorage.setItem(skey,'1');
          _playSound('aprobado');
        }
      });
      const aprHtml=aprQuotes.map(q=>{
        const nm=q.datos?.cliente?.nombre||'Pasajero';
        const dest=q.destino||q.datos?.viaje?.destino||'';
        return `<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)">
          <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;margin-top:5px"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:.85rem;font-weight:700;color:var(--text);margin-bottom:4px">${nm} — ${dest}</div>
            <div style="font-size:.78rem;color:var(--g4);margin-bottom:8px">El pasajero aprobó la cotización. Confirmala para iniciar el seguimiento.</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-pri btn-xs" onclick="editFromHistory('${q.ref_id||''}','${q.id}')">Ver cotización</button>
              <button class="btn btn-cta btn-xs" onclick="_confirmFromDash('${q.id}')">Confirmar</button>
            </div>
          </div>
        </div>`;
      }).join('');
      if(aprEl){aprEl.style.display='';aprEl.innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(34,197,94,0.2)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span style="font-size:.8rem;font-weight:700;color:#22c55e">${aprQuotes.length} cotización${aprQuotes.length>1?'es aprobadas':' aprobada'} — esperando confirmación</span></div>${aprHtml}`;}
    } else if(aprEl){aprEl.style.display='none';}

    // Quick action counts
    set('qac-hist',total||'0');
    set('qac-clients',totalClients||'0');

    // Status distribution bar
    if(total>0){
      const seg=(id,n)=>{const el=document.getElementById(id);if(el)el.style.width=(n/total*100)+'%';};
      seg('seg-borrador',borr);seg('seg-enviada',env);
      seg('seg-confirmada',conf);seg('seg-cancelada',canc);
      const leg=(id,lbl,n)=>{const el=document.getElementById(id);if(el)el.textContent=lbl+' ('+n+')';};
      leg('leg-borrador','Borradores',borr);leg('leg-enviada','Enviadas',env);
      leg('leg-confirmada','Confirmadas',conf);leg('leg-cancelada','Canceladas',canc);
    }

    // Ingresos del mes
    try{
      const hoy=new Date();
      const inicioMes=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-01`;
      const{data:ing}=await sb.from('ingresos')
        .select('monto').eq('agente_id',window._agenteId)
        .eq('estado','cobrado').gte('fecha_cobro',inicioMes);
      const totalMes=(ing||[]).reduce((s,r)=>s+(+r.monto||0),0);
      set('met-ingresos-mes',totalMes>0?'$'+totalMes.toLocaleString('es-AR'):'—');
      const meta=typeof agCfg!=='undefined'&&agCfg?agCfg.meta_mensual||0:0;
      const pct=meta>0?Math.min(100,(totalMes/meta)*100):0;
      const barEl=document.getElementById('met-ingresos-bar');
      if(barEl) barEl.style.width=pct+'%';
    }catch(e2){console.warn('[ingresos-mes]',e2);}

    // Reservas activas
    try{
      const{count:rsvCount}=await sb.from('cotizaciones')
        .select('id',{count:'exact',head:true})
        .eq('agente_id',window._agenteId)
        .in('estado',['aprobado','confirmada']);
      set('met-reservas-act',rsvCount!=null?String(rsvCount):'—');
    }catch(e3){console.warn('[reservas-act]',e3);}

  }catch(e){
    console.error('loadDashboardMetrics error:',e);
    if(typeof _captureError==='function') _captureError('DASHBOARD',e);
  }
}

// ═══════════════════════════════════════════
// CONFIRM FROM DASH (aprobadas alert)
// ═══════════════════════════════════════════
async function _confirmFromDash(id){
  if(!id||id==='null'||id==='undefined'){toast('ID de cotización inválido',false);return;}
  if(!confirm('¿Confirmar esta reserva?')) return;
  const {error}=await sb.from('cotizaciones').update({estado:'confirmada'}).eq('id',id);
  if(error){toast('Error: '+error.message,false);return;}
  toast('Reserva confirmada');
  loadDashboardMetrics();
}

// ═══════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════
async function _loadAdminDashboard(){
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  const setBar=(id,pct)=>{const el=document.getElementById(id);if(el)el.style.width=Math.min(100,pct)+'%';};
  try{
    const [{data:agencias},{data:agentes},{data:cotiz}]=await Promise.all([
      sb.from('agencias').select('id'),
      sb.from('agentes').select('id,rol').neq('rol','admin'),
      sb.from('cotizaciones').select('id,destino,estado')
    ]);
    const nAg=(agencias||[]).length;
    const nAgents=(agentes||[]).length;
    const nQ=(cotiz||[]).length;
    const nConf=(cotiz||[]).filter(q=>q.estado==='confirmada').length;
    set('met-adm-agencies',nAg||'0');
    set('met-adm-agents',nAgents||'0');
    set('met-adm-quotes',nQ||'0');
    set('met-adm-confirmed',nConf||'0');
    setBar('met-adm-agencies-bar',Math.min(100,nAg/10*100));
    setBar('met-adm-agents-bar',Math.min(100,nAgents/50*100));
    setBar('met-adm-quotes-bar',Math.min(100,nQ/200*100));
    setBar('met-adm-confirmed-bar',nQ>0?nConf/nQ*100:0);
    // Top destinos
    const destMap={};
    (cotiz||[]).forEach(q=>{if(q.destino){destMap[q.destino]=(destMap[q.destino]||0)+1;}});
    const sorted=Object.entries(destMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const topEl=document.getElementById('adm-top-destinos');
    if(topEl){
      if(!sorted.length){topEl.innerHTML='<span style="color:var(--g3)">Sin datos aun.</span>';return;}
      const max=sorted[0][1];
      topEl.innerHTML=sorted.map(([d,n])=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <span style="min-width:120px;font-weight:600;font-size:.8rem">${d}</span>
        <div style="flex:1;height:6px;background:var(--g1);border-radius:3px;overflow:hidden"><div style="width:${n/max*100}%;height:100%;background:var(--grad);border-radius:3px"></div></div>
        <span style="font-size:.72rem;color:var(--g4);min-width:20px;text-align:right">${n}</span>
      </div>`).join('');
    }
  }catch(e){console.error('[_loadAdminDashboard]',e);}
  // Tickets de soporte abiertos — alerta en dashboard admin
  try{
    const{data:tickets}=await sb.from('tickets_soporte').select('id,asunto,prioridad,estado,creado_en,agente_id').in('estado',['abierto','en_progreso']).order('creado_en',{ascending:false}).limit(10);
    const alertEl=document.getElementById('adm-tickets-alert');
    if(alertEl&&tickets&&tickets.length>0){
      alertEl.style.display='';
      alertEl.querySelector('.card-body').innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span style="font-size:.8rem;font-weight:700;color:#FF6B35">${tickets.length} ticket${tickets.length>1?'s':''} de soporte pendiente${tickets.length>1?'s':''}</span></div>`+tickets.map(t=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="switchTab('support')"><div style="width:6px;height:6px;border-radius:50%;background:${t.prioridad==='alta'?'#ef4444':t.prioridad==='normal'?'#f59e0b':'var(--g3)'};flex-shrink:0"></div><span style="font-size:.82rem;font-weight:600;color:var(--text);flex:1">${t.asunto||'Sin asunto'}</span><span style="font-size:.7rem;color:var(--g4)">${new Date(t.creado_en).toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}</span></div>`).join('');
    } else if(alertEl){alertEl.style.display='none';}
  }catch(e){/* tickets_soporte may not exist yet */}
}

// ═══════════════════════════════════════════
// AGENCIA DASHBOARD
// ═══════════════════════════════════════════
async function _loadAgenciaDashboard(){
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  const setBar=(id,pct)=>{const el=document.getElementById(id);if(el)el.style.width=Math.min(100,pct)+'%';};
  try{
    const agId=window._agenciaId;
    if(!agId) return;
    // Get agents of this agency
    const {data:agentes}=await sb.from('agentes').select('id,nombre,email').eq('agencia_id',agId);
    const ids=(agentes||[]).map(a=>a.id);
    const nAgents=ids.length;
    // Quotes from all agents
    let quotes=[];
    if(ids.length){
      const {data}=await sb.from('cotizaciones').select('id,agente_id,destino,estado,datos').in('agente_id',ids);
      quotes=data||[];
    }
    // Clients from all agents
    let nClients=0;
    if(ids.length){
      const {data}=await sb.from('clientes').select('id').in('agente_id',ids);
      nClients=(data||[]).length;
    }
    const nQ=quotes.length;
    const nConf=quotes.filter(q=>q.estado==='confirmada').length;
    const getCom=q=>Number(q.datos?.total_comision||q.total_comision)||0;
    const comTotal=quotes.reduce((s,q)=>s+getCom(q),0);
    const comConf=quotes.filter(q=>q.estado==='confirmada').reduce((s,q)=>s+getCom(q),0);
    const comPend=quotes.filter(q=>q.estado==='enviada').reduce((s,q)=>s+getCom(q),0);
    const fmtUSD=n=>n>=1000?'$'+(n/1000).toFixed(1)+'k':'$'+n.toLocaleString('es-AR');

    set('met-agc-agents',nAgents||'0');
    set('met-agc-quotes',nQ||'0');
    set('met-agc-confirmed',nConf||'0');
    set('met-agc-clients',nClients||'0');
    setBar('met-agc-agents-bar',Math.min(100,nAgents/10*100));
    setBar('met-agc-quotes-bar',Math.min(100,nQ/100*100));
    setBar('met-agc-confirmed-bar',nQ>0?nConf/nQ*100:0);
    setBar('met-agc-clients-bar',Math.min(100,nClients/50*100));
    set('met-agc-com',comTotal>0?fmtUSD(comTotal):'—');
    set('met-agc-com-conf',comConf>0?fmtUSD(comConf):'—');
    set('met-agc-com-pend',comPend>0?fmtUSD(comPend):'—');
    // Top agentes por cotizaciones
    const agMap={};
    (agentes||[]).forEach(a=>{agMap[a.id]={nombre:a.nombre||a.email,count:0};});
    quotes.forEach(q=>{if(agMap[q.agente_id])agMap[q.agente_id].count++;});
    const sorted=Object.values(agMap).sort((a,b)=>b.count-a.count);
    const topEl=document.getElementById('agc-top-agentes');
    if(topEl){
      if(!sorted.length){topEl.innerHTML='<span style="color:var(--g3)">Sin agentes.</span>';return;}
      const max=Math.max(sorted[0].count,1);
      topEl.innerHTML=sorted.map(a=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <span style="min-width:120px;font-weight:600;font-size:.8rem">${a.nombre}</span>
        <div style="flex:1;height:6px;background:var(--g1);border-radius:3px;overflow:hidden"><div style="width:${a.count/max*100}%;height:100%;background:var(--grad);border-radius:3px"></div></div>
        <span style="font-size:.72rem;color:var(--g4);min-width:20px;text-align:right">${a.count}</span>
      </div>`).join('');
    }
  }catch(e){console.error('[_loadAgenciaDashboard]',e);}
}

// ═══════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════
const tabMap={inicio:0,form:1,ia:2,preview:3,crm:4,promos:5,providers:7,dashboard:8,admin:9,config:10,agency:11,support:12,adminconfig:13,promosvig:14,ingresos:15};
// CRM sub-tab switcher
function _setCrmTab(t){
  _crmActiveTab=t||'history';
  document.querySelectorAll('.crm-tab').forEach(b=>b.classList.toggle('on',b.dataset.crm===_crmActiveTab));
  document.querySelectorAll('.crm-sub').forEach(p=>p.classList.toggle('on',p.id==='crm-sub-'+_crmActiveTab));
  if(_crmActiveTab==='history') renderHistory();
  if(_crmActiveTab==='clients'){renderClients();if(typeof renderGroups==='function')renderGroups();}
  if(_crmActiveTab==='seguimiento'){if(typeof renderSeguimiento==='function')renderSeguimiento();}
}
function switchTab(id){
  // Admin y agencia son solo lectura — no pueden cotizar
  if(id==='form'&&(currentRol==='admin'||currentRol==='agencia')){
    toast('Solo los agentes pueden crear cotizaciones.',false);
    return;
  }
  // Plan gates — bloquear tabs premium si no tiene plan
  const _planGates={
    'seguimiento':'seguimiento',
    'ingresos':   'ingresos',
    'promos':     'promos',
    'promosvig':  'promos'
  };
  if(_planGates[id] && typeof _tienePlan==='function' && !_tienePlan(_planGates[id])){
    _openUpgradeModal('profesional');
    return;
  }
  // CRM aliases — history/clients/seguimiento redirect to crm panel
  if(id==='history'||id==='clients'||id==='seguimiento'){
    _crmActiveTab=id;
    id='crm';
  }
  // Guardar borrador al salir del formulario
  const activePanel=document.querySelector('.panel.on');
  if(activePanel?.id==='tab-form' && id!=='form'){
    try{ formDraft=collectForm(); }catch(e){ console.warn('saveDraft warning:',e.message); }
  }
  // Panels
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  document.getElementById('tab-'+id)?.classList.add('on');
  // Sidebar items — activar por data-tab
  document.querySelectorAll('#sidebar .sb-item').forEach(b=>{
    b.classList.toggle('on', b.dataset.tab===id);
  });
  // Bottom nav items (mobile)
  document.querySelectorAll('#bottom-nav .bnav-item').forEach(b=>{
    b.classList.toggle('on', b.dataset.tab===id);
  });
  // Legacy ntab compat (por si algún módulo depende)
  document.querySelectorAll('.ntab').forEach(b=>b.classList.remove('on'));
  const idx=tabMap[id];
  if(idx!==undefined) document.querySelectorAll('.ntab')[idx]?.classList.add('on');
  // Acciones por tab
  if(id==='form'){
    if(formDraft) restoreDraft(formDraft);
  }
  if(id==='crm') _setCrmTab(_crmActiveTab||'history');
  if(id==='promos') renderPromos();
  if(id==='admin'){renderAdmin();if(typeof _loadApiKeyFields==='function')_loadApiKeyFields();}
  if(id==='agency'){renderAgency();if(typeof _loadAgencyFields==='function')_loadAgencyFields();if(typeof _loadApiKeyFields==='function')_loadApiKeyFields();}
  if(id==='providers'){if(typeof renderProviders==='function')renderProviders();}
  if(id==='support'){if(typeof renderSupportTickets==='function')renderSupportTickets();}
  if(id==='promosvig'){if(typeof _loadPromosVigAgente==='function')_loadPromosVigAgente();}
  if(id==='ingresos'){if(typeof renderIngresos==='function')renderIngresos();}
  if(id==='adminconfig'){if(typeof _loadApiKeyFields==='function')_loadApiKeyFields();}
  if(id==='dashboard') renderDashboard();
  if(id==='inicio'){loadDashboardMetrics();if(typeof renderHomePromos==='function')renderHomePromos();}
}

// BUG3 — restore simple fields from draft
function restoreDraft(d){
  if(!d) return;
  const set=(id,val)=>{ const e=document.getElementById(id); if(e&&val!==undefined&&val!==null) e.value=val; };
  // Cliente
  set('m-nombre', d.cliente?.nombre);
  set('m-cel', d.cliente?.celular);
  set('m-email', d.cliente?.email);
  // Pasajeros (extraer de string "2 adultos, 1 niño")
  const pax=d.cliente?.pasajeros||'';
  const mA=pax.match(/(\d+)\s*adulto/); if(mA) set('m-adu', mA[1]);
  const mN=pax.match(/(\d+)\s*niño/);   if(mN) set('m-nin', mN[1]);
  const mI=pax.match(/(\d+)\s*infante/); if(mI) set('m-inf', mI[1]);
  // Viaje
  set('m-dest', d.viaje?.destino);
  set('m-pais', d.viaje?.pais);
  set('m-desc', d.viaje?.descripcion);
  // Fechas: almacenadas como DD/MM/YYYY, los inputs son type=date (YYYY-MM-DD)
  const toISO=(dd)=>{ if(!dd) return ''; if(dd.includes('-')) return dd; const[day,mo,yr]=dd.split('/'); return yr&&mo&&day?`${yr}-${mo.padStart(2,'0')}-${day.padStart(2,'0')}`:'' };
  set('m-sal', toISO(d.viaje?.salida));
  set('m-reg', toISO(d.viaje?.regreso));
  set('m-estado', d.estado);
  set('m-notas', d.notas_int);
  set('m-ref', d.refId);
  // Precios
  set('p-cur',  d.precios?.moneda);
  set('p-pp',   d.precios?.por_persona);
  set('p-cur2', d.precios?.moneda2);
  set('p-tot',  d.precios?.total);
  set('p-cur3', d.precios?.moneda3);
  set('p-res',  d.precios?.reserva);
  set('p-cuo',  d.precios?.cuotas);
  set('p-can',  d.precios?.cancelacion);
  set('p-val',  d.precios?.validez);
  set('p-tyc',  d.precios?.tyc);
  // Seguro
  set('seg-nm',    d.seguro?.nombre);
  set('seg-med',   d.seguro?.cobertura_medica);
  set('seg-eq',    d.seguro?.equipaje_seg);
  set('seg-pre',   d.seguro?.preexistencias);
  set('seg-dias',  d.seguro?.dias);
  set('seg-cur',   d.seguro?.moneda);
  set('seg-precio',d.seguro?.precio);
  set('seg-fin',   d.seguro?.fin);
  set('seg-extra', d.seguro?.extra);
  set('seg-com',   d.seguro?.comision);
  set('seg-com-cur',d.seguro?.com_cur);
  // Bloques dinámicos — reconstruir desde draft
  if(d.vuelos?.length){
    document.getElementById('vuelos-cont').innerHTML=''; vc=0;
    d.vuelos.forEach(v=>addVuelo(v));
  }
  if(d.hoteles?.length){
    document.getElementById('hoteles-cont').innerHTML=''; hc=0;
    d.hoteles.forEach(h=>addHotel(h));
  }
  if(d.traslados?.length){
    const tc_el=document.getElementById('traslados-cont'); if(tc_el){ tc_el.innerHTML=''; tc=0; }
    d.traslados.forEach(t=>addTraslado(t));
  }
  if(d.excursiones?.length){
    const ec_el=document.getElementById('excursiones-cont'); if(ec_el){ ec_el.innerHTML=''; ec=0; }
    d.excursiones.forEach(e=>addExcursion(e));
  }
  if(d.tickets?.length){
    const tks=document.getElementById('tickets-cont'); if(tks){ tks.innerHTML=''; }
    d.tickets.forEach(t=>addTicket(t));
  }
  if(d.autos?.length){
    const au_el=document.getElementById('autos-cont'); if(au_el){ au_el.innerHTML=''; if(typeof ac_cnt!=='undefined') ac_cnt=0; }
    d.autos.forEach(a=>{if(typeof addAuto==='function') addAuto(a);});
  }
  if(d.cruceros?.length){
    const cr_el=document.getElementById('cruceros-cont'); if(cr_el){ cr_el.innerHTML=''; if(typeof crc_cnt!=='undefined') crc_cnt=0; }
    d.cruceros.forEach(c=>{if(typeof addCrucero==='function') addCrucero(c);});
  }
  // Markup
  set('p-markup', d.markup_pct);
  set('p-base-cost', d.markup_base);
  if(typeof _calcMarkup==='function') setTimeout(_calcMarkup,50);
  // Itinerario día a día
  if(d.itinerario?.length&&typeof _itiRestore==='function'){
    setTimeout(()=>_itiRestore(d.itinerario),50);
  }
}

// ═══════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════
function toast(msg,ok=true){
  const t=document.getElementById('toast'),m=document.getElementById('toast-msg');
  const ico=document.getElementById('toast-icon');
  // Limpiar ✓ del inicio del mensaje (evita doble ✓ heredado de calls anteriores)
  const cleanMsg=(msg||'').replace(/^[✓\s]+/,'');
  if(ok){
    t.style.background='var(--grad-soft)';
    t.style.borderColor='rgba(27,158,143,0.35)';
    if(ico) ico.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>';
  } else {
    t.style.background='rgba(220,38,38,0.10)';
    t.style.borderColor='rgba(220,38,38,0.35)';
    if(ico) ico.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  }
  m.textContent=cleanMsg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// ═══════════════════════════════════════════
// FORM HELPERS
// ═══════════════════════════════════════════
function gv(id){const e=document.getElementById(id);return e?e.value:'';}
function gn(id){return parseFloat(gv(id))||0;}
function fd(s){if(!s)return'';if(s.includes('/'))return s;const[y,m,d]=s.split('-');return`${d}/${m}/${y}`;}
function paxStr(){
  const a=parseInt(gv('m-adu'))||0,n=parseInt(gv('m-nin'))||0,i=parseInt(gv('m-inf'))||0;
  return[a&&a+' adulto'+(a>1?'s':''),n&&n+' niño'+(n>1?'s':''),i&&i+' infante'+(i>1?'s':'')].filter(Boolean).join(', ');
}
function tglChk(el){el.classList.toggle('on');const inp=el.querySelector('input');inp.checked=!inp.checked;el.querySelector('.chk-dot').textContent=inp.checked?'✓':'';}

// ═══════════════════════════════════════════
// CLIENT SEARCH
// ═══════════════════════════════════════════
// Proveedores para select en seguimiento
let _proveedoresCache=null;
async function _loadProveedoresForSelect(){
  if(_proveedoresCache) return _proveedoresCache;
  try{
    let q=sb.from('proveedores').select('id,nombre,tipo,tipos').order('nombre');
    if(currentRol==='agente'&&window._agenteId){
      // Agente ve sus proveedores + los de su agencia
      if(window._agenciaId) q=q.or(`agente_id.eq.${window._agenteId},agencia_id.eq.${window._agenciaId}`);
      else q=q.eq('agente_id',window._agenteId);
    }
    const{data}=await q;
    _proveedoresCache=data||[];
  }catch(e){console.warn('[_loadProveedoresForSelect]',e);_proveedoresCache=[];}
  return _proveedoresCache;
}
// Acompanantes del cliente — desde datos._acompanantes
async function _loadAcompanantesCliente(clienteId){
  if(!clienteId) return [];
  try{
    const{data}=await sb.from('clientes').select('datos').eq('id',clienteId).maybeSingle();
    return Array.isArray(data?.datos?._acompanantes)?data.datos._acompanantes:[];
  }catch(e){console.warn('[_loadAcompanantesCliente]',e);return [];}
}

async function loadClients(){
  allClients = await dbLoadClients();
}
function searchClients(q){
  const box=document.getElementById('cli-results');
  if(!q||q.length<2){box.style.display='none';return;}
  const res=allClients.filter(c=>(c.nombre||'').toLowerCase().includes(q.toLowerCase())||(c.celular||'').includes(q));
  if(!res.length){box.style.display='none';return;}
  box.style.display='block';
  box.innerHTML=res.slice(0,6).map(c=>`<div class="cli-opt" onclick="selectClient('${c.id}')"><strong>${c.nombre}</strong><span>${c.celular||''} ${c.email?'· '+c.email:''}</span></div>`).join('');
}
function selectClient(id){
  const c=allClients.find(x=>x.id===id); if(!c) return;
  document.getElementById('m-nombre').value=c.nombre||'';
  document.getElementById('m-cel').value=c.celular||'';
  document.getElementById('m-email').value=c.email||'';
  document.getElementById('cli-search').value='';
  document.getElementById('cli-results').style.display='none';
  document.getElementById('_clientId')?.remove();
  const h=document.createElement('input');h.type='hidden';h.id='_clientId';h.value=id;
  document.getElementById('tab-form').appendChild(h);
  toast('✓ Cliente seleccionado: '+c.nombre);
}
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap')) document.getElementById('cli-results').style.display='none';});

// ═══════════════════════════════════════════
// VUELO BLOCK
