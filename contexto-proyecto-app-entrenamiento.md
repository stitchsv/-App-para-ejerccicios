# Contexto del proyecto — App de seguimiento de entrenamiento

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

## Modelo de datos (borrador de tablas)

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
