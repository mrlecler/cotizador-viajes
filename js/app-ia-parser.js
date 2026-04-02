// ═══════════════════════════════════════════
// IA PARSER — Cargar cotización desde texto libre
// Lee API key de localStorage('mp_ia_key'), llama Claude, pre-carga campos del formulario
// ═══════════════════════════════════════════

function openIAParserModal(){
  document.getElementById('modal-content').innerHTML=`
    <div style="font-weight:700;font-size:1rem;margin-bottom:4px">Cargar datos con IA</div>
    <div style="font-size:.78rem;color:var(--g4);margin-bottom:16px">Describi el viaje en lenguaje natural y la IA completara los datos disponibles. Los precios se pueden editar despues.</div>
    <textarea class="ftxt" id="ia-parser-input" rows="7" placeholder="Ej: Cotizacion para Clara Asis que viaja con su esposo e hijos de 4 y 8 anios a Miami del 20 al 30 de julio. Vuelo con American Airlines desde Ezeiza con escala en Dallas. Hotel Hilton Miami Beach. Traslado in/out. Seguro Assist Card." style="font-size:.85rem;line-height:1.5"></textarea>
    <div id="ia-parser-error" style="display:none;margin-top:8px;font-size:.78rem;color:#ef4444;font-weight:600"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-out" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-cta" id="ia-parser-btn" onclick="runIAParser()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg>
        Interpretar
      </button>
    </div>`;
  const box=document.getElementById('modal-box');
  if(box) box.style.maxWidth='600px';
  openModal();
  setTimeout(()=>document.getElementById('ia-parser-input')?.focus(),100);
}

async function runIAParser(){
  const key=localStorage.getItem('mp_ia_key')||localStorage.getItem('mp_key')||'';
  const errEl=document.getElementById('ia-parser-error');
  if(!key){
    errEl.textContent='La API Key de IA no esta configurada. Contacta al administrador.';
    errEl.style.display='';
    return;
  }
  const text=(document.getElementById('ia-parser-input')?.value||'').trim();
  if(!text){
    errEl.textContent='Escribi una descripcion del viaje.';
    errEl.style.display='';
    return;
  }
  errEl.style.display='none';
  const btn=document.getElementById('ia-parser-btn');
  const origHTML=btn.innerHTML;
  btn.innerHTML='<span class="spin spin-tq" style="width:14px;height:14px"></span> Interpretando...';
  btn.disabled=true;

  const systemPrompt=`Sos un asistente que extrae datos de cotizaciones de viaje desde texto en lenguaje natural.
Devolve SOLO un objeto JSON valido, sin texto adicional, sin markdown, sin explicaciones.
Si un dato no esta presente en el texto, omiti el campo (no uses null ni strings vacios).
Extrae unicamente lo que este explicitamente mencionado.

JSON esperado:
{
  "cliente": { "nombre": "", "adultos": 0, "ninos": 0, "infantes": 0 },
  "viaje": { "destino": "", "pais": "", "fecha_salida": "YYYY-MM-DD", "fecha_regreso": "YYYY-MM-DD" },
  "vuelos": [{ "tipo": "ida|vuelta", "origen": "", "destino": "", "aerolinea": "", "fecha": "YYYY-MM-DD", "hora_salida": "HH:MM", "hora_llegada": "HH:MM", "escala": "", "precio": 0 }],
  "hoteles": [{ "nombre": "", "ciudad": "", "checkin": "YYYY-MM-DD", "checkout": "YYYY-MM-DD", "habitacion": "", "regimen": "", "precio": 0 }],
  "traslados": [{ "tipo": "in|out|entre hoteles|privado", "origen": "", "destino": "", "fecha": "YYYY-MM-DD", "precio": 0 }],
  "seguros": [{ "nombre": "", "dias": 0, "precio": 0 }],
  "excursiones": [{ "nombre": "", "fecha": "YYYY-MM-DD", "precio": 0 }],
  "autos": [{ "proveedor": "", "categoria": "", "fecha_retiro": "YYYY-MM-DD", "fecha_devolucion": "YYYY-MM-DD", "precio": 0 }],
  "cruceros": [{ "naviera": "", "barco": "", "puerto_embarque": "", "fecha_embarque": "YYYY-MM-DD", "fecha_desembarque": "YYYY-MM-DD", "cabina": "", "precio_pp": 0, "pasajeros": 0 }]
}`;

  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':key,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:'claude-haiku-4-5-20251001',
        max_tokens:1500,
        system:systemPrompt,
        messages:[{role:'user',content:text}]
      })
    });

    if(!resp.ok){
      const code=resp.status;
      if(code===401){errEl.textContent='API Key de IA invalida.';errEl.style.display='';btn.innerHTML=origHTML;btn.disabled=false;return;}
      if(code===429){errEl.textContent='Limite de uso de IA alcanzado. Espera un momento.';errEl.style.display='';btn.innerHTML=origHTML;btn.disabled=false;return;}
      throw new Error('HTTP '+code);
    }

    const result=await resp.json();
    const content=result.content?.[0]?.text||'';
    // Extraer JSON — puede venir con ```json wrapper
    const jsonStr=content.replace(/^```json\s*/,'').replace(/```\s*$/,'').trim();
    let data;
    try{ data=JSON.parse(jsonStr); }catch(e){
      errEl.textContent='La IA no pudo interpretar el texto. Intenta reformularlo.';
      errEl.style.display='';
      btn.innerHTML=origHTML;btn.disabled=false;
      console.warn('[IAParser] JSON invalido:',content);
      return;
    }

    closeModal();
    _applyIAParser(data);
    toast('Datos cargados. Revisa y completa los precios.');

  }catch(e){
    console.error('[IAParser]',e);
    errEl.textContent='Error al conectar con la IA. Verifica tu conexion.';
    errEl.style.display='';
  }finally{
    btn.innerHTML=origHTML;
    btn.disabled=false;
  }
}

function _applyIAParser(data){
  const set=(id,val)=>{
    if(val===undefined||val===null||val==='') return;
    const el=document.getElementById(id);
    if(!el) return;
    el.value=String(val);
    // Disparar evento input/change para que los listeners se activen
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  };

  // ── Cliente ──
  if(data.cliente){
    set('m-nombre', data.cliente.nombre);
    set('m-adu', data.cliente.adultos);
    set('m-nin', data.cliente.ninos);
    set('m-inf', data.cliente.infantes);
  }

  // ── Viaje ──
  if(data.viaje){
    set('m-dest', data.viaje.destino);
    set('m-pais', data.viaje.pais);
    set('m-sal', data.viaje.fecha_salida);
    set('m-reg', data.viaje.fecha_regreso);
  }

  // ── Vuelos ──
  if(Array.isArray(data.vuelos)&&data.vuelos.length){
    // Asegurar que hay al menos un bloque de vuelo
    if(vc===0 && typeof addVuelo==='function') addVuelo();
    const v=data.vuelos;
    // Primer vuelo (ida) → bloque 1
    const ida=v.find(f=>f.tipo==='ida')||v[0];
    if(ida){
      const id=1;
      // Si hay ida y vuelta, poner modo ida/vuelta
      const vuelta=v.find(f=>f.tipo==='vuelta');
      if(vuelta){
        const modSel=document.getElementById('v'+id+'-mod');
        if(modSel){modSel.value='idavuelta';modSel.dispatchEvent(new Event('change',{bubbles:true}));}
      }
      set('v'+id+'-or', ida.origen);
      set('v'+id+'-de', ida.destino);
      set('v'+id+'-al', ida.aerolinea);
      set('v'+id+'-fs', ida.fecha);
      set('v'+id+'-hs', ida.hora_salida);
      set('v'+id+'-hl', ida.hora_llegada);
      set('v'+id+'-fl', ida.fecha_llegada);
      set('v'+id+'-esc', ida.escala);
      if(ida.precio) set('v'+id+'-pr', ida.precio);

      // Vuelta en el mismo bloque (modo ida/vuelta)
      if(vuelta){
        set('v'+id+'-or2', vuelta.origen);
        set('v'+id+'-de2', vuelta.destino);
        set('v'+id+'-al2', vuelta.aerolinea);
        set('v'+id+'-fs2', vuelta.fecha);
        set('v'+id+'-hs2', vuelta.hora_salida);
        set('v'+id+'-hl2', vuelta.hora_llegada);
        set('v'+id+'-fl2', vuelta.fecha_llegada);
        set('v'+id+'-esc2', vuelta.escala);
      }
    }
    // Vuelos adicionales (segmentos extra, no ida/vuelta)
    const extras=v.filter(f=>f!==ida&&f.tipo!=='vuelta');
    extras.forEach(f=>{
      if(typeof addVuelo==='function') addVuelo();
      const id=vc;
      set('v'+id+'-or', f.origen);
      set('v'+id+'-de', f.destino);
      set('v'+id+'-al', f.aerolinea);
      set('v'+id+'-fs', f.fecha);
      set('v'+id+'-hs', f.hora_salida);
      set('v'+id+'-hl', f.hora_llegada);
      set('v'+id+'-esc', f.escala);
      if(f.precio) set('v'+id+'-pr', f.precio);
    });
  }

  // ── Hoteles ──
  if(Array.isArray(data.hoteles)&&data.hoteles.length){
    data.hoteles.forEach((h,i)=>{
      // Primer hotel: usar bloque existente o crear uno
      if(i===0 && hc===0 && typeof addHotel==='function') addHotel();
      else if(i>0 && typeof addHotel==='function') addHotel();
      const id=i===0?1:hc;
      set('h'+id+'-nm', h.nombre);
      set('h'+id+'-ciu', h.ciudad);
      set('h'+id+'-ci', h.checkin);
      set('h'+id+'-co', h.checkout);
      set('h'+id+'-hab', h.habitacion);
      set('h'+id+'-reg', h.regimen);
      if(h.precio) set('h'+id+'-pr', h.precio);
    });
  }

  // ── Traslados ──
  if(Array.isArray(data.traslados)&&data.traslados.length){
    data.traslados.forEach(t=>{
      if(typeof addTraslado==='function') addTraslado();
      const id=tc;
      set('t'+id+'-or', t.origen);
      set('t'+id+'-de', t.destino);
      set('t'+id+'-fe', t.fecha);
      if(t.precio) set('t'+id+'-pr', t.precio);
      // Tipo de traslado
      if(t.tipo){
        const tipoMap={'in':'aeropuerto_hotel','out':'hotel_aeropuerto','entre hoteles':'entre_hoteles','privado':'privado'};
        set('t'+id+'-tipo', tipoMap[t.tipo]||t.tipo);
      }
    });
  }

  // ── Seguros/Asistencia ──
  if(Array.isArray(data.seguros)&&data.seguros.length){
    const s=data.seguros[0]; // Solo hay 1 bloque de seguro en el formulario
    if(s.nombre) set('seg-nm', s.nombre);
    if(s.dias) set('seg-dias', s.dias);
    if(s.precio) set('seg-precio', s.precio);
  }

  // ── Excursiones ──
  if(Array.isArray(data.excursiones)&&data.excursiones.length){
    data.excursiones.forEach(ex=>{
      if(typeof addExcursion==='function') addExcursion();
      const id=ec;
      set('e'+id+'-nm', ex.nombre);
      set('e'+id+'-fe', ex.fecha);
      if(ex.precio) set('e'+id+'-pr', ex.precio);
    });
  }

  // ── Autos ──
  if(Array.isArray(data.autos)&&data.autos.length){
    data.autos.forEach(a=>{
      if(typeof addAuto==='function') addAuto();
      const id=ac_cnt;
      set('au'+id+'-prov', a.proveedor);
      set('au'+id+'-cat', a.categoria);
      set('au'+id+'-fr', a.fecha_retiro);
      set('au'+id+'-fd', a.fecha_devolucion);
      if(a.precio) set('au'+id+'-pr', a.precio);
    });
  }

  // ── Cruceros ──
  if(Array.isArray(data.cruceros)&&data.cruceros.length){
    data.cruceros.forEach(c=>{
      if(typeof addCrucero==='function') addCrucero();
      const id=crc_cnt;
      set('cr'+id+'-nav', c.naviera);
      set('cr'+id+'-barco', c.barco);
      set('cr'+id+'-pe', c.puerto_embarque);
      set('cr'+id+'-fe', c.fecha_embarque);
      set('cr'+id+'-fd', c.fecha_desembarque);
      set('cr'+id+'-cab', c.cabina);
      if(c.precio_pp) set('cr'+id+'-pp', c.precio_pp);
      if(c.pasajeros) set('cr'+id+'-pax', c.pasajeros);
    });
  }

  // Recalcular noches en hoteles
  if(typeof _initNochesCalc==='function'){
    for(let i=1;i<=hc;i++){
      const ci=document.getElementById('h'+i+'-ci');
      if(ci) ci.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
}
