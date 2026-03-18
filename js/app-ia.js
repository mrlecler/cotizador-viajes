async function processAI(){
  const txt=document.getElementById('raw-text').value.trim();
  if(!txt){showIAErr('Pegá tu cotización primero.');return;}
  const key=localStorage.getItem('mp_key')||'';
  if(!key){showIAErr('Guardá tu API Key primero.');return;}
  const btn=document.getElementById('btn-ai');
  btn.disabled=true;btn.innerHTML='<span class="spin" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(27,158,143,.25);border-top-color:#1B9E8F;border-radius:50%;vertical-align:middle"></span> Procesando...';
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
  finally{btn.disabled=false;btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B9E8F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg> Procesar con IA';}
}
function showIAErr(m){const e=document.getElementById('ia-err');e.textContent=m;e.style.display='';}
function saveKey(){localStorage.setItem('mp_key',document.getElementById('api-key').value.trim());toast('✓ API Key guardada');}

// ═══════════════════════════════════════════
// COVER & LOGO
