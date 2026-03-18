# ermix — Contexto del Proyecto
> Versión: 3.0 | Última actualización: Marzo 2026

---

## Qué es ermix

**ermix** es una plataforma SaaS de cotización de viajes para agentes freelance y agencias independientes. Permite crear cotizaciones profesionales con PDF, gestionar clientes, historial, dashboard y un asistente IA. El objetivo es democratizar el acceso a herramientas profesionales para agentes chicos que hoy trabajan con Excel y WhatsApp.

---

## Quién lo desarrolla

- **Diego Lecler** — agente de viajes freelance (Patoyro Travel) y Cloud Engineer
- No es desarrollador — trabaja con Claude Cowork para implementar cambios
- El repo es `mrlecler/cotizador-viajes` en GitHub
- Deploy actual: **GitHub Pages** en `https://mrlecler.github.io/cotizador-viajes/`

---

## Stack técnico actual

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JS vanilla (sin bundlers, sin npm) |
| Archivos | `index.html` + `styles.css` + módulos en `/js/` |
| Base de datos | Supabase (auth + DB + Storage) |
| Deploy | GitHub Pages → `mrlecler/cotizador-viajes` |
| Fotos de destinos | Unsplash API (proxy serverless pendiente) |
| Autocomplete hoteles | Google Places API (proxy serverless pendiente) |
| Datos | `/data/airports.json` (915 aeropuertos) + `/data/cities.json` |

> ⚠️ Vercel, Stripe, Resend y subdominios son de Fase 1 — aún no implementados.

---

## Archivos JS principales

| Archivo | Responsabilidad |
|---|---|
| `js/app-core.js` | Auth de Supabase, buildWordmark(), toggle dark/light, initTheme() |
| `js/app-form.js` | Formulario de cotización, autocomplete de aeropuertos y ciudades |
| `js/app-quote.js` | Generación del HTML de la cotización y PDF (window.print()) |
| `js/app-admin.js` | Panel admin: aerolíneas, proveedores, seguros, agentes |
| `js/app-clients.js` | Módulo de clientes / mini CRM |
| `js/app-profile.js` | Perfil del agente, cambio de contraseña |

---

## Brand Guidelines v3 — ACTIVO

> El archivo de referencia visual es: `ermix-brand-assets-v2/ermix-brand-guidelines-v3.html`
> (Reemplaza al v2. La carpeta se mantiene igual, solo el archivo HTML cambia.)

### Dirección de diseño
**Layla base + Thats photo headers**
- Light-first con dark mode secundario
- Fondo crema `#F5F0E8` (light) / verde oscuro `#0D120F` (dark)
- Cards pasteles por tipo de sección
- Photo headers con gradiente/color a sangrado completo en cada sección
- Tipografía: DM Sans exclusivamente (sin serif)
- **CERO emojis** — solo SVG Lucide en toda la UI

### Logo — cambio de color, NO de forma

⚠️ La X custom es la identidad de ermix. Su forma, path SVG y coordenadas NO se tocan.

**Instrucción para Cowork:**
1. Abrir `js/app-core.js` y leer `buildWordmark()` completa ANTES de tocar nada
2. Identificar los colores actuales del gradiente de la X (violeta/coral del v2)
3. Reemplazar SOLO esos hexadecimales por el gradiente turquesa:
   - `#4F46E5` → `#1B9E8F`
   - `#7C3AED` → `#0BC5B8`
   - `#F43F5E` → `#06B6D4`
4. NO modificar paths SVG, coordenadas, ni la tipografía "ermi"

### Colores principales

```css
--primary:   #1B9E8F;   /* Turquesa ermix — acento principal */
--primary2:  #0BC5B8;
--primary3:  #06B6D4;
--grad:      linear-gradient(135deg, #1B9E8F 0%, #0BC5B8 50%, #06B6D4 100%);

/* Fondos */
--bg:        #F5F0E8;   /* Crema base — light */
--surface:   #FFFFFF;
--surface2:  #EDE8DF;
--text:      #2D1F14;   /* Texto oscuro cálido */

/* Dark mode */
--bg-dark:   #0D120F;   /* Verde oscuro */
--surface-dark: #141A16;
```

### Colores por tipo de sección (pasteles)

| Sección | Fondo pastel | Color acento |
|---|---|---|
| Vuelos | `#E8F7F3` | `#1B9E8F` |
| Hoteles | `#FFF8E3` | `#D4A017` |
| Traslados | `#FFF0EC` | `#E8826A` |
| Seguros | `#F0EEF9` | `#9B7FD4` |
| Autos | `#FFF0EC` | `#E8826A` |
| Cruceros | `#E8F4FD` | `#0EA5E9` |
| Excursiones | `#FFF8E3` | `#D4A017` |

### Photo headers de sección (gradientes)

| Sección | Gradiente |
|---|---|
| Vuelos | `linear-gradient(135deg, #0EA5E9, #1565C0)` |
| Hoteles | `linear-gradient(135deg, #FF8E53, #E65100)` |
| Traslados | `linear-gradient(135deg, #E8826A, #C2185B)` |
| Excursiones | `linear-gradient(135deg, #43A047, #1B5E20)` |
| Autos | `linear-gradient(135deg, #FF8F00, #E65100)` |
| Cruceros | `linear-gradient(135deg, #0288D1, #01579B)` |
| Seguros | `linear-gradient(135deg, #9B7FD4, #6D28D9)` |

### Estructura de photo header

```html
<div class="sec-photo-hd" style="background: [GRADIENTE]">
  <div class="sec-photo-deco">
    <!-- SVG Lucide 32px, opacity 0.2, stroke white -->
  </div>
  <div class="sec-photo-bar">
    <div class="sec-photo-title">
      <!-- SVG Lucide 13px, stroke white + nombre sección -->
    </div>
    <div class="sec-photo-badge">BADGE</div>
  </div>
</div>
```

### Navegación — sidebar lateral

- Sidebar fijo de **54px** a la izquierda
- Logo `ermix` arriba (gradiente turquesa, 34×34px, border-radius 10px)
- Items de navegación: SVG Lucide, 38×38px, border-radius 10px
- Item activo: `background: rgba(27,158,143,0.1)`, `color: #1B9E8F`
- Avatar del agente (iniciales) abajo del todo
- El contenido principal tiene `margin-left: 54px`
- El menú horizontal superior (`#nav` con `.ntab`) está **eliminado**

### Tipografía

```css
font-family: 'DM Sans', sans-serif;
/* Pesos en uso: 400 (body), 500 (labels), 700 (titles), 800 (headings), 900 (metrics) */
/* DM Mono: solo para valores técnicos como códigos IATA, precios en PDF */
```

---

## Funcionalidades implementadas (Fase 0)

### Formulario de cotización
- **Secciones**: Vuelos (ida/vuelta), Hoteles, Traslados, Excursiones/Tickets, Seguros, Alquiler de Autos, Cruceros
- **Autocomplete**: aeropuertos (airports.json, 915 entradas) y ciudades (cities.json) desde 2 letras
- **Logos de aerolíneas**: CDN Google Flights `https://www.gstatic.com/flights/airline_logos/70px/{IATA}.png`
- **Cards de destinos populares**: franja horizontal al inicio del formulario
- **Cálculos automáticos**: noches por fechas, subtotales por sección, total general
- **Opciones A/B/C**: checkbox por ítem para incluir/excluir del total
- **Modo AUTO/MANUAL**: en campos de total y precio por persona

### Admin
- Aerolíneas (con código IATA)
- Proveedores
- Seguros (tabla `seguros` en Supabase)
- Agentes (invitación vía Supabase Dashboard, no Netlify)

### Mi Perfil
- Logo de la agencia (PNG/JPG, máx 500KB, 300×80px recomendado)
- Cambio de contraseña (`supabase.auth.updateUser()`)

### PDF / Vista de cotización
- Portada con foto del destino (Unsplash o carga manual)
- Nombre del cliente en portada y barra de datos
- Photo headers en cada sección (igual que el formulario)
- Logo de aerolínea en sección de vuelos
- Crédito de fotógrafo Unsplash (cuando aplica)
- Precio de cada ítem con recuadro brand (borde + fondo pastel + valor en gradiente)

### Dashboard
- 6 métricas con cards pastel por tipo
- SVG Lucide como íconos (sin emojis)

### Auth
- Login con email/password
- Login con Google (OAuth — `redirectTo: 'https://mrlecler.github.io/cotizador-viajes/'`)
- Toggle dark/light mode (persiste en localStorage como `ermix-theme`)

---

## Reglas absolutas de desarrollo

1. **CERO emojis** en la UI — solo SVG Lucide
2. **No tocar** la lógica de Supabase auth ni el sistema de guardado de cotizaciones
3. **No tocar** el esquema de base de datos existente (solo agregar campos si se documenta)
4. **No tocar** `window.print()` — es el sistema de generación de PDF
5. **No tocar** el sistema de `buildWordmark()` — solo adaptarlo al nuevo color turquesa
6. **Variables CSS siempre** — nunca colores hardcodeados en el CSS (usar `var(--primary)`, etc.)
7. **Archivos JS separados por módulo** — no mezclar responsabilidades
8. **Sin bundlers, sin npm** — todo vanilla JS, archivos estáticos

---

## Infraestructura planeada (Fase 1 — pendiente)

| Servicio | Uso | Estado |
|---|---|---|
| Vercel | Deploy + subdominios wildcard | ⏳ Pendiente |
| Cloudflare | Dominios ermix.com + ermix.app | ⏳ Pendiente |
| Stripe | Suscripciones + trial 7 días | ⏳ Pendiente |
| Resend | Emails transaccionales | ⏳ Pendiente |
| Supabase multi-tenancy | RLS + tenant_id | ⏳ Pendiente |

---

## Supabase — tablas principales

| Tabla | Descripción |
|---|---|
| `cotizaciones` | Cotizaciones con todos los datos en JSONB |
| `clientes` | Mini CRM del agente |
| `aerolineas` | Lista de aerolíneas con IATA |
| `proveedores` | Proveedores de traslados |
| `seguros` | Aseguradoras disponibles |
| `users` | Perfiles de agentes |

> Campo `share_token` (UUID) en cotizaciones para el link público al cliente — pendiente de implementar en Fase 3.

---

## Lo que NO existe todavía

- Vercel / subdominios — todo sigue en GitHub Pages
- Stripe — no hay suscripciones ni cobros
- Resend — no hay emails automáticos
- Vista pública del cliente (`/c/[token]`) — pendiente Fase 3
- Multi-tenancy (`tenant_id`) — pendiente Fase 1
- Mapa del recorrido — pendiente Fase 3
- Timeline de itinerario — pendiente Fase 3
