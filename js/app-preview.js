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
  const rawPais=(gv('cfg-pais')||'').toUpperCase().trim().slice(0,3);
  const rawTheme=parseInt(document.getElementById('cfg-pdf-theme')?.value||'1')||1;
  agCfg={nm:gv('cfg-nm'),ag:gv('cfg-ag'),em:gv('cfg-em'),tel:gv('cfg-tel'),soc:gv('cfg-soc'),pais_cod:rawPais||'AR',pdf_theme:rawTheme};
  localStorage.setItem('mp_cfg',JSON.stringify(agCfg));
  window._agentePaisCod=agCfg.pais_cod;
  // Update in Supabase
  if(currentUser) sb.from('agentes').update({nombre:agCfg.nm||'',pais_cod:agCfg.pais_cod,pdf_theme:rawTheme}).eq('email',currentUser.email);
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
  [{id:'cfg-nm',k:'nm'},{id:'cfg-ag',k:'ag'},{id:'cfg-em',k:'em'},{id:'cfg-tel',k:'tel'},{id:'cfg-soc',k:'soc'},{id:'cfg-pais',k:'pais_cod'}].forEach(({id,k})=>{const e=document.getElementById(id);if(e&&agCfg[k])e.value=agCfg[k];});
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
// GALLERY MODAL
// ═══════════════════════════════════════════
const _GALLERY_LABELS=['Exterior','Habitación','Piscina','Áreas comunes','Restaurante','Vista'];
function openGalleryPanel(){
  const hoteles=(qData?.hoteles||[]).filter(h=>h.nombre);
  if(!hoteles.length){toast('Agregá hoteles al formulario primero.',false);return;}
  let html='';
  hoteles.forEach((h,hi)=>{
    const fotos=hotelPhotos[hi]||[];
    html+=`<div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border)">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">${h.nombre}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`;
    for(let fi=0;fi<6;fi++){
      const foto=fotos[fi];
      const lbl=foto?.label||_GALLERY_LABELS[fi]||('Foto '+(fi+1));
      html+=`<div>
        <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--g3);margin-bottom:4px">${lbl}</div>
        <div style="display:flex;align-items:center;gap:6px">
          ${foto?.url?`<img src="${foto.url}" style="height:36px;width:64px;object-fit:cover;border-radius:4px;border:1px solid var(--border2)">`:'<div style="height:36px;width:64px;border-radius:4px;border:2px dashed var(--border2)"></div>'}
          <input type="file" id="gf-${hi}-${fi}" accept="image/*" style="display:none" onchange="setHotelGalleryPhoto(${hi},${fi},'${_GALLERY_LABELS[fi]||('Foto '+(fi+1))}',this)">
          <input type="text" value="${lbl}" style="font-size:10px;padding:3px 7px;border:1px solid var(--border2);border-radius:5px;width:90px;color:var(--text);background:var(--surface)" onchange="setHotelGalleryLabel(${hi},${fi},this.value)" placeholder="Etiqueta">
          <button class="btn btn-out btn-xs" onclick="document.getElementById('gf-${hi}-${fi}').click()">+</button>
          ${foto?.url?`<button class="btn btn-del btn-xs" onclick="removeHotelGalleryPhoto(${hi},${fi})">✕</button>`:''}
        </div>
      </div>`;
    }
    html+=`</div></div>`;
  });
  document.getElementById('gallery-body').innerHTML=html;
  document.getElementById('gallery-modal').style.display='flex';
}
function closeGalleryModal(){document.getElementById('gallery-modal').style.display='none';}
function setHotelGalleryPhoto(hi,fi,defaultLabel,inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    if(!hotelPhotos[hi])hotelPhotos[hi]=[];
    hotelPhotos[hi][fi]={url:e.target.result,label:hotelPhotos[hi][fi]?.label||defaultLabel};
    openGalleryPanel();
    if(qData)renderPreview(qData);
  };
  r.readAsDataURL(f);
}
function setHotelGalleryLabel(hi,fi,label){
  if(!hotelPhotos[hi])hotelPhotos[hi]=[];
  if(!hotelPhotos[hi][fi])hotelPhotos[hi][fi]={url:'',label};
  else hotelPhotos[hi][fi].label=label;
}
function removeHotelGalleryPhoto(hi,fi){
  if(hotelPhotos[hi])hotelPhotos[hi][fi]=null;
  openGalleryPanel();
  if(qData)renderPreview(qData);
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
