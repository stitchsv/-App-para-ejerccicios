// Config real del proyecto. Se versiona a propósito (no es un secreto: la
// anon key está pensada para exponerse en el cliente y está protegida por
// RLS) — así el repo es deployable tal cual, sin build step ni variables de
// entorno. Ver js/config.example.js para la plantilla.
// SUPABASE_URL en .env trae el sufijo /rest/v1/ (endpoint REST); createClient
// espera la URL base del proyecto, así que se recorta aquí.
const SUPABASE_CONFIG = {
  url: 'https://utdyofyxdszqkebaenap.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZHlvZnl4ZHN6cWtlYmFlbmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MjY1NjIsImV4cCI6MjEwMjQwMjU2Mn0.Rlei4TaTg-Y05RD8fn_tO6gqAvvz22SH0_wA9BHrcJo',
};
