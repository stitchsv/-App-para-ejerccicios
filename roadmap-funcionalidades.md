# Roadmap de funcionalidades pendientes — App de entrenamiento

> Este documento es la fuente de verdad para el trabajo **funcional** pendiente,
> separado de `contexto-proyecto-app-entrenamiento.md` (que describe el estado
> ya construido/verificado, el stack, el esquema y el sistema de diseño). Leer
> ese documento primero si es una sesión nueva sin contexto — este asume todo
> lo que ahí se describe como punto de partida.

## Filosofía de esta fase

El usuario probó la app desplegada en Vercel y el feedback es: **la base
funcional necesita crecer bastante antes de invertir en diseño**. Las
animaciones y el pulido visual actual se reconocen como "demasiado simples",
pero la decisión explícita es **posponer diseño/animaciones hasta que todas
las funciones de abajo estén construidas**. No reabrir esa decisión sin que
el usuario lo pida — no proponer trabajo de CSS/animación no solicitado
mientras haya items funcionales pendientes en este documento.

## Orden sugerido de trabajo

1. **Rutinas múltiples** (esquema) — bloquea onboarding y "cambiar de rutina".
2. **Menú inferior + pantalla de Perfil** (incluye mover logout ahí).
3. **Onboarding** (pantalla de primer inicio).
4. **Fix responsive de "Hoy".**
5. **Catálogo de ejercicios por músculo + autofill de peso.**
6. **Heatmap mensual estilo racha + integración historial/progreso.**
7. **Separación visual medidas/fuerza dentro de Progreso.**
8. Pendientes técnicos heredados (2 gráficas, redirect URL, email).
9. (Después de todo lo anterior) diseño visual y animaciones.

Este orden prioriza lo que desbloquea otras piezas (rutinas múltiples) y lo
estructural (navegación) antes que ajustes dentro de pantallas ya existentes.

---

## 1. Rutinas múltiples y personalizadas (cambio de esquema)

**Estado: mecanismo implementado (código listo, falta correr la migración
en Supabase — ver abajo). Rutinas de ejemplo (PPL, Arnold, Full Body) NO
incluidas a propósito** — decisión explícita del usuario: solo el mecanismo
ahora, el contenido de rutinas de ejemplo se hace junto con el onboarding
(#8), que es donde realmente se usa.

Implementado:
- Migración `supabase/migrations/20260905000000_multiple_routines.sql` —
  **pendiente de correr manualmente en el SQL Editor de Supabase**, no se
  ejecutó desde aquí (no hay CLI/credenciales conectadas a este entorno).
  Crea `routines`, migra los `routine_days` existentes a una rutina "Mi
  rutina" activa (sin perder datos), y mueve el unique constraint de
  `(user_id, day_of_week)` a `(routine_id, day_of_week)`.
- `js/editor-rutina.js` + `html/editor-rutina.html`: sección "Mis rutinas"
  nueva (crear, activar, renombrar, eliminar) y el editor de días ahora
  opera sobre la rutina seleccionada, con soporte para agregar/eliminar
  días (antes solo se podía editar enfoque/notas de días ya sembrados).
- `js/routine-data.js`, `js/historial.js`, `js/progreso.js`: las tres
  consultas que leían `routine_days` fueron corregidas para filtrar
  siempre por la rutina con `is_active = true` (si no se hacía esto, con
  más de una rutina guardada "Hoy", el historial y el heatmap de
  consistencia hubieran mezclado días de rutinas distintas).

**Antes de seguir con el resto del roadmap, correr la migración nueva en
Supabase y verificar:** que "Hoy" siga mostrando la rutina correcta, que
Historial/Progreso no se rompan, y probar crear una rutina nueva, agregar
un día, activar/desactivar, y eliminar una rutina no activa.

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

## 2. Navegación: menú inferior

Reemplazar la navegación actual por un **bottom nav fijo** estilo
Instagram/TikTok (iconos fijos abajo de la pantalla, con manejo de
safe-area para notch en móvil). El logout **no** va en este menú (ver #3).

## 3. Perfil (pantalla nueva)

- Preferencias: modo claro/oscuro, tamaño de letra.
  - El sistema de diseño actual ("workbench de gimnasio", ver
    `contexto-proyecto-app-entrenamiento.md`) es **un solo tema oscuro fijo**
    sin `data-bs-theme` ni variables para modo claro — introducir el toggle
    implica crear la paleta clara y el mecanismo de cambio, no solo un
    switch visual.
  - Decidir dónde vive la preferencia: `localStorage` (simple, por
    dispositivo, suficiente para un solo usuario real) vs. tabla
    `user_preferences` en Supabase (sincroniza entre dispositivos). Por
    defecto usar `localStorage` salvo que el usuario pida sincronización
    entre dispositivos explícitamente.
- **Botón de cerrar sesión vive aquí**, no como parte del menú principal.

## 4. Dashboard "Hoy": responsive

Reportado como roto/no responsive en las pruebas del usuario. Arreglar antes
de seguir agregando funcionalidad a esa pantalla.

## 5. Registrar sesión: catálogo por músculo + autofill de peso

- **Selección en dos pasos:** elegir grupo muscular → ver lista de
  ejercicios de ese músculo. La columna `exercises.muscle_group` ya existe
  en el esquema — es trabajo de UI (reemplazar/complementar el buscador
  libre actual `.search-combo`), no de esquema.
- **Autofill de peso:** al capturar el peso en la primera serie de un
  ejercicio, propagarlo automáticamente como valor por defecto en las series
  siguientes del mismo ejercicio dentro de esa sesión.
- **Excepción — técnicas de entrenamiento:** si el usuario marca una técnica
  como *dropset* o *superset* en una serie, esa serie (o cadena) no hereda
  el autofill.
  - Implica agregar un selector de técnica en la UI de registrar sesión.
  - Decidir si se persiste: hoy `session_sets` no tiene columna para esto.
    Si se quiere que el historial refleje qué técnica se usó, agregar
    `session_sets.technique text check (technique in ('dropset',
    'superset'))` (nullable) vía nueva migración. Si es solo para controlar
    el autofill en el momento y no importa para el historial, puede quedar
    como estado de UI sin tocar el esquema — **preguntar al usuario cuál de
    las dos antes de tocar el esquema**, ya que no fue explícito.

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
- **Redirect URL de recuperación de contraseña en Supabase:** agregar
  `https://<url-de-vercel>/html/reset-password.html` en Authentication →
  URL Configuration → Redirect URLs. No confirmado si ya se probó
  específicamente el flujo de "olvidé mi contraseña" en producción — validar
  antes de asumir que funciona.
- **Rate limit del mailer de confirmación de email** (~2/hora, integrado de
  Supabase): decidir si se queda así, se desactiva la confirmación de email
  (razonable para un proyecto de un solo usuario), o se configura SMTP
  propio.

## 10. Diseño visual y animaciones (POSPUESTO A PROPÓSITO)

Reconocido por el usuario como "demasiado simple", pero pospuesto
explícitamente hasta terminar los puntos 1–9. Mientras tanto: las pantallas
nuevas (bottom nav, perfil, onboarding, calendario mensual) deben ser
usables y consistentes con `css/style.css` y `skills/SKILL.md`
(`interface-design`), pero sin invertir tiempo extra en pulir animaciones o
microinteracciones hasta que el usuario lo pida.
