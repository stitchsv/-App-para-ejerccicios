// Lógica de la pantalla "Hoy" (dashboard).
// Depende de supabaseClient.js, auth.js y routine-data.js.

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireSession();
  if (!user) return;

  document.getElementById('user-email').textContent = user.email;

  const routine = await getTodayRoutine();
  renderRoutine(routine);

  document.getElementById('btn-registrar').addEventListener('click', () => {
    window.location.href = 'registrar-sesion.html';
  });

  document.getElementById('btn-logout').addEventListener('click', logout);
});

function renderRoutine(routine) {
  document.getElementById('dia-nombre').textContent = routine.dayName;
  document.getElementById('dia-enfoque').textContent = routine.focus;

  const aviso = document.getElementById('aviso-datos-referencia');
  aviso.classList.toggle('d-none', routine.fromDatabase);

  const lista = document.getElementById('lista-ejercicios');
  lista.innerHTML = '';

  if (routine.ejercicios.length === 0) {
    lista.innerHTML = '<li class="list-group-item text-muted">No hay ejercicios definidos para hoy.</li>';
    return;
  }

  routine.ejercicios.forEach((ej) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    const badgeClase = ej.type === 'cardio' ? 'text-bg-info' : 'text-bg-secondary';
    li.innerHTML = `<span>${ej.name}</span><span class="badge ${badgeClase} rounded-pill">${formatTarget(ej)}</span>`;
    lista.appendChild(li);
  });
}
