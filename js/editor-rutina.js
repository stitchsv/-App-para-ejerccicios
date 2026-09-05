// Lógica del Editor de rutina: catálogo de ejercicios, rutinas del usuario
// (routines) y la plantilla semanal de la rutina seleccionada
// (routine_days / routine_day_exercises) sin tocar SQL.
// Depende de supabaseClient.js, auth.js y routine-data.js (para DIAS_SEMANA).
//
// Un usuario puede tener varias rutinas (tabla `routines`); una sola puede
// estar activa a la vez (constraint parcial en la BD). Este editor permite
// crear/activar/renombrar/eliminar rutinas, y dentro de la rutina
// seleccionada, agregar/eliminar días y administrar sus ejercicios.

let usuarioActual = null;
let catalogoEjercicios = [];
let filtroGrupoActual = null; // null = todos los grupos
let listaRutinas = [];
let rutinaSeleccionadaId = null;

document.addEventListener('DOMContentLoaded', async () => {
  usuarioActual = await requireSession();
  if (!usuarioActual) return;

  await cargarCatalogo();
  await cargarRutinas();

  document.getElementById('form-nuevo-ejercicio').addEventListener('submit', onNuevoEjercicio);
  document.getElementById('form-nueva-rutina').addEventListener('submit', onNuevaRutina);
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
  renderDatalistCatalogo();
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
}

// Datalist compartido por los inputs de "agregar ejercicio" de todos los
// días — un solo lugar que poblar, en vez de un <select> por tarjeta.
function renderDatalistCatalogo() {
  document.getElementById('datalist-catalogo').innerHTML = catalogoEjercicios
    .map((ex) => `<option value="${ex.name}">`)
    .join('');
}

function buscarEjercicioPorNombre(nombre) {
  return catalogoEjercicios.find((ex) => ex.name === nombre) || null;
}

// ---------------------------------------------------------------------
// Rutinas (routines)
// ---------------------------------------------------------------------

async function cargarRutinas() {
  const { data, error } = await supabaseClient
    .from('routines')
    .select('id, name, source, is_active')
    .order('created_at', { ascending: true });

  if (error) return mostrarError(error);

  listaRutinas = data || [];
  renderListaRutinas();

  const activa = listaRutinas.find((r) => r.is_active);
  const siguiente = listaRutinas.find((r) => r.id === rutinaSeleccionadaId) || activa || listaRutinas[0];
  if (siguiente) await seleccionarRutina(siguiente.id);
}

function renderListaRutinas() {
  const lista = document.getElementById('lista-rutinas');
  lista.innerHTML = listaRutinas.map((r) => `
    <li class="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2" data-rutina-id="${r.id}">
      <span>
        <strong class="${r.id === rutinaSeleccionadaId ? 'text-warning' : ''}">${r.name}</strong>
        ${r.is_active ? '<span class="badge text-bg-success ms-2">Activa</span>' : ''}
      </span>
      <span class="d-flex gap-2">
        <button type="button" class="btn btn-sm btn-outline-secondary btn-ver-rutina">Ver/editar</button>
        ${r.is_active ? '' : '<button type="button" class="btn btn-sm btn-outline-primary btn-activar-rutina">Activar</button>'}
        <button type="button" class="btn btn-sm btn-outline-secondary btn-renombrar-rutina">Renombrar</button>
        ${r.is_active ? '' : '<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-rutina">Eliminar</button>'}
      </span>
    </li>
  `).join('');

  lista.querySelectorAll('li').forEach((li) => {
    const id = li.dataset.rutinaId;
    li.querySelector('.btn-ver-rutina').addEventListener('click', () => seleccionarRutina(id));
    li.querySelector('.btn-activar-rutina')?.addEventListener('click', () => activarRutina(id));
    li.querySelector('.btn-renombrar-rutina').addEventListener('click', () => renombrarRutina(id));
    li.querySelector('.btn-eliminar-rutina')?.addEventListener('click', () => eliminarRutina(id));
  });
}

async function onNuevaRutina(event) {
  event.preventDefault();
  const input = document.getElementById('nueva-rutina-nombre');
  const nombre = input.value.trim();
  if (!nombre) return;

  const { data, error } = await supabaseClient
    .from('routines')
    .insert({ user_id: usuarioActual.id, name: nombre, source: 'custom', is_active: false })
    .select('id')
    .single();

  if (error) return mostrarError(error);

  input.value = '';
  rutinaSeleccionadaId = data.id;
  await cargarRutinas();
}

// Activar desactiva primero cualquier otra rutina activa del usuario (la
// BD solo permite una a la vez) y luego marca esta — en dos pasos porque
// no puede haber un instante con dos filas activas a la vez.
async function activarRutina(routineId) {
  const { error: errorDesactivar } = await supabaseClient
    .from('routines')
    .update({ is_active: false })
    .eq('user_id', usuarioActual.id)
    .eq('is_active', true);

  if (errorDesactivar) return mostrarError(errorDesactivar);

  const { error: errorActivar } = await supabaseClient
    .from('routines')
    .update({ is_active: true })
    .eq('id', routineId);

  if (errorActivar) return mostrarError(errorActivar);

  await cargarRutinas();
}

async function renombrarRutina(routineId) {
  const actual = listaRutinas.find((r) => r.id === routineId);
  const nuevoNombre = prompt('Nuevo nombre de la rutina:', actual?.name ?? '');
  if (!nuevoNombre || !nuevoNombre.trim()) return;

  const { error } = await supabaseClient
    .from('routines')
    .update({ name: nuevoNombre.trim() })
    .eq('id', routineId);

  if (error) return mostrarError(error);
  await cargarRutinas();
}

async function eliminarRutina(routineId) {
  if (!confirm('¿Eliminar esta rutina y todos sus días y ejercicios asignados? Esta acción no se puede deshacer.')) return;

  const { error } = await supabaseClient
    .from('routines')
    .delete()
    .eq('id', routineId);

  if (error) return mostrarError(error);

  if (rutinaSeleccionadaId === routineId) rutinaSeleccionadaId = null;
  await cargarRutinas();
}

async function seleccionarRutina(routineId) {
  rutinaSeleccionadaId = routineId;
  renderListaRutinas();
  await cargarDias();
}

// ---------------------------------------------------------------------
// Días de rutina
// ---------------------------------------------------------------------

async function cargarDias() {
  const rutina = listaRutinas.find((r) => r.id === rutinaSeleccionadaId);
  document.getElementById('titulo-rutina-seleccionada').textContent = rutina ? `Días de "${rutina.name}"` : '';

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
    .eq('routine_id', rutinaSeleccionadaId)
    .order('day_of_week', { ascending: true });

  if (error) return mostrarError(error);

  const contenedor = document.getElementById('lista-dias');
  contenedor.innerHTML = '';
  (data || []).forEach((dia) => {
    dia.routine_day_exercises.sort((a, b) => a.order_index - b.order_index);
    contenedor.appendChild(renderDiaCard(dia));
  });

  renderAgregarDiaForm(data || []);
}

// Formulario para agregar un día nuevo a la rutina seleccionada — solo
// ofrece días de la semana que esa rutina todavía no tiene.
function renderAgregarDiaForm(diasActuales) {
  const contenedor = document.getElementById('agregar-dia-container');
  const diasUsados = new Set(diasActuales.map((d) => d.day_of_week));
  const diasDisponibles = [1, 2, 3, 4, 5, 6, 7].filter((d) => !diasUsados.has(d));

  if (!rutinaSeleccionadaId || diasDisponibles.length === 0) {
    contenedor.innerHTML = '';
    return;
  }

  contenedor.innerHTML = `
    <div class="card mb-4">
      <div class="card-header">Agregar día a esta rutina</div>
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-6 col-md-4">
            <label class="form-label small">Día</label>
            <select class="form-select form-select-sm" id="nuevo-dia-select">
              ${diasDisponibles.map((d) => `<option value="${d}">${DIAS_SEMANA[d]}</option>`).join('')}
            </select>
          </div>
          <div class="col-6 col-md-6">
            <label class="form-label small">Enfoque</label>
            <input type="text" class="form-control form-control-sm" id="nuevo-dia-focus" placeholder="Ej. Pierna (pesado)">
          </div>
          <div class="col-12 col-md-2">
            <button type="button" class="btn btn-sm btn-outline-primary w-100" id="btn-agregar-dia">+</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-agregar-dia').addEventListener('click', onAgregarDia);
}

async function onAgregarDia() {
  const dayOfWeek = Number(document.getElementById('nuevo-dia-select').value);
  const focus = document.getElementById('nuevo-dia-focus').value.trim();
  if (!focus) return;

  const { error } = await supabaseClient
    .from('routine_days')
    .insert({ user_id: usuarioActual.id, routine_id: rutinaSeleccionadaId, day_of_week: dayOfWeek, focus });

  if (error) return mostrarError(error);
  await cargarDias();
}

async function eliminarDia(routineDayId) {
  if (!confirm('¿Eliminar este día y todos sus ejercicios asignados?')) return;

  const { error } = await supabaseClient
    .from('routine_days')
    .delete()
    .eq('id', routineDayId);

  if (error) return mostrarError(error);
  await cargarDias();
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
        <div class="col-4 col-md-1">
          <button type="button" class="btn btn-sm btn-outline-danger w-100 btn-eliminar-dia">Eliminar día</button>
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
          <div class="search-combo">
            <svg class="search-combo-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11L14.5 14.5"/></svg>
            <input type="text" class="form-control form-control-sm input-agregar-ejercicio" list="datalist-catalogo" placeholder="Buscar ejercicio…" autocomplete="off">
          </div>
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
  card.querySelector('.btn-eliminar-dia').addEventListener('click', () => eliminarDia(dia.id));

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
  const input = card.querySelector('.input-agregar-ejercicio');
  const ejercicio = buscarEjercicioPorNombre(input.value.trim());
  if (!ejercicio) return;

  const btn = card.querySelector('.btn-agregar-ejercicio');

  const payload = {
    user_id: usuarioActual.id,
    routine_day_id: routineDayId,
    exercise_id: ejercicio.id,
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

  input.value = '';
  card.querySelector('.nuevo-sets').value = '';
  card.querySelector('.nuevo-reps-min').value = '';
  card.querySelector('.nuevo-reps-max').value = '';
  card.querySelector('.nuevo-duracion').value = '';
}
