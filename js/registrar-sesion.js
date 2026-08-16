// Lógica del formulario de registro de sesión.
// Depende de supabaseClient.js, auth.js y routine-data.js.
//
// Esquema real (supabase/migrations):
//   workout_sessions(id, user_id, session_date, routine_day_id, energy_level 1-5, notes)
//   session_sets(id, user_id, session_id, exercise_id, set_number, weight_kg, reps not null, rpe, notes)
//   cardio_sessions(id, user_id, session_id, cardio_date, activity_type ['carrera'|'eliptica'],
//     duration_minutes not null, distance_km, avg_heart_rate, heart_rate_zone, notes)
//
// Los ejercicios de tipo 'fuerza'/'pliometria' se guardan como series (peso x reps)
// en session_sets. Los de tipo 'cardio' se guardan aparte en cardio_sessions
// (duración/distancia/frecuencia), porque session_sets exige reps not null.

const SETS_POR_DEFECTO = 3;

let routineActual = null;
let usuarioActual = null;

// Fecha local en formato YYYY-MM-DD. Date#toISOString() usa UTC, lo que
// desalinearía la sesión guardada respecto al día de rutina mostrado
// (que sí se calcula en hora local) para usuarios detrás de UTC por la noche.
function fechaLocalISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  usuarioActual = await requireSession();
  if (!usuarioActual) return;

  routineActual = await getTodayRoutine();

  document.getElementById('dia-nombre').textContent = routineActual.dayName;
  document.getElementById('dia-enfoque').textContent = routineActual.focus;

  const btnSubmit = document.getElementById('btn-guardar');
  const avisoSinDatos = document.getElementById('aviso-sin-datos');

  if (!routineActual.fromDatabase || routineActual.ejercicios.every((e) => e.id === null)) {
    // Sin ejercicios reales en la base de datos todavía no se puede guardar
    // una sesión válida (no hay exercise_id al que asociar las series).
    avisoSinDatos.classList.remove('d-none');
    btnSubmit.disabled = true;
  } else {
    renderEjercicios(routineActual.ejercicios);
  }

  document.getElementById('form-sesion').addEventListener('submit', onSubmit);
  document.getElementById('btn-logout').addEventListener('click', logout);
});

function renderEjercicios(ejercicios) {
  const contenedor = document.getElementById('lista-ejercicios-form');
  contenedor.innerHTML = '';

  ejercicios.forEach((ej, idx) => {
    contenedor.appendChild(ej.type === 'cardio' ? crearCardCardio(ej, idx) : crearCardFuerza(ej, idx));
  });
}

function crearCardFuerza(ej, idx) {
  const card = document.createElement('div');
  card.className = 'card mb-3';
  card.dataset.exerciseType = 'fuerza';
  card.dataset.exerciseId = ej.id;
  card.dataset.exerciseIndex = idx;

  card.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-1">
        <div>
          <h5 class="card-title mb-0">${ej.name}</h5>
          <div class="ghost-target">objetivo: ${formatTarget(ej)}</div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary btn-add-set">+ serie</button>
      </div>
      <div class="sets-container mt-2"></div>
    </div>
  `;

  const setsContainer = card.querySelector('.sets-container');
  const numSets = ej.target_sets || SETS_POR_DEFECTO;
  for (let i = 0; i < numSets; i++) {
    setsContainer.appendChild(crearFilaSet(i + 1));
  }

  card.querySelector('.btn-add-set').addEventListener('click', () => {
    const nextNum = setsContainer.children.length + 1;
    setsContainer.appendChild(crearFilaSet(nextNum));
  });

  return card;
}

function crearFilaSet(numeroSerie) {
  const row = document.createElement('div');
  row.className = 'd-flex align-items-center gap-2 mb-2 set-row';
  row.innerHTML = `
    <div class="col-2 text-muted set-row-num">#${numeroSerie}</div>
    <input type="number" step="0.5" min="0" class="form-control input-peso" placeholder="Peso (kg)" style="flex:1;">
    <input type="number" step="1" min="0" class="form-control input-reps" placeholder="Reps" style="flex:1;">
  `;

  const inputReps = row.querySelector('.input-reps');
  inputReps.addEventListener('input', () => {
    row.classList.toggle('completado', inputReps.value !== '');
  });

  return row;
}

function crearCardCardio(ej, idx) {
  const nombreLower = ej.name.toLowerCase();
  const tipoDetectado = nombreLower.includes('elíptic') || nombreLower.includes('eliptic') ? 'eliptica' : 'carrera';

  const card = document.createElement('div');
  card.className = 'card mb-3';
  card.dataset.exerciseType = 'cardio';
  card.dataset.exerciseIndex = idx;

  card.innerHTML = `
    <div class="card-body">
      <h5 class="card-title mb-3">${ej.name}</h5>
      <div class="row g-2 mb-2">
        <div class="col-6">
          <label class="form-label small">Tipo</label>
          <select class="form-select input-activity-type">
            <option value="carrera" ${tipoDetectado === 'carrera' ? 'selected' : ''}>Carrera</option>
            <option value="eliptica" ${tipoDetectado === 'eliptica' ? 'selected' : ''}>Elíptica</option>
          </select>
        </div>
        <div class="col-6">
          <label class="form-label small">Duración (min)</label>
          <input type="number" step="1" min="0" class="form-control input-duracion" value="${ej.target_duration_minutes ?? ''}">
        </div>
      </div>
      <div class="row g-2">
        <div class="col-6">
          <label class="form-label small">Distancia (km)</label>
          <input type="number" step="0.1" min="0" class="form-control input-distancia">
        </div>
        <div class="col-6">
          <label class="form-label small">FC promedio (opcional)</label>
          <input type="number" step="1" min="0" class="form-control input-fc">
        </div>
      </div>
    </div>
  `;
  return card;
}

async function onSubmit(event) {
  event.preventDefault();

  const btnSubmit = document.getElementById('btn-guardar');
  const mensajeError = document.getElementById('mensaje-error');
  const mensajeExito = document.getElementById('mensaje-exito');
  mensajeError.classList.add('d-none');
  mensajeExito.classList.add('d-none');
  btnSubmit.disabled = true;

  try {
    const notas = document.getElementById('notas').value.trim();
    const energyLevel = document.getElementById('energy-level').value;
    const hoy = fechaLocalISO();

    const { data: sesion, error: sesionError } = await supabaseClient
      .from('workout_sessions')
      .insert({
        user_id: usuarioActual.id,
        session_date: hoy,
        routine_day_id: routineActual.routineDayId,
        energy_level: energyLevel === '' ? null : Number(energyLevel),
        notes: notas || null,
      })
      .select()
      .single();

    if (sesionError) throw sesionError;

    const sets = [];
    const cardioSessions = [];

    document.querySelectorAll('#lista-ejercicios-form .card').forEach((card) => {
      if (card.dataset.exerciseType === 'fuerza') {
        const exerciseId = card.dataset.exerciseId;
        card.querySelectorAll('.set-row').forEach((row, i) => {
          const peso = row.querySelector('.input-peso').value;
          const reps = row.querySelector('.input-reps').value;
          if (reps === '') return; // sin reps no hay serie válida (reps es not null)
          sets.push({
            user_id: usuarioActual.id,
            session_id: sesion.id,
            exercise_id: exerciseId,
            set_number: i + 1,
            weight_kg: peso === '' ? null : Number(peso),
            reps: Number(reps),
          });
        });
      } else {
        const duracion = card.querySelector('.input-duracion').value;
        if (duracion === '') return; // sin duración no se guarda (duration_minutes es not null)
        const distancia = card.querySelector('.input-distancia').value;
        const fc = card.querySelector('.input-fc').value;
        cardioSessions.push({
          user_id: usuarioActual.id,
          session_id: sesion.id,
          cardio_date: hoy,
          activity_type: card.querySelector('.input-activity-type').value,
          duration_minutes: Number(duracion),
          distance_km: distancia === '' ? null : Number(distancia),
          avg_heart_rate: fc === '' ? null : Number(fc),
        });
      }
    });

    if (sets.length > 0) {
      const { error: setsError } = await supabaseClient.from('session_sets').insert(sets);
      if (setsError) throw setsError;
    }

    if (cardioSessions.length > 0) {
      const { error: cardioError } = await supabaseClient.from('cardio_sessions').insert(cardioSessions);
      if (cardioError) throw cardioError;
    }

    mensajeExito.classList.remove('d-none');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  } catch (err) {
    mensajeError.textContent = err.message || 'Ocurrió un error al guardar la sesión.';
    mensajeError.classList.remove('d-none');
    btnSubmit.disabled = false;
  }
}
