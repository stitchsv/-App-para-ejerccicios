# Contexto del proyecto — App de seguimiento de entrenamiento

## Estado actual (actualizado 2026-08-15)

**Fase esquema + RLS: hecha.** El esquema completo (`exercises`, `routine_days`,
`routine_day_exercises`, `workout_sessions`, `session_sets`,
`body_measurements`, `cardio_sessions`) ya está corrido en el proyecto real de
Supabase (ref `utdyofyxdszqkebaenap`), con RLS activo y policy
`auth.uid() = user_id` en cada tabla. El SQL de creación + seed se compartió y
corrió directo en el SQL Editor de Supabase — **todavía no vive como archivo
de migración en este repo** (ver "Qué falta" más abajo).

**Fase frontend estructura: hecha.** `index.html` (raíz, redirige según
sesión) + `css/` + `js/` + `html/` con `login.html`, `dashboard.html` ("Hoy")
y `registrar-sesion.html`. Vanilla JS + Bootstrap 5 + `supabase-js` v2 vía
CDN, sin build tools, tal como decide el stack técnico.

**Fase auth/RLS + CRUD básico + registro de sesión: verificada end-to-end
contra Supabase real**, no solo revisada por código:
- Signup → confirmación de email → login → dashboard → registrar sesión,
  probado completo con un usuario de prueba real
  (`guzmanmoraneduardo+test@gmail.com`).
- El dashboard "Hoy" lee `routine_days`/`routine_day_exercises`/`exercises`
  reales (día de la semana mapeado correctamente: la BD usa 1=lunes...7=domingo,
  el frontend convierte desde `Date.getDay()`). Si un usuario no tiene rutina
  sembrada para hoy, cae a una rutina de referencia local (los mismos valores
  de este documento) en vez de romperse — pensado para desarrollo, no debería
  activarse una vez que todo usuario real tenga su rutina sembrada.
- El formulario de registro separa automáticamente ejercicios de fuerza/
  pliometría (guardan series peso×reps en `session_sets`) de cardio (guardan
  duración/distancia/FC en `cardio_sessions`), porque `session_sets.reps` es
  `not null` y no tiene columna de duración. Confirmado insertando datos
  reales y verificando que llegaron a las tablas correctas.
- RLS confirmado funcionando: un usuario nuevo sin rutina sembrada no ve datos
  de otros usuarios (dashboard cae al fallback local en vez de mostrar datos
  ajenos).
- Credenciales reales en `js/config.js` (gitignorado; plantilla en
  `js/config.example.js`), cargado antes de `js/supabaseClient.js` — el
  proyecto no usa bundler, así que el navegador no puede leer `.env`
  directamente.
- Dos bugs encontrados y corregidos durante la prueba: `registrar-sesion.js`
  volvía a pedir el usuario con `getUser()` dentro de `onSubmit` en vez de
  reusar el de `requireSession()` (crasheaba si el token rotaba entre cargar
  la página y enviar el formulario); y `session_date`/`cardio_date` se
  guardaban en UTC (`toISOString()`) en vez de fecha local, desalineando la
  sesión guardada con el día de rutina mostrado para la zona horaria de
  Centro de México por las noches.

**Sin empezar:** Historial, Editor de rutina, Gráficas (Chart.js), UI de
`body_measurements`, decisión de hosting. Ver "Qué falta" para más detalle.

## Qué se está construyendo

Una aplicación web personal (un solo usuario real por ahora, pero implementada
con autenticación y RLS "bien hecho" como práctica) para:

1. Definir una plantilla de rutina semanal fija (qué día toca qué grupos musculares
   y qué ejercicios/series objetivo).
2. Registrar cada sesión real de entrenamiento (peso, reps, series) y compararla
   contra el plan.
3. Visualizar progreso en el tiempo con gráficas: fuerza por ejercicio, volumen
   semanal por grupo muscular, consistencia (días entrenados vs. planeados),
   medidas corporales, y cardio.

## Stack técnico (decidido, no renegociar sin razón)

- **Backend/datos:** Supabase (Postgres + Auth + API REST autogenerada vía
  PostgREST). Row Level Security (RLS) activo en todas las tablas con datos
  del usuario.
- **Frontend:** HTML + Bootstrap 5 + JavaScript vanilla (sin framework tipo
  React/Vue). Cliente `supabase-js` para hablar directo con la base de datos
  desde el navegador.
- **Gráficas:** Chart.js.
- **Hosting:** estático — Netlify, Vercel o GitHub Pages (a decidir más adelante).
- **Autenticación:** Supabase Auth (email/password o magic link). Aunque el uso
  real es de un solo usuario, se implementa auth y RLS correctamente como
  ejercicio de práctica.

## Modelo de datos (implementado en Supabase; nombres de columna reales)

Ya no es borrador: este esquema está corrido y sembrado en el proyecto real.
Los nombres de columna reales (usados por el frontend) difieren un poco de
la descripción conceptual original — por ejemplo `routine_days.focus` (no
"enfoque"), `exercises.name` (no "nombre"), `workout_sessions.session_date`
(no "fecha"), `session_sets.weight_kg`/`reps`/`set_number` (no "peso"/"orden").
El SQL completo con esos nombres solo existe en el historial de esta
conversación y en la base real — no como archivo versionado (pendiente, ver
"Qué falta").

- `exercises` — catálogo de ejercicios: nombre, grupo muscular, tipo
  (fuerza / cardio / pliometría).
- `routine_days` — plantilla semanal fija (lunes = espalda/tríceps, martes =
  antebrazo/abdomen/cardio, etc.).
- `routine_day_exercises` — qué ejercicios van en cada día de la plantilla,
  con series objetivo (el "plan ideal").
- `workout_sessions` — cada sesión real: fecha, día de rutina asociado, notas
  generales (energía, contexto, ajustes del día).
- `session_sets` — detalle real por serie: ejercicio, peso, reps, RPE/sensación
  opcional. Aquí vive el progreso real.
- `body_measurements` (opcional) — circunferencia de antebrazo, bíceps, peso
  corporal, fecha. Relevante porque uno de los objetivos es estético
  (antebrazo/brazos).
- `cardio_sessions` — elíptica y carrera: duración, distancia, zona/frecuencia
  cardiaca si se mide.

Cada tabla con datos personales lleva columna `user_id` y policy de RLS
`auth.uid() = user_id`.

La relación clave del producto es **plan (`routine_day_exercises`) vs.
ejecución (`session_sets`)** — es el mismo ejercicio de comparar "lo que debía
hacer" contra "lo que realmente hice" que se ha estado haciendo manualmente
en la conversación (bajar peso, no completar series, mover días, etc.), ahora
automatizado.

## Pantallas / flujo esperado

1. Login/registro.
2. Dashboard/"Hoy" — qué día de rutina toca según la fecha, con ejercicios y
   series objetivo listos para registrar.
3. Registrar sesión — formulario rápido pensado para usarse desde el celular
   en el gimnasio (peso x reps por serie).
4. Historial — sesiones pasadas, filtrable por día/ejercicio/fecha.
5. Progreso/Gráficas (ver abajo).
6. Editor de rutina — para modificar la plantilla sin tocar código.

## Gráficas necesarias

- Progresión de fuerza por ejercicio (peso máximo o 1RM estimado en el tiempo).
- Volumen semanal por grupo muscular (barras), para verificar que antebrazo y
  bíceps mantienen la frecuencia 2 planeada.
- Consistencia: heatmap tipo calendario (días entrenados vs. planeados).
- Medidas corporales en el tiempo (línea).
- Cardio (duración/distancia de zona 2 en el tiempo).

## Contexto personal relevante para decisiones de producto

- Estudiante: sale de casa 6am, regresa 6pm. El tiempo es el recurso más
  limitado, más que la ganancia marginal de hipertrofia.
- Pierna fija el miércoles (no negociable). Corre los domingos (zona 2, ritmo
  suave).
- Frecuencia 1 en músculos grandes (pecho, espalda, pierna); frecuencia 2 en
  antebrazo (prioridad principal) y abdomen.
- Motivación de antebrazo: mejora funcional en agarre (dominadas, RDL, remos)
  y motivación estética (evitar verse "delgado de muñecas" con camisa).
- Sensible a fatiga acumulada: evita juntar pliometría con pierna o con la
  carrera del domingo sin margen de recuperación.
- Prefiere sesiones cortas e intensas (máx. 3 series por ejercicio en general,
  8-12 series por grupo grande) sobre maximizar volumen.

## Rutina actual de referencia (útil como datos semilla)

| Día | Enfoque | Ejercicios principales |
|---|---|---|
| Lunes | Espalda + Tríceps (pesado) | Remo con barra, Dominadas asistidas, Remo unilateral, Extensión de tríceps en polea |
| Martes | Antebrazo + Abdomen + Cardio (suave) | Curl inverso (polea), Curl de antebrazo, Crunch en polea, Elíptica |
| Miércoles | Pierna (pesado, fijo) | Sentadilla, Peso muerto rumano, Prensa, Curl femoral, Gemelos de pie |
| Jueves | Antebrazo + Abdomen + Cardio (suave) | Curl de muñeca (supino/prono), Crunch en polea (variante), Elíptica |
| Viernes | Pliometría + Hombro (ligero) | Saltos/Box jumps, Press militar con mancuernas, Elevaciones laterales |
| Sábado | Pecho + Bíceps (pesado) | Press inclinado, Fly con mancuernas, Fondos asistidos, Curl de bíceps, Curl martillo |
| Domingo | Correr (zona 2) | Carrera suave, opcional curl de muñeca ligero |

## Qué falta

- **Migraciones versionadas.** El esquema + seed viven en Supabase pero no en
  `supabase/migrations/*.sql` dentro del repo — si alguien reconstruye el
  proyecto desde cero, no hay fuente de verdad local del schema.
- **Usuario canónico.** El usuario original sembrado en la migración inicial
  (`v_user_id` de la primera corrida) quedó con password desconocida y sin
  poder resetearla por rate limit de email. Se sembraron los mismos datos
  para un segundo usuario de prueba (`guzmanmoraneduardo+test@gmail.com`) que
  sí funciona — falta decidir si ese es el usuario "real" definitivo o si se
  limpia/consolida más adelante.
- **Historial** — pantalla de sesiones pasadas filtrable por día/ejercicio/
  fecha. No existe todavía ni el archivo HTML ni el JS.
- **Editor de rutina** — pantalla para modificar `routine_days`/
  `routine_day_exercises` sin tocar SQL directo. No existe todavía.
- **Gráficas (Chart.js)** — ninguna de las 5 gráficas del plan está
  implementada; Chart.js ni siquiera está incluido en el proyecto todavía.
- **`body_measurements`** — la tabla existe con RLS, pero no hay ninguna
  pantalla ni formulario para leerla o escribirla.
- **Recuperación de contraseña** — el formulario de login no tiene flujo de
  "olvidé mi contraseña" (relevante porque ya se vivió el problema una vez).
- **Hosting** — sin decidir entre Netlify/Vercel/GitHub Pages; el proyecto
  solo se ha probado con un servidor estático local.
- **Confirmación de email** — el proyecto Supabase tiene confirmación de
  email activada por defecto con el mailer integrado, que tiene rate limit
  muy bajo (~2 emails/hora). Vale la pena decidir si se queda así, se
  desactiva (razonable para un proyecto de un solo usuario), o se configura
  SMTP propio más adelante.

## Cómo debe ayudar Claude en este proyecto

- Priorizar código simple y legible (vanilla JS, sin build tools innecesarios)
  sobre soluciones sofisticadas, salvo que se pida explícitamente lo contrario.
- Al proponer esquema SQL, entregarlo en formato de migraciones de Supabase
  (`supabase/migrations/*.sql`) con políticas RLS incluidas desde el inicio.
- Mantener consistencia con el modelo de datos y la rutina de referencia de
  este documento, y avisar explícitamente si una sugerencia se aparta de las
  decisiones ya tomadas aquí.
- Ir construyendo por fases (esquema → auth/RLS → CRUD básico → registro de
  sesión → gráficas), sin saltar a features avanzadas antes de tener lo básico
  funcionando.
