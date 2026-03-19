function uploadCover(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{coverUrl=e.target.result;updCovers();};r.readAsDataURL(f);}
function autoCover(){const dest=(document.getElementById('m-dest')?.value||qData?.viaje?.destino||'travel');coverUrl=`https://source.unsplash.com/1200x600/?${encodeURIComponent(dest+' travel')}&sig=${Date.now()}`;updCovers();}
function removeCover(){coverUrl=null;updCovers();}

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
// CONFIG
// ═══════════════════════════════════════════
function saveCfg(){
  agCfg={nm:gv('cfg-nm'),ag:gv('cfg-ag'),em:gv('cfg-em'),tel:gv('cfg-tel'),soc:gv('cfg-soc')};
  localStorage.setItem('mp_cfg',JSON.stringify(agCfg));
  // Update in Supabase
  if(currentUser) sb.from('agentes').update({nombre:agCfg.nm||''}).eq('email',currentUser.email);
  updateHeader();updateLogoPreview();
  const ok=document.getElementById('cfg-ok');ok.style.display='inline';setTimeout(()=>ok.style.display='none',2500);
}
async function changePassword(){
  const p1=document.getElementById('pw-new').value;
  const p2=document.getElementById('pw-conf').value;
  if(!p1||p1.length<6){toast('La contraseña debe tener al menos 6 caracteres',false);return;}
  if(p1!==p2){toast('Las contraseñas no coinciden',false);return;}
  const {error}=await sb.auth.updateUser({password:p1});
  if(error){toast(error.message,false);return;}
  document.getElementById('pw-new').value='';
  document.getElementById('pw-conf').value='';
  const ok=document.getElementById('pw-ok');
  if(ok){ok.style.display='inline';setTimeout(()=>ok.style.display='none',3000);}
  toast('Contraseña actualizada');
}
function loadCfg(){
  [{id:'cfg-nm',k:'nm'},{id:'cfg-ag',k:'ag'},{id:'cfg-em',k:'em'},{id:'cfg-tel',k:'tel'},{id:'cfg-soc',k:'soc'}].forEach(({id,k})=>{const e=document.getElementById(id);if(e&&agCfg[k])e.value=agCfg[k];});
}

// ═══════════════════════════════════════════
// PREVIEW & PRINT
// ═══════════════════════════════════════════
function buildAndPreview(){
  console.log('click buildAndPreview');
  try{qData=collectForm();renderPreview(qData);switchTab('preview');}
  catch(e){toast('Error al generar vista: '+e.message,false);console.error(e);}
}
function buildAndPrint(){
  console.log('click buildAndPrint');
  try{qData=collectForm();renderPreview(qData);switchTab('preview');setTimeout(doPrint,600);}
  catch(e){toast('Error al generar PDF: '+e.message,false);console.error(e);}
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
}

// ═══════════════════════════════════════════
// HISTORIAL
