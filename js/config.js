// ─────────────────────────────────────────────────────────
// ermix — Configuración de entorno
// La anon key de Supabase es publica por diseno — RLS protege los datos
// ─────────────────────────────────────────────────────────
const ERMIX_CONFIG = {
  supabaseUrl: 'https://jsgxoygyvibredxqyinj.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZ3hveWd5dmlicmVkeHF5aW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDQ5MTAsImV4cCI6MjA4ODcyMDkxMH0.oVIChImLTwew3w0gB2zolHlsdFyiM6W_xuiWlYdDDns',
  // PRODUCCION — master siempre queda en 'production'
  env: 'production',
  version: '25'
};
