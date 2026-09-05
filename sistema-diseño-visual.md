# Sistema de Diseño Visual — App de Entrenamiento

> **Este archivo es la fuente de verdad ÚNICA para diseño visual y componentes de UI.**
> Separado deliberadamente de `contexto-proyecto-app-entrenamiento.md` (que es técnico/arquitectura).
> Actualiza este archivo cuando cambies colores, tipografía, espaciados, componentes o animaciones.
> No editarla sin revisar su impacto en todas las pantallas.
>
> **Estado: dirección de diseño APROBADA, todavía NO IMPLEMENTADA en el
> código.** La app en producción sigue corriendo el sistema oscuro
> "workbench de gimnasio" (v1.0 más abajo). Este Clean UI blanco/azul
> (v2.0) se va a construir con Claude Design en una sesión aparte y luego
> se integrará al repo — no lo implementes en `css/style.css`/HTML hasta
> que el usuario lo pida explícitamente. Mientras tanto, este documento
> sirve como referencia de diseño (colores exactos, componentes,
> espaciado) para esa sesión de Claude Design.

---

## Filosofía de diseño

**Clean UI minimalista + blanco + accesibilidad alta**

- Sin decoración innecesaria
- Máxima claridad en la jerarquía de información
- Espacio en blanco generoso (respiración visual)
- Contraste alto para legibilidad sin esfuerzo
- Conexión emocional mínima, utilidad máxima
- Que cada elemento tenga un propósito visible

---

## Paleta de color (valores hex exactos)

### Superficies

| Nombre | Hex | Uso |
|---|---|---|
| Fondo base | `#FFFFFF` | Fondo de toda la app |
| Tarjeta / Panel | `#F8F8F8` | `.card`, `.panel`, contenedores de contenido |
| Input / Textarea | `#FAFAFA` | Campos de formulario, menos contraste que tarjeta para distinguir entrada de contenido |
| Borde subtle | `#E5E5E5` | Bordes de tarjetas, divisores, líneas finas |
| Hover ligero | `#F0F0F0` | Fondo al pasar mouse sobre elementos, muy sutil |

### Texto

| Nombre | Hex | Uso |
|---|---|---|
| Primario | `#1A1A1A` | Texto principal, encabezados, legibilidad máxima |
| Secundario | `#666666` | Texto descriptivo, labels, información de contexto |
| Muted / Hint | `#999999` | Placeholders, help text, información de baja prioridad |
| Deshabilitado | `#CCCCCC` | Botones/inputs deshabilitados |

### Acentos funcionales

| Nombre | Hex | Uso | Hover |
|---|---|---|---|
| Primario (CTA) | `#2563EB` | Botón principal, acciones positivas, "Siguiente", "Guardar" | `#1D4ED8` |
| Secundario | `#E0E7FF` | Botón outline, acciones neutrales | N/A (cambiar a hover del primario en outline) |
| Éxito | `#10B981` | Checkmarks, "Completado", estados positivos, badges verdes | `#059669` |
| Alerta / Aviso | `#F59E0B` | Warnings, necesita atención, data faltante | `#D97706` |
| Peligro / Error | `#EF4444` | Errores, delete, rechazar, "Dejar de seguir" | `#DC2626` |
| Info | `#3B82F6` | Información general, hints no críticos | `#2563EB` |

### Especiales

| Nombre | Hex | Uso |
|---|---|---|
| Divider / Separator | `#D1D5DB` | Línea entre secciones, bordes suaves |
| Overlay / Modal | `rgba(0,0,0,0.5)` | Fondo oscuro semitraslúcido bajo modal |

---

## Tipografía

### Familia principal

- **Sistema:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Fallback:** System fonts, completamente portable, sin custom fonts que cargar
- **Razón:** Inter es la tipografía estándar de clean UI (Stripe, GitHub, Vercel usan variantes). Fallback a system fonts hace que no dependa de CDN.

### Escala de tamaños

| Contexto | Tamaño | Peso | Altura de línea | Uso |
|---|---|---|---|---|
| **h1** Título pantalla | 32px | 700 | 1.2 | Encabezado de página (ej. "Onboarding", "Progreso") |
| **h2** Subtítulo / Sección | 20px | 600 | 1.3 | Títulos de secciones, encabezados de tarjeta |
| **h3** Mini título | 16px | 600 | 1.4 | Encabezados de subsecciones |
| **Body** Texto principal | 14px | 400 | 1.5 | Párrafos, descripciones, contenido |
| **Body small** Secundario | 12px | 400 | 1.5 | Labels, helper text, información pequeña |
| **Caption** Muy pequeño | 11px | 400 | 1.4 | Timestamps, footnotes |
| **Input / Form** | 14px | 400 | 1.5 | Dentro de inputs y selects |
| **Mono (números)** | 14px | 500 | 1.4 | Peso, reps, fecha, valores numéricos — fuente monospace `font-family: 'Courier New', monospace` + `font-variant-numeric: tabular-nums` |

### Reglas de tipografía

- **Contraste mínimo:** 4.5:1 para texto principal sobre fondo (cumple WCAG AA)
  - Primario `#1A1A1A` sobre blanco `#FFFFFF` = 20.6:1 ✓
  - Secundario `#666666` sobre blanco = 6.8:1 ✓
  - Muted `#999999` sobre gris claro `#F8F8F8` = 5.9:1 ✓
- **Sin underline en links a menos que esté en prosa** — en UI, usa color + opacity en hover
- **Números siempre en monospace** — regla global en CSS: `input[type="number"], .stat { font-family: monospace; font-variant-numeric: tabular-nums; }`

---

## Componentes visuales

### Botón (4 variantes)

#### Botón primario (CTA)
```
Fondo: #2563EB
Texto: #FFFFFF
Padding: 10px 16px
Border radius: 6px
Borde: ninguno
Font: 14px / 600 weight
Hover: fondo → #1D4ED8
Active: scale(0.98) + opacidad 0.8
Transición: 0.15s
```

#### Botón secundario (outline)
```
Fondo: transparent
Texto: #2563EB
Padding: 10px 16px
Border radius: 6px
Borde: 1px solid #2563EB
Font: 14px / 600 weight
Hover: fondo → #E0E7FF (no cambiar texto)
Active: scale(0.98)
```

#### Botón peligro (delete / logout)
```
Fondo: #EF4444
Texto: #FFFFFF
Padding: 10px 16px
Border radius: 6px
Borde: ninguno
Font: 14px / 600 weight
Hover: fondo → #DC2626
Active: scale(0.98)
```

#### Botón deshabilitado (cualquier variante)
```
Opacidad: 0.5
Cursor: not-allowed
Sin hover effect
```

### Input / Textarea

```
Fondo: #FAFAFA
Texto: #1A1A1A
Borde: 1px solid #E5E5E5
Border radius: 6px
Padding: 8px 12px
Font: 14px
Placeholder: #999999
Focus: borde → #2563EB (2px), outline: none, box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)
Transición: 0.15s
```

### Card / Panel

```
Fondo: #F8F8F8
Borde: 1px solid #E5E5E5
Border radius: 8px
Padding: 16px
Sin sombra
Hover: fondo → #F0F0F0 (muy sutil, solo si clickeable)
```

### Chip (pastilla de filtro / selección)

```
Fondo: #E0E7FF (no seleccionado)
Texto: #2563EB
Padding: 6px 12px
Border radius: 999px (border-radius redondo)
Borde: 1px solid #2563EB
Font: 13px
Cursor: pointer
Hover: fondo → #C7D2FE
Active / Seleccionado: 
  - Fondo: #2563EB
  - Texto: #FFFFFF
  - Borde: 1px solid #2563EB
Transición: 0.15s
```

### Badge (pequeño, informativo)

```
Fondo: ver tabla abajo por tipo
Texto: blanco si fondo oscuro, #1A1A1A si fondo claro
Padding: 3px 8px
Border radius: 4px
Font: 11px / 600 weight
Sin borde
```

**Tipos de badge:**
- Éxito: fondo `#10B981`, texto blanco
- Alerta: fondo `#F59E0B`, texto blanco
- Info: fondo `#3B82F6`, texto blanco
- Neutro: fondo `#D1D5DB`, texto `#1A1A1A`

### Icono (SVG inline)

```
Tamaño estándar: 20px × 20px
Stroke width: 1.5 para lineart, 2 para íconos más pequeños
Color: heredar de texto (currentColor en SVG)
Hover: cambiar opacidad a 0.7 (si el padre tiene :hover)
```

### Checkbox / Radio (nativo del navegador, mínimo estilo)

```
Accent color: #2563EB (para que el nativo use el azul)
Focus ring: outline 2px solid #2563EB, offset 2px
```

### Tabla (`.rde-table` - responsive)

```
Encabezado:
  - Fondo: #E5E5E5
  - Texto: #1A1A1A / 600 weight
  - Padding: 12px
  - Border bottom: 1px solid #D1D5DB

Filas:
  - Padding: 12px
  - Border bottom: 1px solid #E5E5E5
  - Hover: fondo → #F8F8F8

Bajo 700px:
  - Se apila en 2 columnas
  - Label visible antes de cada valor
  - Padding aumenta a 16px (toque más grande en móvil)
```

### Heatmap / Grid de consistencia (`.heatmap-grid`)

```
Celda tamaño: 32px × 32px (móvil: 28px)
Border radius: 4px
Borde: 1px solid #E5E5E5
Opacidad: varía por estado

Estados:
  - Entrenado: fondo #10B981, opacidad 1
  - Perdido: fondo #EF4444, opacidad 0.5
  - Sin plan: fondo #D1D5DB, opacidad 0.3
  - Futuro: fondo #FFFFFF (ninguno), borde gris claro
  - Hover: scale(1.1), z-index arriba

Tooltip (title nativo): mostrar fecha exacta
```

### Alerta / Alert

```
Contenedor:
  - Padding: 12px 14px
  - Border radius: 6px
  - Border left: 3px solid (color según tipo)
  - Fondo: color diluido (ej. alert-info: fondo #EFF6FF)

Texto:
  - Primario: color según tipo (éxito: #10B981, error: #EF4444, etc.)
  - Font: 14px

Tipos:
  - alert-success: borde/texto #10B981, fondo #F0FDF4
  - alert-danger: borde/texto #EF4444, fondo #FEF2F2
  - alert-warning: borde/texto #F59E0B, fondo #FFFBEB
  - alert-info: borde/texto #3B82F6, fondo #EFF6FF
```

### Modal / Overlay

```
Fondo: rgba(0, 0, 0, 0.5) (semitraslúcido oscuro)
Transición: 0.2s opacity
Panel dentro:
  - Fondo: #FFFFFF
  - Border radius: 8px
  - Box shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
  - Ancho máximo: 90vw (responsive)
  - Max height: 90vh (con scroll interno si falta espacio)
  - Padding: 20px (móvil: 16px)
```

### Follow Button (`.follow-btn`, componente nuevo)

Estados y estilos:

```
Estado "Seguir" (sin relación previa):
  - Tipo: primario
  - Texto: "Seguir"
  - Ícono: + (pequeño)

Estado "Solicitud enviada" (perfil privado, pending):
  - Tipo: secundario (outline)
  - Texto: "Solicitud enviada"
  - Disabled appearance (no clickeable)

Estado "Siguiendo" (ya conectados):
  - Tipo: primario, pero con fondo #10B981 (éxito)
  - Texto: "Siguiendo"
  - On hover/click: mostrar "Dejar de seguir" con confirmación
```

---

## Espaciado (tokens)

Escala basada en 4px:

| Token | Valor | Uso |
|---|---|---|
| `xs` | 4px | Gap muy pequeño entre elementos (raro) |
| `sm` | 8px | Gap entre inputs en un formulario |
| `md` | 12px | Padding interno de card, gap entre secciones pequeñas |
| `lg` | 16px | Padding estándar de card, gap entre secciones |
| `xl` | 20px | Gap entre tarjetas principales |
| `2xl` | 24px | Gap entre secciones grandes |
| `3xl` | 32px | Top/bottom margin de pantalla |

---

## Animaciones y movimiento

### Regla de oro

**Transición estándar:** `transition: all 0.15s ease-in-out;`

### Casos específicos

| Elemento | Animación | Duración | Easing |
|---|---|---|---|
| Hover de botón | `scale(1.05)` + `color change` | 0.15s | ease-in-out |
| Clic de botón | `scale(0.98)` | 0.1s | ease-in-out |
| Focus ring en input | `box-shadow fade-in` + `border color change` | 0.15s | ease-out |
| Fade in de modal | `opacity 0 → 1` | 0.2s | ease-out |
| Slide up de panel | `transform translateY(10px) → 0` | 0.2s | ease-out |
| Color change (hover de card) | `background-color change` | 0.15s | ease-in-out |
| Página transition (cambio de pantalla) | Sin animación (navegación instantánea) | - | - |

### Respeto a `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsividad

### Breakpoints

| Nombre | Ancho | Devices |
|---|---|---|
| Mobile | < 700px | iPhone, pequeños Android |
| Tablet | 700px — 1024px | iPad, tablets |
| Desktop | > 1024px | Laptops, monitores |

### Reglas por breakpoint

**Mobile (< 700px):**
- Ancho: 100% con padding 12px (no margin)
- Fuente: 14px base (no reducir)
- Tablas: apilan en 2 columnas, label + valor
- Botones: ancho completo si están solos
- Padding en inputs/buttons: aumenta a 12px (toque más grande)
- Grid de calendario: celdas de 28px
- Heatmap: celdas de 28px

**Tablet (700px — 1024px):**
- Ancho: 90% con margin auto
- Tablas: empiezan a verse como tabla real (3+ columnas es ok)
- Grid de layout: 2 columnas
- Botones: ancho auto (no completo)

**Desktop (> 1024px):**
- Ancho máximo: 1200px (no más, para no cansar la vista)
- Margin auto
- Todo a su tamaño natural

### Safe areas (notch)

```css
/* En header/footer fijo */
padding-top: max(16px, env(safe-area-inset-top));
padding-bottom: max(16px, env(safe-area-inset-bottom));
padding-left: max(16px, env(safe-area-inset-left));
padding-right: max(16px, env(safe-area-inset-right));
```

---

## Accesibilidad

### Colores

- Todas las combinaciones cumplen WCAG AA (4.5:1 contraste mínimo)
- No confiar en color solo para comunicar estado — usar icono + color (ej. "✓ Completado" en verde)
- Los botones deshabilitados usan opacidad baja, no color diferente (evita confusión roja/verde)

### Foco

```css
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}

/* Mejor que outline en inputs */
input:focus {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### Texto

- Mínimo 14px para body text
- Altura de línea 1.5+ para legibilidad
- Máximo 70 caracteres por línea en prosa larga
- Labels visibles en formularios (no solo placeholder)

### Iconos

- SVG con `role="img"` y `aria-label` si es informativo
- O `aria-hidden="true"` si es solo decorativo junto a texto

---

## Esquema de color (para `<meta>` tag)

```html
<meta name="color-scheme" content="light">
```

Esto hace que los controles nativos del navegador (date picker, select, etc.) se vean con tema claro automáticamente.

---

## Notas de implementación CSS

### Variables CSS recomendadas

```css
:root {
  /* Colores */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-success: #10B981;
  --color-danger: #EF4444;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
  
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;
  
  --color-bg-base: #FFFFFF;
  --color-bg-card: #F8F8F8;
  --color-bg-input: #FAFAFA;
  --color-bg-hover: #F0F0F0;
  
  --color-border: #E5E5E5;
  --color-divider: #D1D5DB;
  
  /* Espaciado */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  
  /* Tipografía */
  --font-primary: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Courier New', monospace;
  --font-size-body: 14px;
  --font-size-sm: 12px;
  --font-size-h2: 20px;
  --line-height-normal: 1.5;
  
  /* Animación */
  --transition: all 0.15s ease-in-out;
  --transition-fast: all 0.1s ease-in-out;
  --transition-slow: all 0.2s ease-out;
  
  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-full: 999px;
}
```

---

## Comparación antes / después

| Aspecto | Sistema antiguo (oscuro) | Sistema nuevo (Clean UI) |
|---|---|---|
| Fondo | `#18181b` (muy oscuro) | `#FFFFFF` (blanco puro) |
| Tarjeta | `#222225` | `#F8F8F8` (gris muy claro) |
| Acento principal | `#d98c3d` (ámbar cálido) | `#2563EB` (azul frío) |
| Éxito | `#6fa05e` (verde) | `#10B981` (verde más vibrante) |
| Sensación | Workbench de gimnasio oscuro | Profesional, limpio, accesible |
| Tipografía | Números en monospace | Números + Todo el sistema en Inter |
| Espacios en blanco | Compactos | Generosos, "respiratory" |
| Sombras | Ninguna (escalones de color) | Mínimas, sutiles (para modal) |

---

## Cambios en componentes específicos para migración

### `.ghost-target` (objetivo fantasma en Registrar sesión)

**Antes (oscuro):** texto muted gris sobre fondo oscuro

**Ahora (blanco):** texto muted gris sobre blanco, con borde left `#E5E5E5` para distinguir del resto del input

```css
.ghost-target {
  color: var(--color-text-muted);
  font-style: italic;
  border-left: 3px solid var(--color-border);
  padding-left: var(--spacing-sm);
  opacity: 0.8;
}
```

### Heatmap de consistencia

**Antes:** 8 semanas rodantes, oscuro

**Ahora:** calendario mensual, blanco con colores más saturados

- Entrenado: `#10B981` (igual verde)
- Perdido: `#EF4444` (rojo más claro, por el fondo blanco)
- Sin-plan: `#D1D5DB` (gris neutro)
- Futuro: sin color (blanco puro)

---

## Historial de versiones

| Versión | Fecha | Estado |
|---|---|---|
| 1.0 | Sept 2026 | **Vigente en producción** — sistema oscuro "workbench de gimnasio" (ver `css/style.css`) |
| 2.0 | Sept 2026 | **Aprobada, no implementada** — rediseño completo a Clean UI blanco/azul descrito en este documento. Pasa a implementarse cuando el usuario lo indique (vía Claude Design). |

