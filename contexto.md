# ermix (Magic Planner) — Contexto del Proyecto

## Quién soy
Soy Diego Lecler, agente de viajes freelance (Patoyro Travel) y Cloud Engineer.
No soy desarrollador. Implementá los cambios directamente en los archivos
del proyecto sin pedirme que lo haga yo.

## Stack técnico
- index.html — estructura principal
- styles.css — estilos globales
- /js/app-core.js — inicialización, auth, estado global, Supabase
- /js/app-form.js — formulario de cotización
- /js/app-quote.js — lógica de cálculo, precios y generación del PDF
- /js/app-admin.js — panel de administración
- /js/app-preview.js — vista previa de la cotización
- /js/app-history.js — historial de cotizaciones
- /js/app-ia.js — asistente IA integrado
- Supabase: jsgxoygyvibredxqyinj.supabase.co (auth + base de datos)
- Deploy: GitHub Pages → repo mrlecler/cotizador-viajes

## Principios de arquitectura
- Arquitectura multi-archivo separada del single-file original
- SIN pasos de build. Sin npm, webpack, ni bundlers. Todo funciona con archivos estáticos.
- Cada módulo JS es independiente pero comparte estado global definido en app-core.js
- Cualquier cambio en la base de datos debe ser compatible con el esquema Supabase existente
- Prioridad: que el código sea mantenible con asistencia IA, no que sea "elegante"

## Brand Guidelines — LEER ANTES DE TOCAR ESTILOS
El sistema visual de ermix está documentado en:
`ermix-brand-assets-v2/ermix-brand-guidelines-v2.html`

Antes de modificar cualquier estilo visual, leer ese archivo.
Las reglas no negociables son:

### Identidad
- El nombre siempre se escribe **ermix** — nunca "Ermix", "ERMIX" ni ninguna variante capitalizada
- La app es **dark-first** siempre. Fondo base: `#09000F`. Nunca negro puro ni blanco puro en la app.

### Logo y wordmark
- El wordmark se construye dinámicamente con JS usando DM Sans 900 + la X custom path:
  `M8 8 L8 18 L24.5 32 L8 46 L8 56 L20 56 L32 43.5 L44 56 L56 56 L56 46 L39.5 32 L56 18 L56 8 L44 8 L32 20.5 L20 8 Z`
- La X **NUNCA** se separa del texto "ermi". Son una sola palabra indivisible.
- No reemplazar el sistema dinámico de wordmark por texto SVG hardcodeado ni por imágenes.
- El ícono standalone (favicon, app icon) es solo la X con gradiente en contenedor cuadrado rx=25%.
- Assets disponibles en: `ermix-brand-assets-v2/` (SVG y PNG en múltiples tamaños)

### Tipografía
- **DM Sans** para todo — pesos 300 a 900
- **DM Mono** únicamente para: número de cotización (ref ID), códigos IATA, hex de colores, datos técnicos
- Nunca usar otras familias tipográficas

### Paleta de colores
```
--ink:          #09000F   /* fondo base */
--ink2:         #0F0018   /* cards y paneles */
--ink3:         #160024   /* hover states */
--violet:       #7C3AED   /* color primario */
--violet-mid:   #A855F7   /* hover, badges */
--violet-light: #C4B5FD   /* texto suave, chips */
--indigo:       #4F46E5   /* inicio del gradiente */
--coral:        #F43F5E   /* fin del gradiente */
--grad:         linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #F43F5E 100%)
--grad-text:    linear-gradient(90deg, #818CF8 0%, #A855F7 45%, #F43F5E 100%)
```
El gradiente se usa SOLO en: la X del wordmark, botón principal CTA y totales de precio.

### Componentes UI
- Íconos: SVG de Lucide, stroke `#A855F7`, stroke-width 1.5, 20×20px. **Nunca emoji como íconos de interfaz.**
- Botón primario: fondo `var(--grad)`, border-radius 10px, DM Sans 700
- Botón ghost: fondo transparente, border `rgba(255,255,255,.18)`, color white
- Cards: fondo `#0F0018`, border `rgba(255,255,255,.07)`, border-radius 12px
- Inputs: fondo `rgba(255,255,255,.04)`, border `rgba(255,255,255,.09)`, focus border `rgba(79,70,229,.55)`
- Labels de formulario: DM Sans 700, 9-10px, uppercase, letter-spacing 2-3px, color `rgba(255,255,255,.28)`

### Estados de cotización
```
Confirmada: background rgba(5,150,105,.12)  · color #34D399
Enviada:    background rgba(59,130,246,.12) · color #93C5FD
Borrador:   background rgba(255,255,255,.05) · color rgba(255,255,255,.4)
Cancelada:  background rgba(244,63,94,.1)   · color #FCA5A5
```

### PDF de cotización (app-quote.js)
- Dirección visual aprobada: **D — Dark cover + secciones con accent violeta**
- Portada: fondo `#09000F` + foto del destino `opacity:.45` + overlay gradiente to-bottom + grid geométrico sutil
- Cuerpo: fondo blanco `#FFFFFF`, secciones con border-left `3px solid #7C3AED` en tarjetas de vuelo
- Total: fondo `linear-gradient(135deg,#09000F,#1A0033)` + border-top gradiente ermix
- Footer agente: fondo blanco, avatar circular con gradiente ermix

## Estructura de assets de marca
```
ermix-brand-assets-v2/
├── ermix-brand-guidelines-v2.html   ← referencia visual completa
├── svg/                             ← vectoriales editables
├── png/transparent/                 ← PNG transparente (16-512px)
├── png/dark/                        ← PNG sobre #09000F
├── png/white/                       ← PNG sobre blanco
└── swatches/                        ← paleta exportable
```

## Idioma
Respóndeme siempre en español. El código puede tener comentarios en español o inglés.

## Cómo trabajar conmigo
- Implementá los cambios directamente en los archivos. No me expliques cómo hacerlo: hacelo.
- Antes de modificar un archivo, leelo completo para entender el contexto.
- Si un cambio toca múltiples archivos, modificá todos los necesarios en la misma tarea.
- Si encontrás un bug relacionado mientras trabajás, mencionámelo pero no lo corrijas sin avisarme.
- Cuando termines, decime exactamente qué archivos modificaste y qué cambió en cada uno.
- Si necesitás confirmarme algo antes de proceder, preguntame una sola cosa a la vez.
- Antes de modificar cualquier estilo, leer `ermix-brand-assets-v2/ermix-brand-guidelines-v2.html`.

## Convenciones de código
- Variables y funciones: camelCase en inglés
- IDs de HTML: kebab-case en inglés
- Comentarios de sección: en español está bien
- No introducir dependencias externas sin consultarme

## Contexto de negocio
ermix es una plataforma de cotización de viajes para agentes freelance y agencias
independientes. Permite cotizar, generar PDFs profesionales y gestionar clientes.
Los módulos manejan: servicios de viaje (vuelos, hoteles, traslados, excursiones,
asistencia), comisiones por servicio, historial de cotizaciones en Supabase,
generación de PDF y asistente IA. El sistema tiene roles: admin y agente.

## Seguridad — IMPORTANTE
- Nunca embeber la Supabase Service Role Key en ningún archivo del frontend
- El repositorio es público en GitHub — cualquier clave sensible es un riesgo crítico
- Solo usar la Supabase anon key para operaciones del cliente