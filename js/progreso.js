// Progreso — progresión de fuerza por ejercicio (peso máximo por sesión).
// Depende de supabaseClient.js y auth.js. Usa Chart.js (CDN) para la gráfica.

let chartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireSession();
  if (!user) return;

  await cargarEjercicios();

  document.getElementById('select-ejercicio').addEventListener('change', cargarProgreso);
  document.getElementById('btn-logout').addEventListener('click', logout);
});

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

async function cargarEjercicios() {
  const { data, error } = await supabaseClient
    .from('exercises')
    .select('id, name')
    .in('type', ['fuerza', 'pliometria'])
    .order('name', { ascending: true });

  if (error) return mostrarError(error);

  const select = document.getElementById('select-ejercicio');

  if (!data || data.length === 0) {
    select.innerHTML = '<option value="">Sin ejercicios de fuerza en el catálogo</option>';
    document.getElementById('card-chart').classList.add('d-none');
    return;
  }

  select.innerHTML = data.map((ex) => `<option value="${ex.id}">${ex.name}</option>`).join('');
  await cargarProgreso();
}

async function cargarProgreso() {
  const exerciseId = document.getElementById('select-ejercicio').value;
  if (!exerciseId) return;

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
