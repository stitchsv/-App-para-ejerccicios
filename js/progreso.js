// Progreso — fuerza por ejercicio, consistencia y medidas corporales.
// Depende de supabaseClient.js, auth.js y routine-data.js (jsDayToDbDay).
// Usa Chart.js (CDN) para las gráficas de línea.

let usuarioActual = null;
let chartInstance = null;
let chartMedidasInstance = null;
let ejerciciosDisponibles = [];

document.addEventListener('DOMContentLoaded', async () => {
  usuarioActual = await requireSession();
  if (!usuarioActual) return;

  document.getElementById('medida-fecha').value = hoyISO();

  await cargarEjercicios();
  await cargarConsistencia();
  await cargarMedidas();

  document.getElementById('input-ejercicio').addEventListener('input', () => {
    const ej = buscarEjercicioPorNombre(document.getElementById('input-ejercicio').value.trim());
    if (ej) cargarProgreso();
  });
  document.getElementById('form-medida').addEventListener('submit', onNuevaMedida);
  document.getElementById('btn-logout').addEventListener('click', logout);
});

function buscarEjercicioPorNombre(nombre) {
  return ejerciciosDisponibles.find((ex) => ex.name === nombre) || null;
}

function mostrarError(err) {
  const el = document.getElementById('mensaje-error');
  el.textContent = err.message || 'Ocurrió un error.';
  el.classList.remove('d-none');
}

// 'YYYY-MM-DD' -> "15 ago" en hora local (evita el corrimiento de día de
// interpretar la fecha como UTC).
function formatFecha(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

// Date -> 'YYYY-MM-DD' en hora local.
function fechaISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hoyISO() {
  return fechaISO(new Date());
}

async function cargarEjercicios() {
  const { data, error } = await supabaseClient
    .from('exercises')
    .select('id, name')
    .in('type', ['fuerza', 'pliometria'])
    .order('name', { ascending: true });

  if (error) return mostrarError(error);

  const input = document.getElementById('input-ejercicio');

  if (!data || data.length === 0) {
    input.placeholder = 'Sin ejercicios de fuerza en el catálogo';
    input.disabled = true;
    document.getElementById('card-chart').classList.add('d-none');
    return;
  }

  ejerciciosDisponibles = data;
  document.getElementById('datalist-ejercicios').innerHTML = data
    .map((ex) => `<option value="${ex.name}">`)
    .join('');

  input.value = data[0].name;
  await cargarProgreso();
}

async function cargarProgreso() {
  const ejercicio = buscarEjercicioPorNombre(document.getElementById('input-ejercicio').value.trim());
  if (!ejercicio) return;
  const exerciseId = ejercicio.id;

  const avisoSinDatos = document.getElementById('mensaje-sin-datos');
  const cardChart = document.getElementById('card-chart');
  avisoSinDatos.classList.add('d-none');

  const { data, error } = await supabaseClient
    .from('session_sets')
    .select('weight_kg, workout_sessions ( session_date )')
    .eq('exercise_id', exerciseId);

  if (error) return mostrarError(error);

  // Peso máximo levantado por fecha de sesión (una serie puede no ser la
  // única de ese día; nos quedamos con la más pesada de cada fecha).
  const maxPorFecha = new Map();
  (data || []).forEach((set) => {
    const fecha = set.workout_sessions?.session_date;
    if (!fecha || set.weight_kg == null) return;
    const actual = maxPorFecha.get(fecha) ?? 0;
    if (set.weight_kg > actual) maxPorFecha.set(fecha, set.weight_kg);
  });

  const fechas = Array.from(maxPorFecha.keys()).sort();

  if (fechas.length === 0) {
    avisoSinDatos.classList.remove('d-none');
    cardChart.classList.add('d-none');
    return;
  }

  cardChart.classList.remove('d-none');
  const pesos = fechas.map((f) => maxPorFecha.get(f));

  document.getElementById('stat-pr').textContent = `${Math.max(...pesos)} kg`;
  document.getElementById('stat-ultima').textContent = `${pesos[pesos.length - 1]} kg`;

  renderChart(fechas.map(formatFecha), pesos);
}

function renderChart(labels, data) {
  const estilos = getComputedStyle(document.documentElement);
  const accent = estilos.getPropertyValue('--accent-strong').trim();
  const textMuted = estilos.getPropertyValue('--text-muted').trim();
  const border = estilos.getPropertyValue('--border').trim();

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(document.getElementById('chart-progreso'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peso máximo (kg)',
        data,
        borderColor: accent,
        backgroundColor: accent,
        pointBackgroundColor: accent,
        pointRadius: 4,
        tension: 0.2,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: textMuted }, grid: { color: border } },
        y: { ticks: { color: textMuted }, grid: { color: border } },
      },
    },
  });
}

// ---------------------------------------------------------------------
// Consistencia — heatmap de días entrenados vs. planeados, últimas 8
// semanas. "Planeado" = el día de la semana tiene al menos un ejercicio
// en routine_day_exercises; "entrenado" = hay workout_sessions esa fecha.
// ---------------------------------------------------------------------

async function cargarConsistencia() {
  const { data: dias, error: errorDias } = await supabaseClient
    .from('routine_days')
    .select('day_of_week, routine_day_exercises ( id )');

  if (errorDias) return mostrarError(errorDias);

  const diasPlaneados = new Set(
    (dias || []).filter((d) => d.routine_day_exercises.length > 0).map((d) => d.day_of_week)
  );

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Rango: 8 semanas completas (lunes a domingo), terminando en el
  // domingo de la semana actual.
  const finSemana = new Date(hoy);
  finSemana.setDate(finSemana.getDate() + (7 - jsDayToDbDay(finSemana.getDay())));

  const inicio = new Date(finSemana);
  inicio.setDate(inicio.getDate() - 7 * 8 + 1);

  const { data: sesiones, error: errorSesiones } = await supabaseClient
    .from('workout_sessions')
    .select('session_date')
    .gte('session_date', fechaISO(inicio))
    .lte('session_date', fechaISO(finSemana));

  if (errorSesiones) return mostrarError(errorSesiones);

  const fechasEntrenadas = new Set((sesiones || []).map((s) => s.session_date));

  const celdas = [];
  let cumplidos = 0;
  let planeadosPasados = 0;

  for (const f = new Date(inicio); f <= finSemana; f.setDate(f.getDate() + 1)) {
    const fechaStr = fechaISO(f);
    const esFuturo = f > hoy;
    const esPlaneado = diasPlaneados.has(jsDayToDbDay(f.getDay()));
    const entrenado = fechasEntrenadas.has(fechaStr);

    let estado;
    if (entrenado) estado = 'entrenado';
    else if (esFuturo) estado = 'futuro';
    else if (esPlaneado) estado = 'perdido';
    else estado = 'sin-plan';

    if (!esFuturo && esPlaneado) {
      planeadosPasados++;
      if (entrenado) cumplidos++;
    }

    celdas.push({ fecha: fechaStr, estado });
  }

  document.getElementById('stat-consistencia').textContent = planeadosPasados > 0
    ? `${cumplidos}/${planeadosPasados} (${Math.round((cumplidos / planeadosPasados) * 100)}%)`
    : 'sin rutina planeada';

  const grid = document.getElementById('heatmap-consistencia');
  grid.className = 'heatmap-grid';
  grid.innerHTML = celdas
    .map((c) => `<div class="heatmap-cell heatmap-${c.estado}" title="${c.fecha}"></div>`)
    .join('');
}

// ---------------------------------------------------------------------
// Medidas corporales — antebrazo y bíceps (cm) en un eje, peso (kg) en
// otro, porque comparten muy poco rango entre sí.
// ---------------------------------------------------------------------

async function cargarMedidas() {
  const { data, error } = await supabaseClient
    .from('body_measurements')
    .select('measurement_date, forearm_cm, bicep_cm, body_weight_kg')
    .order('measurement_date', { ascending: true });

  if (error) return mostrarError(error);

  const avisoSinMedidas = document.getElementById('mensaje-sin-medidas');
  const cardMedidas = document.getElementById('card-medidas');

  if (!data || data.length === 0) {
    avisoSinMedidas.classList.remove('d-none');
    cardMedidas.classList.add('d-none');
    return;
  }

  avisoSinMedidas.classList.add('d-none');
  cardMedidas.classList.remove('d-none');

  const ultima = data[data.length - 1];
  document.getElementById('stat-antebrazo').textContent = ultima.forearm_cm != null ? `${ultima.forearm_cm} cm` : '—';
  document.getElementById('stat-biceps').textContent = ultima.bicep_cm != null ? `${ultima.bicep_cm} cm` : '—';
  document.getElementById('stat-peso').textContent = ultima.body_weight_kg != null ? `${ultima.body_weight_kg} kg` : '—';

  renderChartMedidas(
    data.map((m) => formatFecha(m.measurement_date)),
    data.map((m) => m.forearm_cm),
    data.map((m) => m.bicep_cm),
    data.map((m) => m.body_weight_kg)
  );
}

function renderChartMedidas(labels, antebrazo, biceps, peso) {
  const estilos = getComputedStyle(document.documentElement);
  const accent = estilos.getPropertyValue('--accent-strong').trim();
  const success = estilos.getPropertyValue('--success').trim();
  const textPrimary = estilos.getPropertyValue('--text-primary').trim();
  const textMuted = estilos.getPropertyValue('--text-muted').trim();
  const border = estilos.getPropertyValue('--border').trim();

  if (chartMedidasInstance) chartMedidasInstance.destroy();

  chartMedidasInstance = new Chart(document.getElementById('chart-medidas'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Antebrazo (cm)', data: antebrazo, borderColor: accent, backgroundColor: accent, pointRadius: 3, tension: 0.2, yAxisID: 'cm' },
        { label: 'Bíceps (cm)', data: biceps, borderColor: success, backgroundColor: success, pointRadius: 3, tension: 0.2, yAxisID: 'cm' },
        { label: 'Peso (kg)', data: peso, borderColor: textPrimary, backgroundColor: textPrimary, pointRadius: 3, tension: 0.2, yAxisID: 'kg', borderDash: [4, 3] },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: textMuted, boxWidth: 12, font: { size: 11 } } },
      },
      scales: {
        x: { ticks: { color: textMuted }, grid: { color: border } },
        cm: { type: 'linear', position: 'left', ticks: { color: textMuted }, grid: { color: border }, title: { display: true, text: 'cm', color: textMuted } },
        kg: { type: 'linear', position: 'right', ticks: { color: textMuted }, grid: { display: false }, title: { display: true, text: 'kg', color: textMuted } },
      },
    },
  });
}

async function onNuevaMedida(event) {
  event.preventDefault();

  const fecha = document.getElementById('medida-fecha').value || hoyISO();
  const antebrazo = document.getElementById('medida-antebrazo').value;
  const biceps = document.getElementById('medida-biceps').value;
  const peso = document.getElementById('medida-peso').value;

  const { error } = await supabaseClient.from('body_measurements').insert({
    user_id: usuarioActual.id,
    measurement_date: fecha,
    forearm_cm: antebrazo === '' ? null : Number(antebrazo),
    bicep_cm: biceps === '' ? null : Number(biceps),
    body_weight_kg: peso === '' ? null : Number(peso),
  });

  if (error) return mostrarError(error);

  document.getElementById('form-medida').reset();
  document.getElementById('medida-fecha').value = hoyISO();
  await cargarMedidas();
}
