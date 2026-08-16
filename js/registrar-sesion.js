// Lógica del formulario de registro de sesión.
// Depende de supabaseClient.js, auth.js y routine-data.js.
//
// Asume el siguiente esquema (a confirmar al crear las migraciones):
//   workout_sessions(id, user_id, fecha date, routine_day_id, notas)
//   session_sets(id, user_id, session_id, exercise_id, orden, peso numeric, reps int, rpe numeric null)

const SETS_POR_DEFECTO = 3;

let routineActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireSession();
  if (!user) return;

  routineActual = await getTodayRoutine();

  document.getElementById('dia-nombre').textContent = routineActual.nombre;
  document.getElementById('dia-enfoque').textContent = routineActual.enfoque;

  const form = document.getElementById('form-sesion');
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

  form.addEventListener('submit', onSubmit);
  document.getElementById('btn-logout').addEventListener('click', logout);
});

function renderEjercicios(ejercicios) {
  const contenedor = document.getElementById('lista-ejercicios-form');
  contenedor.innerHTML = '';

  ejercicios.forEach((ej, idx) => {
    const card = document.createElement('div');
    card.className = 'card mb-3';
    card.dataset.exerciseId = ej.id;
    card.dataset.exerciseIndex = idx;

    card.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="card-title mb-0">${ej.nombre}</h5>
          <button type="button" class="btn btn-sm btn-outline-secondary btn-add-set">+ serie</button>
        </div>
        <div class="sets-container"></div>
      </div>
    `;
    contenedor.appendChild(card);

    const setsContainer = card.querySelector('.sets-container');
    const numSets = ej.series_objetivo || SETS_POR_DEFECTO;
    for (let i = 0; i < numSets; i++) {
      setsContainer.appendChild(crearFilaSet(i + 1));
    }

    card.querySelector('.btn-add-set').addEventListener('click', () => {
      const nextNum = setsContainer.children.length + 1;
      setsContainer.appendChild(crearFilaSet(nextNum));
    });
  });
}

function crearFilaSet(numeroSerie) {
  const row = document.createElement('div');
  row.className = 'row g-2 align-items-center mb-2 set-row';
  row.innerHTML = `
    <div class="col-2 text-muted">#${numeroSerie}</div>
    <div class="col-5">
      <input type="number" step="0.5" min="0" class="form-control input-peso" placeholder="Peso (kg)">
    </div>
    <div class="col-5">
      <input type="number" step="1" min="0" class="form-control input-reps" placeholder="Reps">
    </div>
  `;
  return row;
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    const notas = document.getElementById('notas').value.trim();
    const hoy = new Date().toISOString().slice(0, 10);

    const { data: sesion, error: sesionError } = await supabaseClient
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        fecha: hoy,
        routine_day_id: routineActual.routineDayId,
        notas: notas || null,
      })
      .select()
      .single();

    if (sesionError) throw sesionError;

    const sets = [];
    document.querySelectorAll('#lista-ejercicios-form .card').forEach((card) => {
      const exerciseId = card.dataset.exerciseId;
      card.querySelectorAll('.set-row').forEach((row, i) => {
        const peso = row.querySelector('.input-peso').value;
        const reps = row.querySelector('.input-reps').value;
        if (peso === '' && reps === '') return; // fila vacía, se omite
        sets.push({
          user_id: user.id,
          session_id: sesion.id,
          exercise_id: exerciseId,
          orden: i + 1,
          peso: peso === '' ? null : Number(peso),
          reps: reps === '' ? null : Number(reps),
        });
      });
    });

    if (sets.length > 0) {
      const { error: setsError } = await supabaseClient.from('session_sets').insert(sets);
      if (setsError) throw setsError;
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
