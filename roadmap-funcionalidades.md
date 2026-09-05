# Roadmap de funcionalidades pendientes — App de entrenamiento

> Este documento es la fuente de verdad para el trabajo **funcional** pendiente,
> separado de `contexto-proyecto-app-entrenamiento.md` (estado ya construido,
> stack, esquema) y de `sistema-diseño-visual.md` (paleta, tipografía,
> componentes visuales). Leer esos documentos primero si es una sesión nueva
> sin contexto — este asume todo lo que ahí se describe como punto de partida.

## Filosofía de esta fase

El usuario probó la app desplegada en Vercel y el feedback es: **la base
funcional necesita crecer bastante antes de invertir en diseño**. Las
animaciones y el pulido visual actual se reconocen como "demasiado simples",
pero la decisión explícita es **posponer diseño/animaciones hasta que todas
las funciones de abajo estén construidas**. No reabrir esa decisión sin que
el usuario lo pida — no proponer trabajo de CSS/animación no solicitado
mientras haya items funcionales pendientes en este documento.

## Orden sugerido de trabajo

1. ✅ **Rutinas múltiples** (esquema) — hecho y verificado, ver detalle en #1.
2. ✅ **Menú inferior + pantalla de Perfil** — implementado y verificado
   por el usuario en el navegador (ver #2 y #3).
3. **Onboarding** (pantalla de primer inicio).
4. **Fix responsive de "Hoy".**
5. **Catálogo de ejercicios por músculo.**
6. **Heatmap mensual estilo racha + integración historial/progreso.**
7. **Separación visual medidas/fuerza dentro de Progreso.**
8. **Capa social mínima** (perfiles públicos + seguir, sin feed) — ver #10.
9. Pendientes técnicos heredados (2 gráficas, redirect URL, email).
10. (Después de todo lo anterior) diseño visual y animaciones.

Este orden prioriza lo que desbloquea otras piezas (rutinas múltiples) y lo
estructural (navegación) antes que ajustes dentro de pantallas ya existentes.

---

## 1. Rutinas múltiples y personalizadas (cambio de esquema) — ✅ HECHO Y VERIFICADO

**Estado: mecanismo implementado, migración corrida en Supabase, y
verificado end-to-end por el usuario** (creó una rutina extra, agregó un
día, activó/desactivó, registró sesiones bajo ambas rutinas, confirmó que
"Hoy" cambia según la rutina activa y que Historial/Progreso siguen
correctos — incluyendo que el historial muestre correctamente sesiones de
hoy asociadas a dos rutinas distintas, que es el comportamiento correcto:
cada sesión guarda con qué `routine_day` estaba asociada al momento de
registrarse, sin importar cuál rutina esté activa después).

Commit: `d7f49b1` "Support multiple saved routines instead of one fixed
routine per user".

**Rutinas de ejemplo (PPL, Arnold, Full Body) NO incluidas a propósito** —
decisión explícita del usuario: solo el mecanismo ahora, el contenido de
rutinas de ejemplo se hace junto con el onboarding (#8), que es donde
realmente se usa.

Implementado:
- Migración `supabase/migrations/20260905000000_multiple_routines.sql` —
  ya corrida en el proyecto real de Supabase. Crea `routines`, migró los
  `routine_days` existentes a una rutina "Mi rutina" activa (sin perder
  datos), y movió el unique constraint de `(user_id, day_of_week)` a
  `(routine_id, day_of_week)`.
- `js/editor-rutina.js` + `html/editor-rutina.html`: sección "Mis rutinas"
  nueva (crear, activar, renombrar, eliminar) y el editor de días ahora
  opera sobre la rutina seleccionada, con soporte para agregar/eliminar
  días (antes solo se podía editar enfoque/notas de días ya sembrados).
- `js/routine-data.js`, `js/historial.js`, `js/progreso.js`: las tres
  consultas que leían `routine_days` fueron corregidas para filtrar
  siempre por la rutina con `is_active = true` (si no se hacía esto, con
  más de una rutina guardada "Hoy", el historial y el heatmap de
  consistencia hubieran mezclado días de rutinas distintas).

**Pendiente de limpieza:** el usuario creó una rutina y sesión de prueba
durante la verificación — borrar esa rutina de prueba (y la sesión
asociada si no se quiere conservar) antes de seguir, siguiendo la
convención del proyecto de no dejar datos fantasma de testing.

**Problema que resolvía:** `routine_days` tenía `unique (user_id,
day_of_week)` — el modelo asumía que **solo podía existir una rutina activa
a la vez** por usuario, sin nombre ni forma de tener varias guardadas.

**Pendiente dentro de este punto (pospuesto a propósito, se hace en #8):**
Rutinas de ejemplo (PPL, Arnold Split, Full Body) como filas `source =
'template'` que el usuario pueda clonar/activar desde el onboarding. El
mecanismo (`source` en `routines`) ya soporta esto, solo falta el
contenido y la UI de "elegir una rutina de ejemplo".

Esta fue la pieza de mayor impacto en esquema de todo el roadmap — se hizo
primero porque onboarding (#8) y "cambiar de rutina" dependían de ella.

## 2. Navegación: menú inferior — ✅ HECHO Y VERIFICADO

**Estado: implementado y probado por el usuario en el navegador.**

Implementado:
- `.app-topbar` (nuevo, en `css/style.css`): reemplaza la barra superior
  vieja — ahora solo muestra el título de la pantalla, sin links ni botón
  de salir.
- `.bottom-nav` / `.bottom-nav-item` (nuevo, en `css/style.css`): menú fijo
  abajo con 5 destinos (Hoy, Historial, Rutina, Progreso, Perfil), iconos
  SVG inline dibujados a mano en el mismo estilo que el ícono de búsqueda
  ya existente (stroke, sin librería externa). El activo se distingue por
  color (ámbar), no por relleno. `env(safe-area-inset-bottom)` para no
  quedar tapado por el home indicator en iPhone.
  "Registrar sesión" sigue sin ser un destino del menú (se llega solo
  desde el botón en "Hoy", como antes) — no se marca ningún ítem activo en
  esa pantalla.
- Las 6 pantallas autenticadas (`dashboard`, `registrar-sesion`,
  `historial`, `editor-rutina`, `progreso`, `perfil` nueva) tienen el menú
  nuevo; `login.html`/`reset-password.html` no lo llevan (no están
  autenticadas, sin cambios ahí).
- `js/dashboard.js`, `js/editor-rutina.js`, `js/progreso.js`,
  `js/historial.js`, `js/registrar-sesion.js`: se quitó el wiring del
  `btn-logout` viejo (el botón ya no existe en esas pantallas).

## 3. Perfil (pantalla nueva) — ✅ HECHO Y VERIFICADO

**Estado: implementado y probado por el usuario en el navegador.**

Implementado (`html/perfil.html` + `js/perfil.js`):
- **Tema claro/oscuro**: paleta clara nueva completa en
  `css/style.css` bajo `:root[data-theme="light"]` — mismas superficies,
  mismo acento ámbar (oscurecido para contraste en fondo claro), mismo
  verde de éxito, misma estrategia de solo-bordes (sin sombras) que el
  oscuro, para no mezclar dos sistemas de profundidad. Se activa con dos
  chips ("Oscuro"/"Claro") reutilizando el componente `.chip` que ya
  existía para los filtros de grupo muscular.
- **Tamaño de letra**: 3 chips (Pequeño/Normal/Grande) que escalan el
  `font-size` de `<html>` (87.5% / 100% / 112.5%) — como Bootstrap es
  rem-first, esto reescala toda la app sin tocar componente por
  componente.
- **Preferencia guardada en `localStorage`** (decisión ya tomada, ver
  abajo), bajo las claves `pref-tema` y `pref-tamano-letra`. Un script
  inline pequeño en el `<head>` de **cada** una de las 6 pantallas
  autenticadas lee esas claves y aplica el tema/tamaño *antes* del primer
  pintado, para evitar el parpadeo de "oscuro y luego cambia a claro" al
  cargar. Si se agregan más pantallas autenticadas en el futuro, ese mismo
  snippet debe copiarse en su `<head>`.
- **Botón "Cerrar sesión" vive en Perfil**, separado en su propia tarjeta
  "Cuenta" junto con el email de la sesión activa — ya no está en ninguna
  otra pantalla.
- Decisión de dónde vive la preferencia: se usó `localStorage` (por
  dispositivo) como estaba planeado por defecto en este documento — no se
  construyó sincronización entre dispositivos vía Supabase.

## 4. Dashboard "Hoy": responsive

Reportado como roto/no responsive en las pruebas del usuario. Arreglar antes
de seguir agregando funcionalidad a esa pantalla.

## 5. Registrar sesión: catálogo por músculo

- **Selección en dos pasos:** elegir grupo muscular → ver lista de
  ejercicios de ese músculo. La columna `exercises.muscle_group` ya existe
  en el esquema — es trabajo de UI (reemplazar/complementar el buscador
  libre actual `.search-combo`), no de esquema.

> Nota: este punto incluía antes una idea de "autofill de peso" (propagar
> el peso capturado a series siguientes, con excepción para dropset/
> superset). Se descartó por completo a pedido del usuario — fue un error
> de redacción que tomó un rumbo no deseado — así que no forma parte del
> alcance de este punto ni del roadmap.

## 6. Historial + Progreso: heatmap mensual estilo racha (Duolingo) y detalle por día

- Rediseñar el heatmap de consistencia (hoy: 8 semanas en grid genérico,
  ver `html/progreso.html`) a un **calendario mensual real** (semanas del
  mes, como la racha de Duolingo), no una ventana rodante de 8 semanas.
- **Click en un día del calendario → muestra el entrenamiento de ese día**
  (lo que hoy vive filtrado en `html/historial.html`), en modal o panel
  inline.
- Decisión pendiente de diseño de producto: ¿`historial.html` desaparece y
  se fusiona dentro de `progreso.html`, o `progreso.html` enlaza al detalle
  de historial pre-filtrado por esa fecha? Confirmar con el usuario antes de
  eliminar la pantalla de historial standalone.

## 7. Progreso: separar medidas y fuerza en secciones claras

Hoy todas las gráficas de `progreso.html` están en scroll continuo sin
separación fuerte. Introducir una división visual/de navegación explícita
entre "Medidas corporales" y "Progreso de fuerza" dentro de esa pantalla
(pestañas, anclas con menú superior propio, o secciones claramente
delimitadas — a decidir al implementar, no es una decisión de producto
abierta como la del punto 6).

## 8. Onboarding (pantalla de primer inicio)

Al primer login (o registro), antes de llegar al dashboard normal:
1. Pedir medidas corporales iniciales (alimenta `body_measurements`).
2. Pedir preferencias iniciales (ver #3).
3. Elegir una rutina de arranque: alguna de las rutinas de ejemplo (PPL,
   Arnold, Full Body, etc. — ver #1) o crear una personalizada desde cero.

**Depende de #1** (no se puede elegir/clonar una rutina de ejemplo sin que
exista el concepto de rutinas múltiples) — implementar después de esa
pieza, no antes.

## 9. Pendientes técnicos heredados (de la fase anterior, aún abiertos)

Carry-over de `contexto-proyecto-app-entrenamiento.md` — no se pierden al
mover el foco a las funciones de arriba:

- **2 gráficas de Progreso sin empezar:** volumen semanal por grupo
  muscular (barras), y cardio (duración/distancia zona 2 en el tiempo).
- **Redirect URL de recuperación de contraseña en Supabase:** confirmado
  que el link de recuperación mandaba a `localhost:3000` — causa: el **Site
  URL** del proyecto nunca se cambió del default. Pendiente que el usuario
  entre a Authentication → URL Configuration en el dashboard de Supabase
  (no accesible desde aquí) y:
  - **Site URL** → `https://app-para-ejerccicios.vercel.app`
  - **Redirect URLs** → agregar
    `https://app-para-ejerccicios.vercel.app/html/reset-password.html`
    (y la URL/puerto local si se sigue probando en local, con el mismo
    sufijo `/html/reset-password.html`).
  - Pedir un correo de recuperación nuevo después de guardar — el link
    viejo ya quedó apuntando a la URL incorrecta.
  - **No marcar como resuelto hasta que el usuario confirme** que un link
    nuevo sí lo lleva a `reset-password.html` en producción.
- **Rate limit del mailer de confirmación de email** (~2/hora, integrado de
  Supabase): decidir si se queda así, se desactiva la confirmación de email
  (razonable para un proyecto de un solo usuario), o se configura SMTP
  propio.

## 10. Capa social mínima — perfiles públicos + seguir (sin feed)

Basado en el análisis comparativo de `apps-fitness-loggers-sociales.md`
(Strava/Hevy/Strong) — decisión explícita del usuario: **opción B ("seguir
sin feed")**, ni el link de solo-lectura sin cuenta (más barato) ni el feed
completo con reacciones/comparaciones estilo Hevy/Strava (mucho más caro y
probablemente prematuro con un solo usuario real).

**Alcance:**
- Perfil público/privado por usuario, controlable desde `html/perfil.html`
  (columna `is_public boolean`, en tabla `profiles` nueva o donde tenga más
  sentido al implementar).
- Relación de "seguir": tabla `follows` (`follower_id`, `followed_id`). Si
  el perfil es privado, seguir requiere solicitud/aceptación (como
  Strava); si es público, seguimiento directo — a confirmar al
  implementar.
- Poder ver el perfil de otro usuario que sigues (o que es público): su
  rutina activa y progreso/gráficas, reutilizando en modo lectura las
  pantallas ya existentes (`progreso.html`, etc.) en vez de construir
  pantallas nuevas.
- **Explícitamente fuera de alcance** (eso sería la opción C, descartada):
  feed cronológico, reacciones/comentarios, comparación de estadísticas
  entre perfiles, y copiar la rutina de otro usuario ("Save as Routine" de
  Hevy).

**Cambios de esquema implicados** (nueva migración, nunca editar las ya
corridas):
- Tabla `profiles` (o extender la que se use) con `is_public`.
- Tabla `follows`.
- Policies RLS nuevas de `select` para exponer datos marcados públicos o
  visibles a seguidores — **este es el primer caso del proyecto donde un
  usuario necesita leer datos de otro usuario**; hoy todas las policies son
  `auth.uid() = user_id` estricto, así que escribir esto con cuidado y no
  por analogía con las policies existentes.

**Pendiente de definir antes de implementar** (preguntar al usuario, no
asumir): qué tablas exactamente se vuelven visibles a un seguidor —¿solo
`workout_sessions`/`session_sets`? ¿también `body_measurements`, que es
más sensible?— y si seguir un perfil privado requiere aprobación o queda
para una iteración futura.

**Prioridad relativa:** no bloquea el resto del roadmap funcional (#3–#7,
#9) ni depende de ellos técnicamente, pero sí depende de que exista más de
un usuario real para tener sentido probarlo — razonable dejarlo después de
onboarding (#8/sección "Orden sugerido") aunque no es estrictamente
necesario esperar.

## 11. Diseño visual y animaciones (POSPUESTO A PROPÓSITO)

Reconocido por el usuario como "demasiado simple", pero pospuesto
explícitamente hasta terminar los puntos 1–10. Mientras tanto: las pantallas
nuevas (bottom nav, perfil, onboarding, calendario mensual) deben ser
usables y consistentes con el sistema oscuro/ámbar **ya implementado** en
`css/style.css` y `skills/SKILL.md` (`interface-design`), pero sin invertir
tiempo extra en pulir animaciones o microinteracciones hasta que el usuario
lo pida.

**La dirección del rediseño ya está decidida** — `sistema-diseño-visual.md`
documenta el sistema "Clean UI" (blanco/azul) aprobado como destino, que se
construirá con Claude Design en una sesión aparte. Lo que sigue pospuesto es
**cuándo** se implementa (después de terminar los puntos 1–10), no **hacia
qué** se va a rediseñar.
