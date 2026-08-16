# Contexto del proyecto — App de seguimiento de entrenamiento

## Estado actual (actualizado 2026-08-16, buscador + 3 de 5 gráficas)

**Buscador de ejercicios en vez de combobox largo.** Los `<select>` con
todos los ejercicios (Progreso, Editor de rutina, filtro de Historial) se
reemplazaron por `input` + `<datalist>` nativo de HTML — el navegador
filtra conforme se escribe, sin necesitar backend especial (PostgREST de
Supabase también soporta `ilike` si algún día hace falta filtrar en
servidor, pero con ~25-50 ejercicios el filtrado en cliente ya es
instantáneo). Como el valor de un `<datalist>` es el nombre visible, no un
id, cada página mantiene el catálogo cargado en memoria y resuelve
nombre → `exercise_id` al vuelo. Nota de testing: los clicks por coordenada
del navegador de previsualización se traban con el popup nativo del
datalist (típico de herramientas de automatización); se verificó disparando
eventos reales sobre los inputs en su lugar — no debería afectar el uso
normal en un navegador real.

**Gráficas — 3 de 5 hechas** (`html/progreso.html` + `js/progreso.js`,
ahora reestructurado como el hub único de "Progreso" con tres secciones):
- **Fuerza por ejercicio** (ya existía).
- **Consistencia** — heatmap de 8 semanas (grid CSS de 7 columnas, sin
  librería extra) comparando días *planeados* (el día de la semana tiene
  al menos un ejercicio en `routine_day_exercises`) contra días
  *entrenados* (existe `workout_sessions` esa fecha). Días futuros no
  cuentan en el % de consistencia aunque si hay sesión ese día sí se pintan
  como entrenados. Stat arriba: "X/Y días planeados cumplidos".
- **Medidas corporales** — como `body_measurements` no tenía ninguna UI
  todavía (ninguna forma de meterle datos), se agregó un formulario rápido
  de "nueva medición" (antebrazo/bíceps/peso) directo en esta sección, para
  que la gráfica sea probable de punta a punta y no un cascarón vacío
  permanente. Antebrazo y bíceps comparten eje Y (cm); peso usa un eje Y
  secundario (kg) porque las escalas no son comparables.

Bug de datos encontrado y corregido en el camino (no del código nuevo): la
primera sesión de prueba guardada (antes de arreglar el bug de fecha
UTC/local hace unas iteraciones) había quedado con `session_date` un día
adelantada; se corrigió el dato directo en Supabase para que el heatmap de
consistencia calculara bien.

Faltan 2 gráficas: volumen semanal por grupo muscular, cardio.

## Estado actual — buscador + primera gráfica (2026-08-16)

**Editor de rutina — responsive + filtro de catálogo.** La tabla de 8
columnas causaba scroll horizontal en pantallas angostas; se reemplazó por
un grid CSS (`.rde-row`/`.rde-header` en `css/style.css`) que en desktop se
ve como tabla y por debajo de 700px se apila en 2 columnas con etiqueta por
campo — verificado sin overflow a 375px, 408px y 1280px. El catálogo de
ejercicios (25 y creciendo) ahora tiene chips de filtro por grupo muscular
arriba de la lista en vez de mostrarla siempre completa.

**Gráficas — arrancó con "progresión de fuerza por ejercicio"
(`html/progreso.html` + `js/progreso.js`).** Chart.js vía CDN (sin build
tools, igual que el resto del stack). Selector de ejercicio (solo
`fuerza`/`pliometria` — cardio no tiene peso), gráfica de línea del peso
máximo levantado por fecha de sesión (consulta `session_sets` con join a
`workout_sessions` para la fecha, agrupa por fecha en cliente), más dos
stats simples arriba (PR histórico, peso de la última sesión). Colores de
la gráfica leídos de las variables CSS del sistema de diseño
(`getComputedStyle`), no hardcodeados, para no duplicar la paleta. Faltan
las otras 4 gráficas del plan (volumen semanal, consistencia, medidas
corporales, cardio) — quedan para después, mismo patrón.

Se agregó el link "Progreso" a la navegación de dashboard, historial y
editor de rutina.

## Estado actual — pase de diseño (actualizado 2026-08-16)

**Pase de diseño visual: hecho sobre las 5 pantallas** (login, dashboard,
registrar sesión, historial, editor de rutina). Dirección confirmada con el
usuario tras iterar sobre una propuesta inicial:

- **Dirección:** "workbench de gimnasio" — denso, oscuro, un solo acento,
  pensado para leerse rápido a mitad de una serie en el celular.
- **Paleta** (en `css/style.css` como variables CSS): base `#18181b`,
  tarjeta `#222225`, input `#101012` (más oscuro que su entorno — recibe
  contenido), texto `#e7e7e4` / muted `#8b8b8d` — todo neutro, sin sesgo
  cálido. Acento ámbar `#d98c3d` (usado con moderación: botones primarios y
  el estado "necesita tu atención"), verde `#6fa05e` solo para "logrado".
  **Iteración importante:** la primera propuesta tenía texto y base con tinte
  cálido además del acento ámbar, y el usuario correctamente señaló que todo
  "le jalaba al amarillo" — se corrigió neutralizando base/texto y dejando el
  ámbar como acento aislado, no como temperatura general de la paleta.
- **Signature del producto:** cada fila de serie en "Registrar sesión"
  muestra el objetivo del plan como texto fantasma (`objetivo: 3 series
  6-10 reps`) y el borde izquierdo de la fila pasa de gris a verde en vivo
  cuando se llenan las reps — la comparación plan-vs-ejecución, que es el
  concepto central del producto, ahora es visible mientras se registra, no
  solo después en el historial.
- **Detalles técnicos:** números (peso, reps, fechas, series) en fuente
  monospace con `font-variant-numeric: tabular-nums` vía clase `.stat` y
  `input[type=number]`, para que se lean como un dial y no salten de ancho.
  Profundidad solo por bordes sutiles y escalón de superficie, sin sombras.
  `<meta name="color-scheme" content="dark">` en todas las páginas para que
  los controles nativos (selector de fecha, flechas de `<select>`) también
  se vean oscuros.
- Bootstrap se sobreescribe vía variables CSS (`--bs-*`) en `:root` más
  overrides puntuales donde Bootstrap no cascadea bien (links, badges).
  No se usa `data-bs-theme` — la app tiene un solo tema fijo, no hay toggle
  claro/oscuro.
- Verificado visualmente con capturas de pantalla en las 5 páginas, más la
  interacción real de llenar una serie y ver el borde cambiar a verde.

## Estado actual — fases previas (actualizado 2026-08-16)

**Fase Historial + Editor de rutina: base funcional hecha y verificada
end-to-end** (el pase de diseño de la sección de arriba ya se aplicó también
aquí). Detalle:
- `html/historial.html` + `js/historial.js`: sesiones pasadas filtrables por
  fecha (desde/hasta), día de rutina y ejercicio. El filtro por ejercicio se
  resuelve en cliente (una sesión pasa si alguna de sus series usó ese
  ejercicio); fecha y día de rutina se filtran server-side.
- `html/editor-rutina.html` + `js/editor-rutina.js`: catálogo de ejercicios
  (listar + agregar nuevos) y, por cada uno de los 7 días ya sembrados,
  edición del enfoque/notas y CRUD de `routine_day_exercises` (agregar,
  editar targets inline, eliminar). No crea ni borra `routine_days` — los 7
  ya existen por el constraint `unique(user_id, day_of_week)` del seed.
- Bug real encontrado y corregido durante la prueba: el `<select>` de
  "agregar ejercicio" no tenía opción en blanco, así que un click accidental
  en "+" insertaba silenciosamente el primer ejercicio alfabético con targets
  vacíos. Se agregó una opción `-- elegir ejercicio --` por defecto.
- Verificado con operaciones reales contra Supabase (guardar fila, agregar,
  eliminar, editar enfoque de día, agregar ejercicio al catálogo), no solo
  revisión de código.
- Nota de testing: en esta sesión el click por coordenadas del navegador de
  previsualización no registraba de forma confiable (el panel no se estaba
  renderizando visualmente) — la verificación se hizo disparando eventos
  reales sobre los elementos (`.click()`) en vez de clicks por pixel.

## Estado actual — fases previas (actualizado 2026-08-15)

**Fase esquema + RLS: hecha.** El esquema completo (`exercises`, `routine_days`,
`routine_day_exercises`, `workout_sessions`, `session_sets`,
`body_measurements`, `cardio_sessions`) ya está corrido en el proyecto real de
Supabase (ref `utdyofyxdszqkebaenap`), con RLS activo y policy
`auth.uid() = user_id` en cada tabla. Versionado en
`supabase/migrations/20260815120000_initial_schema.sql` (schema) y
`supabase/migrations/20260816000000_seed_reference_routine.sql` (seed) —
estos archivos documentan lo que ya está corrido en Supabase, no se han vuelto
a ejecutar contra el proyecto real desde que se crearon (no hay CLI de
Supabase conectada todavía).

**Usuario oficial (por ahora):** `guzmanmoraneduardo+test@gmail.com`
(id `1a47dd9b-98ac-443f-9d19-ac3d1e7c3f5b`). Es el usuario con el que se
sembró la rutina y se probó todo el flujo end-to-end. El usuario original de
la primera corrida del seed quedó huérfano (password desconocida, sin poder
resetear por rate limit de email) — no tiene datos que migrar ni se usa en
ningún lado del código.

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

**Sin empezar:** 2 gráficas (volumen semanal, cardio), decisión de hosting.
Ver "Qué falta" para más detalle.

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

Ya no es borrador: este esquema está corrido y sembrado en el proyecto real,
y versionado en `supabase/migrations/`. Los nombres de columna reales (usados
por el frontend) difieren un poco de la descripción conceptual de abajo —
por ejemplo `routine_days.focus` (no "enfoque"), `exercises.name` (no
"nombre"), `workout_sessions.session_date` (no "fecha"),
`session_sets.weight_kg`/`reps`/`set_number` (no "peso"/"orden"). Para los
nombres exactos, revisar el SQL en `supabase/migrations/` directamente en vez
de esta descripción conceptual.

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

- **Gráficas (Chart.js) — 3 de 5 hechas.** Progresión de fuerza, consistencia
  y medidas corporales listas en `html/progreso.html`. Faltan: volumen
  semanal por grupo muscular (barras) y cardio (duración/distancia zona 2
  en el tiempo).
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
