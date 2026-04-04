function uploadCover(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{coverUrl=e.target.result;window._unsplashCredit=null;updCovers();};r.readAsDataURL(f);}
// Unsplash — key en localStorage, NUNCA en el repo
function _unsplashKey(){ return (typeof agCfg!=='undefined'?agCfg._unsplash_key:'')||localStorage.getItem('mp_unsplash_key')||''; }
// Último crédito de foto Unsplash (para atribución)
window._unsplashCredit=null;

// Fotos curadas de viaje — usadas como fallback cuando no hay API key
const _COVER_FALLBACKS=[
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=1200&h=600&fit=crop&q=80'
];
function _useCoverFallback(){
  coverUrl=_COVER_FALLBACKS[Math.floor(Math.random()*_COVER_FALLBACKS.length)];
  window._unsplashCredit=null;
  updCovers();
}
function autoCover(){
  // Plan gate: fotos Unsplash son plan Profesional+
  if(typeof _tienePlan==='function'&&!_tienePlan('fotos_unsplash')){
    _useCoverFallback();
    return;
  }
  const dest=(document.getElementById('m-dest')?.value||qData?.viaje?.destino||'travel');
  const key=_unsplashKey();
  if(!key){
    // Admin: indicar dónde configurar. Agente/agencia: usar fotos curadas silenciosamente.
    if(typeof currentRol!=='undefined'&&currentRol==='admin'){
      toast('Configurá la Unsplash API Key en Admin → Integraciones',false);
      return;
    }
    _useCoverFallback();
    return;
  }
  const q=encodeURIComponent(dest+' travel landscape');
  fetch(`https://api.unsplash.com/photos/random?query=${q}&orientation=landscape&client_id=${key}`)
    .then(r=>{
      if(!r.ok) throw new Error('Unsplash '+r.status);
      return r.json();
    })
    .then(d=>{
      coverUrl=d.urls?.regular || d.urls?.small;
      // Atribución Unsplash (requerido por TOS)
      window._unsplashCredit={
        name: d.user?.name||'Fotógrafo',
        username: d.user?.username||'',
        link: d.links?.html||'',
        downloadUrl: d.links?.download_location||''
      };
      // Trigger download event (requerido por Unsplash TOS)
      if(d.links?.download_location){
        fetch(d.links.download_location,{headers:{Authorization:'Client-ID '+key}}).catch(()=>{});
      }
      updCovers();
      _showUnsplashCredit();
    })
    .catch(e=>{
      console.warn('Unsplash API:',e.message);
      _useCoverFallback();
    });
}

function _showUnsplashCredit(){
  const c=window._unsplashCredit;
  if(!c) return;
  const _photoBase=c.link||'https://unsplash.com';
  const _photoUrl=_photoBase+(_photoBase.includes('?')?'&':'?')+'utm_source=ermix&utm_medium=referral';
  const _html=`Foto de <a href="https://unsplash.com/@${c.username}?utm_source=ermix&utm_medium=referral" target="_blank" style="color:var(--primary)">${c.name}</a> en <a href="${_photoUrl}" target="_blank" style="color:var(--primary)">Unsplash</a>`;
  // 1. Crédito en el formulario (junto al thumbnail de portada)
  const elForm=document.getElementById('cov-form-credit');
  if(elForm){elForm.innerHTML=_html;elForm.style.display='';}
  // 2. Crédito en la vista previa (debajo del toolbar del preview)
  const elPrev=document.getElementById('unsplash-credit');
  if(elPrev){elPrev.innerHTML=_html;elPrev.style.display='';}
}
function removeCover(){
  coverUrl=null;window._unsplashCredit=null;
  // Limpiar crédito en ambos lugares
  ['cov-form-credit','unsplash-credit'].forEach(id=>{const e=document.getElementById(id);if(e){e.innerHTML='';e.style.display='none';}});
  updCovers();
}

function uploadLogo(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{logoUrl=e.target.result;agCfg.logo_url=logoUrl;_saveAgCfg();updateLogoPreview();const uf=document.getElementById('cfg-logo-url');if(uf)uf.value='';};r.readAsDataURL(f);}
function removeLogo(){logoUrl=null;agCfg.logo_url=null;_saveAgCfg();updateLogoPreview();const uf=document.getElementById('cfg-logo-url');if(uf)uf.value='';}
function _logoUrlInput(url){url=(url||'').trim();if(!url){return;}logoUrl=url;agCfg.logo_url=url;_saveAgCfg();updateLogoPreview();}
function updateLogoPreview(){
  const w=document.getElementById('logo-wrap'),b=document.getElementById('btn-rmlogo');
  if(!w) return; // element may not exist yet
  if(logoUrl){w.innerHTML=`<img src="${logoUrl}" style="height:50px;max-width:160px;object-fit:contain;border-radius:8px;border:1px solid var(--g2);padding:5px;background:white">`;if(b)b.style.display='';}
  else{const ini=(agCfg.nm||'M')[0].toUpperCase();w.innerHTML=`<div style="width:48px;height:48px;background:linear-gradient(135deg,var(--amber),var(--sky));border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:1.1rem;color:white">${ini}</div>`;if(b)b.style.display='none';}
  updateHeader();
}
function updateHeader(){
  // El logo de agente solo aparece en el PDF — el header siempre muestra el wordmark ermix
  // Esperar a que DM Sans esté lista antes de medir
  function _buildHdr(){
    if(document.fonts.check('900 48px "DM Sans"')){
      buildWordmark('hdr-wm',22,'currentColor','grad');
    } else {
      document.fonts.ready.then(()=>buildWordmark('hdr-wm',22,'currentColor','grad'));
    }
  }
  _buildHdr();
}

// ═══════════════════════════════════════════
// API KEYS — Supabase es fuente de verdad, localStorage solo cache
// ═══════════════════════════════════════════
async function saveApiKeys(){
  const unsplash=(document.getElementById('ak-unsplash')?.value||'').trim();
  const ia=(document.getElementById('ak-ia')?.value||'').trim();
  const resend=(document.getElementById('ak-resend')?.value||'').trim();
  const from=(document.getElementById('ak-resend-from')?.value||'').trim();
  // 1. Actualizar agCfg en memoria
  if(unsplash) agCfg._unsplash_key=unsplash; else delete agCfg._unsplash_key;
  if(ia) agCfg._ia_key=ia; else delete agCfg._ia_key;
  if(resend) agCfg._resend_key=resend; else delete agCfg._resend_key;
  if(from) agCfg.resend_from=from; else delete agCfg.resend_from;
  // 2. Persistir en Supabase — fuente de verdad
  // Las API keys van SIEMPRE en agencias.config para que todos los agentes las hereden
  // Si el usuario tiene agencia_id → su agencia específica
  // Si es admin sin agencia_id → broadcast a TODAS las agencias (keys globales)
  // Si es agente independiente sin agencia → su propio agentes.config
  const keyCfg={
    _unsplash_key: unsplash||null,
    _ia_key:       ia||null,
    _resend_key:   resend||null,
    resend_from:   from||null
  };
  console.log('[saveApiKeys] agenciaId:',window._agenciaId,'isAdmin:',typeof isAdmin!=='undefined'?isAdmin:'undef','agenteId:',window._agenteId);
  if(typeof isAdmin!=='undefined'&&isAdmin){
    // Admin → broadcast a TODAS las agencias (aunque tenga agencia_id propia, igual distribuye a todas)
    try{
      const {data:allAg,error:fetchErr}=await sb.from('agencias').select('id');
      if(fetchErr) throw fetchErr;
      console.log('[saveApiKeys] admin broadcast a',allAg?.length,'agencias');
      if(allAg?.length){
        const results=await Promise.all(allAg.map(ag=>sb.from('agencias').update({config:keyCfg}).eq('id',ag.id)));
        const firstErr=results.find(r=>r.error);
        if(firstErr){console.error('[saveApiKeys] broadcast error:',firstErr.error);throw firstErr.error;}
      }
    }catch(e){
      toast('Error al guardar en agencias: '+e.message,false);
      return;
    }
    // También en agentes.config del admin como fallback
    if(window._agenteId){
      try{ await sb.from('agentes').update({config:agCfg}).eq('id',window._agenteId); }catch(_){}
    }
  } else if(window._agenciaId){
    // Agencia (no admin) → solo su agencia
    try{
      const {error}=await sb.from('agencias').update({config:keyCfg}).eq('id',window._agenciaId);
      if(error) throw error;
      console.log('[saveApiKeys] guardado en agencias id:',window._agenciaId);
    }catch(e){
      toast('Error al guardar en agencia: '+e.message,false);
      return;
    }
  } else if(window._agenteId){
    // Agente independiente sin agencia
    try{
      const {error}=await sb.from('agentes').update({config:agCfg}).eq('id',window._agenteId);
      if(error) throw error;
    }catch(e){
      toast('Error al guardar en Supabase: '+e.message,false);
      return;
    }
  }
  // 3. Sincronizar localStorage como cache (solo después de Supabase exitoso)
  if(unsplash) localStorage.setItem('mp_unsplash_key',unsplash); else localStorage.removeItem('mp_unsplash_key');
  if(ia){localStorage.setItem('mp_ia_key',ia);localStorage.setItem('mp_key',ia);}
  else{localStorage.removeItem('mp_ia_key');localStorage.removeItem('mp_key');}
  if(resend) localStorage.setItem('mp_resend_key',resend); else localStorage.removeItem('mp_resend_key');
  _saveAgCfg();
  toast('API Keys guardadas');
}
function _loadApiKeyFields(){
  // agCfg es fuente de verdad (cargado desde Supabase en showApp), localStorage como fallback
  const el1=document.getElementById('ak-unsplash');if(el1)el1.value=agCfg._unsplash_key||localStorage.getItem('mp_unsplash_key')||'';
  const el2=document.getElementById('ak-ia');if(el2)el2.value=agCfg._ia_key||localStorage.getItem('mp_ia_key')||'';
  const el3=document.getElementById('ak-resend');if(el3)el3.value=agCfg._resend_key||localStorage.getItem('mp_resend_key')||'';
  const el4=document.getElementById('ak-resend-from');if(el4)el4.value=agCfg.resend_from||'';
  // Cargar sonidos admin guardados
  const sndApr=document.getElementById('adm-snd-aprobado');
  if(sndApr&&agCfg.adm_snd_aprobado) sndApr.value=agCfg.adm_snd_aprobado;
  const sndSop=document.getElementById('adm-snd-soporte');
  if(sndSop&&agCfg.adm_snd_soporte) sndSop.value=agCfg.adm_snd_soporte;
}

// ═══════════════════════════════════════════
// ADMIN SOUNDS
// ═══════════════════════════════════════════
function saveAdminSounds(){
  const apr=(document.getElementById('adm-snd-aprobado')?.value||'chime');
  const sop=(document.getElementById('adm-snd-soporte')?.value||'alert');
  agCfg.adm_snd_aprobado=apr;
  agCfg.adm_snd_soporte=sop;
  // Los sonidos del admin también se propagan como defaults del sistema
  // (agentes que no tienen preferencia propia usarán el valor del admin)
  localStorage.setItem('mp_sys_snd_aprobado',apr);
  localStorage.setItem('mp_sys_snd_soporte',sop);
  _saveAgCfg();
  const ok=document.getElementById('adm-snd-ok');
  if(ok){ok.style.display='inline';setTimeout(()=>ok.style.display='none',2000);}
  toast('Sonidos guardados');
}
function _previewAdminSound(category){
  const sel=document.getElementById(category==='aprobado'?'adm-snd-aprobado':'adm-snd-soporte');
  const soundId=sel?.value||'chime';
  if(typeof _playSound==='function') _playSound(category,soundId);
}

// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════
async function saveCfg(){
  const rawPais=(gv('cfg-pais')||'').toUpperCase().trim().slice(0,3);
  agCfg.nm=gv('cfg-nm');agCfg.em=gv('cfg-em');agCfg.tel=gv('cfg-tel');agCfg.soc=gv('cfg-soc');agCfg.pais_cod=rawPais||'AR';
  const _vd=(document.getElementById('cfg-validez-dias')?.value||'').trim();
  if(_vd) agCfg.validez_dias=parseInt(_vd); else delete agCfg.validez_dias;
  const _mm=(document.getElementById('cfg-meta-mensual')?.value||'').trim();
  if(_mm) agCfg.meta_mensual=parseFloat(_mm); else delete agCfg.meta_mensual;
  const _sndApr=(document.getElementById('cfg-sound-aprobado')?.value||'').trim();
  if(_sndApr) agCfg.sound_aprobado=_sndApr; else delete agCfg.sound_aprobado;
  _saveAgCfg();
  window._agentePaisCod=agCfg.pais_cod;
  // Logo URL desde campo (si cambió)
  const rawLogoUrl=(document.getElementById('cfg-logo-url')?.value||'').trim();
  if(rawLogoUrl){logoUrl=rawLogoUrl;agCfg.logo_url=rawLogoUrl;}
  // Update in Supabase — sin pdf_theme (se maneja solo en preview via localStorage)
  if(currentUser&&window._agenteId){
    // soc no existe en tabla agentes — no incluir en UPDATE
    const upd={nombre:agCfg.nm||'',telefono:agCfg.tel||'',pais_cod:agCfg.pais_cod};
    if(agCfg.logo_url) upd.logo_url=agCfg.logo_url;
    const {error}=await sb.from('agentes').update(upd).eq('id',window._agenteId);
    if(error){
      // logo_url puede no existir — retry sin ese campo
      if(error.code==='42703'||error.message?.includes('column')){
        delete upd.logo_url;
        const {error:e2}=await sb.from('agentes').update(upd).eq('id',window._agenteId);
        if(e2){console.warn('[saveCfg] Supabase error:',e2.message);_captureError('saveCfg',e2);}
      } else {
        console.warn('[saveCfg] Supabase error:',error.message);_captureError('saveCfg',error);
      }
    }
  }
  updateHeader();
  const ok=document.getElementById('cfg-ok');if(ok){ok.style.display='inline';setTimeout(()=>ok.style.display='none',2500);}
  toast('Perfil guardado');
}
async function changePassword(){
  const p1=document.getElementById('pw-new').value;
  const p2=document.getElementById('pw-conf').value;
  if(!p1||p1.length<6){toast('La contraseña debe tener al menos 6 caracteres',false);return;}
  if(p1!==p2){toast('Las contraseñas no coinciden',false);return;}
  const {error}=await sb.auth.updateUser({password:p1});
  if(error){toast('No se pudo actualizar la contraseña, intentá de nuevo',false);return;}
  document.getElementById('pw-new').value='';
  document.getElementById('pw-conf').value='';
  const ok=document.getElementById('pw-ok');
  if(ok){ok.style.display='inline';setTimeout(()=>ok.style.display='none',3000);}
  toast('Contraseña actualizada');
}
function loadCfg(){
  [{id:'cfg-nm',k:'nm'},{id:'cfg-ag',k:'ag'},{id:'cfg-em',k:'em'},{id:'cfg-tel',k:'tel'},{id:'cfg-soc',k:'soc'},{id:'cfg-pais',k:'pais_cod'}].forEach(({id,k})=>{const e=document.getElementById(id);if(e&&agCfg[k])e.value=agCfg[k];});
  // Logo — mostrar en preview y poblar campo URL si es una URL (no base64)
  if(logoUrl||agCfg.logo_url){
    if(!logoUrl) logoUrl=agCfg.logo_url;
    updateLogoPreview();
    const uf=document.getElementById('cfg-logo-url');
    if(uf&&logoUrl&&!logoUrl.startsWith('data:')) uf.value=logoUrl;
  } else {
    updateLogoPreview(); // muestra inicial (avatar con letra)
  }
  if(agCfg.pdf_theme!=null) selectPdfTheme(agCfg.pdf_theme);
  // Sound preference
  const sndEl=document.getElementById('cfg-sound-aprobado');
  if(sndEl&&agCfg.sound_aprobado) sndEl.value=agCfg.sound_aprobado;
  // Profile card: adapt per role
  const cfgCard=document.getElementById('cfg-card-title')?.closest('.card');
  const ttl=document.getElementById('cfg-card-title');
  if(currentRol==='admin'){
    // Admin: only name, email, tel + password — sin logo personal ni campos de agente
    const hide=id=>{const el=document.getElementById(id);if(el)el.style.display='none';};
    hide('cfg-ag-wrap');
    hide('cfg-pais-wrap');
    hide('cfg-soc-wrap');
    hide('cfg-logo-wrap');
    if(ttl) ttl.textContent='Mi perfil de administrador';
  } else if(currentRol==='agencia'){
    // Agencia: mostrar perfil básico (nombre, email, tel), sin campos exclusivos de agente
    if(ttl) ttl.textContent='Mi perfil de agencia';
    const hideAg=id=>{const el=document.getElementById(id);if(el)el.style.display='none';};
    hideAg('cfg-ag-wrap');
    hideAg('cfg-pais-wrap');
    hideAg('cfg-soc-wrap');
  } else {
    if(ttl) ttl.textContent='Mi perfil de agente';
    // Load agencia name readonly from Supabase relation
    if(window._agenciaId){
      sb.from('agencias').select('nombre').eq('id',window._agenciaId).maybeSingle().then(({data})=>{
        const el=document.getElementById('cfg-ag');
        if(el&&data?.nombre) el.value=data.nombre;
        // Persistir en agCfg para que el PDF lo use
        if(data?.nombre && agCfg.ag!==data.nombre){
          agCfg.ag=data.nombre;
          if(typeof _saveAgCfg==='function') _saveAgCfg();
        }
      });
    }
  }
  _loadIntegrationFields();
}

// ═══════════════════════════════════════════
// PDF THEME SELECTOR
// ═══════════════════════════════════════════
const _PDF_THEME_NAMES={1:'Turquesa',2:'Azul Glaciar',3:'Ámbar Dorado',4:'Negro Violeta',5:'Rojo Coral',6:'Azul Marino',7:'Negro Naranja',8:'Rosa Fucsia',9:'Cyan Profundo',10:'Rojo Carmín'};
function selectPdfTheme(n){
  n=parseInt(n)||1;
  const inp=document.getElementById('cfg-pdf-theme');
  if(inp)inp.value=n;
  const lbl=document.getElementById('pdf-theme-lbl');
  if(lbl)lbl.textContent=_PDF_THEME_NAMES[n]||'';
  // Sync dropdown + color dot
  const sel=document.getElementById('pdf-theme-sel');
  if(sel)sel.value=n;
  const dot=document.getElementById('tb-theme-dot');
  if(dot&&typeof PDF_THEMES!=='undefined'&&PDF_THEMES[n])dot.style.background=PDF_THEMES[n].grad;
  agCfg.pdf_theme=n;
  if(typeof _saveAgCfg==='function') _saveAgCfg();
  if(qData)renderPreview(qData);
}

// ═══════════════════════════════════════════
// PREVIEW & PRINT
// ═══════════════════════════════════════════
function buildAndPreview(){
  console.log('click buildAndPreview');
  try{qData=collectForm();renderPreview(qData);switchTab('preview');}
  catch(e){toast('Hubo un error al generar la vista previa',false);console.error(e);}
}
function buildAndPrint(){
  console.log('click buildAndPrint');
  try{qData=collectForm();renderPreview(qData);switchTab('preview');setTimeout(doPrint,600);}
  catch(e){toast('Hubo un error al generar el PDF',false);console.error(e);}
}
function doPrint(){
  if(!qData){toast('Primero generá la vista previa.',false);return;}
  const nm=(qData.cliente?.nombre||'cotizacion').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
  const today=new Date();const dd=String(today.getDate()).padStart(2,'0'),mm=String(today.getMonth()+1).padStart(2,'0'),yy=today.getFullYear();
  document.title=`${nm}_${dd}${mm}${yy}`;
  window.print();
  setTimeout(()=>document.title='Magic Planner · Cotizador',1500);
}
function renderPreview(d){
  document.getElementById('prev-empty').style.display='none';
  document.getElementById('prev-content').style.display='';
  const html=buildQuoteHTML(d);
  document.getElementById('qscreen').innerHTML=html;
  document.getElementById('qprint').innerHTML=html;
  // Apply covers directly — do NOT call updCovers() here to avoid
  // the renderPreview→updCovers→renderPreview infinite recursion (stack overflow on PDF).
  _applyCoversToDOM();
}
function _applyCoversToDOM(){
  ['cov-thumb','tb-thumb'].forEach(function(id){var e=document.getElementById(id);if(!e)return;e.src=coverUrl||'';e.style.display=coverUrl?'':'none';});
  ['btn-rmcov','btn-rmcov2'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display=coverUrl?'':'none';});
}
function updCovers(){
  _applyCoversToDOM();
  if(qData) renderPreview(qData);
  // Mostrar/ocultar crédito Unsplash (en preview y en form)
  if(window._unsplashCredit){
    _showUnsplashCredit();
  } else {
    ['unsplash-credit','cov-form-credit'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  }
}

// ═══════════════════════════════════════════
// CIERRE PHOTO
// ═══════════════════════════════════════════
function uploadClosing(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{closingUrl=e.target.result;['btn-rmclosing','btn-rmclosing-form'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='';});if(qData)renderPreview(qData);};r.readAsDataURL(f);}
function removeClosing(){closingUrl=null;['btn-rmclosing','btn-rmclosing-form'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});if(qData)renderPreview(qData);}

// ═══════════════════════════════════════════
// SECTION PHOTOS MODAL
// ═══════════════════════════════════════════
const _SP_LABELS={vuelos:'Vuelos',hotel:'Alojamiento',traslados:'Traslados',excursiones:'Excursiones/Tickets',autos:'Autos',cruceros:'Cruceros',seguro:'Seguro/Asistencia'};
function openSecPhotosPanel(){
  const _sph=JSON.parse(localStorage.getItem('mp_sec_photos')||'{}');
  const keys=Object.keys(_SP_LABELS);
  let html='';
  keys.forEach(k=>{
    const cur=_sph[k]?.url||'';
    html+=`<div style="margin-bottom:16px">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--g3);margin-bottom:6px">${_SP_LABELS[k]}</div>
      <div style="display:flex;align-items:center;gap:8px">
        ${cur?`<img src="${cur}" style="height:40px;width:72px;object-fit:cover;border-radius:6px;border:1px solid var(--border2)">`:'<div style="height:40px;width:72px;border-radius:6px;border:2px dashed var(--border2);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--g3)">Sin foto</div>'}
        <input type="file" id="spf-${k}" accept="image/*" style="display:none" onchange="setSectionPhoto('${k}',this)">
        <button class="btn btn-out btn-sm" onclick="document.getElementById('spf-${k}').click()">Subir</button>
        ${cur?`<button class="btn btn-del btn-xs" onclick="removeSectionPhoto('${k}')">✕</button>`:''}
      </div>
    </div>`;
  });
  document.getElementById('sec-photos-body').innerHTML=html;
  document.getElementById('sec-photos-modal').style.display='flex';
}
function closeSPModal(){document.getElementById('sec-photos-modal').style.display='none';}
function setSectionPhoto(k,inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    const _sph=JSON.parse(localStorage.getItem('mp_sec_photos')||'{}');
    _sph[k]={url:e.target.result,pos:'center center'};
    localStorage.setItem('mp_sec_photos',JSON.stringify(_sph));
    openSecPhotosPanel();
    if(qData)renderPreview(qData);
  };
  r.readAsDataURL(f);
}
function removeSectionPhoto(k){
  const _sph=JSON.parse(localStorage.getItem('mp_sec_photos')||'{}');
  delete _sph[k];
  localStorage.setItem('mp_sec_photos',JSON.stringify(_sph));
  openSecPhotosPanel();
  if(qData)renderPreview(qData);
}

// ═══════════════════════════════════════════
// LINK PÚBLICO + APROBACIÓN CLIENTE
// ═══════════════════════════════════════════
async function _shareQuote(){
  if(!editingQuoteId){toast('Guardá primero la cotización para poder compartirla',false);return;}
  let token=null;
  try{
    const{data:row}=await sb.from('cotizaciones').select('datos').eq('id',editingQuoteId).single();
    const d=typeof row?.datos==='string'?JSON.parse(row.datos):(row?.datos||{});
    if(d.public_token) token=d.public_token;
    if(!token){
      token=(typeof crypto.randomUUID==='function')?crypto.randomUUID():(Math.random().toString(36).slice(2)+Date.now().toString(36)).slice(0,32);
      const newD={...d,public_token:token};
      const{error}=await sb.from('cotizaciones').update({datos:newD}).eq('id',editingQuoteId);
      if(error){toast('Error al generar el link: '+error.message,false);return;}
    }
  }catch(e){toast('No se pudo generar el link',false);return;}
  const url=window.location.origin+window.location.pathname+'?q='+token;
  _showShareModal(url);
}
function _showShareModal(url){
  let m=document.getElementById('share-modal');
  if(!m){
    m=document.createElement('div');m.id='share-modal';m.className='modal-overlay';
    m.style.cssText='display:none';
    m.innerHTML=`<div class="modal" style="max-width:420px;padding:28px 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h3 style="font-size:1rem;font-weight:700;color:var(--text);margin:0">Compartir cotización</h3>
        <button onclick="document.getElementById('share-modal').style.display='none'" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:1.2rem;line-height:1">✕</button>
      </div>
      <p style="font-size:.83rem;color:var(--muted);margin-bottom:14px;line-height:1.5">El cliente puede ver la cotización y aprobarla desde este link. No requiere login.</p>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input id="share-url-inp" class="finput" type="text" readonly style="flex:1;font-size:.78rem;background:var(--g1)">
        <button class="btn btn-pri btn-sm" onclick="_copyShareUrl()">Copiar</button>
      </div>
    </div>`;
    document.body.appendChild(m);
  }
  document.getElementById('share-url-inp').value=url;
  m.style.display='flex';
}
function _copyShareUrl(){
  const inp=document.getElementById('share-url-inp');
  if(!inp)return;
  navigator.clipboard.writeText(inp.value).then(()=>toast('Link copiado')).catch(()=>{inp.select();document.execCommand('copy');toast('Link copiado');});
}
// Vista pública — se activa si hay ?q=TOKEN en la URL (sin login)
async function _initPublicView(){
  const params=new URLSearchParams(window.location.search);
  const token=params.get('q');
  if(!token)return false;
  // Reemplazar toda la UI por spinner
  document.body.innerHTML='<div id="pub-loading" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0D120F;color:#F0EDE6;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif;gap:16px"><div style="width:40px;height:40px;border:3px solid rgba(27,158,143,0.3);border-top-color:#1B9E8F;border-radius:50%;animation:spin .8s linear infinite"></div><p style="font-size:.9rem;color:rgba(240,237,230,0.6)">Cargando cotización...</p><style>@keyframes spin{to{transform:rotate(360deg)}}</style></div>';
  try{
    const{data,error}=await sb.from('cotizaciones').select('*').filter('datos->>public_token','eq',token).maybeSingle();
    if(error||!data){
      document.body.innerHTML=`<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D120F;color:#F0EDE6;font-family:'Plus Jakarta Sans',system-ui,sans-serif;text-align:center;padding:24px"><div><p style="font-size:1.1rem;font-weight:600;margin-bottom:8px">Cotización no encontrada</p><p style="font-size:.85rem;color:rgba(240,237,230,0.5)">El link puede haber expirado o no ser válido.</p></div></div>`;
      return true;
    }
    const d=typeof data.datos==='string'?JSON.parse(data.datos):data.datos;
    _buildPublicWall(d,data.estado,data.id,token,data.cover_url||null);
  }catch(e){
    document.body.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D120F;color:#F0EDE6;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif"><p>Error al cargar la cotización.</p></div>';
  }
  return true;
}
function _buildPublicWall(d,estado,quoteId,token,fallbackCoverUrl){
  if(typeof buildQuoteHTML!=='function'){setTimeout(()=>_buildPublicWall(d,estado,quoteId,token,fallbackCoverUrl),200);return;}
  coverUrl=d._cover_url||fallbackCoverUrl||null;
  logoUrl=d._logo_url||null;
  if(d._unsplash_credit) window._unsplashCredit=d._unsplash_credit;
  if(d._agent&&typeof agCfg!=='undefined'){Object.assign(agCfg,d._agent);if(d._agent.pdf_theme)agCfg.pdf_theme=d._agent.pdf_theme;}
  const html=buildQuoteHTML(d);
  const agNm=d._agent?.nm||'tu agente';
  let bottomBar='';
  if(estado==='aprobado'){
    bottomBar=`<div style="position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#1B9E8F,#0BC5B8);color:white;text-align:center;padding:14px 20px;font-size:.9rem;font-weight:600;z-index:9999;font-family:'Plus Jakarta Sans',system-ui,sans-serif">Cotización aprobada</div>`;
  } else if(estado==='revision'){
    bottomBar=`<div style="position:fixed;bottom:0;left:0;right:0;background:rgba(255,107,53,0.95);color:white;text-align:center;padding:14px 20px;font-size:.9rem;font-weight:600;z-index:9999;font-family:'Plus Jakarta Sans',system-ui,sans-serif">Modificaciones solicitadas — ${agNm} ya fue notificado</div>`;
  } else {
    bottomBar=`<div id="pub-bar" style="position:fixed;bottom:0;left:0;right:0;background:rgba(13,18,15,0.95);backdrop-filter:blur(10px);border-top:1px solid rgba(27,158,143,0.2);padding:16px 20px;z-index:9999;font-family:'Plus Jakarta Sans',system-ui,sans-serif">
      <div id="pub-bar-actions" style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">
        <p style="color:rgba(240,237,230,0.7);font-size:.82rem;margin:0;flex-basis:100%;text-align:center">¿Todo listo? Aprobá esta cotización</p>
        <button onclick="_publicApprove('${quoteId}','${token}')" style="background:linear-gradient(135deg,#1B9E8F,#0BC5B8);color:white;border:none;border-radius:10px;padding:10px 24px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:inherit">Aprobar cotización</button>
        <button onclick="_showModForm()" style="background:transparent;color:rgba(240,237,230,0.7);border:1px solid rgba(240,237,230,0.2);border-radius:10px;padding:10px 20px;font-size:.82rem;font-weight:600;cursor:pointer;font-family:inherit">Solicitar modificaciones</button>
      </div>
      <div id="pub-bar-mod" style="display:none">
        <p style="color:rgba(240,237,230,0.85);font-size:.85rem;font-weight:600;margin:0 0 10px">¿Qué cambios necesitás?</p>
        <textarea id="pub-mod-msg" rows="3" placeholder="Describí los cambios que necesitás en la cotización..." style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#F0EDE6;padding:10px 14px;font-size:.85rem;font-family:inherit;resize:vertical"></textarea>
        <div style="display:flex;gap:10px;margin-top:10px;justify-content:flex-end">
          <button onclick="_hideModForm()" style="background:transparent;color:rgba(240,237,230,0.5);border:none;padding:8px 16px;font-size:.82rem;cursor:pointer;font-family:inherit">Cancelar</button>
          <button onclick="_publicRequestMod('${quoteId}','${token}')" style="background:#FF6B35;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit">Enviar solicitud</button>
        </div>
      </div>
    </div>`;
  }
  document.body.innerHTML=`<div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;padding-bottom:80px">${html}</div>${bottomBar}`;
}
function _showModForm(){
  const a=document.getElementById('pub-bar-actions');
  const m=document.getElementById('pub-bar-mod');
  if(a)a.style.display='none';
  if(m)m.style.display='block';
  document.getElementById('pub-mod-msg')?.focus();
}
function _hideModForm(){
  const a=document.getElementById('pub-bar-actions');
  const m=document.getElementById('pub-bar-mod');
  if(a)a.style.display='flex';
  if(m)m.style.display='none';
}
async function _publicApprove(quoteId,token){
  const btn=document.querySelector('[onclick*="_publicApprove"]');
  if(btn){btn.disabled=true;btn.textContent='Aprobando...';}
  try{
    const{error}=await sb.from('cotizaciones').update({estado:'aprobado'}).filter('datos->>public_token','eq',token);
    if(error){alert('No se pudo aprobar: '+(error.message||error.code||'error desconocido'));if(btn){btn.disabled=false;btn.textContent='Aprobar cotización';}return;}
    const bar=document.getElementById('pub-bar');
    if(bar){bar.style.background='linear-gradient(135deg,#1B9E8F,#0BC5B8)';bar.style.borderTop='none';bar.innerHTML='<p style="color:white;font-weight:600;font-size:.9rem;margin:0;text-align:center;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif">Cotización aprobada</p>';}
    // Email de confirmación al cliente
    try{
      const{data:qRow}=await sb.from('cotizaciones').select('datos').filter('datos->>public_token','eq',token).maybeSingle();
      const rd=qRow?.datos||{};
      const resendKey=rd._resend_key||'';
      const clientEmail=rd?.cliente?.email||'';
      if(resendKey&&clientEmail&&typeof _buildEmailHTML==='function'){
        const agCfgTemp={nm:rd._agent?.nm||'',tel:rd._agent?.tel||'',soc:rd._agent?.soc||'',logo_url:rd._agent?.logo_url||'',pdf_theme:rd._agent?.pdf_theme||1,resend_from:rd._agent?.resend_from||'ermix <onboarding@resend.dev>'};
        const confirmHtml=_buildEmailHTML(rd,'confirmacion',agCfgTemp);
        const dest=rd?.viaje?.destino||'tu viaje';
        await fetch('https://api.resend.com/emails',{
          method:'POST',
          headers:{'Authorization':'Bearer '+resendKey,'Content-Type':'application/json'},
          body:JSON.stringify({from:agCfgTemp.resend_from,to:clientEmail,subject:'Tu viaje a '+dest+' esta confirmado!',html:confirmHtml})
        });
      }
    }catch(e){console.warn('[confirmacion-email]',e);}
  }catch(e){alert('Error al aprobar. Intentá de nuevo.');}
}
async function _publicRequestMod(quoteId,token){
  const msg=(document.getElementById('pub-mod-msg')?.value||'').trim();
  if(!msg){alert('Escribí qué cambios necesitás.');return;}
  const btn=document.querySelector('[onclick*="_publicRequestMod"]');
  if(btn){btn.disabled=true;btn.textContent='Enviando...';}
  try{
    // Leer datos actuales para mergear la solicitud
    const{data:row}=await sb.from('cotizaciones').select('datos').filter('datos->>public_token','eq',token).maybeSingle();
    if(!row){alert('Error: cotización no encontrada.');return;}
    const rd=typeof row.datos==='string'?JSON.parse(row.datos):(row.datos||{});
    const reqs=Array.isArray(rd._mod_requests)?rd._mod_requests:[];
    reqs.push({msg,ts:new Date().toISOString()});
    rd._mod_requests=reqs;
    const{error}=await sb.from('cotizaciones').update({estado:'revision',datos:rd}).filter('datos->>public_token','eq',token);
    if(error){alert('No se pudo enviar: '+(error.message||error.code||'error desconocido'));if(btn){btn.disabled=false;btn.textContent='Enviar solicitud';}return;}
    const bar=document.getElementById('pub-bar');
    if(bar){bar.style.background='rgba(255,107,53,0.95)';bar.style.borderTop='none';bar.innerHTML='<p style="color:white;font-weight:600;font-size:.9rem;margin:0;text-align:center;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif;padding:4px 0">Solicitud enviada — tu agente ya fue notificado</p>';}
  }catch(e){alert('Error al enviar. Intentá de nuevo.');if(btn){btn.disabled=false;btn.textContent='Enviar solicitud';}}
}

// ═══════════════════════════════════════════
// EMAIL VIA RESEND
// ═══════════════════════════════════════════
function _loadIntegrationFields(){
  // Solo carga validez_dias y meta_mensual (en tab-config) — resend/unsplash/ia son admin-only
  const vd=document.getElementById('cfg-validez-dias');if(vd)vd.value=agCfg.validez_dias||'';
  const mm=document.getElementById('cfg-meta-mensual');if(mm)mm.value=agCfg.meta_mensual||'';
}
// ═══════════════════════════════════════════
// EMAIL TEMPLATES — 5 temas sincronizados con PDF
// ═══════════════════════════════════════════
// 10 temas sincronizados con PDF_THEMES de app-quote.js
const EMAIL_THEMES={
  1: {name:'Turquesa',      headerBg:'linear-gradient(135deg,#1B9E8F,#0BC5B8,#06B6D4)',         btnBg:'linear-gradient(135deg,#1B9E8F,#0BC5B8)',  accent:'#1B9E8F',cardBorder:'rgba(27,158,143,0.25)',  cardBg:'#F0FAF9'},
  2: {name:'Azul Glaciar',  headerBg:'linear-gradient(135deg,#1E3A5F,#2979B0,#7EC8E3)',         btnBg:'linear-gradient(135deg,#2979B0,#7EC8E3)',  accent:'#2979B0',cardBorder:'rgba(41,121,176,0.25)',  cardBg:'#EEF6FB'},
  3: {name:'Ambar Dorado',  headerBg:'linear-gradient(135deg,#1A0A00,#7C4A00,#E8C77D)',         btnBg:'linear-gradient(135deg,#C9860A,#E8C77D)',  accent:'#C9860A',cardBorder:'rgba(201,134,10,0.3)',   cardBg:'#FFFBF0'},
  4: {name:'Negro Violeta', headerBg:'linear-gradient(135deg,#0A0A0A,#1A0A2E,#7B2FBE)',         btnBg:'linear-gradient(135deg,#7B2FBE,#9B59B6)',  accent:'#7B2FBE',cardBorder:'rgba(123,47,190,0.25)',  cardBg:'#F5F0FA'},
  5: {name:'Rojo Coral',    headerBg:'linear-gradient(135deg,#C84B31,#E8826A,#F5A623)',         btnBg:'linear-gradient(135deg,#C84B31,#E8826A)',  accent:'#C84B31',cardBorder:'rgba(200,75,49,0.25)',   cardBg:'#FFF5F2'},
  6: {name:'Azul Marino',   headerBg:'linear-gradient(135deg,#0F1B5C,#1A2E8A,#FFD700)',         btnBg:'linear-gradient(135deg,#1A2E8A,#2940A0)',  accent:'#1A2E8A',cardBorder:'rgba(26,46,138,0.25)',   cardBg:'#F0F1FA'},
  7: {name:'Negro Naranja', headerBg:'linear-gradient(135deg,#0A0A0A,#1C0500,#FF4500)',         btnBg:'linear-gradient(135deg,#FF4500,#FF6B35)',  accent:'#FF4500',cardBorder:'rgba(255,69,0,0.25)',    cardBg:'#FFF5F0'},
  8: {name:'Rosa Fucsia',   headerBg:'linear-gradient(135deg,#8B1A4A,#C4426A,#F7C5D8)',         btnBg:'linear-gradient(135deg,#C4426A,#E06090)',  accent:'#C4426A',cardBorder:'rgba(196,66,106,0.25)',  cardBg:'#FDF2F5'},
  9: {name:'Cyan Profundo', headerBg:'linear-gradient(135deg,#050E2D,#0A1F5C,#00E5FF)',         btnBg:'linear-gradient(135deg,#0A1F5C,#00D4E8)',  accent:'#00B8D4',cardBorder:'rgba(0,212,232,0.25)',   cardBg:'#EEF9FB'},
  10:{name:'Rojo Carmin',   headerBg:'linear-gradient(135deg,#8B0000,#B22222,#FF6B6B)',         btnBg:'linear-gradient(135deg,#B22222,#D43B3B)',  accent:'#B22222',cardBorder:'rgba(178,34,34,0.25)',   cardBg:'#FDF2F2'}
};

function _buildEmailHTML(d, tipo, agCfgRef, publicUrl){
  const cfg=agCfgRef||agCfg||{};
  const t=EMAIL_THEMES[parseInt(cfg.pdf_theme||1)]||EMAIL_THEMES[1];
  const primerNombre=(d?.cliente?.nombre||'').split(' ')[0];
  const destino=d?.viaje?.destino||'tu viaje';
  const fechaEnt=d?.viaje?.fecha_entrada||d?.viaje?.salida||'';
  const fechaSal=d?.viaje?.fecha_salida||d?.viaje?.regreso||'';
  const adultos=parseInt(d?.cliente?.adultos||1);
  const ninos=parseInt(d?.cliente?.ninos||0);
  const totalPax=adultos+ninos;
  const precioTotal=d?.precio_total||d?.precios?.total||'';
  const moneda=d?.moneda||d?.precios?.moneda||'USD';
  const tieneVuelo=!!(d?.vuelos?.length||d?.vuelo?.aerolinea);
  const tieneHotel=!!(d?.hoteles?.length||d?.hotel?.nombre);
  const tieneTraslado=!!(d?.traslados?.length||d?.traslado?.tipo);
  const tieneExcursion=!!(d?.excursiones?.length);
  const tieneSeguro=!!(d?.seguros?.length||d?.seguro?.nombre);
  const agNm=cfg.nm||'Tu agente de viajes';
  const agTel=cfg.tel||'';
  const agSoc=cfg.soc||'';
  const logoUrl=cfg.logo_url||'';
  // Formatear fechas
  const fmtD=s=>{if(!s)return'';try{const dt=new Date(s.includes('-')?s+'T12:00:00':s);return dt.toLocaleDateString('es-AR',{day:'numeric',month:'short'});}catch(e){return s;}};
  const fechasHtml=fechaEnt?`<div style="font-size:14px;color:#6B5E52;margin-top:6px">${fmtD(fechaEnt)}${fechaSal?' → '+fmtD(fechaSal):''}</div>`:'';
  // Pasajeros
  const paxHtml=`<div style="font-size:13px;color:#9B8C80;margin-top:4px">${adultos} adulto${adultos>1?'s':''}${ninos?' + '+ninos+' ni'+(ninos>1?'nos':'no'):''}</div>`;
  // Servicios incluidos
  const svcs=[];
  if(tieneVuelo) svcs.push('Vuelos');
  if(tieneHotel) svcs.push('Hotel');
  if(tieneTraslado) svcs.push('Traslados');
  if(tieneExcursion) svcs.push('Excursiones');
  if(tieneSeguro) svcs.push('Asistencia al viajero');
  const svcsHtml=svcs.length?`<div style="margin-top:12px;padding-top:10px;border-top:1px solid ${t.cardBorder}">${svcs.map(s=>`<span style="display:inline-block;font-size:12px;color:${t.accent};font-weight:600;margin-right:12px;margin-bottom:4px">${s}</span>`).join('')}</div>`:'';
  // Precio
  const precioHtml=precioTotal?`<div style="margin-top:12px;padding-top:10px;border-top:1px solid ${t.cardBorder};font-size:13px;color:#6B5E52">Total estimado<div style="font-size:22px;font-weight:800;color:${t.accent};letter-spacing:-0.5px;margin-top:2px">${moneda} ${Number(precioTotal).toLocaleString('es-AR')}</div></div>`:'';
  // Logo
  const logoHtml=logoUrl?`<img src="${logoUrl}" alt="" style="max-height:48px;max-width:160px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto" />`:'';
  // Título header
  const headerTitle=tipo==='confirmacion'?'Viaje confirmado':'Tu cotizacion esta lista';

  // Cuerpo según tipo
  let bodyHtml='';
  if(tipo==='confirmacion'){
    bodyHtml=`
      <p style="font-size:15px;color:#2D1F14;margin:0 0 16px;font-weight:600">Hola${primerNombre?' '+primerNombre:''}!</p>
      <p style="font-size:14px;color:#6B5E52;line-height:1.65;margin:0 0 20px">Tu viaje a <strong>${destino}</strong> fue aprobado. Tu agente ya esta trabajando en la reserva.</p>
      <div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:12px;padding:20px;margin-bottom:20px">
        <div style="font-size:20px;font-weight:800;color:${t.accent};letter-spacing:-0.3px">${destino}</div>
        ${fechasHtml}${paxHtml}${svcsHtml}${precioHtml}
      </div>
      <div style="margin-bottom:20px">
        <p style="font-size:13px;font-weight:700;color:#2D1F14;margin:0 0 8px">Proximos pasos:</p>
        <div style="font-size:13px;color:#6B5E52;line-height:1.7">
          1. Tu agente confirmara las reservas con los proveedores<br>
          2. Recibiras los vouchers y documentos del viaje<br>
          3. Ante cualquier duda, contacta a tu agente directamente
        </div>
      </div>`;
  } else {
    bodyHtml=`
      <p style="font-size:15px;color:#2D1F14;margin:0 0 16px;font-weight:600">Hola${primerNombre?' '+primerNombre:''}!</p>
      <p style="font-size:14px;color:#6B5E52;line-height:1.65;margin:0 0 20px">Te comparto tu cotizacion de viaje personalizada. Podes verla completa y aprobarla desde el boton de abajo.</p>
      <div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:12px;padding:20px;margin-bottom:20px">
        <div style="font-size:20px;font-weight:800;color:${t.accent};letter-spacing:-0.3px">${destino}</div>
        ${fechasHtml}${paxHtml}${svcsHtml}${precioHtml}
      </div>
      ${publicUrl?`<a href="${publicUrl}" style="display:block;background:${t.btnBg};color:#fff;text-decoration:none;text-align:center;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;margin-bottom:20px;font-family:'Plus Jakarta Sans',Arial,sans-serif">Ver mi cotizacion completa</a>`:''}`;
  }
  // Firma
  const firmaHtml=`<p style="font-size:13px;color:#9B8C80;margin:0">Preparada por <strong style="color:#2D1F14">${agNm}</strong>${agTel?' <span style="color:#9B8C80">'+agTel+'</span>':''}${agSoc?' <span style="color:#9B8C80">'+agSoc+'</span>':''}</p>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;background:#F5F0E8;margin:0;padding:20px 10px;-webkit-text-size-adjust:100%">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(45,31,20,0.08)">
  <div style="background:${t.headerBg};padding:28px 32px;text-align:center">
    ${logoHtml}
    <h1 style="color:#ffffff;font-size:20px;margin:0 0 6px;font-weight:700;font-family:'Plus Jakarta Sans',Arial,sans-serif">${headerTitle}</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;font-family:'Plus Jakarta Sans',Arial,sans-serif">${destino}</p>
  </div>
  <div style="padding:28px 32px">
    ${bodyHtml}
    ${firmaHtml}
  </div>
  <div style="border-top:1px solid #EDE8DF;padding:20px 32px;text-align:center">
    <p style="font-size:12px;color:#9B8C80;margin:0;font-family:'Plus Jakarta Sans',Arial,sans-serif">ermix · cotizaciones de viaje profesionales</p>
  </div>
</div>
</body></html>`;
}

async function _sendQuoteEmail(){
  // Plan gate
  if(typeof _tienePlan==='function'&&!_tienePlan('enviar_email')){_openUpgradeModal('profesional');return;}
  // Verificar que hay cotización y email del cliente
  const d=qData||collectFormSafe();
  const clientEmail=d?.cliente?.email;
  if(!clientEmail){toast('El cliente no tiene email registrado',false);return;}
  // Verificar Resend key — intentar múltiples fuentes
  let resendKey=(typeof agCfg!=='undefined'?agCfg._resend_key:'')||localStorage.getItem('mp_resend_key')||'';
  // Fallback: fetch en vivo desde agencias.config (por si showApp no lo cargó o la columna es nueva)
  if(!resendKey && window._agenciaId){
    try{
      const{data:ag}=await sb.from('agencias').select('*').eq('id',window._agenciaId).maybeSingle();
      console.log('[email] agencias row:', ag);
      if(ag?.config?._resend_key){
        resendKey=ag.config._resend_key;
        if(typeof agCfg!=='undefined') agCfg._resend_key=resendKey;
        localStorage.setItem('mp_resend_key',resendKey);
        console.log('[email] resend key cargada desde agencias en vivo');
      }
    }catch(e){console.warn('[email] fetch agencias.config:',e.message);}
  }
  console.log('[email] resendKey final:',!!resendKey,'agenciaId:',window._agenciaId,'agCfg._resend_key:',!!agCfg?._resend_key);
  if(!resendKey){
    if(typeof currentRol!=='undefined'&&currentRol==='admin'){
      toast('Configurá la Resend API Key en Admin → Integraciones',false);
    } else {
      toast('El envío de emails no está activado. Contactá al administrador.',false);
    }
    return;
  }
  // Generar link público (igual que _shareQuote)
  let token=null;
  if(editingQuoteId){
    try{
      const{data:row}=await sb.from('cotizaciones').select('datos').eq('id',editingQuoteId).single();
      const rd=typeof row?.datos==='string'?JSON.parse(row.datos):(row?.datos||{});
      if(rd.public_token) token=rd.public_token;
      if(!token){
        token=(typeof crypto.randomUUID==='function')?crypto.randomUUID():(Math.random().toString(36).slice(2)+Date.now().toString(36)).slice(0,32);
        const{error}=await sb.from('cotizaciones').update({datos:{...rd,public_token:token}}).eq('id',editingQuoteId);
        if(error){toast('Error al generar el link: '+error.message,false);return;}
      }
    }catch(e){toast('Error al preparar el link',false);return;}
  }
  const publicUrl=token?(window.location.origin+window.location.pathname+'?q='+token):'';
  const destino=d?.viaje?.destino||'tu viaje';
  const fromAddr=agCfg.resend_from||'ermix <onboarding@resend.dev>';
  const subject=`Tu cotización para ${destino} está lista`;
  const html=_buildEmailHTML(d,'cotizacion',null,publicUrl);
  // Llamar Resend vía proxy server-side (Vercel /api/send-email o Supabase Edge Function)
  // Necesario porque Resend no permite llamadas directas desde el browser (CORS)
  const _proxyUrl='/api/send-email';
  const btn=document.querySelector('[onclick*="_sendQuoteEmail"]');
  if(btn){btn.disabled=true;btn.textContent='Enviando...';}
  try{
    const res=await fetch(_proxyUrl,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({resend_key:resendKey,from:fromAddr,to:clientEmail,subject,html,reply_to:agCfg.em||undefined})
    });
    const json=await res.json();
    if(!res.ok){toast('Error al enviar: '+(json.message||json.name||res.status),false);}
    else{
      toast('Email enviado a '+clientEmail);
      // Marcar como enviada automáticamente
      if(editingQuoteId){
        const dias=parseInt(agCfg?.validez_dias)||7;
        const vence=new Date();vence.setDate(vence.getDate()+dias);
        const fv=vence.toISOString().slice(0,10);
        try{
          const{data:row2}=await sb.from('cotizaciones').select('datos').eq('id',editingQuoteId).single();
          const rd2=typeof row2?.datos==='string'?JSON.parse(row2.datos):(row2?.datos||{});
          await sb.from('cotizaciones').update({estado:'enviada',datos:{...rd2,fecha_vencimiento:fv}}).eq('id',editingQuoteId);
        }catch(e2){}
      }
    }
  }catch(e){toast('No se pudo conectar con Resend: '+e.message,false);}
  finally{if(btn){btn.disabled=false;btn.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Enviar';}}
}
function collectFormSafe(){try{return collectForm();}catch(e){return qData||null;}}

// ═══════════════════════════════════════════
// EDIT FROM PREVIEW
// ═══════════════════════════════════════════
function _editFromPreview(){
  if(qData){
    formDraft=qData;
  }
  switchTab('form');
  if(editingQuoteId&&qData){
    setTimeout(()=>_showEditBanner(qData.refId||''),90);
  }
}

// ═══════════════════════════════════════════
// HISTORIAL
