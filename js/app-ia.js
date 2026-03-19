async function processAI(){
  const txt=document.getElementById('raw-text').value.trim();
  if(!txt){showIAErr('Pegá tu cotización primero.');return;}
  const key=localStorage.getItem('mp_key')||'';
  if(!key){showIAErr('Guardá tu API Key primero.');return;}
  const btn=document.getElementById('btn-ai');
  btn.disabled=true;btn.innerHTML='<span class="spin spin-tq"></span> Procesando...';
  document.getElementById('ia-err').style.display='none';
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:3500,system:SYS,messages:[{role:'user',content:txt}]})});
    const data=await res.json();
    if(data.error){
      const ec=data.error.type||'';
      if(ec==='overloaded_error')throw new Error('Los servidores de Anthropic están sobrecargados. Intentá nuevamente en unos minutos.');
      if(ec==='authentication_error')throw new Error('API Key inválida. Verificá tu clave en la sección IA.');
      if(ec==='permission_error'||data.error.message?.toLowerCase().includes('credit'))throw new Error('Créditos de Anthropic agotados. Recargá tu cuenta en console.anthropic.com.');
      if(data.error.message?.toLowerCase().includes('overload'))throw new Error('Los servidores de Anthropic están sobrecargados. Intentá en unos minutos.');
      throw new Error(data.error.message||'Error desconocido de la API');
    }
    qData=JSON.parse(data.content[0].text);
    if(qData.viaje?.destino&&!coverUrl)coverUrl=`https://source.unsplash.com/1200x600/?${encodeURIComponent(qData.viaje.destino+' travel')}&sig=${Date.now()}`;
    renderPreview(qData);switchTab('preview');
    toast('✓ Cotización estructurada correctamente');
  }catch(e){
    let msg=e.message||'Error desconocido';
    if(msg.includes('429')||msg.includes('Too Many'))msg='Límite de solicitudes alcanzado. Esperá un momento.';
    if(msg.includes('402')||msg.toLowerCase().includes('billing'))msg='Créditos de Anthropic agotados. Recargá en console.anthropic.com.';
    showIAErr(msg);
  }
  finally{btn.disabled=false;btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg> Procesar con IA';}
}
function showIAErr(m){const e=document.getElementById('ia-err');e.textContent=m;e.style.display='';}
function saveKey(){localStorage.setItem('mp_key',document.getElementById('api-key').value.trim());toast('✓ API Key guardada');}

// ═══════════════════════════════════════════
// GENERAR DESCRIPCIÓN TURÍSTICA CON IA
// ═══════════════════════════════════════════
async function generarDescIA(){
  const destEl=document.getElementById('m-dest');
  const descEl=document.getElementById('m-desc');
  const btn=document.getElementById('btn-ia-desc');
  const btnTxt=document.getElementById('btn-ia-desc-txt');
  if(!destEl||!descEl||!btn) return;

  const destino=destEl.value.trim();
  if(!destino){
    toast('Ingresá el destino primero.',false);
    destEl.focus();
    return;
  }
  const key=localStorage.getItem('mp_key')||'';
  if(!key){
    toast('Guardá tu API Key en la sección IA primero.',false);
    return;
  }

  // Si ya hay contenido — preguntar reemplazar o agregar
  let _modoAgregar=false;
  if(descEl.value.trim()){
    const _reemplazar=confirm('Ya hay una descripción. ¿Reemplazarla con la nueva generada por IA?\n(Cancelá para agregar al final)');
    _modoAgregar=!_reemplazar;
  }

  btn.disabled=true;
  btnTxt.textContent='Generando...';

  try{
    const prompt=`Genera una descripción turística de ${destino} para incluir en una cotización de viaje profesional. Incluí: clima ideal para visitar, principales atractivos, qué hace especial este destino. Máximo 3 párrafos cortos. Tono cálido y vendedor. En español.`;
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':key,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:600,
        messages:[{role:'user',content:prompt}]
      })
    });
    const data=await res.json();
    if(data.error){
      const ec=data.error.type||'';
      if(ec==='authentication_error') throw new Error('API Key inválida. Verificala en la sección IA.');
      if(ec==='overloaded_error') throw new Error('Servidor ocupado. Intentá en unos segundos.');
      throw new Error(data.error.message||'Error de la API');
    }
    const texto=(data.content?.[0]?.text||'').trim();
    if(!texto) throw new Error('La IA no devolvió texto.');

    // Insertar — reemplazar o agregar
    if(_modoAgregar){
      descEl.value=descEl.value.trimEnd()+'\n\n'+texto;
    } else {
      descEl.value=texto;
    }
    toast('Descripción generada correctamente.');
  }catch(e){
    toast('Error IA: '+(e.message||'intenta de nuevo'),false);
  }finally{
    btn.disabled=false;
    btnTxt.textContent='Generar descripción';
  }
}

// ═══════════════════════════════════════════
// COVER & LOGO
