# ermix — Contexto del proyecto v3.0 · Marzo 2026

## ¿Qué es ermix?
Plataforma SaaS de cotización de viajes para agentes freelance. Permite crear, guardar y exportar cotizaciones en PDF con múltiples secciones (vuelos, hotel, traslados, excursiones/tickets, autos, cruceros, seguros).

**Dueño:** Diego Lecler (Patoyro Travel / Spectro Travel)  
**Repo:** `mrlecler/cotizador-viajes`  
**Deploy:** GitHub Pages — `https://mrlecler.github.io/cotizador-viajes/`  
**Stack:** HTML + CSS + JS vanilla, Supabase (auth + DB), sin bundlers, sin npm

---

## Archivos clave

| Archivo | Descripción |
|---|---|
| `index.html` | Shell principal de la app |
| `styles.css` | Todos los estilos — variables CSS, layout, componentes |
| `js/app-core.js` | Auth Supabase, `buildWordmark()`, toggle tema dark/light |
| `js/app-form.js` | Formulario de cotización, autocomplete aeropuertos/ciudades |
| `js/app-quote.js` | Generación HTML cotización y PDF (`window.print()`) |
| `js/app-admin.js` | Panel admin (sin aerolíneas — esa sección fue eliminada) |
| `data/airports.json` | 915 aeropuertos con IATA, ciudad, país |
| `data/cities.json` | Ciudades del mundo |
| `contexto.md` | Este archivo — leer primero |
| `ermix-brand-assets-v2/ermix-brand-guidelines-v3.html` | **Referencia visual definitiva — leer antes de tocar cualquier CSS** |

---

## Brand v3 — Resumen ejecutivo

**Dirección:** Layla base + Thats photo headers · Light-first  
**Font:** DM Sans exclusivamente (ya importada). NUNCA Inter, NUNCA system fonts  
**Fondo:** `#F5F0E8` crema. NUNCA violeta, NUNCA negro puro  
**Acento:** Turquesa `#1B9E8F → #0BC5B8 → #06B6D4`  
**Dark bg:** `#0D120F` (verde oscuro, no negro puro)  
**Emojis:** CERO. Solo SVG Lucide (`stroke-width:1.8`, `stroke-linecap:round`, `stroke-linejoin:round`)

### Colores principales
```
--bg:       #F5F0E8   (crema, fondo de pantallas)
--surface:  #FFFFFF   (cards, inputs, sidebar, topbar)
--text:     #2D1F14   (texto principal)
--primary:  #1B9E8F
--primary2: #0BC5B8
--primary3: #06B6D4
--grad:     linear-gradient(135deg, #1B9E8F, #0BC5B8, #06B6D4)
```

### Pasteles por sección
```
Vuelos:              #E8F7F3  acc #1B9E8F
Alojamiento/Hotel:   #FFF8E3  acc #D4A017
Traslados:           #FFF0EC  acc #E8826A
Excursiones/Tickets: #FFF8E3  acc #D4A017
Alquiler de Autos:   #FFF0EC  acc #E8826A
Cruceros:            #E8F4FD  acc #0EA5E9
Asistencia/Seguro:   #F0EEF9  acc #9B7FD4
```

### Gradientes photo headers (fallback sin foto)
```
Vuelos:              #0EA5E9 → #1565C0
Alojamiento:         #FF8E53 → #E65100
Traslados:           #E8826A → #C2185B
Excursiones/Tickets: #43A047 → #1B5E20
Alquiler de Autos:   #FF8F00 → #E65100
Cruceros:            #0288D1 → #01579B
Asistencia/Seguro:   #9B7FD4 → #6D28D9
```

---

## Logo ermix

La forma X es custom (path SVG propio del v2) — **NO TOCAR EL PATH**.  
Solo cambiar los colores del gradiente en `buildWordmark()`:

```js
// Reemplazar en buildWordmark():
// ANTES (v2 violeta):  #4F46E5, #7C3AED, #F43F5E
// AHORA (v3 turquesa): #1B9E8F, #0BC5B8, #06B6D4
```

**Favicon:** SVG inline con la X del logo en gradiente turquesa. Fondo con `border-radius: 8px`.

---

## Sidebar

- **Colapsado:** `54px` fijo, solo íconos + tooltips CSS puro (`::after`)
- **Expandido:** `200px`, clase `sb open` — ícono + label de texto + avatar con nombre/agencia
- **Toggle:** botón ☰ (tres líneas) para abrir, ← (chevron) para cerrar
- Estado guardado en `localStorage('sb-open')`
- Contenido principal: `margin-left` animado `54px → 200px`, `transition: margin-left 0.22s ease`
- Ítem activo: `background: rgba(27,158,143,0.1)`, `stroke: #1B9E8F`

**Orden de ítems:**
1. Inicio
2. Cotizaciones (formulario)
3. Historial
4. Clientes
5. [separador]
6. Admin
7. [separador abajo]
8. Perfil (avatar)

---

## Pantallas

### Login
- Fondo: `var(--bg)` = `#F5F0E8`. **NUNCA violeta**
- Card centrada con `box-shadow: var(--sh2)`
- Logo con gradiente turquesa (buildWordmark)
- Botón Google con ícono SVG real
- Link "olvidé contraseña" en color primary

### Inicio (pantalla separada)
- Saludo "Hola, [nombre]" + strip de destinos frecuentes con fotos Unsplash
- Fallback gradiente si Unsplash falla (nunca imagen rota)
- CTA principal "Nueva cotización desde cero"
- 3 métricas: Cotizaciones (verde), Comisiones (amarillo), Conversión (púrpura)

### Formulario
- Cada sección es una card: `background: var(--surface)`, border, shadow, `overflow: hidden`
- **Photo header** de 60px: foto Unsplash o gradiente fallback + overlay `rgba(0,0,0,0.72)` to top
- Las fotos son **administrables desde Admin** (panel "Imágenes de secciones")
- Body de sección: fondo pastel del tipo, inputs **siempre blancos**
- Recuadro de precio al fondo de cada sección con gradiente del tipo
- Barra total al fondo: `background: var(--grad)` turquesa

### Vista previa / PDF
- Toolbar: thumbnail, botón Foto (Unsplash), botón Destino, botón × rojo, Editar, Guardar, PDF
- **Todos los botones turquesa o neutros. NINGÚN botón violeta**
- Portada: `linear-gradient(160deg, #0D2B1E, #0A1A12, #0D120F)` — verde esmeralda oscuro. NO negro puro
- Chip del cliente en turquesa semitransparente
- `window.print()` para generar PDF — no tocar

### Admin
- Sin sección Aerolíneas (eliminada)
- Secciones: Seguros, Proveedores, **Imágenes de secciones** (nueva)
- "Imágenes de secciones": el agente sube una foto por tipo de servicio → se guarda en Supabase → se usa como `background-image` del photo header

### Historial
- Cards con hover `translateY(-1px)` y `var(--sh2)`
- Badges: Confirmada (verde), Pendiente (amarillo), Borrador (gris)

### Mi Perfil
- Dos cards: "Datos del agente" y "Cambiar contraseña"
- `max-width: 720px`, `margin: 0 auto`
- Inputs siempre blancos

---

## Íconos SVG por sección (Lucide)

Todos con `stroke-width:1.8`, `stroke-linecap:round`, `stroke-linejoin:round`, `fill:none`:

```
Vuelos:        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
Alojamiento:   <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
Traslados:     <rect x="2" y="6" width="20" height="12" rx="2"/>
               <path d="M2 11h20M7 19v2M17 19v2M6 6V4M18 6V4"/>
Excursiones:   <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
               <path d="M13 5v2M13 17v2M13 11v2"/>
Autos:         <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.6A6 6 0 0 0 2 12.16V16h2"/>
               <circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
Cruceros:      <path d="M2 21c.6.5 1.2 1 2.5 1C7 22 7 21 9.5 21s2.5 1 5 1 2.5-1 5-1c1.3 0 1.9.5 2.5 1"/>
               <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.4.8 4.5 2.1 6.2"/>
Seguros:       <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
```

---

## Reglas absolutas — NUNCA hacer

- Emojis en cualquier parte de la UI
- Colores hardcodeados — siempre variables CSS
- Fondo violeta en el login o en cualquier pantalla
- Inputs con fondo crema/pastel (siempre blancos)
- Tocar el path SVG de la X del logo
- Tocar lógica Supabase auth o guardado de cotizaciones
- Tocar `window.print()`
- Tocar IDs de campos del formulario
- Tocar el sistema de autocomplete
- Tocar los cálculos automáticos
- Escribir "Ermix" — siempre "ermix" minúscula
- Logo blanco sobre fondo blanco/crema
- Usar npm, bundlers o librerías externas pesadas

---

## Dark mode

- Toggle guarda en `localStorage('theme')`, aplica `data-theme="dark"` en `<html>`
- `--bg: #0D120F` (verde oscuro, NO negro puro)
- `--surface: #141A16`
- `--surface2: #1B231D` (inputs en dark)
- `--text: #F0EDE6`
- Photo headers: igual que en light (la imagen o gradiente no cambia)
- Pasteles en dark: mismos colores con opacidad reducida (ver variables CSS en guidelines)

---

## Supabase

- RLS habilitado en `public.agentes`
- Function search path corregido en `public.set_updated_en`
- Leaked Password Protection: en pausa (requiere plan Pro)
- Las fotos de secciones se guardan en Supabase Storage o como URL en la tabla de configuración del agente

---

## Estado del proyecto · Marzo 2026

- Brand v3 aprobado y documentado en `ermix-brand-guidelines-v3.html`
- Reescritura frontend completa en curso
- Fase 1 SaaS (ermix.com, Cloudflare, Vercel, multi-tenancy, Stripe, Resend) — pendiente

---

*Última actualización: Marzo 2026 · Brand v3.0*
