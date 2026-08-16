# Contexto del proyecto — App de seguimiento de entrenamiento

> Este documento es la fuente de verdad para retomar el proyecto en una
> sesión nueva de Claude sin contexto previo. Está escrito como estado
> actual, no como bitácora — para el historial de cómo se llegó aquí, usa
> `git log` (cada commit es una unidad de trabajo verificada y explicada en
> su propio mensaje).

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
  del usuario. Proyecto real: ref `utdyofyxdszqkebaenap`.
- **Frontend:** HTML + Bootstrap 5 + JavaScript vanilla (sin framework tipo
  React/Vue, sin build tools). Cliente `supabase-js` v2 vía CDN para hablar
  directo con la base de datos desde el navegador.
- **Gráficas:** Chart.js vía CDN.
- **Hosting:** estático en **Vercel** — decidido, repo ya empujado a GitHub
  (`stitchsv/-App-para-ejerccicios`, rama `master`), deploy en Vercel todavía
  no confirmado por el usuario (ver "Qué falta").
- **Autenticación:** Supabase Auth (email/password). Aunque el uso real es de
  un solo usuario, se implementa auth y RLS correctamente como ejercicio de
  práctica.

## Estado actual — resumen ejecutivo

**Las 7 pantallas del flujo están construidas, con diseño visual aplicado, y
verificadas end-to-end contra el proyecto real de Supabase** (no solo
revisadas por código — cada feature se probó insertando/editando/borrando
datos reales y confirmando en la UI y/o directo en la base). Falta: 2 de 5
gráficas, y publicar el deploy en Vercel (ver "Qué falta" para el detalle
completo).

- **Esquema + RLS**: corrido y sembrado en Supabase, versionado en
  `supabase/migrations/`.
- **Auth completa**: login, registro, confirmación de email, y recuperación
  de contraseña.
- **CRUD de rutina y sesiones**: dashboard "Hoy", registrar sesión, historial
  filtrable, editor de rutina.
- **Gráficas**: 3 de 5 (fuerza por ejercicio, consistencia, medidas
  corporales) en una sola pantalla "Progreso".
- **Sistema de diseño propio** ("workbench de gimnasio") aplicado a las 8
  páginas, con favicon y pulido de hover/animaciones.
- **Buscador de ejercicios** (input + `<datalist>`) en vez de `<select>`
  largos, y tablas responsive (grid CSS, sin scroll horizontal) — auditado,
  sin pendientes de este tipo.

## Estructura del repo

```
index.html                    # entrada: redirige a html/dashboard.html o html/login.html según sesión
favicon.svg                   # barbell simple en el acento ámbar
css/style.css                 # todo el sistema de diseño (ver sección abajo)
js/
  config.js                   # credenciales reales de Supabase (versionado a propósito, ver nota abajo)
  config.example.js           # plantilla de config.js
  supabaseClient.js           # crea `supabaseClient` (createClient), depende de config.js
  auth.js                     # login/signup/logout/requireSession(), usado por todas las páginas protegidas
  routine-data.js             # DIAS_SEMANA, jsDayToDbDay(), getTodayRoutine() con fallback local
  dashboard.js                # lógica de html/dashboard.html
  registrar-sesion.js         # lógica de html/registrar-sesion.html
  historial.js                # lógica de html/historial.html
  editor-rutina.js            # lógica de html/editor-rutina.html
  progreso.js                 # lógica de html/progreso.html (3 gráficas)
  reset-password.js           # lógica de html/reset-password.html
html/
  login.html                  # login/registro/recuperar contraseña (3 modos en un formulario)
  dashboard.html               # "Hoy": rutina del día según fecha real
  registrar-sesion.html        # registro rápido de series (peso×reps) + cardio
  historial.html               # sesiones pasadas filtrables
  editor-rutina.html           # catálogo de ejercicios + CRUD de routine_day_exercises
  progreso.html                 # fuerza / consistencia / medidas corporales
  reset-password.html          # donde aterriza el link de recuperación de contraseña
supabase/migrations/
  20260815120000_initial_schema.sql       # las 7 tablas + RLS (documenta lo ya corrido en Supabase)
  20260816000000_seed_reference_routine.sql # catálogo + rutina de referencia para el usuario oficial
skills/SKILL.md               # skill "interface-design" del usuario — cargar antes de tocar CSS/UI
```

**Nota sobre `js/config.js`:** está versionado a propósito (no gitignorado).
Contiene la URL y anon key reales de Supabase, pero la anon key está
diseñada para exponerse en el cliente — la protege RLS, no es un secreto —
así que el repo es deployable tal cual en Vercel/Netlify/GitHub Pages sin
variables de entorno ni build step. `.env` sigue gitignorado (es solo un
respaldo de referencia, el código no lo lee).

## Modelo de datos

7 tablas, cada una con `user_id` + policy RLS `auth.uid() = user_id`:
`exercises`, `routine_days`, `routine_day_exercises`, `workout_sessions`,
`session_sets`, `body_measurements`, `cardio_sessions`. **Para los nombres
de columna exactos, leer `supabase/migrations/20260815120000_initial_schema.sql`
directamente** — no asumir desde el nombre conceptual (ej. es
`routine_days.focus` no "enfoque", `exercises.name` no "nombre",
`workout_sessions.session_date` no "fecha", `session_sets.weight_kg`/`reps`/
`set_number` no "peso"/"orden").

Puntos no obvios del esquema:
- `routine_days.day_of_week` va de **1 (lunes) a 7 (domingo)** — el frontend
  convierte desde `Date.getDay()` de JS (0=domingo) con `jsDayToDbDay()` en
  `js/routine-data.js`.
- `session_sets.reps` es `not null` y no tiene columna de duración — por eso
  los ejercicios de tipo `cardio` (Elíptica, Carrera suave) se guardan en
  `cardio_sessions` en vez de `session_sets`.
- `routine_day_exercises` tiene `target_sets`/`target_reps_min`/
  `target_reps_max` (fuerza) **o** `target_duration_minutes` (cardio) — no
  ambos a la vez normalmente.

La relación clave del producto es **plan (`routine_day_exercises`) vs.
ejecución (`session_sets`)** — comparar "lo que debía hacer" contra "lo que
realmente hice". Esa comparación es literal y visible en pantalla: en
"Registrar sesión", cada fila de serie muestra el objetivo del plan como
texto fantasma y el borde izquierdo pasa a verde en vivo al completarse.

**Usuario oficial (por ahora):** `guzmanmoraneduardo+test@gmail.com`
(id `1a47dd9b-98ac-443f-9d19-ac3d1e7c3f5b`). Es el único usuario con rutina
sembrada y con el que se probó todo el flujo. Hay un usuario huérfano de la
primera corrida del seed (password desconocida, sin poder resetear por rate
limit de email) — no tiene datos ni se usa en ningún lado del código, se
puede ignorar o borrar desde el dashboard de Supabase.

## Sistema de diseño — "workbench de gimnasio"

Dirección confirmada con el usuario (iterando sobre una propuesta inicial que
tiraba demasiado a cálido/amarillo — corregida a neutro con el ámbar como
único acento aislado). Denso, oscuro, sin adornos — pensado para leerse
rápido a mitad de una serie en el celular. Todo vive en `css/style.css` como
variables CSS, sobreescribiendo Bootstrap vía sus propias variables (`--bs-*`)
en `:root` más overrides puntuales donde Bootstrap no cascadea bien. No hay
`data-bs-theme` ni toggle claro/oscuro — un solo tema fijo.

- **Superficies** (escalón, sin sombras): base `#18181b` → tarjeta `#222225`
  → input `#101012` (más oscuro — recibe contenido, no un peldaño hacia arriba).
- **Texto**: primario `#e7e7e4`, muted `#8b8b8d` — neutros, sin sesgo cálido.
- **Acento único**: ámbar `#d98c3d` / `#e6a15c` (hover) — botones primarios y
  estado "necesita tu atención". Verde `#6fa05e` solo para "logrado". Nada
  más lleva color.
- **Números** (peso, reps, fechas, series) en fuente monospace con
  `font-variant-numeric: tabular-nums` (clase `.stat`, y `input[type=number]`
  globalmente) — se leen como un dial, no saltan de ancho.
- **Buscador de ejercicios**: `input` + `<datalist>` nativo (clase
  `.search-combo`) en vez de `<select>` largos — el navegador filtra
  conforme se escribe, sin backend especial.
- **Tablas responsive**: grid CSS (`.rde-row`/`.rde-header`), no `<table>` —
  se ve como tabla en desktop y se apila en 2 columnas con etiqueta por
  campo por debajo de 700px. No hay ningún `<table>` en el proyecto.
- **Movimiento**: transiciones de 0.15s en botones/links/chips/inputs,
  `.btn:active { scale(0.98) }`, hover con `scale(1.15)` en el heatmap,
  `@media (prefers-reduced-motion: reduce)` apaga los `transform`.
- **`<meta name="color-scheme" content="dark">`** en las 8 páginas para que
  los controles nativos (selector de fecha, flechas de `<select>`) también
  se vean oscuros.

Si se va a tocar CSS o construir UI nueva, cargar `skills/SKILL.md`
(skill `interface-design` del usuario) antes de empezar.

## Pantallas

| # | Pantalla | Archivo | Estado |
|---|---|---|---|
| 1 | Login/registro/recuperar contraseña | `html/login.html` + `html/reset-password.html` | Hecho, verificado |
| 2 | Dashboard "Hoy" | `html/dashboard.html` | Hecho, verificado |
| 3 | Registrar sesión | `html/registrar-sesion.html` | Hecho, verificado |
| 4 | Historial | `html/historial.html` | Hecho, verificado |
| 5 | Progreso/Gráficas | `html/progreso.html` | 3 de 5 gráficas |
| 6 | Editor de rutina | `html/editor-rutina.html` | Hecho, verificado |

### Gráficas (dentro de `html/progreso.html`, 3 secciones en una sola página)

- ✅ **Fuerza por ejercicio** — línea de peso máximo por fecha de sesión,
  selector de ejercicio con buscador, stats de PR y última sesión.
- ✅ **Consistencia** — heatmap de 8 semanas (grid CSS de 7 columnas, sin
  librería) comparando días *planeados* (`routine_day_exercises` tiene algo
  ese día de la semana) contra *entrenados* (`workout_sessions` existe esa
  fecha). Stat: "X/Y días planeados cumplidos".
- ✅ **Medidas corporales** — como `body_measurements` no tenía ninguna UI,
  se agregó un formulario rápido de "nueva medición" ahí mismo. Antebrazo y
  bíceps comparten eje Y (cm), peso corporal usa eje Y secundario (kg).
- ❌ **Volumen semanal por grupo muscular** (barras) — no empezada.
- ❌ **Cardio** (duración/distancia zona 2 en el tiempo) — no empezada.

## Qué falta

- **Deploy en Vercel** — decidido, repo ya en GitHub y listo (config.js
  versionado, cero build step necesario). Falta que el usuario conecte el
  repo en vercel.com (Framework Preset: "Other", sin build/install command,
  Output Directory `.`) y confirme la URL resultante.
- **Redirect URL de recuperación en Supabase** — una vez exista la URL de
  Vercel, agregar `https://<esa-url>/html/reset-password.html` en
  Authentication → URL Configuration → Redirect URLs (y también la de
  localhost si se sigue probando local). Sin esto, `resetPasswordForEmail`
  no funciona en producción aunque el código esté listo.
- **2 gráficas** — volumen semanal por grupo muscular, cardio.
- **Confirmación de email** — el proyecto Supabase tiene confirmación de
  email activada por defecto con el mailer integrado, que tiene rate limit
  muy bajo (~2 emails/hora, ya se topó ese límite una vez). Vale la pena
  decidir si se queda así, se desactiva (razonable para un proyecto de un
  solo usuario), o se configura SMTP propio.

## Notas de testing (para no rediscobrir esto en cada sesión)

- El navegador de previsualización a veces no renderiza visualmente el panel
  (falla `screenshot` con "pane is not displayed") y los clicks por
  coordenada a veces no registran o se traban con popups nativos (como el
  de `<datalist>`). Cuando pase, verificar disparando eventos reales sobre
  los elementos vía `javascript_tool` (`el.click()`, `dispatchEvent(new
  Event('input'/'change', {bubbles:true}))`) en vez de insistir con clicks
  por pixel — funciona igual de bien para probar la lógica real.
- El emailer integrado de Supabase tiene rate limit bajo (~2/hora). Probar
  `resetPasswordForEmail`/signup con un email inexistente no cuenta contra
  el límite (Supabase no revela si el usuario existe, así que no manda
  correo) — útil para probar sin gastar cupo.
- Al insertar/editar datos de prueba directo en Supabase durante testing,
  limpiarlos después (se ha hecho consistentemente) para no dejar filas
  fantasma que luego confundan cálculos como el heatmap de consistencia.

## Rutina actual de referencia (datos semilla)

| Día | Enfoque | Ejercicios principales |
|---|---|---|
| Lunes | Espalda + Tríceps (pesado) | Remo con barra, Dominadas asistidas, Remo unilateral, Extensión de tríceps en polea |
| Martes | Antebrazo + Abdomen + Cardio (suave) | Curl inverso (polea), Curl de antebrazo, Crunch en polea, Elíptica |
| Miércoles | Pierna (pesado, fijo) | Sentadilla, Peso muerto rumano, Prensa, Curl femoral, Gemelos de pie |
| Jueves | Antebrazo + Abdomen + Cardio (suave) | Curl de muñeca (supino/prono), Crunch en polea (variante), Elíptica |
| Viernes | Pliometría + Hombro (ligero) | Saltos/Box jumps, Press militar con mancuernas, Elevaciones laterales |
| Sábado | Pecho + Bíceps (pesado) | Press inclinado, Fly con mancuernas, Fondos asistidos, Curl de bíceps, Curl martillo |
| Domingo | Correr (zona 2) | Carrera suave, opcional curl de muñeca ligero |

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

## Cómo debe ayudar Claude en este proyecto

- Priorizar código simple y legible (vanilla JS, sin build tools innecesarios)
  sobre soluciones sofisticadas, salvo que se pida explícitamente lo contrario.
- Al proponer cambios de esquema SQL, entregarlos como nueva migración en
  `supabase/migrations/*.sql` (nunca editar las ya corridas) con políticas
  RLS incluidas desde el inicio.
- Mantener consistencia con el modelo de datos real (leer las migraciones,
  no asumir) y la rutina de referencia de este documento; avisar
  explícitamente si una sugerencia se aparta de decisiones ya tomadas aquí.
- Para cambios visuales o UI nueva, cargar `skills/SKILL.md` y seguir la
  dirección "workbench de gimnasio" ya establecida en vez de reabrir esa
  decisión sin razón.
- Verificar features contra el proyecto real de Supabase cuando sea posible
  (no solo revisión de código), y limpiar cualquier dato de prueba insertado
  durante la verificación.
- No dar por hecho que el deploy en Vercel ya pasó — confirmar con el
  usuario antes de asumir que hay una URL de producción.
