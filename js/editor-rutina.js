// Lógica del Editor de rutina: modificar el catálogo de ejercicios y la
// plantilla semanal (routine_days / routine_day_exercises) sin tocar SQL.
// Depende de supabaseClient.js, auth.js y routine-data.js (para DIAS_SEMANA).
//
// Los routine_days (1-7) ya existen sembrados por usuario (constraint
// unique(user_id, day_of_week)) — este editor no crea ni borra días, solo
// edita su enfoque/notas y administra los ejercicios dentro de cada uno.

let usuarioActual = null;
let catalogoEjercicios = [];
let filtroGrupoActual = null; // null = todos los grupos

document.addEventListener('DOMContentLoaded', async () => {
  usuarioActual = await requireSession();
  if (!usuarioActual) return;

  await cargarCatalogo();
  await cargarDias();

  document.getElementById('form-nuevo-ejercicio').addEventListener('submit', onNuevoEjercicio);
  document.getElementById('btn-logout').addEventListener('click', logout);
});

function mostrarError(err) {
  const el = document.getElementById('mensaje-error');
  el.textContent = err.message || 'Ocurrió un error.';
  el.classList.remove('d-none');
}

// ---------------------------------------------------------------------
// Catálogo de ejercicios
// ---------------------------------------------------------------------

async function cargarCatalogo() {
  const { data, error } = await supabaseClient
    .from('exercises')
    .select('id, name, muscle_group, type')
    .order('name', { ascending: true });

  if (error) return mostrarError(error);

  catalogoEjercicios = data || [];
  renderFiltroGrupos();
  renderCatalogo();
}

// Chips por grupo muscular — el catálogo completo es demasiado largo para
// mostrarlo siempre entero, así que se filtra por grupo (antebrazo, pecho...).
function renderFiltroGrupos() {
  const grupos = [...new Set(catalogoEjercicios.map((ex) => ex.muscle_group))].sort();
  const contenedor = document.getElementById('filtro-grupo-muscular');

  const chip = (valor, etiqueta) => {
    const activo = filtroGrupoActual === valor;
    return `<button type="button" class="chip${activo ? ' activo' : ''}" data-grupo="${valor ?? ''}">${etiqueta}</button>`;
  };

  contenedor.innerHTML = chip(null, 'Todos') + grupos.map((g) => chip(g, g)).join('');

  contenedor.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      filtroGrupoActual = btn.dataset.grupo || null;
      renderFiltroGrupos();
      renderCatalogo();
    });
  });
}

function renderCatalogo() {
  const lista = document.getElementById('lista-catalogo');
  const ejercicios = filtroGrupoActual
    ? catalogoEjercicios.filter((ex) => ex.muscle_group === filtroGrupoActual)
    : catalogoEjercicios;

  lista.innerHTML = ejercicios.map((ex) =>
    `<li class="list-group-item d-flex justify-content-between">
      <span>${ex.name}</span>
      <span class="text-muted small">${ex.muscle_group} · ${ex.type}</span>
    </li>`
  ).join('');
}

async function onNuevoEjercicio(event) {
  event.preventDefault();
  const nombre = document.getElementById('nuevo-ej-nombre').value.trim();
  const grupo = document.getElementById('nuevo-ej-grupo').value.trim();
  const tipo = document.getElementById('nuevo-ej-tipo').value;
  if (!nombre || !grupo) return;

  const { error } = await supabaseClient
    .from('exercises')
    .insert({ user_id: usuarioActual.id, name: nombre, muscle_group: grupo, type: tipo });

  if (error) return mostrarError(error);

  document.getElementById('form-nuevo-ejercicio').reset();
  await cargarCatalogo();
  renderSelectsDeEjercicio();
}

// Vuelve a poblar los <select> de "agregar ejercicio" de cada día ya
// renderizado, sin tener que reconstruir las tarjetas completas.
function renderSelectsDeEjercicio() {
  document.querySelectorAll('.select-agregar-ejercicio').forEach((select) => {
    const valorPrevio = select.value;
    select.innerHTML = '<option value="">-- elegir ejercicio --</option>' + catalogoEjercicios
      .map((ex) => `<option value="${ex.id}">${ex.name}</option>`)
      .join('');
    if (valorPrevio) select.value = valorPrevio;
  });
}

// ---------------------------------------------------------------------
// Días de rutina
// ---------------------------------------------------------------------

async function cargarDias() {
  const { data, error } = await supabaseClient
    .from('routine_days')
    .select(`
      id, day_of_week, focus, notes,
      routine_day_exercises (
        id, target_sets, target_reps_min, target_reps_max,
        target_duration_minutes, order_index, notes, exercise_id,
        exercises ( name )
      )
    `)
    .order('day_of_week', { ascending: true });

  if (error) return mostrarError(error);

  const contenedor = document.getElementById('lista-dias');
  contenedor.innerHTML = '';
  (data || []).forEach((dia) => {
    dia.routine_day_exercises.sort((a, b) => a.order_index - b.order_index);
    contenedor.appendChild(renderDiaCard(dia));
  });
}

function renderDiaCard(dia) {
  const card = document.createElement('div');
  card.className = 'card mb-4';
  card.innerHTML = `
    <div class="card-header">
      <div class="row g-2 align-items-center">
        <div class="col-12 col-md-2"><strong>${DIAS_SEMANA[dia.day_of_week]}</strong></div>
        <div class="col-8 col-md-6">
          <input type="text" class="form-control form-control-sm input-focus" value="${dia.focus}">
        </div>
        <div class="col-8 col-md-3">
          <input type="text" class="form-control form-control-sm input-day-notes" placeholder="Notas del día" value="${dia.notes ?? ''}">
        </div>
        <div class="col-4 col-md-1">
          <button type="button" class="btn btn-sm btn-outline-secondary w-100 btn-guardar-dia">Guardar</button>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="rde-table">
        <div class="rde-header">
          <div>Ejercicio</div><div>Series</div><div>Reps min</div><div>Reps max</div>
          <div>Duración (min)</div><div>Orden</div><div>Notas</div><div></div>
        </div>
        <div class="cuerpo-ejercicios"></div>
      </div>
      <div class="row g-2 align-items-end mt-3">
        <div class="col-12 col-md-3">
          <select class="form-select form-select-sm select-agregar-ejercicio">
            <option value="">-- elegir ejercicio --</option>
            ${catalogoEjercicios.map((ex) => `<option value="${ex.id}">${ex.name}</option>`).join('')}
          </select>
        </div>
        <div class="col-3 col-md-2">
          <input type="number" step="1" min="0" class="form-control form-control-sm nuevo-sets" placeholder="Series">
        </div>
        <div class="col-3 col-md-2">
          <input type="number" step="1" min="0" class="form-control form-control-sm nuevo-reps-min" placeholder="Reps min">
        </div>
        <div class="col-3 col-md-2">
          <input type="number" step="1" min="0" class="form-control form-control-sm nuevo-reps-max" placeholder="Reps max">
        </div>
        <div class="col-3 col-md-2">
          <input type="number" step="1" min="0" class="form-control form-control-sm nuevo-duracion" placeholder="Min">
        </div>
        <div class="col-12 col-md-1">
          <button type="button" class="btn btn-sm btn-outline-primary w-100 btn-agregar-ejercicio">+</button>
        </div>
      </div>
    </div>
  `;

  const cuerpo = card.querySelector('.cuerpo-ejercicios');
  dia.routine_day_exercises.forEach((rde) => {
    cuerpo.appendChild(renderFilaEjercicio(rde));
  });

  card.querySelector('.btn-guardar-dia').addEventListener('click', () => guardarDia(dia.id, card));

  const btnAgregar = card.querySelector('.btn-agregar-ejercicio');
  const siguienteOrden = dia.routine_day_exercises.length + 1;
  btnAgregar.dataset.siguienteOrden = siguienteOrden;
  btnAgregar.addEventListener('click', () => agregarEjercicio(dia.id, card));

  return card;
}

function renderFilaEjercicio(rde) {
  const template = document.getElementById('template-fila-ejercicio');
  const fila = template.content.firstElementChild.cloneNode(true);

  fila.dataset.rdeId = rde.id;
  fila.querySelector('.nombre-ejercicio').textContent = rde.exercises?.name ?? '(ejercicio eliminado)';
  fila.querySelector('.input-sets').value = rde.target_sets ?? '';
  fila.querySelector('.input-reps-min').value = rde.target_reps_min ?? '';
  fila.querySelector('.input-reps-max').value = rde.target_reps_max ?? '';
  fila.querySelector('.input-duracion').value = rde.target_duration_minutes ?? '';
  fila.querySelector('.input-orden').value = rde.order_index ?? '';
  fila.querySelector('.input-notas').value = rde.notes ?? '';

  fila.querySelector('.btn-guardar-fila').addEventListener('click', () => guardarFilaEjercicio(fila));
  fila.querySelector('.btn-eliminar-fila').addEventListener('click', () => eliminarFilaEjercicio(fila));

  return fila;
}

function valorONull(input) {
  return input.value === '' ? null : Number(input.value);
}

async function guardarDia(routineDayId, card) {
  const focus = card.querySelector('.input-focus').value.trim();
  const notes = card.querySelector('.input-day-notes').value.trim();

  const { error } = await supabaseClient
    .from('routine_days')
    .update({ focus, notes: notes || null })
    .eq('id', routineDayId);

  if (error) mostrarError(error);
}

async function guardarFilaEjercicio(fila) {
  const payload = {
    target_sets: valorONull(fila.querySelector('.input-sets')),
    target_reps_min: valorONull(fila.querySelector('.input-reps-min')),
    target_reps_max: valorONull(fila.querySelector('.input-reps-max')),
    target_duration_minutes: valorONull(fila.querySelector('.input-duracion')),
    order_index: valorONull(fila.querySelector('.input-orden')) ?? 1,
    notes: fila.querySelector('.input-notas').value.trim() || null,
  };

  const { error } = await supabaseClient
    .from('routine_day_exercises')
    .update(payload)
    .eq('id', fila.dataset.rdeId);

  if (error) mostrarError(error);
}

async function eliminarFilaEjercicio(fila) {
  const { error } = await supabaseClient
    .from('routine_day_exercises')
    .delete()
    .eq('id', fila.dataset.rdeId);

  if (error) return mostrarError(error);
  fila.remove();
}

async function agregarEjercicio(routineDayId, card) {
  const select = card.querySelector('.select-agregar-ejercicio');
  const exerciseId = select.value;
  if (!exerciseId) return;

  const btn = card.querySelector('.btn-agregar-ejercicio');

  const payload = {
    user_id: usuarioActual.id,
    routine_day_id: routineDayId,
    exercise_id: exerciseId,
    target_sets: valorONull(card.querySelector('.nuevo-sets')),
    target_reps_min: valorONull(card.querySelector('.nuevo-reps-min')),
    target_reps_max: valorONull(card.querySelector('.nuevo-reps-max')),
    target_duration_minutes: valorONull(card.querySelector('.nuevo-duracion')),
    order_index: Number(btn.dataset.siguienteOrden),
  };

  const { data, error } = await supabaseClient
    .from('routine_day_exercises')
    .insert(payload)
    .select('id, target_sets, target_reps_min, target_reps_max, target_duration_minutes, order_index, notes, exercise_id, exercises ( name )')
    .single();

  if (error) return mostrarError(error);

  card.querySelector('.cuerpo-ejercicios').appendChild(renderFilaEjercicio(data));
  btn.dataset.siguienteOrden = Number(btn.dataset.siguienteOrden) + 1;

  card.querySelector('.nuevo-sets').value = '';
  card.querySelector('.nuevo-reps-min').value = '';
  card.querySelector('.nuevo-reps-max').value = '';
  card.querySelector('.nuevo-duracion').value = '';
}
