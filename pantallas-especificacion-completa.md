# Especificación completa de pantallas — App de entrenamiento

> Documento único y autónomo: pantalla por pantalla, qué hace, cómo está
> dividida (de lo general a lo específico), qué botones/controles tiene, y
> qué tablas/columnas de Supabase lee o escribe — tanto para las 8
> pantallas ya construidas (detalle extraído directo del HTML/JS/migraciones
> reales del repo) como para lo que el roadmap tiene pendiente, llevado al
> mismo nivel de detalle en vez de quedar como propuesta abierta.
>
> Es el documento que le darías a una herramienta de diseño visual para que
> vea de un vistazo *todo* lo que la app va a tener. Complementa a
> `contexto-proyecto-app-entrenamiento.md` (stack, esquema, sistema de
> diseño) y `roadmap-funcionalidades.md` (qué falta y en qué orden) — no
> repite sus decisiones, las asume.

---

## Estructura general común

Las 6 pantallas autenticadas comparten el mismo esqueleto de tres franjas
verticales:

```
┌─────────────────────────────┐
│  .app-topbar                │  ← barra fija arriba, solo título de la pantalla
├─────────────────────────────┤
│                              │
│  .app-container             │  ← contenido específico de cada pantalla,
│  (scrollable)                │    con scroll propio
│                              │
├─────────────────────────────┤
│  .bottom-nav                 │  ← menú fijo abajo, 5 destinos
└─────────────────────────────┘
```

- **`.app-topbar`**: un solo `<span>` con el nombre de la pantalla ("Hoy",
  "Historial", "Rutina", "Progreso", "Perfil", "Registrar sesión"). Sin
  botones, sin links — es puramente informativa.
- **`.bottom-nav`**: 5 íconos SVG dibujados a mano (Hoy / Historial /
  Rutina / Progreso / Perfil), cada uno un `<a>` a su `.html`. El ítem de
  la pantalla activa se distingue por color (ámbar), no por relleno.
  "Registrar sesión" no es un destino del menú — se llega solo desde el
  botón en "Hoy" — así que en esa pantalla el menú se ve pero ningún ítem
  queda marcado activo. No se le agrega ningún ítem nuevo con el roadmap
  pendiente (sigue siendo Hoy / Historial / Rutina / Progreso / Perfil) —
  la entrada a "Buscar personas" (capa social) vive dentro de Perfil, no en
  la barra inferior, para no competir en prioridad visual con las 5
  pantallas centrales del uso diario en solitario.
- **Login y Restablecer contraseña** son las únicas 2 pantallas sin
  `.app-topbar` ni `.bottom-nav` (no hay sesión todavía). **Onboarding**
  (pendiente, ver más abajo) tampoco los lleva.

**Vocabulario de componentes reutilizados:**

| Componente | Qué es | Dónde se usa | Estado |
|---|---|---|---|
| `.card` | Tarjeta con borde, sin sombra (escalón de superficie) | Todas las pantallas autenticadas | Ya existe |
| `.chip` | Botón pequeño tipo "pastilla", con estado `.activo` | Filtro de grupo muscular (Editor), tema/tamaño de letra (Perfil), selector músculo→ejercicio (Registrar sesión, planeado), privacidad (Perfil, planeado) | Ya existe |
| `.search-combo` + `<datalist>` | Input de texto con ícono de lupa y autocompletado nativo del navegador | Buscar ejercicio (Historial, Progreso, Editor de rutina) | Ya existe |
| `.rde-table` / `.rde-row` | Grid CSS que se ve como tabla en desktop y se apila en móvil | Fila de ejercicio dentro de un día de rutina (Editor) | Ya existe |
| `.heatmap-grid` / `.heatmap-cell` | Grid de celdas coloreadas por estado, ventana rodante de 8 semanas | Consistencia (Progreso) | Se reemplaza por `.calendar-grid` (roadmap #6) |
| `.stat` | Texto en fuente monoespaciada (`tabular-nums`) | Cualquier número que se lee "como un dial": PR, peso, fechas | Ya existe |
| `.ghost-target` | Texto tenue mostrando el objetivo del plan al lado del input real | Registrar sesión, para comparar plan vs. ejecución en vivo | Ya existe |
| `alert-danger` / `alert-warning` / `alert-success` | Bootstrap estándar | Errores, avisos de datos faltantes, confirmaciones | Ya existe |
| `.stepper` | Indicador de paso (1/3, 2/3, 3/3) + botones Atrás/Siguiente | Onboarding | Planeado |
| `.calendar-grid` / `.calendar-cell` | Grid de semanas × días de un mes calendario real (con noción de mes, a diferencia del heatmap rodante actual) | Progreso, sección Consistencia | Planeado (roadmap #6) |
| `.follow-btn` | Botón de estado múltiple ("Seguir" / "Solicitud enviada" / "Siguiendo") | Buscar personas, Ver perfil de otro usuario | Planeado (roadmap #10) |

---

## Pantallas construidas

### 1. Login / Registro / Recuperar contraseña

**Archivo:** `html/login.html` · **Sin topbar ni bottom-nav** (no autenticada)

**Propósito:** un solo formulario con 3 modos (`login` / `registro` /
`recuperar`) controlados por una variable JS, no 3 pantallas separadas.

**División general:**
1. Encabezado centrado (título de la app + subtítulo que cambia según modo)
2. Alerta de error/éxito (oculta por defecto)
3. Formulario
4. Dos links de cambio de modo

**División específica:**
- Encabezado: `<h1>` fijo "App de Entrenamiento" + `<p id="form-subtitle">`
  que cambia texto según modo ("Inicia sesión para continuar" / "Crea tu
  cuenta" / "Recupera tu contraseña").
- `#mensaje-error`: una sola alerta reutilizada para error (rojo) y éxito
  (verde, en registro/recuperar), oculta con `d-none` hasta que hay algo
  que mostrar.
- Formulario (`#form-login`):
  - Input `email` (siempre visible)
  - Grupo `#grupo-password` con input `password` — **se oculta por
    completo en modo `recuperar`** (no aplica pedir contraseña para
    recuperarla)
  - Botón submit `#btn-submit` — texto cambia: "Entrar" / "Crear cuenta" /
    "Enviar link de recuperación"
- Dos links debajo del formulario:
  - `#toggle-modo`: alterna `login` ↔ `registro` (oculto en modo
    `recuperar`)
  - `#toggle-olvide`: alterna hacia/desde `recuperar` ("¿Olvidaste tu
    contraseña?" / "Volver a iniciar sesión")

**Botones/controles:** `#btn-submit` (submit), `#toggle-modo` (link),
`#toggle-olvide` (link). Ninguno más — sin bottom-nav, sin logout aquí.

**Datos de Supabase:** no toca tablas propias del proyecto. Llama a
`supabaseClient.auth`:
- `signInWithPassword` (modo login, vía `login()` en `auth.js`)
- `signUp` (modo registro, vía `signup()`)
- `resetPasswordForEmail` (modo recuperar, directo)

---

### 2. Restablecer contraseña

**Archivo:** `html/reset-password.html` · **Sin topbar ni bottom-nav**

**Propósito:** página de aterrizaje del link de recuperación de email.
Depende de una sesión temporal de recuperación que Supabase-js crea sola
al leer el token del fragmento de la URL — no usa `requireSession()`.

**División general:**
1. Encabezado centrado (título + subtítulo fijos)
2. Tres alertas mutuamente excluyentes (error / éxito / "link inválido")
3. Formulario (oculto hasta confirmar que hay sesión de recuperación válida)

**División específica:**
- `#aviso-sin-token`: se muestra si al cargar no hay sesión — incluye un
  link de vuelta a `login.html` para pedir un link nuevo.
- `#form-reset` (oculto con `d-none` hasta que `getSession()` confirma
  sesión, o hasta el evento `PASSWORD_RECOVERY`):
  - Input `nueva-password`
  - Input `confirmar-password`
  - Botón submit `#btn-guardar` — valida en cliente que ambas coincidan
    antes de llamar a Supabase
- `#mensaje-exito`: reemplaza al formulario tras guardar, con redirect
  automático a `dashboard.html` a los 1.5s.

**Botones/controles:** `#btn-guardar` (submit) — es el único control
interactivo de la pantalla.

**Datos de Supabase:** `supabaseClient.auth.updateUser({ password })`. No
toca ninguna tabla propia.

---

### 3. Hoy (Dashboard)

**Archivo:** `html/dashboard.html` · **Pantalla activa en el bottom-nav:** Hoy

**Propósito:** mostrar la rutina planeada para el día de la semana actual
y ser el punto de entrada a "Registrar sesión".

**División general:**
1. `.app-topbar` "Hoy"
2. Aviso opcional (datos de referencia local, no de la BD)
3. Tarjeta con el día y su enfoque
4. Lista de ejercicios de hoy
5. Botón grande "Registrar esta sesión"
6. `.bottom-nav`

**División específica:**
- `#aviso-datos-referencia`: alerta amarilla que solo aparece si
  `routine.fromDatabase === false` (usuario sin rutina sembrada ese día —
  usa la constante local `RUTINA_REFERENCIA` de `routine-data.js` como
  fallback para poder seguir trabajando en frontend sin BD vacía).
- Tarjeta de encabezado: `<h2 id="dia-nombre">` (ej. "Miércoles") +
  `<p id="dia-enfoque">` (ej. "Pierna (pesado, fijo)").
- `<h3>Ejercicios de hoy</h3>` + `<ul id="lista-ejercicios">` generada por
  JS: un `<li>` por ejercicio, con el nombre a la izquierda y un badge a
  la derecha con el objetivo formateado (`"3 series 6-10 reps"` o
  `"25 min"` para cardio — badge de color distinto para cardio vs. fuerza).
- `#btn-registrar`: botón ancho completo, único CTA de la pantalla —
  navega a `registrar-sesion.html`.

**Botones/controles:** `#btn-registrar` (único). El resto es de solo
lectura.

**Datos de Supabase (lectura, vía `getTodayRoutine()` en
`routine-data.js`):**
- `routine_days` — `id, focus, notes` + join `routines!inner(is_active)`,
  filtrado por `day_of_week` = hoy y `routines.is_active = true`.
- `routine_day_exercises` — `target_sets, target_reps_min,
  target_reps_max, target_duration_minutes, order_index, notes` + join
  `exercises(id, name, muscle_group, type)`, filtrado por
  `routine_day_id`, ordenado por `order_index`.
- Si cualquiera de las dos consultas falla o no hay fila para hoy, cae al
  fallback local `RUTINA_REFERENCIA` (sin tocar la BD).

**Cambio pendiente (roadmap #4):** reportada como rota/no responsive en
pruebas del usuario — fix pendiente antes de seguir agregando
funcionalidad a esta pantalla. No cambia la división de arriba, es un
arreglo de CSS/layout en los breakpoints angostos.

---

### 4. Registrar sesión

**Archivo:** `html/registrar-sesion.html` · **Sin ítem activo en bottom-nav**

**Propósito:** capturar la sesión real del día (series de peso×reps para
ejercicios de fuerza/pliometría, o duración/distancia para cardio) y
guardarla. Es la pantalla donde vive la comparación plan-vs-ejecución en
vivo.

**División general:**
1. `.app-topbar` "Registrar sesión"
2. Encabezado con el día/enfoque de hoy (mismo dato que "Hoy")
3. Aviso de bloqueo si no hay datos reales en BD
4. Alertas de error/éxito
5. Formulario: N tarjetas de ejercicio (una por ejercicio de hoy) + nivel
   de energía + notas + botón guardar
6. `.bottom-nav`

**División específica:**
- `#aviso-sin-datos`: si `routine.fromDatabase` es `false` (rutina de
  fallback local, sin `exercise_id` real), deshabilita `#btn-guardar` por
  completo — no se puede guardar una serie sin un `exercise_id` válido.
- Por cada ejercicio de hoy, una tarjeta distinta según tipo:
  - **Tarjeta de fuerza/pliometría** (`crearCardFuerza`):
    nombre del ejercicio, `.ghost-target` con el objetivo del plan (texto
    fantasma, ej. "objetivo: 3 series 6-10 reps"), botón `+ serie`, y un
    contenedor de filas de serie. Cada fila (`crearFilaSet`): número de
    serie, input peso (kg), input reps — **el borde izquierdo de la fila
    pasa a verde (`.completado`) en cuanto se escribe algo en reps**, sin
    esperar a guardar. El número de filas iniciales = `target_sets` del
    plan (o 3 por defecto).
  - **Tarjeta de cardio** (`crearCardCardio`): nombre del ejercicio,
    select tipo de actividad (Carrera/Elíptica, autodetectado por el
    nombre), input duración (precargado con `target_duration_minutes`),
    input distancia, input FC promedio (opcional).
- Select `energy-level` (1 a 5, o "Sin dato").
- Textarea `notas`.
- `#btn-guardar`: submit, ancho completo, deshabilitado mientras guarda.

**Botones/controles:** `+ serie` (uno por tarjeta de fuerza, agrega filas
dinámicamente), `#btn-guardar` (submit único de toda la pantalla). No hay
botón para quitar una serie ya agregada ni para cambiar de ejercicio
dentro de esta pantalla (eso vive en "Rutina") — **hasta el cambio de
abajo**.

**Datos de Supabase:**
- Lectura: igual que "Hoy" (`getTodayRoutine()` → `routine_days` +
  `routine_day_exercises` + `exercises`).
- Escritura, al enviar el formulario:
  - `workout_sessions` — insert `{ user_id, session_date, routine_day_id,
    energy_level, notes }`.
  - `session_sets` — insert masivo `{ user_id, session_id, exercise_id,
    set_number, weight_kg, reps }` (una fila por serie con `reps` no
    vacío — `reps` es `not null` en el esquema).
  - `cardio_sessions` — insert masivo `{ user_id, session_id, cardio_date,
    activity_type, duration_minutes, distance_km, avg_heart_rate }` (solo
    si se llenó duración).

#### Cambio planeado — catálogo por músculo (roadmap #5)

**Qué cambia respecto a hoy:** hoy la tarjeta de cada ejercicio viene fija
desde la rutina del día. Se agrega la posibilidad de **cambiar o agregar
un ejercicio** dentro de esta misma pantalla, sin salir a Editor de
rutina.

**División específica (nueva, dentro de cada tarjeta de ejercicio):**
- Botón `Cambiar ejercicio` (ícono de swap) junto al nombre del ejercicio
  en la tarjeta de fuerza/pliometría existente.
- Al tocarlo, la tarjeta se expande en modo selección: chips de grupo
  muscular (mismo componente `.chip` que ya existe en Editor de rutina) →
  al elegir uno, lista filtrada de ejercicios de ese `muscle_group` →
  al elegir uno, la tarjeta vuelve a su estado normal pero con el nuevo
  ejercicio y sus filas de serie reiniciadas.
- Botón `+ Agregar ejercicio` al final de la lista de tarjetas de hoy, que
  abre el mismo selector (grupo → ejercicio) pero crea una tarjeta nueva en
  vez de reemplazar una existente.

**Nota importante:** el autofill de peso que este punto incluía en
versiones previas del roadmap **fue descartado explícitamente** — no está
en el alcance de este cambio. Solo se agrega el selector músculo →
ejercicio.

**Botones/controles nuevos:** `Cambiar ejercicio` (por tarjeta), chips de
grupo muscular (dentro del selector), `+ Agregar ejercicio` (una vez, al
pie).

**Datos de Supabase:**
- Lectura nueva: `exercises(id, name, muscle_group, type)` completo (no
  solo los de la rutina del día) para poblar el selector — mismo query que
  ya usa Editor de rutina para su catálogo.
- Escritura: sin cambios en `session_sets`/`cardio_sessions` — el cambio de
  ejercicio solo afecta qué `exercise_id` se usa al guardar, no la
  estructura del insert.
- **Abierto:** si al cambiar de ejercicio, esa sustitución se guarda solo
  para la sesión de hoy (no toca `routine_day_exercises`) o si además
  ofrece "actualizar también el plan" — se asume **solo para hoy**, ya que
  cambiar el plan permanente es trabajo de Editor de rutina.

---

### 5. Historial

**Archivo:** `html/historial.html` · **Pantalla activa en el bottom-nav:** Historial

**Propósito:** ver sesiones pasadas, filtrables por rango de fecha, día de
rutina y ejercicio.

**División general:**
1. `.app-topbar` "Historial"
2. Tarjeta de filtros
3. Alerta de error
4. Lista de tarjetas de sesión (una por sesión que coincide con los filtros)
5. `.bottom-nav`

**División específica:**
- Tarjeta de filtros, en grid de 4 columnas (2 en móvil):
  - `filtro-desde` / `filtro-hasta` (inputs de fecha)
  - `filtro-dia` (select poblado con los días de la rutina activa,
    formato "Miércoles — Pierna (pesado, fijo)")
  - `filtro-ejercicio` (`.search-combo` con datalist de todo el catálogo)
  - Botones `btn-filtrar` (aplica) y `btn-limpiar` (resetea los 4 campos
    y vuelve a cargar sin filtros)
- Lista de sesiones (`crearCardSesion`), cada una:
  - `card-header`: fecha legible + nombre del día ("Miércoles, 15 de
    agosto de 2026 — Pierna (pesado, fijo)") a la izquierda, nivel de
    energía a la derecha si se registró.
  - Lista de ejercicios agrupados por nombre, con sus series concatenadas
    en formato `"80kg × 8, 82.5kg × 6"`.
  - Entradas de cardio (si las hay) con tipo, duración, distancia, FC.
  - Notas de la sesión, si existen, en texto pequeño al pie.

**Botones/controles:** `btn-filtrar`, `btn-limpiar`. El resto de la
pantalla es de solo lectura (no hay edición ni borrado de sesiones pasadas
desde aquí).

**Datos de Supabase (todo lectura):**
- `routine_days` — `id, day_of_week, focus` + join
  `routines!inner(is_active)`, para poblar el filtro de día.
- `exercises` — `id, name`, para poblar el datalist de ejercicios.
- `workout_sessions` — `id, session_date, routine_day_id, energy_level,
  notes` + joins anidados `routine_days(focus)`,
  `session_sets(id, set_number, weight_kg, reps, exercise_id,
  exercises(name))`, `cardio_sessions(id, activity_type,
  duration_minutes, distance_km, avg_heart_rate)`. Filtros de fecha
  (`gte`/`lte` sobre `session_date`) y de día (`eq` sobre
  `routine_day_id`) se aplican en la query; el filtro por ejercicio se
  aplica **en cliente** (una sesión pasa si alguna de sus `session_sets`
  usó ese `exercise_id` — cardio no tiene `exercise_id` propio).

**Decisión abierta (roadmap #6):** si esta pantalla desaparece fusionada
dentro del calendario mensual de Progreso, o si se mantiene aparte para
filtrar por rango/ejercicio — ver la sección de Progreso más abajo y
"Decisiones abiertas" al final de este documento.

---

### 6. Editor de rutina

**Archivo:** `html/editor-rutina.html` · **Pantalla activa en el bottom-nav:** Rutina

**Propósito:** la pantalla más compleja — administra 3 conceptos a la vez:
el catálogo global de ejercicios, la lista de rutinas guardadas del
usuario, y los días/ejercicios de la rutina seleccionada.

**División general:**
1. `.app-topbar` "Editor de rutina"
2. Alerta de error
3. Tarjeta "Mis rutinas"
4. Tarjeta "Catálogo de ejercicios"
5. Título de la rutina seleccionada + lista de tarjetas de día
6. Formulario para agregar un día nuevo (si aplica)
7. `.bottom-nav`

**División específica:**

**Tarjeta "Mis rutinas":**
- `lista-rutinas`: un `<li>` por rutina, con:
  - Nombre (resaltado en ámbar si es la seleccionada actualmente en
    pantalla) + badge verde "Activa" si `is_active`
  - Botones: `Ver/editar` (siempre), `Activar` (solo si no es la activa),
    `Renombrar` (siempre, usa `prompt()` nativo del navegador), `Eliminar`
    (solo si no es la activa — no se puede borrar la rutina activa)
- `form-nueva-rutina`: input de nombre + botón `Crear`

**Tarjeta "Catálogo de ejercicios":**
- Chips de filtro por grupo muscular (`Todos` + uno por cada
  `muscle_group` distinto en el catálogo) — clic filtra la lista de abajo
  sin recargar.
- `lista-catalogo`: un `<li>` por ejercicio filtrado, nombre + "grupo ·
  tipo" en texto muted.
- `form-nuevo-ejercicio`: inputs nombre + grupo muscular + select tipo
  (Fuerza/Cardio/Pliometría) + botón `+`.
- `datalist-catalogo` (oculto): alimenta todos los buscadores de "agregar
  ejercicio a un día" de las tarjetas de abajo.

**Días de la rutina seleccionada (`lista-dias`):**
Una tarjeta por día ya creado en esa rutina:
- Header: nombre del día (fijo, ej. "Miércoles"), input de enfoque
  editable, input de notas del día editable, botón `Guardar` (guarda
  enfoque+notas), botón `Eliminar día` (borra el día completo con
  confirmación nativa).
- Body: tabla responsive (`.rde-table`) con columnas Ejercicio / Series /
  Reps min / Reps max / Duración / Orden / Notas / (acciones). Cada fila
  (`renderFilaEjercicio`, desde `<template id="template-fila-ejercicio">`)
  tiene inputs editables para todo excepto el nombre, y dos botones:
  `Guardar` (actualiza esa fila) y `Eliminar` (borra ese ejercicio del
  día).
- Al pie de cada tarjeta de día, fila para agregar un ejercicio nuevo a
  ese día: `.search-combo` (busca en el catálogo completo) + inputs
  series/reps min/reps max/duración + botón `+`.

**Formulario "Agregar día a esta rutina"** (`agregar-dia-container`): solo
aparece si hay una rutina seleccionada y quedan días de la semana sin
usar en ella — select del día disponible + input de enfoque + botón `+`.

**Botones/controles (resumen):** Ver/editar, Activar, Renombrar, Eliminar
(por rutina) · Crear (rutina nueva) · chips de grupo muscular · `+`
(ejercicio nuevo al catálogo) · Guardar / Eliminar día (por día) ·
Guardar / Eliminar (por fila de ejercicio) · `+` (agregar ejercicio a un
día) · `+` (agregar día nuevo).

**Datos de Supabase:**
- Lectura: `exercises(id, name, muscle_group, type)` · `routines(id,
  name, source, is_active)` · `routine_days(id, day_of_week, focus,
  notes)` + join `routine_day_exercises(id, target_sets,
  target_reps_min, target_reps_max, target_duration_minutes, order_index,
  notes, exercise_id, exercises(name))`, filtrado por `routine_id`.
- Escritura: insert en `exercises`, `routines`, `routine_days`,
  `routine_day_exercises`; update en `routines` (`name`, `is_active`),
  `routine_days` (`focus`, `notes`), `routine_day_exercises` (todos los
  campos objetivo); delete en `routines`, `routine_days`,
  `routine_day_exercises` (con cascada de FK en BD para lo que cuelga de
  la rutina/día borrado).
- Detalle no obvio: **activar una rutina son dos updates secuenciales**
  (desactivar la que estaba activa, luego activar la nueva) porque la BD
  no permite dos filas activas simultáneas para el mismo usuario.

---

### 7. Progreso

**Archivo:** `html/progreso.html` · **Pantalla activa en el bottom-nav:** Progreso

**Propósito:** 3 secciones de gráficas/estadísticas en una sola página con
scroll continuo (ver roadmap #7 — separarlas más claramente es trabajo
pendiente aparte del cambio de abajo).

**División general:**
1. `.app-topbar` "Progreso"
2. Sección "Fuerza por ejercicio"
3. Sección "Consistencia"
4. Sección "Medidas corporales"
5. `.bottom-nav`

**División específica:**

**Sección Fuerza por ejercicio:**
- `.search-combo` con datalist de ejercicios tipo `fuerza`/`pliometria`
  (cardio excluido — no tiene peso).
- Alertas: error, o "sin series con peso registradas" si el ejercicio
  elegido no tiene datos.
- `card-chart`: dos stats (`PR`, `Última sesión`, en kg) + `<canvas>` con
  línea de peso máximo por fecha de sesión (Chart.js).

**Sección Consistencia (estado actual, ver cambio planeado abajo):**
- Un stat: "X/Y días planeados cumplidos (Z%)".
- `heatmap-consistencia`: grid de 56 celdas (8 semanas × 7 días), cada
  celda coloreada por estado: `entrenado` (hubo sesión), `perdido`
  (planeado, no se entrenó, ya pasó), `sin-plan` (ese día de la semana no
  tiene ejercicios planeados), `futuro` (día que aún no llega, sin
  colorear como perdido). Tooltip nativo (`title`) con la fecha exacta por
  celda.
- Leyenda de 3 puntos de color debajo del heatmap.

**Sección Medidas corporales:**
- `form-medida`: fecha (precargada con hoy) + antebrazo (cm) + bíceps
  (cm) + peso corporal (kg) + botón `+`.
- Alerta "sin medidas" si la tabla está vacía.
- `card-medidas`: 3 stats (última medición de cada campo) + `<canvas>`
  con línea múltiple: antebrazo y bíceps comparten eje Y izquierdo (cm),
  peso corporal usa eje Y derecho (kg, línea punteada).

**Botones/controles:** el input de búsqueda de ejercicio (dispara la
gráfica de fuerza al escribir/elegir), el botón `+` del formulario de
medidas. El resto es de solo lectura.

**Datos de Supabase:**
- `exercises` — `id, name` filtrado `type in (fuerza, pliometria)`.
- `session_sets` — `weight_kg` + join `workout_sessions(session_date)`,
  filtrado por `exercise_id` — se calcula el peso máximo por fecha en
  cliente (una fecha puede tener varias series).
- `routine_days` — `day_of_week` + join `routine_day_exercises(id)` +
  `routines!inner(is_active)`, para saber qué días de la semana están
  "planeados" (tienen al menos un ejercicio).
- `workout_sessions` — `session_date` en el rango de 8 semanas, para saber
  qué fechas se entrenó de verdad.
- `body_measurements` — `measurement_date, forearm_cm, bicep_cm,
  body_weight_kg`, orden ascendente por fecha.
- Escritura: insert en `body_measurements` desde el formulario de nueva
  medición.
- **Pendiente (roadmap #9):** faltan 2 secciones — volumen semanal por
  grupo muscular (barras) y cardio en el tiempo — que usarían
  `session_sets` agregado por `exercises.muscle_group` y
  `cardio_sessions` respectivamente.

#### Cambio planeado — calendario mensual + detalle por día (roadmap #6)

**Qué cambia respecto a hoy:** la sección "Consistencia" reemplaza el
`heatmap-consistencia` actual (grid rodante de 8 semanas, sin noción de
mes) por un calendario mensual real, con detalle al hacer clic en un día.

**División específica (reemplaza a la sección Consistencia actual):**
- Header de navegación: flecha ← / nombre del mes y año (ej. "Agosto
  2026") / flecha → — no se puede navegar a meses futuros más allá del
  actual.
- `.calendar-grid`: filas = semanas del mes, columnas = Lunes a Domingo
  (7 columnas fijas, con celdas vacías al inicio/fin del mes para alinear
  el primer y último día correctamente). Mismo esquema de color por estado
  que hoy (`entrenado` / `perdido` / `sin-plan` / `futuro`).
- Al hacer clic en una celda con estado `entrenado`: modal o panel inline
  con el detalle de esa sesión — reutiliza la lógica de `crearCardSesion`
  de Historial (ejercicios agrupados, series concatenadas, cardio, notas).
  Clic en una celda sin sesión no abre nada.
- Stat resumen arriba del calendario: "X/Y días planeados cumplidos este
  mes (Z%)" — mismo cálculo que hoy, pero acotado al mes visible en vez de
  a las 8 semanas rodantes.
- Leyenda de color, igual que hoy.

**Botones/controles:** flechas ←/→ de navegación de mes, celdas del
calendario (clic solo activo en días `entrenado`).

**Datos de Supabase:** mismas tres fuentes que ya usa la sección hoy
(`routine_days`+`routine_day_exercises` para saber qué está planeado,
`workout_sessions` para saber qué se entrenó), acotando el rango de fecha
al mes navegado en vez de a "hoy menos 8 semanas". Para el detalle al
hacer clic, mismo query que ya usa Historial sobre `workout_sessions` con
sus joins a `session_sets`/`cardio_sessions`, filtrado por esa
`session_date` puntual.

**Abierto (decisión de producto, no técnica):** si `historial.html`
desaparece y se fusiona aquí, o si el panel de detalle enlaza a Historial
prefiltrado por esa fecha en vez de mostrarlo inline. Se asume, para esta
especificación, que **se muestra inline** (panel/modal reutilizando el
componente de tarjeta de sesión) y que `historial.html` se mantiene aparte
para cuando se quiere filtrar por rango/ejercicio en vez de por día
puntual — pero esta decisión no está cerrada, confírmala antes de pasar
esto a diseño si te importa que no se dupliquen pantallas sin necesidad.

---

### 8. Perfil

**Archivo:** `html/perfil.html` · **Pantalla activa en el bottom-nav:** Perfil

**Propósito:** preferencias de apariencia (tema, tamaño de letra) y cerrar
sesión. Hoy es la única pantalla sin ninguna tabla de Supabase propia.

**División general:**
1. `.app-topbar` "Perfil"
2. Tarjeta "Apariencia"
3. Tarjeta "Cuenta"
4. `.bottom-nav`

**División específica:**
- Tarjeta "Apariencia":
  - Grupo de 2 chips: `Oscuro` / `Claro` (tema)
  - Grupo de 3 chips: `Pequeño` / `Normal` / `Grande` (tamaño de letra,
    escala el `font-size` de `<html>`)
- Tarjeta "Cuenta":
  - Label "Sesión iniciada como" + email del usuario actual
  - Botón `Cerrar sesión` (ancho completo, estilo `outline-danger`)

**Botones/controles:** los 5 chips (2 tema + 3 tamaño) + `btn-logout`.

**Datos de Supabase:** ninguna tabla propia. Lee `user.email` de la sesión
actual (`requireSession()`) y llama a `supabaseClient.auth.signOut()` al
cerrar sesión (vía `logout()` en `auth.js`). Las preferencias de
tema/tamaño **no se guardan en la BD** — viven en `localStorage` bajo las
claves `pref-tema` y `pref-tamano-letra`, leídas por un script inline en
el `<head>` de cada una de las 6 pantallas autenticadas antes del primer
pintado.

#### Cambio planeado — tarjeta "Privacidad" (roadmap #10, capa social)

**Qué se agrega:** una tarjeta nueva entre "Apariencia" y "Cuenta", más
una tarjeta "Comunidad" con la entrada a "Buscar personas" (ver pantallas
nuevas más abajo).

**División específica:**
- Tarjeta "Privacidad":
  - Toggle o 2 chips: `Privado` / `Público` — controla si otros usuarios
    pueden ver tu perfil sin que aceptes su solicitud de seguimiento.
  - Texto explicativo corto debajo, ej. "Con perfil público, cualquiera
    puede ver tu progreso y rutina activa sin pedirte permiso."
  - Si es `Privado`: lista corta de "Solicitudes pendientes" (quién pidió
    seguirte), con botones `Aceptar`/`Rechazar` por solicitud — vacía la
    mayor parte del tiempo, no es una bandeja completa de notificaciones.

**Botones/controles nuevos:** los 2 chips de privacidad, `Aceptar`/
`Rechazar` por solicitud pendiente, botón `Buscar personas` (tarjeta
"Comunidad").

**Datos de Supabase (requiere tabla nueva `profiles`):**
- Lectura/escritura: `profiles.is_public boolean` (nueva columna o tabla,
  ver "Decisiones abiertas" al final — hoy no existe ninguna tabla
  `profiles`).
- Lectura: tabla nueva `follows` (`follower_id`, `followed_id`, `status`
  — `pending`/`accepted`) filtrada por `followed_id = auth.uid() AND
  status = 'pending'` para la lista de solicitudes.
- Escritura: update de `status` a `accepted` o delete de la fila en
  `follows` al rechazar.

---

## Pantallas completamente nuevas

### Onboarding (roadmap #8)

**Cuándo aparece:** una sola vez, en el primer login/registro, antes de
llegar a "Hoy" por primera vez. **Sin** `.bottom-nav` (todavía no hay nada
a donde navegar) ni `.app-topbar` estándar — usa su propio encabezado con
el `.stepper`.

**División general (flujo de 3 pasos, no una sola pantalla larga):**
1. `.stepper` arriba, fijo, en las 3 pantallas del flujo (indicador "Paso
   1 de 3", etc.)
2. Contenido específico del paso (cambia)
3. Botones `Atrás` / `Siguiente` (o `Empezar` en el último paso)

**División específica por paso:**

- **Paso 1 — Medidas iniciales:** mismos 3 campos que ya existen en el
  formulario de nueva medición de Progreso (antebrazo cm, bíceps cm, peso
  corporal kg) + fecha precargada con hoy. Botón `Omitir este paso` visible
  (medidas es razonable no tenerlas el primer día).
- **Paso 2 — Preferencias:** mismos controles que ya existen en Perfil
  (tema, tamaño de letra) — mismo mecanismo de `localStorage`, sin botón
  de omitir (siempre tiene un valor por defecto ya).
- **Paso 3 — Elegir rutina de arranque:** dos opciones mutuamente
  excluyentes:
  - Lista de tarjetas, una por rutina de ejemplo (`routines` con `source =
    'template'` — contenido de PPL/Arnold/Full Body aún sin crear, ver
    roadmap #1) con nombre + días/enfoques resumidos + botón `Usar esta`.
  - Botón separado `Crear la mía desde cero` que marca el onboarding como
    completado y navega a Editor de rutina con una rutina vacía ya creada
    y activa, lista para agregar días.

**Botones/controles:** `Atrás`/`Siguiente` del stepper, `Omitir` (solo
paso 1), `Usar esta` (por rutina de ejemplo, paso 3), `Crear la mía desde
cero` (paso 3).

**Datos de Supabase:**
- Escritura paso 1: insert en `body_measurements` (si no se omitió).
- Escritura paso 3, ruta "usar plantilla": clonar la `routine` con
  `source = 'template'` elegida junto con sus `routine_days` y
  `routine_day_exercises` a filas nuevas con `user_id` del usuario actual
  y `is_active = true` — mecánicamente el mismo patrón que ya se pensó
  para "copiar rutina de un amigo" en la capa social, solo que la fuente
  es una plantilla del sistema en vez de otro usuario.
- Escritura paso 3, ruta "desde cero": insert de una `routine` vacía con
  `is_active = true` para el usuario.
- **Abierto:** dónde se guarda el flag de "onboarding completado" — ver
  "Decisiones abiertas" al final.

### Buscar y seguir personas (roadmap #10, capa social — opción B)

**Punto de entrada:** un botón `Buscar personas` dentro de una tarjeta
nueva "Comunidad" en Perfil (no un ítem del `.bottom-nav`, para no
competir en prioridad visual con las 5 pantallas centrales del uso diario
en solitario).

**División general:**
1. `.app-topbar` "Buscar personas"
2. `.search-combo` de búsqueda por email o nombre de usuario
3. Lista de resultados
4. `.bottom-nav`

**División específica:**
- Input de búsqueda (sin datalist esta vez — la lista de usuarios no se
  precarga completa como el catálogo de ejercicios, se busca contra la
  BD conforme se escribe, con debounce).
- Por cada resultado: nombre/email + `.follow-btn` con 3 estados posibles:
  `Seguir` (sin relación previa) → `Solicitud enviada` (si el perfil es
  privado y queda pendiente) → `Siguiendo` (si es público, o ya fue
  aceptada) — tocar `Siguiendo` ofrece `Dejar de seguir` con confirmación.
- Si el resultado ya te sigue a ti, un badge pequeño "Te sigue" al lado
  del nombre (paridad simétrica visible, como en Strava/Hevy).

**Botones/controles:** input de búsqueda, `.follow-btn` por resultado.

**Datos de Supabase:**
- Lectura: búsqueda en `auth.users` o en `profiles` (según dónde termine
  viviendo el nombre de usuario, ver "Decisiones abiertas") filtrada por
  coincidencia parcial de texto — **no exponer el listado completo de
  usuarios sin búsqueda activa**, por privacidad.
- Escritura: insert en `follows` (`follower_id = auth.uid()`,
  `followed_id`, `status = 'pending'` si el perfil buscado es privado o
  `'accepted'` directo si es público); delete al dejar de seguir.

### Ver perfil de otro usuario (roadmap #10, capa social — opción B)

**No es una pantalla visual nueva desde cero** — reutiliza los componentes
de Progreso (gráficas) y Editor de rutina (solo lectura, sin botones de
edición) del usuario seguido, en un modo "espejo" de solo lectura.

**División general:**
1. `.app-topbar` con el nombre/email del usuario, no "Progreso" genérico
2. Botón `.follow-btn` arriba del todo (mismo componente que en Buscar
   personas, para dejar de seguir directo desde aquí)
3. Rutina activa de ese usuario (igual a la vista de Editor de rutina,
   pero sin ningún botón de editar/eliminar/agregar)
4. Gráficas de Progreso de ese usuario (mismas 3-5 secciones, mismo
   `<canvas>` de Chart.js, sin el formulario de "nueva medición" — es
   solo lectura)
5. `.bottom-nav` (con ningún ítem marcado activo, igual que Registrar
   sesión — esta pantalla no es uno de los 5 destinos principales)

**Botones/controles:** `.follow-btn` (dejar de seguir). Todo lo demás es
de solo lectura — ni inputs, ni botones de guardar/eliminar/agregar.

**Datos de Supabase:** los mismos queries que ya usan Editor de rutina y
Progreso, pero con `user_id` del perfil visitado en vez de
`auth.uid()` — lo cual requiere policies RLS nuevas de `select` que
permitan leer filas de otro usuario **solo si**: (a) ese usuario tiene
`profiles.is_public = true`, o (b) existe una fila en `follows` con
`follower_id = auth.uid()`, `followed_id = ese usuario`, `status =
'accepted'`. Sin esa policy, RLS actual (`auth.uid() = user_id` a secas)
bloquea esta pantalla por completo — es el cambio de RLS más delicado de
todo este documento, tócalo con cuidado y pruébalo explícitamente con dos
usuarios reales, no solo de código.

**Abierto:** qué tablas exactamente se exponen (`workout_sessions`/
`session_sets`/`routine_days` sí; ¿`body_measurements` también, o se
oculta por ser más personal? ¿`cardio_sessions`?) — decide esto antes de
escribir las policies, ya que cada tabla que agregues aquí es una policy
RLS nueva que hay que mantener.

---

## Decisiones abiertas antes de pasar esto a diseño

Estas no son de diseño visual — son de modelo de datos/producto, y
conviene cerrarlas antes de que una herramienta de diseño genere pantallas
sobre supuestos que luego no coincidan con tu esquema real:

1. **¿Existe tabla `profiles`?** La capa social entera (privacidad, flag
   de onboarding completado, posible nombre de usuario visible) depende de
   que exista. Hoy no existe ninguna tabla así en el esquema — ver
   `contexto-proyecto-app-entrenamiento.md`.
2. **¿Dónde vive el flag de "onboarding completado"?** Columna en
   `profiles` (si se crea por el punto 1) o en
   `auth.users.raw_user_meta_data` (evita crear tabla nueva, pero es menos
   consultable con RLS estándar).
3. **¿Qué tablas se exponen a un seguidor?** Ver el punto abierto en "Ver
   perfil de otro usuario" arriba.
4. **¿Historial se fusiona con el calendario mensual de Progreso, o
   quedan separados?** Ver el punto abierto en esa sección arriba.
5. **¿Cómo se identifica a un usuario en "Buscar personas"?** ¿Por email
   completo (menos amigable, pero cero trabajo extra), o se agrega un
   `username` a `profiles` (más amigable, un campo más que mantener y
   validar como único)?

Ninguna de estas bloquea diseñar las pantallas de arriba a nivel visual
(el layout no cambia según la respuesta), pero sí cambian qué texto de
ejemplo/contenido mostrar en cada una — vale la pena decidirlas antes de
la fase de implementación aunque el diseño visual avance en paralelo.
