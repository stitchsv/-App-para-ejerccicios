// Configuración del cliente de Supabase.
// Reemplaza estos valores con los de tu proyecto (Settings > API en Supabase).
// La anon key es segura de exponer en el frontend siempre que RLS esté activo
// en todas las tablas con datos de usuario.
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY';

// Se usa el nombre `supabaseClient` (no `supabase`) para no chocar con el
// objeto global que expone el script UMD de @supabase/supabase-js cargado por CDN.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
