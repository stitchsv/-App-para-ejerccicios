// Configuración del cliente de Supabase.
// Los valores reales viven en js/config.js (gitignorado, no en el repo).
// La anon key es segura de exponer en el frontend siempre que RLS esté activo
// en todas las tablas con datos de usuario. Este script debe cargarse
// después de js/config.js.

// Se usa el nombre `supabaseClient` (no `supabase`) para no chocar con el
// objeto global que expone el script UMD de @supabase/supabase-js cargado por CDN.
const supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
