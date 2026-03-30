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

function uploadLogo(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{logoUrl=e.target.result;agCfg.logo_url=logoUrl;localStorage.setItem('mp_logo',logoUrl);_saveAgCfg();updateLogoPreview();const uf=document.getElementById('cfg-logo-url');if(uf)uf.value='';};r.readAsDataURL(f);}
function removeLogo(){logoUrl=null;agCfg.logo_url=null;localStorage.removeItem('mp_logo');_saveAgCfg();updateLogoPreview();const uf=document.getElementById('cfg-logo-url');if(uf)uf.value='';}
function _logoUrlInput(url){url=(url||'').trim();if(!url){return;}logoUrl=url;agCfg.logo_url=url;localStorage.setItem('mp_logo',url);_saveAgCfg();updateLogoPreview();}
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
// API KEYS (localStorage only — never sent to server)
// ═══════════════════════════════════════════
function saveApiKeys(){
  // Unsplash — check both old (cfg-unsplash) and new (ak-unsplash) fields
  const unsplash=(document.getElementById('ak-unsplash')?.value||document.getElementById('cfg-unsplash')?.value||'').trim();
  if(unsplash) localStorage.setItem('mp_unsplash_key',unsplash);
  else localStorage.removeItem('mp_unsplash_key');
  // IA key
  const ia=(document.getElementById('ak-ia')?.value||'').trim();
  if(ia) localStorage.setItem('mp_ia_key',ia);
  else localStorage.removeItem('mp_ia_key');
  toast('API Keys guardadas');
}
function _loadApiKeyFields(){
  const k=localStorage.getItem('mp_unsplash_key')||'';
  const el1=document.getElementById('ak-unsplash');if(el1)el1.value=k;
  const el2=document.getElementById('cfg-unsplash');if(el2)el2.value=k;
  const iak=localStorage.getItem('mp_ia_key')||'';
  const el3=document.getElementById('ak-ia');if(el3)el3.value=iak;
}

// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════
async function saveCfg(){
  const rawPais=(gv('cfg-pais')||'').toUpperCase().trim().slice(0,3);
  agCfg.nm=gv('cfg-nm');agCfg.em=gv('cfg-em');agCfg.tel=gv('cfg-tel');agCfg.soc=gv('cfg-soc');agCfg.pais_cod=rawPais||'AR';
  _saveAgCfg();
  window._agentePaisCod=agCfg.pais_cod;
  // Logo URL desde campo (si cambió)
  const rawLogoUrl=(document.getElementById('cfg-logo-url')?.value||'').trim();
  if(rawLogoUrl){logoUrl=rawLogoUrl;agCfg.logo_url=rawLogoUrl;localStorage.setItem('mp_logo',rawLogoUrl);}
  // Update in Supabase — sin pdf_theme (se maneja solo en preview via localStorage)
  if(currentUser&&window._agenteId){
    const upd={nombre:agCfg.nm||'',telefono:agCfg.tel||'',soc:agCfg.soc||'',pais_cod:agCfg.pais_cod};
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
  // Profile card: adapt per role
  const cfgCard=document.getElementById('cfg-card-title')?.closest('.card');
  const ttl=document.getElementById('cfg-card-title');
  if(currentRol==='admin'){
    // Admin: only name, email, tel + password
    const hide=id=>{const el=document.getElementById(id);if(el)el.style.display='none';};
    hide('cfg-ag-wrap');
    hide('cfg-pais-wrap');
    hide('cfg-soc-wrap');
    if(ttl) ttl.textContent='Mi perfil de administrador';
  } else if(currentRol==='agencia'){
    // Agencia: hide entire profile card (managed in Mi Agencia), only password
    if(cfgCard) cfgCard.style.display='none';
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
      <div id="share-rls-info" style="display:none;background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.3);border-radius:10px;padding:12px 14px;font-size:.78rem;color:var(--text);line-height:1.6">
        <strong style="color:var(--cta)">Configurar RLS en Supabase</strong><br>
        Para que el link público funcione, ejecutá esta policy en Supabase SQL Editor:<br>
        <code id="share-rls-code" style="display:block;background:var(--surface2);border-radius:6px;padding:8px;margin-top:8px;font-family:'DM Mono',monospace;font-size:.72rem;white-space:pre-wrap;word-break:break-all"></code>
      </div>
      <button class="btn btn-out btn-xs" onclick="_showRlsInfo()" style="color:var(--muted);font-size:.75rem;margin-top:8px">Ver config RLS</button>
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
function _showRlsInfo(){
  const wrap=document.getElementById('share-rls-info');
  const code=document.getElementById('share-rls-code');
  if(!wrap||!code)return;
  const sql=`CREATE POLICY "public_token_read"\nON cotizaciones FOR SELECT\nUSING (datos->>'public_token' IS NOT NULL);`;
  code.textContent=sql;
  wrap.style.display=wrap.style.display==='none'?'':'none';
}
// Vista pública — se activa si hay ?q=TOKEN en la URL (sin login)
async function _initPublicView(){
  const params=new URLSearchParams(window.location.search);
  const token=params.get('q');
  if(!token)return false;
  // Reemplazar toda la UI por spinner
  document.body.innerHTML='<div id="pub-loading" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0D120F;color:#F0EDE6;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif;gap:16px"><div style="width:40px;height:40px;border:3px solid rgba(27,158,143,0.3);border-top-color:#1B9E8F;border-radius:50%;animation:spin .8s linear infinite"></div><p style="font-size:.9rem;color:rgba(240,237,230,0.6)">Cargando cotización...</p><style>@keyframes spin{to{transform:rotate(360deg)}}</style></div>';
  try{
    const{data,error}=await sb.from('cotizaciones').select('datos,estado,id').filter('datos->>public_token','eq',token).maybeSingle();
    if(error||!data){
      document.body.innerHTML=`<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D120F;color:#F0EDE6;font-family:'Plus Jakarta Sans',system-ui,sans-serif;text-align:center;padding:24px"><div><p style="font-size:1.1rem;font-weight:600;margin-bottom:8px">Cotización no encontrada</p><p style="font-size:.85rem;color:rgba(240,237,230,0.5)">El link puede haber expirado o no ser válido.</p></div></div>`;
      return true;
    }
    const d=typeof data.datos==='string'?JSON.parse(data.datos):data.datos;
    _buildPublicWall(d,data.estado,data.id,token);
  }catch(e){
    document.body.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D120F;color:#F0EDE6;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif"><p>Error al cargar la cotización.</p></div>';
  }
  return true;
}
function _buildPublicWall(d,estado,quoteId,token){
  if(typeof buildQuoteHTML!=='function'){setTimeout(()=>_buildPublicWall(d,estado,quoteId,token),200);return;}
  const html=buildQuoteHTML(d);
  const approved=estado==='aprobado';
  const approveBar=approved
    ?`<div style="position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#1B9E8F,#0BC5B8);color:white;text-align:center;padding:14px 20px;font-size:.9rem;font-weight:600;z-index:9999;font-family:'Plus Jakarta Sans',system-ui,sans-serif">Cotización aprobada</div>`
    :`<div style="position:fixed;bottom:0;left:0;right:0;background:rgba(13,18,15,0.95);backdrop-filter:blur(10px);border-top:1px solid rgba(27,158,143,0.2);padding:16px 20px;z-index:9999;font-family:'Plus Jakarta Sans',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap">
      <p style="color:rgba(240,237,230,0.7);font-size:.82rem;margin:0">¿Todo listo? Aprobá esta cotización</p>
      <button onclick="_publicApprove('${quoteId}','${token}')" style="background:linear-gradient(135deg,#1B9E8F,#0BC5B8);color:white;border:none;border-radius:10px;padding:10px 24px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',system-ui,sans-serif">Aprobar cotización</button>
    </div>`;
  document.body.innerHTML=`<div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;padding-bottom:80px">${html}</div>${approveBar}`;
}
async function _publicApprove(quoteId,token){
  const btn=document.querySelector('[onclick*="_publicApprove"]');
  if(btn){btn.disabled=true;btn.textContent='Aprobando...';}
  try{
    const{error}=await sb.from('cotizaciones').update({estado:'aprobado'}).filter('datos->>public_token','eq',token);
    if(error){alert('No se pudo aprobar. Intentá de nuevo.');if(btn){btn.disabled=false;btn.textContent='Aprobar cotización';}return;}
    const bar=btn?.closest('[style*="position:fixed"]');
    if(bar){bar.style.background='linear-gradient(135deg,#1B9E8F,#0BC5B8)';bar.innerHTML='<p style="color:white;font-weight:600;font-size:.9rem;margin:0;text-align:center;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif">Cotización aprobada</p>';}
  }catch(e){alert('Error al aprobar. Intentá de nuevo.');}
}

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
