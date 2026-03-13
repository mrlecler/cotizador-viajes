# Magic Planner — Contexto del Proyecto

## Quién soy
Soy Diego Lecler, agente de viajes freelance (Patoyro Travel) y Cloud Engineer. No soy desarrollador. Necesito que implementes cambios directamente en los archivos del proyecto sin pedirme que lo haga yo.

## Stack técnico
- index.html — estructura principal
- styles.css — estilos globales
- /js/app-core.js — inicialización, auth, estado global, Supabase
- /js/app-form.js — formulario de cotización
- /js/app-quote.js — lógica de cálculo y precios
- /js/app-admin.js — panel de administración
- /js/app-preview.js — vista previa de la cotización
- /js/app-history.js — historial de cotizaciones
- /js/app-ia.js — asistente IA integrado
- Supabase: jsgxoygyvibredxqyinj.supabase.co (auth + base de datos)
- Deploy: GitHub Pages → repo mrlecler/cotizador-viajes

## Principios de arquitectura
- Arquitectura multi-archivo separada del single-file original
- SIN pasos de build. Sin npm, webpack, ni bundlers. Todo debe funcionar con archivos estáticos.
- Cada módulo JS es independiente pero comparte estado global definido en app-core.js
- Cualquier cambio en la base de datos debe ser compatible con el esquema Supabase existente
- Prioridad: que el código sea mantenible con asistencia IA, no que sea "elegante"

## Idioma
Respóndeme siempre en español. El código puede tener comentarios en español o inglés, lo que sea más claro.

## Cómo trabajar conmigo
- Implementá los cambios directamente en los archivos. No me expliques cómo hacerlo: hacelo.
- Antes de modificar un archivo, leelo completo para entender el contexto.
- Si un cambio toca múltiples archivos, modificá todos los necesarios en la misma tarea.
- Si encontrás un bug relacionado mientras trabajás, mencionámelo pero no lo corrijas sin avisarme.
- Cuando termines, decime exactamente qué archivos modificaste y qué cambió en cada uno.
- Si necesitás confirmarme algo antes de proceder, preguntame una sola cosa a la vez.

## Convenciones de código
- Variables y funciones: camelCase en inglés
- IDs de HTML: kebab-case en inglés  
- Comentarios de sección: en español está bien
- No introducir dependencias externas sin consultarme

## Contexto de negocio
Es un cotizador de viajes. Los módulos manejan: servicios de viaje (vuelos, hoteles, traslados, excursiones, asistencia), comisiones por servicio, historial de cotizaciones guardado en Supabase, generación de PDF, y un asistente IA. El sistema tiene roles: admin y agente.

## Seguridad — IMPORTANTE
- Nunca embeber la Supabase Service Role Key en ningún archivo del frontend
- El repositorio es público en GitHub — cualquier clave sensible es un riesgo crítico
- Solo usar la Supabase anon key para operaciones del cliente