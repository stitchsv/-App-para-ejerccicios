// Lógica de la pantalla de Historial: sesiones pasadas, filtrables por
// fecha, día de rutina y ejercicio.
// Depende de supabaseClient.js, auth.js y routine-data.js (para DIAS_SEMANA
// y jsDayToDbDay, reutilizados para mostrar el nombre del día de cada sesión).

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireSession();
  if (!user) return;

  await Promise.all([cargarFiltroDias(), cargarFiltroEjercicios()]);
  await cargarSesiones();

  document.getElementById('btn-filtrar').addEventListener('click', cargarSesiones);
  document.getElementById('btn-limpiar').addEventListener('click', () => {
    document.getElementById('filtro-desde').value = '';
    document.getElementById('filtro-hasta').value = '';
    document.getElementById('filtro-dia').value = '';
    document.getElementById('filtro-ejercicio').value = '';
    cargarSesiones();
  });
  document.getElementById('btn-logout').addEventListener('click', logout);
});

// 'YYYY-MM-DD' -> Date en medianoche local (evita el corrimiento de día que
// da `new Date('YYYY-MM-DD')`, que lo interpreta como UTC).
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function etiquetaFecha(dateStr) {
  const date = parseLocalDate(dateStr);
  const dia = DIAS_SEMANA[jsDayToDbDay(date.getDay())];
  const fechaLegible = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${dia}, ${fechaLegible}`;
}

async function cargarFiltroDias() {
  const { data } = await supabaseClient
    .from('routine_days')
    .select('id, day_of_week, focus')
    .order('day_of_week', { ascending: true });

  const select = document.getElementById('filtro-dia');
  (data || []).forEach((rd) => {
    const opt = document.createElement('option');
    opt.value = rd.id;
    opt.textContent = `${DIAS_SEMANA[rd.day_of_week]} — ${rd.focus}`;
    select.appendChild(opt);
  });
}

async function cargarFiltroEjercicios() {
  const { data } = await supabaseClient
    .from('exercises')
    .select('id, name')
    .order('name', { ascending: true });

  const select = document.getElementById('filtro-ejercicio');
  (data || []).forEach((ex) => {
    const opt = document.createElement('option');
    opt.value = ex.id;
    opt.textContent = ex.name;
    select.appendChild(opt);
  });
}

async function cargarSesiones() {
  const mensajeError = document.getElementById('mensaje-error');
  const contenedor = document.getElementById('lista-sesiones');
  mensajeError.classList.add('d-none');
  contenedor.innerHTML = '<p class="text-muted">Cargando…</p>';

  const desde = document.getElementById('filtro-desde').value;
  const hasta = document.getElementById('filtro-hasta').value;
  const routineDayId = document.getElementById('filtro-dia').value;
  const exerciseId = document.getElementById('filtro-ejercicio').value;

  let query = supabaseClient
    .from('workout_sessions')
    .select(`
      id, session_date, routine_day_id, energy_level, notes,
      routine_days ( focus ),
      session_sets ( id, set_number, weight_kg, reps, exercise_id, exercises ( name ) ),
      cardio_sessions ( id, activity_type, duration_minutes, distance_km, avg_heart_rate )
    `)
    .order('session_date', { ascending: false });

  if (desde) query = query.gte('session_date', desde);
  if (hasta) query = query.lte('session_date', hasta);
  if (routineDayId) query = query.eq('routine_day_id', routineDayId);

  const { data, error } = await query;

  if (error) {
    mensajeError.textContent = error.message;
    mensajeError.classList.remove('d-none');
    contenedor.innerHTML = '';
    return;
  }

  // El filtro por ejercicio se aplica en cliente: una sesión pasa si alguna
  // de sus series usó ese ejercicio (cardio no tiene exercise_id propio).
  const sesiones = exerciseId
    ? (data || []).filter((s) => s.session_sets.some((set) => set.exercise_id === exerciseId))
    : (data || []);

  renderSesiones(sesiones);
}

function renderSesiones(sesiones) {
  const contenedor = document.getElementById('lista-sesiones');
  contenedor.innerHTML = '';

  if (sesiones.length === 0) {
    contenedor.innerHTML = '<p class="text-muted">No hay sesiones que coincidan con los filtros.</p>';
    return;
  }

  sesiones.forEach((sesion) => {
    contenedor.appendChild(crearCardSesion(sesion));
  });
}

function crearCardSesion(sesion) {
  const card = document.createElement('div');
  card.className = 'card mb-3';

  const energia = sesion.energy_level ? `Energía ${sesion.energy_level}/5` : '';

  // Agrupar series por ejercicio, en el orden en que aparecen.
  const porEjercicio = new Map();
  sesion.session_sets
    .slice()
    .sort((a, b) => a.set_number - b.set_number)
    .forEach((set) => {
      const nombre = set.exercises?.name ?? '(ejercicio eliminado)';
      if (!porEjercicio.has(nombre)) porEjercicio.set(nombre, []);
      porEjercicio.get(nombre).push(set);
    });

  const ejerciciosHtml = Array.from(porEjercicio.entries()).map(([nombre, sets]) => {
    const seriesTexto = sets.map((s) => `${s.weight_kg ?? '—'}kg × ${s.reps}`).join(', ');
    return `<li class="list-group-item"><strong>${nombre}</strong>: ${seriesTexto}</li>`;
  }).join('');

  const cardioHtml = (sesion.cardio_sessions || []).map((c) => {
    const distancia = c.distance_km ? `${c.distance_km} km` : '';
    const fc = c.avg_heart_rate ? `FC prom. ${c.avg_heart_rate}` : '';
    const detalles = [`${c.duration_minutes} min`, distancia, fc].filter(Boolean).join(' · ');
    const tipo = c.activity_type === 'eliptica' ? 'Elíptica' : 'Carrera';
    return `<li class="list-group-item"><strong>${tipo}</strong>: ${detalles}</li>`;
  }).join('');

  card.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-1">
      <span><strong>${etiquetaFecha(sesion.session_date)}</strong> — ${sesion.routine_days?.focus ?? 'Sin día de rutina'}</span>
      <span class="text-muted small">${energia}</span>
    </div>
    <ul class="list-group list-group-flush">
      ${ejerciciosHtml}${cardioHtml}
    </ul>
    ${sesion.notes ? `<div class="card-body py-2"><p class="card-text small text-muted mb-0">${sesion.notes}</p></div>` : ''}
  `;

  return card;
}
