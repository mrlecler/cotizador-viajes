# ermix — CLAUDE.md

Sos el desarrollador principal de **ermix**, una app SaaS de cotización de viajes para agentes freelance. Este archivo es tu fuente de verdad. Leelo completo antes de tocar cualquier archivo.

## Stack
- HTML + CSS + JS vanilla
- Supabase (auth + DB + Storage)
- Sin bundlers, sin npm, sin frameworks
- Deploy: GitHub Pages — `https://mrlecler.github.io/cotizador-viajes/`
- Versión actual: `0.23.1` — cache-bust `?v=32` en index.html

## Archivos principales

| Archivo | Qué hace |
|---|---|
| `index.html` | Shell principal |
| `styles.css` | Todos los estilos — variables CSS, layout, componentes |
| `js/config.js` | Entorno: `supabaseUrl`, `supabaseKey`, `env`, `version` |
| `js/app-core.js` | Auth Supabase, `buildWordmark()`, toggle dark/light, roles, `_captureError()`, profile dropdown, `dbSaveQuote()` |
| `js/app-form.js` | Formulario, autocomplete aeropuertos/ciudades, `saveQuote()`, autosave |
| `js/app-quote.js` | Generación HTML cotización y PDF (`window.print()`) |
| `js/app-admin.js` | Panel admin, activity log + error log, gestión de agentes/seguros, `renderAgency()` |
| `js/app-preview.js` | Vista previa de cotización, perfil de usuario, cambio de contraseña, link público (`_initPublicView()`) |
| `js/app-history.js` | Historial de cotizaciones, CRM clientes (`openClientModal()`), grupos de viaje |
| `js/app-ia.js` | Integración con Claude API para generar descripciones |
| `js/app-promos.js` | Gestión de promos |
| `data/airports.json` | 915 aeropuertos con IATA |
| `data/cities.json` | Ciudades del mundo |
| `ermix-brand-assets-v2/ermix-brand-guidelines-v4.html` | Referencia visual v4 Aurora Teal — leer si hay dudas de diseño |

## Reglas absolutas — NUNCA hacer esto

- ❌ Tocar lógica de Supabase auth (login, signup, session, OAuth)
- ❌ Tocar `dbSaveQuote()` sin verificar columnas reales de la tabla `cotizaciones`
- ❌ Tocar `window.print()`
- ❌ Tocar IDs de campos del formulario
- ❌ Tocar el sistema de autocomplete de aeropuertos/ciudades
- ❌ Tocar los cálculos automáticos de precios
- ❌ Tocar el path SVG de la X custom del logo ermix
- ❌ Hardcodear colores — siempre variables CSS (`var(--primary)`, etc.)
- ❌ Emojis en ningún lugar de la UI
- ❌ Escribir "Ermix" — siempre "ermix" en minúscula
- ❌ npm, bundlers, librerías externas pesadas
- ❌ Usar `window.coverUrl` o `window.logoUrl` — son `let` en `app-core.js`, no propiedades de `window`

## Brand v4 — Aurora Teal

### Principios v4
- **Glassmorphism** sobre fondos atmosféricos — cards con `backdrop-filter:blur(15px)`, bordes translúcidos
- **Plus Jakarta Sans** reemplaza DM Sans como fuente principal (DM Sans solo en `buildWordmark()` del logo, DM Mono para IATA)
- **CTA naranja** `#FF6B35` como acento de contraste para acciones de guardar/confirmar
- **Aurora glow** — resplandores sutiles de teal detrás de elementos clave
- **Border radius** 16px (era 14px)

### Variables CSS v4

```css
/* LIGHT MODE */
--bg:       #F5F0E8;   /* crema — fondo de TODA la app */
--surface:  #FFFFFF;   /* cards, inputs, sidebar, topbar */
--surface2: #EDE8DF;
--glass:    rgba(255,255,255,0.75);
--glass-blur: blur(15px);
--glass-border: 1px solid rgba(45,31,20,0.06);
--text:     #2D1F14;
--muted:    rgba(45,31,20,0.52);
--g1:       #EDE8DF;
--g2:       #E2DAD0;
--g3:       rgba(45,31,20,0.32);  /* labels uppercase */
--g4:       rgba(45,31,20,0.55);
--border:   rgba(45,31,20,0.07);
--border2:  rgba(45,31,20,0.13);
--sh:       0 4px 20px rgba(45,31,20,0.05);
--sh2:      0 8px 32px rgba(45,31,20,0.1);
--r:        16px;
--r2:       10px;
--primary:  #1B9E8F;
--primary2: #0BC5B8;
--primary3: #06B6D4;
--grad:     linear-gradient(135deg, #1B9E8F 0%, #0BC5B8 50%, #06B6D4 100%);
--cta:      #FF6B35;
--cta-hover:#E85A25;

/* DARK MODE — [data-theme="dark"] */
--bg:       #0D120F;   /* verde oscuro — NO negro puro */
--surface:  #141A16;
--surface2: #1B231D;
--glass:    rgba(11,197,184,0.06);
--glass-blur: blur(15px);
--glass-border: 1px solid rgba(11,197,184,0.08);
--text:     #F0EDE6;
--g3:       rgba(240,237,230,0.28);
--border:   rgba(255,255,255,0.07);
--border2:  rgba(255,255,255,0.13);
--sh:       0 4px 20px rgba(0,0,0,0.3);
--sh2:      0 8px 32px rgba(0,0,0,0.5);
```

### `.intro-bar` en dark mode
La clase `.intro-bar` usa `var(--grad)` (teal brillante) que contrasta mucho en dark mode. Ya hay override:
```css
[data-theme="dark"] .intro-bar { background: linear-gradient(135deg,#0D2B1E 0%,#0A1A12 50%,#112218 100%) }
[data-theme="dark"] .intro-bar::before { background: radial-gradient(circle,rgba(11,197,184,.12) 0%,transparent 70%) }
```

## Pasteles por sección de formulario

| Sección | Fondo | Acento | Gradiente header fallback |
|---|---|---|---|
| Vuelos | `#E8F7F3` | `#1B9E8F` | `#0EA5E9 → #1565C0` |
| Alojamiento | `#FFF8E3` | `#D4A017` | `#FF8E53 → #E65100` |
| Traslados | `#FFF0EC` | `#E8826A` | `#E8826A → #C2185B` |
| Excursiones/Tickets | `#FFF8E3` | `#D4A017` | `#43A047 → #1B5E20` |
| Alquiler de Autos | `#FFF0EC` | `#E8826A` | `#FF8F00 → #E65100` |
| Cruceros | `#E8F4FD` | `#0EA5E9` | `#0288D1 → #01579B` |
| Asistencia/Seguro | `#F0EEF9` | `#9B7FD4` | `#9B7FD4 → #6D28D9` |

En dark mode los pasteles usan los mismos colores con opacidad reducida (ej: `rgba(27,158,143,0.1)`).

## Íconos — SVG Lucide exclusivamente

Atributos obligatorios en todos los SVG: `fill="none"` `stroke-width="1.8"` `stroke-linecap="round"` `stroke-linejoin="round"`

```
Vuelos:      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
Alojamiento: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
Traslados:   <rect x="2" y="6" width="20" height="12" rx="2"/>
             <path d="M2 11h20M7 19v2M17 19v2M6 6V4M18 6V4"/>
Excursiones: <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
             <path d="M13 5v2M13 17v2M13 11v2"/>
Autos:       <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.6A6 6 0 0 0 2 12.16V16h2"/>
             <circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
Cruceros:    <path d="M2 21c.6.5 1.2 1 2.5 1C7 22 7 21 9.5 21s2.5 1 5 1 2.5-1 5-1c1.3 0 1.9.5 2.5 1"/>
             <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.4.8 4.5 2.1 6.2"/>
Seguros:     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
Usuario:     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
             <circle cx="12" cy="7" r="4"/>
```

## Logo ermix

- La forma X es un path SVG custom — **NO TOCAR EL PATH** (`M8 8 L8 18 L24.5 32...`)
- **NO TOCAR `buildWordmark()`** — usa DM Sans internamente para medir "ermi", no cambiar a Plus Jakarta Sans
- Colores del gradiente: `#1B9E8F → #0BC5B8 → #06B6D4` (sin cambio en v4)
- El wordmark va en el topbar superior
- En el sidebar NO va el ícono de la marca — solo el botón toggle y los ítems de nav

## Sidebar

- Colapsado: `54px`, solo íconos + tooltips CSS (`::after`)
- Expandido: `200px`, clase `#sidebar.open` — ícono + label + avatar con nombre/agencia
- Toggle: ☰ para abrir, ← para cerrar
- Estado en `localStorage('sb-open')`
- `margin-left` del contenido animado: `54px → 200px`, `transition: 0.22s ease`
- Ítems activos: `background: rgba(27,158,143,0.12)`, `box-shadow: inset 3px 0 0 var(--primary)`
- En mobile (`< 768px`): sidebar oculto, reemplazado por `#bottom-nav`

**Ítems reales del sidebar (por `data-role`):**

| Ítem | `data-tab` | Roles |
|---|---|---|
| Inicio | `inicio` | agente / agencia / admin |
| Cotizar | `form` | agente |
| Historial | `history` | agente |
| Clientes | `clients` | agente |
| Proveedores | `providers` | agente |
| Promociones | `promos` | agente |
| Promos vigentes | `promosvig` | agente |
| Mi Agencia | `agency` | agencia |
| Gestión | `dashboard` | admin |
| Soporte | `support` | agente / agencia / admin |
| Config | `adminconfig` | admin |

- El perfil/avatar (`#sb-prof-dd`, `#sb-avatar`) está al fondo del sidebar — **no es un ítem de nav**
- `#sb-prof-label` (nombre + rol + versión) se muestra/oculta por JS en `_sbToggle()` — `display:none` cuando colapsado
- **Admin se accede desde el dropdown del avatar** — no hay ítem directo de nav para admin
- El dropdown (`#sb-prof-menu.prof-dd`) se abre con `_toggleProfDD(event)` en `#sb-avatar`
- Dropdown contiene: nombre, badge rol, links a Admin/Mi perfil/Cerrar sesión (según `currentRol`)

**Bottom nav mobile (< 768px):**
```
Inicio | Cotizar | Historial | Clientes | Mi Agencia (agencia) | Soporte | Perfil
```
Clase activa: `.bnav-item.on`. La class `.bn-lbl` es mobile-only.

## Photo headers (secciones del formulario)

- Alto: `60px`, `overflow: hidden`, `position: relative`
- `background-image: url(photo_url)` + `background-size: cover; background-position: center`
- Si no hay foto → gradiente fallback (ver tabla arriba)
- Overlay siempre: `linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 60%)`
- Ícono + título + badge van con `position: relative; z-index: 1`

**Imágenes Unsplash por defecto:**
```
Vuelos:      https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80
Alojamiento: https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80
Traslados:   https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80
Excursiones: https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?w=800&q=80
Autos:       https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80
Cruceros:    https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&q=80
Seguros:     https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80
```

## Portada del PDF / Vista previa

- Fondo: `linear-gradient(160deg, #0D2B1E 0%, #0A1A12 50%, #0D120F 100%)` — verde esmeralda oscuro
- Todo el texto sobre fondo oscuro: blanco o `rgba(255,255,255,X)`
- Chip cliente: label chico lowercase gris, nombre grande turquesa
- Barra total: `background: var(--grad)`, texto blanco

## Link público del pasajero (`?q=<token>`)

Cuando la URL tiene `?q=<public_token>`, `_initPublicView()` en `app-preview.js` carga la cotización sin login.

**Datos embebidos en `datos` JSONB al guardar:**
```js
datos._cover_url      // URL de la foto de portada
datos._logo_url       // URL del logo del agente
datos._unsplash_credit // crédito de foto Unsplash
datos._agent          // { nm, ag, logo_url, tel, soc } — info del agente
```

**CRÍTICO — variable scope:**
En `app-core.js` línea 17: `let coverUrl = null, logoUrl = null` son **`let` variables**, NO propiedades de `window`.
- `window.coverUrl = url` crea una propiedad DIFERENTE — `buildQuoteHTML()` lee el `let`, no el `window`
- Siempre asignar directamente: `coverUrl = url` y `logoUrl = url` (sin `window.`)
- `_unsplashCredit` NO tiene `let` declarado — ese sí usa `window._unsplashCredit`

`_buildPublicWall()` en `app-preview.js`:
1. Asigna `coverUrl` y `logoUrl` (sin `window.`)
2. Si hay `_agent`, mergea en `agCfg` via `Object.assign`
3. Llama `buildQuoteHTML(d)` — que lee los `let` variables

## Print / PDF

```css
@media print {
  #bottom-nav, #bottom-nav.active,
  #form-sticky-bar, #prev-toolbar, #hdr,
  #sidebar, .sb { display: none !important; }
  #ui, #main-content, .cnt { margin-left: 0 !important; }
  body, #ui { padding: 0 !important; margin: 0 !important; }
}
```

**IMPORTANTE:** El bloque `@media print` FINAL en `styles.css` debe ser el **ÚLTIMO bloque del archivo**. Reglas mobile con `!important` agregadas después ganan por cascada y rompen el PDF.

## Modales

```css
.modal-overlay { background: rgba(45,31,20,0.4); backdrop-filter: blur(8px); }
.modal { background: var(--surface); border: 1px solid var(--border); box-shadow: 0 20px 60px rgba(45,31,20,0.15); }
/* SIN box-shadow violeta — eso es del brand v2, está eliminado */
```

**Mobile:** Los modales se convierten en bottom sheets en `< 768px`:
```css
.modal-overlay { align-items: flex-end !important; padding: 0 !important; }
.modal { width: 100% !important; border-radius: var(--r) var(--r) 0 0 !important; max-height: 85vh !important; }
```

## Glassmorphism (v4)

```css
.glass { background: var(--glass); backdrop-filter: var(--glass-blur); border: var(--glass-border); }
```
Usar `.glass` en cards que necesiten efecto frosted sobre fondos con contenido visible detrás. No abusar — solo donde agrega profundidad visual.

## Tipografía

- Font principal: `Plus Jakarta Sans` (reemplaza DM Sans desde v4)
- Font del logo (buildWordmark): `DM Sans` — **no cambiar**, el logo mide "ermi" con DM Sans
- Labels: `8-9px`, `font-weight: 700`, `letter-spacing: 2px`, `text-transform: uppercase`, `color: var(--g3)`
- Precios: `font-weight: 800`, `letter-spacing: -0.5px`, gradiente via `-webkit-background-clip: text`
- Monospace (IATA, refs): `DM Mono`

## Botón CTA naranja (v4)

```css
.btn-cta { background: #FF6B35; color: white; box-shadow: 0 4px 15px rgba(255,107,53,0.3); }
```
Usar para acciones de **guardar/confirmar**. El teal (`.btn-pri`) queda para acciones de navegación y estados activos.

## Clases CSS — trampas conocidas

**`.ok` vs `.com-ok`:**
La clase utilitaria `.ok` en `styles.css` tiene `background:#ECFDF5; border:1px solid #A7F3D0` — estilos de alerta de éxito.
NO usarla en `.dm-com-item-val`. Usar `.com-ok` que solo aplica `color:#22c55e`.
```css
.dm-com-item-val.com-ok { color: #22c55e }  /* sin background ni border */
.dm-com-item-val.ok { color: #22c55e }      /* LEGACY — igual al anterior, pero evitar */
```

## Funcionalidad IA

La API de Claude está en `https://api.anthropic.com/v1/messages`.
- Modelo: `claude-sonnet-4-20250514`
- La API key se guarda en Supabase por agente (campo en tabla `agentes`)
- Uso actual: botón "✦ Generar descripción" inline en el formulario — rellena el campo descripción del viaje con info turística del destino seleccionado

## Roles de usuario

Variable global `currentRol` en `app-core.js`: `'admin'` | `'agencia'` | `'agente'`

| Rol | Acceso |
|---|---|
| `admin` | Todo: admin panel, config global, ver todos los agentes, editar roles |
| `agencia` | Config agencia, ver cotizaciones de sus agentes, Mi Agencia, invitar hasta 3 agentes |
| `agente` | Sus propias cotizaciones, clientes, proveedores, promos, config PDF |

- El rol viene de `agentes.rol` en Supabase; se cachea en `localStorage('mp_rol')`
- `_applyRolUI()` en `app-core.js` muestra badge `ADMIN`/`AGENCIA` en header y arma el dropdown
- `isAdmin` (boolean legacy) se mantiene sincronizado con `currentRol==='admin'`
- Los ítems del sidebar se filtran por `data-role` — `_applyRolUI()` oculta los que no corresponden

## Sistema de error log (debug)

- `window._appLog` — array global de errores capturados en sesión (max 100)
- `_captureError(ctx, err)` — empuja al array y refresca el admin log si está abierto
- Se llama desde `dbSaveQuote`, `saveQuote`, y puntos clave de error
- El admin panel muestra errores de sesión (sección roja) + actividad en tabla horizontal con paginador (10/25/50)
- `loadAdminLog()` carga hasta 500 registros, pagina en JS con `_logPage`/`_logPageSize`/`_logData`

## Tab Agency (Mi Agencia)

- Panel `tab-agency` — accesible solo para `agencia` y `admin` desde sidebar (y desde dropdown del avatar)
- `renderAgency()` en `app-admin.js` — renderiza datos de agencia, agentes y proveedores
- 3 cards: Datos de agencia, Mis agentes, Proveedores
- Proveedores unificados: tipos expandidos (traslado, excursion, hotel, seguro, asistencia, DMC, receptivo, aerolinea, crucero, otro)

## CRM Clientes

- Modal con 5 tabs: Datos personales, Viaje, Documentos, Cotizaciones, Grupos
- `openClientModal()` en `app-history.js` genera modal tabulado con `_cliTab()` para switching
- `saveClient()` construye row dinámico — solo envía campos con valor para evitar errores de columna
- Documentos: upload a Storage bucket `documentos-clientes`, tabla `documentos_cliente`
  - `uploadClientDoc()`, `loadClientDocs()`, `downloadClientDoc()`, `deleteClientDoc()`
- Cotizaciones del cliente: `loadClientQuotes()` busca por `cliente_id` o match de nombre
- Grupos del cliente: `loadClientGroups()`, `removeFromGroup()`

## Grupos de Viaje

- Tabla `grupos_viaje` (id, nombre, agente_id, creado_en)
- Tabla `grupo_miembros` (id, grupo_id, cliente_id) — junction con cascade delete
- Sección en tab-clients debajo de la lista de clientes
- `renderGroups()` — renderiza lista de grupos con miembros
- `openGroupModal()` — modal con nombre + picker de miembros (checkboxes + buscador)
- `saveGroup()` — upsert grupo + sync miembros (delete all + re-insert)
- `deleteGroup()` — elimina grupo (cascade elimina miembros)

## Proveedores

- Panel `tab-providers` — accesible para `agente`
- Catálogo propio de proveedores del agente: hoteles, traslados, seguros, excursiones, aerolíneas, cruceros, etc.
- Se pueden cargar desde el formulario via "Desde catálogo" en cada sección

## Promos

- Panel `tab-promos` — carga/gestión de promociones del agente
- Panel `tab-promosvig` — promos vigentes (readonly, las de la agencia)
- `js/app-promos.js` — lógica de ambos panels

## Soporte

- Panel `tab-support` — accesible para todos los roles
- Formulario de contacto / ayuda

## Supabase

### Identidad — CRÍTICO
- **`agentes.id = auth.uid()` siempre** — la migración sincronizó todos los IDs (2026-03)
- **`window._agenteId = user.id`** se asigna sincrónicamente en `showApp()` como primera línea
- NUNCA buscar agente por email para obtener su id — usar `window._agenteId`
- RLS filtra automáticamente según rol — NO agregar filtros JS por `currentRol` en queries

### Modelo de datos
```
Admin (1)
  └── Agencias (N)  → tabla: public.agencias
        └── Agentes (N)  → tabla: public.agentes (agencia_id → agencias.id)
```

### Tablas principales
- **`agentes`**: `id` (= auth.uid()), `email`, `nombre`, `rol` (admin/agencia/agente), `activo`, `agencia_id` → `agencias.id`
- **`agencias`**: `id`, `nombre`, `email`, `telefono`, `direccion`, `logo_url`, `plan`, `max_agentes`, `activa`
- **`invitaciones`**: `id`, `email`, `nombre`, `rol`, `tipo` (invite/reset), `agencia_id`, `token`, `usado`, `creado_en`
  - Invitaciones pendientes viven acá — NO en `agentes.invite_token`
  - Al aceptar → `agentes.insert({id: auth.uid(), ...})` + `invitaciones.update({usado:true})`
- **`cotizaciones`**: columnas seguras: `id`, `ref_id`, `agente_id`, `cliente_id`, `destino`, `fecha_sal`, `fecha_reg`, `noches`, `pasajeros`, `estado`, `datos`, `creado_en`, `updated_at`, `grupo_id`
  - **`created_at` NO EXISTE** — la columna de fecha es `creado_en`
  - `total_comision` NO existe como columna — vive dentro del JSONB `datos`
  - Columnas inciertas (pueden no existir): `cover_url`, `precio_total`, `moneda`, `notas_int` — `dbSaveQuote` tiene fallback
  - `datos` JSONB embebe también: `_cover_url`, `_logo_url`, `_unsplash_credit`, `_agent` — para el link público
- **`clientes`**: campos expandidos (documento, doc_tipo, fecha_nac, nacionalidad, visa_*, ff_*, etc.) — `saveClient` solo envía campos con valor
- **`grupos_viaje`** + **`grupo_miembros`** — grupos de viaje con miembros
- **`documentos_cliente`** — documentos subidos (pasaporte, visa, voucher, seguro, etc.)

### Reglas de consulta
- RLS habilitado en todas las tablas — NO hacer upsert en `agentes` desde cliente (403)
- Usar `select('*')` — NO nombrar columnas individualmente (riesgo de 400 por columna inexistente)
- Storage buckets: fotos de secciones, logos de agencia, `documentos-clientes` (privado)
- NO modificar políticas RLS ni funciones de DB sin confirmar primero

### localStorage
- Config per-user: `mp_cfg_<uid>` (antes era `mp_cfg_<email>` — migración automática en primer login)
- Tema: `localStorage('theme')` — `'light'` | `'dark'`
- Sidebar: `localStorage('sb-open')` — `'1'` | `''`
- Rol: `localStorage('mp_rol')` — cache del rol del usuario

## Workflow para cada cambio

1. Leer el archivo afectado completo
2. Identificar el selector/función exacta a modificar
3. Confirmar qué vas a cambiar antes de aplicar
4. Aplicar el cambio mínimo necesario — no reescribir lo que funciona
5. Verificar que no rompiste nada relacionado
6. Hacer commit + push (producción en `master`, test en `claude/thirsty-spence`)
