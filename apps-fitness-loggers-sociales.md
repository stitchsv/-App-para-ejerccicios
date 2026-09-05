# Loggers Sociales de Fitness: Strava, Hevy y Strong — Análisis para tu proyecto

## Resumen ejecutivo

Este arquetipo (**el usuario registra lo que hizo, la app no le dice qué hacer, y una capa social da motivación**) es el que mejor describe hacia dónde vas: tu proyecto ya es un logger de fuerza con auth/RLS real, y el roadmap actual (`roadmap-funcionalidades.md`) ya cubre buena parte de las piezas estructurales de este arquetipo. Las tres apps de referencia son **Strava** (cardio/GPS + comunidad masiva), **Hevy** (fuerza + comunidad + algoritmo opcional) y **Strong** (fuerza pura, sin nada social).

Comparado contra tu contexto real (`contexto-proyecto-app-entrenamiento.md`) y tu roadmap, la conclusión central es: **tienes el core loop resuelto mejor que Strong en algunos aspectos (comparación plan-vs-ejecución en vivo), pero no tienes absolutamente ninguna pieza de la capa social — ni está en el roadmap actual.** Esa es la brecha que separa tu app de "poder mostrarla a amigos y familia" en el sentido en que Strava/Hevy lo permiten, y es la sección 8 la que te interesa leer primero.

Nota sobre "comprar rutinas": ninguna de las tres apps de este arquetipo tiene un marketplace público de rutinas de terceros. Lo que existe es suscripción a analítica (Strava), un generador algorítmico de pago dentro de la misma app (Hevy Trainer) o un producto B2B aparte (Hevy Coach). Dado que tu proyecto es gratuito y de uso personal/círculo cercano, esto probablemente no aplica todavía — lo dejo señalado para que lo descartes conscientemente en vez de que quede como duda abierta.

---

## 1. Strava — cardio, GPS y la comunidad más grande del sector

**Autenticación y perfil:** registro por email, Google o Facebook, con login biométrico en móvil y verificación en dos pasos añadida en 2025. El perfil guarda deporte principal, altura/peso y tiene controles de privacidad granulares (Everyone / Followers / Only You) por actividad.

**Onboarding:** registro → completar perfil (deporte, métricas corporales) → configurar privacidad → seguir atletas o contactos. Es un onboarding ligero: prioriza que el usuario suba su primera actividad rápido, no un cuestionario largo.

**Core loop:** el usuario graba una actividad con GPS (o la sincroniza desde un reloj) → esos datos alimentan gráficas de progreso, comparaciones históricas y, si paga, analítica avanzada (Fitness & Freshness tipo CTL/ATL, Performance Predictions, Power Curve). Strava es "actividad-céntrica", no "rutina-céntrica": no le dice al usuario qué entrenar.

**Capa social (el corazón del producto):** feed con kudos y comentarios, clubs, segmentos con leaderboards (competir en tramos de ruta), retos grupales y "Athlete Intelligence" (resúmenes de entrenamiento generados por IA). Strava reporta más de 150 millones de atletas registrados y, según su informe anual, los clubs casi se cuadruplicaron en 2025 hasta 1 millón en total. Este dato importa mucho para ti: **el crecimiento reciente de Strava viene de la comunidad, no de nuevas funciones de tracking.**

**"Comprar rutinas":** Strava en sí no vende programas de entrenamiento. En 2025 adquirió **Runna** (planes de running con coaching por IA) y en 2025-2026 lanzó una suscripción combinada Strava+Runna (149,99 USD/año, con ahorro de hasta 60% frente a pagar ambas por separado). Es decir: resolvió la necesidad de "vender rutinas" comprando una empresa entera y ofreciendo un bundle, no construyendo un marketplace interno.

**Monetización:** freemium. Gratis: GPS ilimitado, feed, kudos, clubs, segmentos básicos. De pago (11,99 USD/mes o 79,99 USD/año): analítica avanzada, mapas offline, leaderboards filtrados y (desde agosto 2024) los retos grupales, lo que generó cierta crítica de usuarios por mover funciones sociales detrás del muro de pago.

---

## 2. Hevy — el logger de fuerza más social y con IA opcional

**Autenticación y perfil:** registro estándar (email/social login); perfil público o privado configurable. Con perfil público, cualquiera puede ver tu actividad; con perfil privado, deben pedir seguirte y ser aceptados.

**Onboarding:** flujo corto orientado a crear tu primera rutina de inmediato: crear una rutina (plantilla reutilizable) o elegir una de la biblioteca de Hevy filtrando por objetivo, nivel y equipo disponible. El valor se entrega en minutos, no en un cuestionario largo.

**Core loop:** eliges una rutina → registras sets, reps y peso (Hevy autocompleta con lo que hiciste la última vez, clave para la sobrecarga progresiva) → terminas el entrenamiento y decides si lo publicas. El logging está optimizado para velocidad (pocos taps por set).

**Capa social:** un feed ("content feed") con las publicaciones de gente que sigues, un modo "Discover" para ver actividad pública de desconocidos, comparación de estadísticas entre perfiles (volumen, PRs, tiempo entrenado), y una función distintiva: **puedes guardar el entrenamiento de cualquier persona como tu propia rutina** ("Save as Routine") o copiarlo para hacerlo tú mismo ("Copy Workout"). También se integra con Strava para republicar tus sesiones de gimnasio en el feed de Strava.

**"Comprar rutinas":** no hay marketplace de creadores. Existen dos capas separadas:
- **Hevy Trainer** (lanzado en febrero de 2026): un generador algorítmico dentro de la propia app, de pago (parte de Hevy Pro), que crea el programa según tu objetivo/equipo/frecuencia y ajusta automáticamente el peso de trabajo según lo que vas registrando.
- **Hevy Coach**: un producto B2B totalmente aparte — el entrenador paga una suscripción para gestionar clientes (de 1 a 500), y sus clientes usan Hevy gratis para recibir el programa y chatear con su coach.

**Monetización:** freemium generoso. Gratis para siempre: logging ilimitado, 4 rutinas, 7 ejercicios personalizados, 3 meses de historial de gráficas. Hevy Pro: 2,99 USD/mes, 23,99 USD/año o 74,99 USD de por vida — desbloquea rutinas y ejercicios ilimitados, historial completo y Hevy Trainer.

---

## 3. Strong — el logger minimalista, sin nada social

**Autenticación y perfil:** registro simple; el onboarding es deliberadamente mínimo, sin cuestionario de objetivos ni de equipo. La filosofía del producto es "tú ya sabes qué entrenar, solo necesitas anotarlo rápido."

**Core loop:** eliges o creas una rutina → registras cada set en máximo tres taps → Strong calcula 1RM estimado, volumen y frecuencia por grupo muscular. Tiene mejor manejo de tipos de set avanzados (dropsets, series de calentamiento, AMRAP) que Hevy, lo cual lo hace preferido por lifters muy experimentados.

**Capa social:** no existe. Sin feed, sin seguir gente, sin comparar con otros. Es la app de referencia para quien quiere loggear sin ninguna fricción social.

**"Comprar rutinas":** no existe biblioteca de rutinas de terceros, generador por IA, ni marketplace. El usuario trae su propio programa (de un coach, un libro, o su cabeza) y solo lo registra.

**Monetización:** el mejor free tier "puro" del mercado — logging ilimitado, historial completo, sin anuncios, biblioteca de 450+ ejercicios; solo limita a 3 rutinas guardadas. Strong Premium (4,99 USD/mes o 29,99 USD/año) desbloquea rutinas ilimitadas, analítica de volumen/frecuencia por grupo muscular, exportar a CSV y sincronización con Apple Health/Watch.

---

## 4. Comparación directa

| | **Strava** | **Hevy** | **Strong** |
|---|---|---|---|
| Dominio principal | Cardio / GPS | Fuerza | Fuerza |
| Onboarding | Ligero, social-first | Corto, valor inmediato | Mínimo, sin preguntas |
| ¿Genera rutinas? | No (delega a Runna) | Sí, opcional y de pago (Trainer) | No |
| Feed / seguir gente | Sí, es el core del producto | Sí, con feed y "Discover" | No existe |
| Comparar con otros | Leaderboards por segmento | Comparación de perfil a perfil | No |
| Copiar rutina de otro usuario | No aplica | Sí ("Save as Routine") | No |
| Vender/comprar programas | Vía adquisición (Runna) + bundle | Vía producto aparte (Hevy Coach, B2B) | No existe |
| Modelo de precio | Freemium (~80 USD/año) | Freemium muy generoso (~24 USD/año) | Freemium + pago único opcional (~30 USD/año) |
| Usuarios reportados | ~150M+ | 9M+ | No público, pero valorado en ~108.000 reseñas en App Store |

---

## 5. El flujo de información, paso a paso (común a los tres)

1. **Registro/login** → cuenta creada, sesión persistente.
2. **Onboarding mínimo** → a diferencia de un generador algorítmico (Fitbod) o una plataforma de coaching (Trainerize), aquí el onboarding NO necesita capturar objetivo/nivel/lesiones en profundidad, porque la app no va a prescribir nada. Esto simplifica mucho el backend comparado con lo que necesitarías si añades generación automática.
3. **Rutina** → el usuario la crea él mismo, la copia de otro usuario (Hevy), o la trae de fuera (Strong). Solo Hevy Trainer y Strava+Runna generan una rutina por ti, y ambas son capas de pago añadidas encima del logger base.
4. **Registro del entrenamiento** → sets/reps/peso o actividad GPS. El dato clave que hace útil a estas apps es que **muestran tu última sesión en el momento de registrar la siguiente** (auto-fill de Hevy, historial de Strong) — esto es lo mínimo que un logger necesita para ser útil, y no requiere ningún algoritmo.
5. **El dato vuelve al usuario como insight** → gráficas de volumen, PRs, 1RM estimado, comparación temporal. Esta es la función que retiene: sin esto, un logger es solo una hoja de cálculo con más pasos.
6. **Capa social (donde aplica)** → publicar, dar kudos/likes, comentar, seguir, comparar. Strava y Hevy la tienen; Strong la omite por completo y no le ha hecho falta para tener una base de usuarios sólida — dato importante: **la capa social es una decisión de producto, no un requisito técnico para que un logger funcione.**
7. **Monetización** → siempre gatea analítica avanzada o capacidades adicionales (historial ilimitado, exportar datos, generación de rutinas), nunca el registro básico. Los tres mantienen el logging esencial gratis indefinidamente.

---

## 6. Qué ya tienes resuelto igual o mejor que estas tres apps

Repasando `contexto-proyecto-app-entrenamiento.md` y `roadmap-funcionalidades.md` contra el análisis de arriba:

- **Auth + RLS multiusuario real**: ya está — email/password con confirmación y recuperación (aunque el redirect de recuperación está pendiente de arreglar, ver #9 de tu roadmap). Es más de lo que Strong necesitó para llegar a millones de reseñas.
- **Rutinas múltiples y con nombre** (`routines` + `routine_id`, commit `d7f49b1`): ya resuelto, con el mismo patrón conceptual que Strong/Hevy (el usuario trae o crea su propia rutina; no hay generación algorítmica todavía, lo cual está bien para este arquetipo).
- **Comparación plan vs. ejecución en vivo** (texto fantasma con el objetivo + borde verde al completar en "Registrar sesión"): esto es una función que **ninguna de las tres apps de este análisis tiene tan explícita** — Hevy y Strong muestran tu historial pasado, pero no tu *plan* al lado de lo que estás registrando ahora mismo. Es un diferenciador real de tu proyecto, no una carencia.
- **Historial filtrable + heatmap de consistencia**: ya existe (8 semanas hoy, calendario mensual en el roadmap #6) — cubre la misma necesidad que el historial de Strong y las gráficas de consistencia, y tu plan de mejorarlo a calendario mensual tipo racha lo deja al nivel de lo que estas apps ofrecen.
- **Tema claro/oscuro + tamaño de letra en Perfil**: esto va más allá de lo que Strava/Hevy/Strong ofrecen (ninguna tiene selector de tamaño de letra) — no es necesario para el arquetipo, pero no sobra.

## 7. Lo que le falta a tu proyecto, específicamente frente a este arquetipo

Esto es lo que tu propio roadmap **no cubre todavía** y que las tres apps de este análisis sí resuelven — organizado por si ya está en tu roadmap (aunque incompleto) o si es completamente nuevo:

### 7.1 — Ya está en tu roadmap, pero vale la pena revisar el alcance

**Autofill de peso (#5 del roadmap) — alcance más corto de lo que hacen Hevy/Strong.** Tu roadmap describe el autofill como propagar el peso de la primera serie a las series siguientes **dentro de la misma sesión**. Eso resuelve fricción de tipeo, pero no es la función que retiene en Hevy/Strong: ellas precargan el peso **de la sesión anterior en la que hiciste ese mismo ejercicio**, como valor por defecto al empezar una serie nueva — eso es lo que le muestra al usuario "cuánto debería intentar superar hoy" sin que tenga que abrir el historial. Tu proyecto ya tiene la pieza de datos para esto (`session_sets.weight_kg` con `workout_sessions.session_date`), así que es una extensión natural del punto #5, no una funcionalidad nueva: al abrir un ejercicio en "Registrar sesión", buscar el último `session_sets` de ese `exercise_id` para ese usuario y usarlo como valor fantasma/por defecto, además del target del plan que ya muestras. Vale la pena decidir si esto se agrega como parte de #5 o como un punto aparte, ya que tiene una fuente de datos distinta (histórico de sesiones vs. mismo formulario).

### 7.2 — No está en tu roadmap: la capa social completa

Ninguno de los 10 puntos de `roadmap-funcionalidades.md` toca esto, y es la pieza que específicamente separa "app personal" de "algo que le muestras a tus amigos" en Strava y Hevy. Concretamente, lo que existe en esas dos apps y no en tu proyecto ni en tu roadmap:

- **Perfil público/privado por usuario**: hoy tu modelo es "cada usuario ve solo lo suyo" vía RLS estricta (`auth.uid() = user_id`). Para que un amigo vea tu progreso necesitarías una policy adicional (probablemente una tabla `profiles` con una columna `is_public boolean`, y policies de `select` más permisivas para datos marcados públicos) — es un cambio de RLS no trivial dado que ahora mismo *todo* está aislado por usuario a propósito.
- **Relación de "seguir"**: una tabla `follows` (`follower_id`, `followed_id`) — la pieza mínima para que exista cualquier feed o comparación entre usuarios.
- **Feed de actividad**: una vista o tabla derivada de `workout_sessions` de la gente que sigues, ordenada por fecha, con datos suficientes para mostrar "quién entrenó qué hoy" sin exponer el detalle completo de series si no se quiere.
- **Reacciones/comentarios**: lo mínimo que usan Strava (kudos) y Hevy (likes/comentarios) — una tabla simple `reactions` o `comments` con `session_id` + `user_id`.
- **Comparar rutinas entre usuarios / copiar la rutina de un amigo**: el equivalente a "Save as Routine" de Hevy. Con tu modelo de `routines` ya construido (#1 del roadmap), técnicamente sería "clonar" una `routine` + sus `routine_days`/`routine_day_exercises` de otro usuario a la tuya — mecánicamente parecido a lo que ya hiciste para las rutinas de ejemplo (`source = 'template'`) en el punto #1, solo que la fuente sería otro `user_id` en vez de una plantilla del sistema.

**Por qué esto importa más que el resto de tu roadmap para tu objetivo declarado:** tu roadmap actual (onboarding, catálogo por músculo, heatmap, perfil) mejora la experiencia del único usuario que ya tienes hoy. Ninguno de esos puntos, por sí solo, le da una razón a un amigo o familiar para abrir la app más de una vez — eso es específicamente lo que la capa social resuelve en Strava/Hevy (accountability social, no solo mejor UX personal).

### 7.3 — Decisión pendiente, no técnica: alcance del "mostrar a amigos"

Antes de convertir el punto 7.2 en tareas de roadmap, vale la pena que decidas explícitamente (de la misma forma en que ya decidiste posponer diseño) qué tan lejos quieres llegar, porque el costo de implementación escala mucho entre estas tres opciones:

- **Opción A — "Compartir de forma pasiva"**: un link de solo-lectura a tu progreso/rutina (sin cuenta del otro lado), similar a cómo Hevy permite compartir una rutina como imagen sin que el receptor tenga cuenta. Es la más barata de construir y no toca tu modelo de RLS multiusuario.
- **Opción B — "Seguir sin feed"**: perfiles públicos + relación de seguir + poder ver el perfil de otro usuario (como Strava permite ver perfiles), pero sin un feed cronológico propio. Complejidad media.
- **Opción C — "Feed completo estilo Hevy/Strava"**: todo lo de 7.2, incluyendo feed, reacciones y comparación. Es el nivel de esfuerzo más alto y probablemente no vale la pena antes de que exista más de un usuario real usando la app.

Dado el criterio que ya usas en tu roadmap (rutinas múltiples se hizo primero porque desbloqueaba onboarding y "cambiar de rutina"), la recomendación sería no bloquear el resto del roadmap funcional para construir 7.2 ahora — pero sí agregarlo explícitamente como un punto numerado (ej. "#11 — Capa social mínima") con la opción elegida, para que no quede como un vacío invisible entre "terminar funcional" y "empezar diseño".

---

## Fuentes consultadas
Strava (business.strava.com, support.strava.com, press.strava.com), Runna (support.runna.com), Hevy (hevyapp.com, help.hevyapp.com, hevycoach.com), Strong (App Store, Google Play), y reviews comparativas de RepReturn, SensAI, PRPath, Setgraph, Push/Pull, JEFIT blog y Stronger app blog (todas consultadas en 2026). Contraste de brechas basado en `contexto-proyecto-app-entrenamiento.md` y `roadmap-funcionalidades.md` del proyecto real del usuario.
