// ═══════════════════════════════════════════
// PROMOCIONES
// ═══════════════════════════════════════════

let _promos=[];

async function loadPromos(){
  const{data}=await sb.from('promociones').select('*').order('created_at',{ascending:false});
  _promos=data||[];
  return _promos;
}

function _promoImgUrl(p){
  if(p.imagen_url) return p.imagen_url;
  if(p.imagen_path){const{data}=sb.storage.from('promociones').getPublicUrl(p.imagen_path);return data?.publicUrl||'';}
  return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
}

function _promoCardHTML(p,showDelete=true){
  const img=_promoImgUrl(p);
  const dest=p.destino?`<span class="promo-chip">${p.destino}</span>`:'';
  const datos=p.datos||{};
  const pp=datos.precios?.por_persona;
  const cur=datos.precios?.moneda||'USD';
  const precioChip=pp?`<span class="promo-chip promo-chip-tq">Desde ${cur} ${Number(pp).toLocaleString('es-AR')}</span>`:'';
  const nights=(datos.hoteles||[]).reduce((acc,h)=>{
    if(h.checkin&&h.checkout){const diff=Math.round((new Date(h.checkout)-new Date(h.checkin))/86400000);return acc+(diff>0?diff:0);}
    return acc;
  },0);
  const nightChip=nights>0?`<span class="promo-chip">${nights} noche${nights>1?'s':''}</span>`:'';
  const delBtn=showDelete?`<button class="promo-card-del" onclick="event.stopPropagation();deletePromo('${p.id}')" title="Eliminar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`:'';
  return `<div class="promo-card" onclick="loadPromoIntoForm('${p.id}')" style="background-image:url('${img}')">
    <div class="promo-card-overlay"></div>
    ${delBtn}
    <div class="promo-card-body">
      <div class="promo-card-title">${p.titulo}</div>
      <div class="promo-card-chips">${dest}${nightChip}${precioChip}</div>
    </div>
  </div>`;
}

async function renderPromos(){
  const el=document.getElementById('promos-grid');
  if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:40px;color:var(--g3)"><span class="spin spin-tq"></span> Cargando...</div>';
  await loadPromos();
  if(!_promos.length){
    el.innerHTML=`<div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <p>Todavía no tenés promociones</p>
      <small>Armá una cotización tipo y guardala como Promoción desde el formulario</small>
      <button class="btn btn-pri" style="margin-top:16px" onclick="switchTab('form')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva cotización
      </button>
    </div>`;
    return;
  }
  el.innerHTML=_promos.map(p=>_promoCardHTML(p)).join('');
}

async function renderHomePromos(){
  const el=document.getElementById('home-promos-grid');
  if(!el)return;
  if(!_promos.length) await loadPromos();
  if(!_promos.length){
    el.innerHTML=`<div style="color:var(--g3);font-size:.82rem;padding:12px 0;grid-column:1/-1">Guardá tu primera promoción desde el formulario de cotización</div>`;
    return;
  }
  el.innerHTML=_promos.slice(0,3).map(p=>_promoCardHTML(p,false)).join('');
}

// ─── Modal guardar como promo ──────────────────────────────────────────────
function openSavePromoModal(){
  let currentData;
  try{currentData=collectForm();}catch(e){toast('Completá el formulario primero',false);return;}
  if(!currentData?.viaje?.destino){toast('Ingresá al menos un destino',false);return;}
  window._pendingPromoData=currentData;

  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:4px">Guardar como Promoción</div>
    <div style="font-size:.78rem;color:var(--g4);margin-bottom:20px">Los datos del cliente y pasajeros no se guardarán</div>
    <div class="fg"><label class="lbl">Título de la promoción</label>
      <input class="finput" id="pm-titulo" placeholder="Ej: Caribe 7 noches All Inclusive" value="${currentData.viaje?.destino||''}">
    </div>
    <div class="fg" style="margin-top:14px"><label class="lbl">Imagen de portada</label>
      <div class="promo-img-tabs">
        <button class="promo-img-tab on" id="pm-tab-url" onclick="_switchPromoImgTab('url')">URL de imagen</button>
        <button class="promo-img-tab" id="pm-tab-file" onclick="_switchPromoImgTab('file')">Subir desde disco</button>
      </div>
      <div id="pm-url-wrap">
        <input class="finput" id="pm-img-url" placeholder="https://images.unsplash.com/..." style="margin-top:8px">
      </div>
      <div id="pm-file-wrap" style="display:none;margin-top:8px;display:none">
        <label class="promo-upload-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Elegir imagen
          <input type="file" id="pm-img-file" accept="image/*" onchange="_previewPromoFile(this)" style="display:none">
        </label>
        <span id="pm-file-name" style="font-size:.75rem;color:var(--g4);margin-left:8px"></span>
      </div>
      <div id="pm-img-preview" style="margin-top:10px;display:none">
        <img id="pm-img-preview-el" style="width:100%;height:130px;object-fit:cover;border-radius:var(--r2);border:1px solid var(--border2)">
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-pri" onclick="savePromo()" id="pm-save-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Guardar promoción
      </button>
    </div>`;
  openModal();
  setTimeout(()=>{
    document.getElementById('pm-img-url')?.addEventListener('input',function(){
      const prev=document.getElementById('pm-img-preview');
      const img=document.getElementById('pm-img-preview-el');
      if(this.value.startsWith('http')){img.src=this.value;prev.style.display='block';}
      else prev.style.display='none';
    });
  },50);
}

function _switchPromoImgTab(mode){
  document.getElementById('pm-tab-url').classList.toggle('on',mode==='url');
  document.getElementById('pm-tab-file').classList.toggle('on',mode==='file');
  document.getElementById('pm-url-wrap').style.display=mode==='url'?'':'none';
  document.getElementById('pm-file-wrap').style.display=mode==='file'?'':'none';
}

function _previewPromoFile(input){
  const file=input.files[0];
  if(!file)return;
  document.getElementById('pm-file-name').textContent=file.name;
  const reader=new FileReader();
  reader.onload=e=>{
    const prev=document.getElementById('pm-img-preview');
    const img=document.getElementById('pm-img-preview-el');
    img.src=e.target.result;prev.style.display='block';
  };
  reader.readAsDataURL(file);
}

async function savePromo(){
  const titulo=document.getElementById('pm-titulo')?.value.trim();
  if(!titulo){alert('Ingresá un título');return;}
  const btn=document.getElementById('pm-save-btn');
  btn.disabled=true;btn.textContent='Guardando...';
  const d=window._pendingPromoData||{};
  // Strip client & personal data
  const datos=JSON.parse(JSON.stringify(d));
  if(datos.cliente) datos.cliente={nombre:'',celular:'',email:''};
  if(datos.precios){delete datos.precios.por_persona;delete datos.precios.total;delete datos.precios.res;delete datos.precios.cuotas;}
  delete datos.refId;delete datos.estado;delete datos.notas_int;datos.pax={};

  let imagen_url='',imagen_path='';
  const isFile=document.getElementById('pm-tab-file')?.classList.contains('on');
  if(isFile){
    const file=document.getElementById('pm-img-file')?.files[0];
    if(file){
      const ext=file.name.split('.').pop();
      const{data:ud}=await sb.auth.getUser();
      const path=`${ud.user.id}/${Date.now()}.${ext}`;
      const{error:ue}=await sb.storage.from('promociones').upload(path,file);
      if(!ue){imagen_path=path;const{data:purl}=sb.storage.from('promociones').getPublicUrl(path);imagen_url=purl?.publicUrl||'';}
    }
  } else {
    imagen_url=document.getElementById('pm-img-url')?.value.trim()||'';
  }

  const{data:ud2}=await sb.auth.getUser();
  const{error}=await sb.from('promociones').insert({titulo,destino:datos.viaje?.destino||'',datos,imagen_url,imagen_path,agente_id:ud2.user.id});
  btn.disabled=false;
  closeModal();
  if(error){toast('Error al guardar: '+error.message,false);return;}
  toast('Promoción guardada');
  _promos=[];
  if(document.getElementById('tab-promos')?.classList.contains('on')) renderPromos();
  renderHomePromos();
}

async function loadPromoIntoForm(id){
  const promo=_promos.find(p=>p.id===id);
  let datos;
  if(promo){datos=promo.datos;}
  else{
    const{data}=await sb.from('promociones').select('*').eq('id',id).single();
    if(!data){toast('No se encontró la promoción',false);return;}
    datos=data.datos;
  }
  formDraft=datos;
  switchTab('form');
  setTimeout(()=>{
    if(formDraft) restoreDraft(formDraft);
    formDraft=null;
    ['m-nombre','m-cel','m-email','m-adu','m-nin','m-inf','m-ref'].forEach(fid=>{const e=document.getElementById(fid);if(e)e.value='';});
    toast('Promoción cargada — completá los datos del cliente');
  },80);
}

async function deletePromo(id){
  if(!confirm('¿Eliminar esta promoción?'))return;
  const promo=_promos.find(p=>p.id===id);
  if(promo?.imagen_path) await sb.storage.from('promociones').remove([promo.imagen_path]);
  await sb.from('promociones').delete().eq('id',id);
  toast('Promoción eliminada');
  _promos=[];
  renderPromos();
  renderHomePromos();
}
