function uploadCover(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{coverUrl=e.target.result;window._unsplashCredit=null;updCovers();};r.readAsDataURL(f);}
// Unsplash — key en localStorage, NUNCA en el repo
function _unsplashKey(){ return localStorage.getItem('mp_unsplash_key')||''; }
// Último crédito de foto Unsplash (para atribución)
window._unsplashCredit=null;

function autoCover(){
  const dest=(document.getElementById('m-dest')?.value||qData?.viaje?.destino||'travel');
  const key=_unsplashKey();
  if(!key){
    toast('Configurá tu Unsplash API Key en Mi Perfil',false);
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
        fetch(d.links.download_location+'?client_id='+key).catch(()=>{});
      }
      updCovers();
      _showUnsplashCredit();
    })
    .catch(e=>{
      console.warn('Unsplash API:',e.message);
      // Fallback: fotos curadas sin API
      const fallbacks=[
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1200&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=1200&h=600&fit=crop&q=80'
      ];
      coverUrl=fallbacks[Math.floor(Math.random()*fallbacks.length)];
      window._unsplashCredit=null;
      updCovers();
    });
}

function _showUnsplashCredit(){
  const c=window._unsplashCredit;
  if(!c) return;
  // Mostrar crédito debajo de la portada en preview
  const el=document.getElementById('unsplash-credit');
  if(el){
    el.innerHTML=`Foto de <a href="https://unsplash.com/@${c.username}?utm_source=ermix&utm_medium=referral" target="_blank" style="color:var(--primary)">${c.name}</a> en <a href="https://unsplash.com/?utm_source=ermix&utm_medium=referral" target="_blank" style="color:var(--primary)">Unsplash</a>`;
    el.style.display='';
  }
}
function removeCover(){coverUrl=null;window._unsplashCredit=null;updCovers();}

function uploadLogo(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{logoUrl=e.target.result;localStorage.setItem('mp_logo',logoUrl);updateLogoPreview();};r.readAsDataURL(f);}
function removeLogo(){logoUrl=null;localStorage.removeItem('mp_logo');updateLogoPreview();}
function updateLogoPreview(){
  const w=document.getElementById('logo-wrap'),b=document.getElementById('btn-rmlogo');
  if(logoUrl){w.innerHTML=`<img src="${logoUrl}" style="height:50px;max-width:160px;object-fit:contain;border-radius:8px;border:1px solid var(--g2);padding:5px;background:white">`;if(b)b.style.display='';}
  else{const ini=(agCfg.nm||'M')[0].toUpperCase();w.innerHTML=`<div style="width:48px;height:48px;background:linear-gradient(135deg,var(--amber),var(--sky));border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:1.1rem;color:white">${ini}</div>`;if(b)b.style.display='none';}
  updateHeader();
}
function updateHeader(){
  // El logo de agente solo aparece en el PDF — el header siempre muestra el wordmark ermix
  // buildWordmark() es llamado desde app-core.js en fonts.ready
  document.fonts.ready.then(function(){ buildWordmark('hdr-wm',22,'currentColor','grad'); });
}

// ═══════════════════════════════════════════
// API KEYS (localStorage only — never sent to server)
// ═══════════════════════════════════════════
function saveApiKeys(){
  const unsplash=document.getElementById('cfg-unsplash')?.value?.trim();
  if(unsplash) localStorage.setItem('mp_unsplash_key',unsplash);
  else localStorage.removeItem('mp_unsplash_key');
  const ok=document.getElementById('api-ok');
  if(ok){ok.style.display='inline';setTimeout(()=>ok.style.display='none',3000);}
  toast('API Keys guardadas');
}
function _loadApiKeyFields(){
  const el=document.getElementById('cfg-unsplash');
  if(el){
    const k=localStorage.getItem('mp_unsplash_key')||'';
    el.value=k;
  }
}

// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════
async function saveCfg(){
  const rawPais=(gv('cfg-pais')||'').toUpperCase().trim().slice(0,3);
  const rawTheme=parseInt(document.getElementById('cfg-pdf-theme')?.value||'1')||1;
  agCfg={nm:gv('cfg-nm'),ag:agCfg.ag||'',em:gv('cfg-em'),tel:gv('cfg-tel'),soc:gv('cfg-soc'),pais_cod:rawPais||'AR',pdf_theme:rawTheme};
  _saveAgCfg();
  window._agentePaisCod=agCfg.pais_cod;
  // Update in Supabase
  if(currentUser){
    const {error}=await sb.from('agentes').update({nombre:agCfg.nm||'',agencia:agCfg.ag||'',telefono:agCfg.tel||'',soc:agCfg.soc||'',pais_cod:agCfg.pais_cod,pdf_theme:rawTheme}).eq('email',currentUser.email);
    if(error){
      _captureError('saveCfg',error);
      toast('Error al guardar perfil: '+_friendlyError(error),false);
    }
  }
  updateHeader();updateLogoPreview();
  const ok=document.getElementById('cfg-ok');ok.style.display='inline';setTimeout(()=>ok.style.display='none',2500);
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
  [{id:'cfg-nm',k:'nm'},{id:'cfg-em',k:'em'},{id:'cfg-tel',k:'tel'},{id:'cfg-soc',k:'soc'},{id:'cfg-pais',k:'pais_cod'}].forEach(({id,k})=>{const e=document.getElementById(id);if(e&&agCfg[k])e.value=agCfg[k];});
  if(agCfg.pdf_theme) selectPdfTheme(agCfg.pdf_theme);
}

// ═══════════════════════════════════════════
// PDF THEME SELECTOR
// ═══════════════════════════════════════════
const _PDF_THEME_NAMES={1:'Turquesa ermix',2:'Azul marino',3:'Negro y dorado',4:'Verde selva',5:'Borgoña premium'};
function selectPdfTheme(n){
  n=parseInt(n)||1;
  const inp=document.getElementById('cfg-pdf-theme');
  if(inp)inp.value=n;
  document.querySelectorAll('.pdf-sw').forEach(b=>b.classList.toggle('pdf-sw-on',parseInt(b.dataset.t)===n));
  const lbl=document.getElementById('pdf-theme-lbl');
  if(lbl)lbl.textContent=_PDF_THEME_NAMES[n]||'';
  agCfg.pdf_theme=n;
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
  // Mostrar/ocultar crédito Unsplash
  const creditEl=document.getElementById('unsplash-credit');
  if(creditEl){
    if(window._unsplashCredit){
      _showUnsplashCredit();
    } else {
      creditEl.style.display='none';
    }
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

// ═══════════════════════════════════════════
// EDIT FROM PREVIEW
// ═══════════════════════════════════════════
function _editFromPreview(){
  // Bloquear si no es propietario
  if(window._viewingQuoteOwnerId && window._viewingQuoteOwnerId !== window._agenteId && currentRol !== 'admin'){
    toast('Solo podés ver esta cotización, no editarla',false);
    return;
  }
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
