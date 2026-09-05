// Lógica de la pantalla de Perfil: preferencias de apariencia (tema y
// tamaño de letra) y cerrar sesión.
// Depende de supabaseClient.js y auth.js.
//
// Las preferencias se guardan en localStorage (por dispositivo, no en la
// base de datos) bajo 'pref-tema' ('dark'|'light') y 'pref-tamano-letra'
// ('small'|'medium'|'large'). El mismo par de claves lo lee, antes del
// primer pintado, el script inline en el <head> de cada página para
// aplicar el tema sin parpadeo — si cambian los nombres aquí, hay que
// cambiarlos también en ese script en cada .html.

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireSession();
  if (!user) return;

  document.getElementById('perfil-email').textContent = user.email;

  marcarActivo('grupo-tema', localStorage.getItem('pref-tema') || 'dark');
  marcarActivo('grupo-tamano', localStorage.getItem('pref-tamano-letra') || 'medium');

  document.querySelectorAll('#grupo-tema .chip').forEach((btn) => {
    btn.addEventListener('click', () => aplicarTema(btn.dataset.valor));
  });
  document.querySelectorAll('#grupo-tamano .chip').forEach((btn) => {
    btn.addEventListener('click', () => aplicarTamano(btn.dataset.valor));
  });

  document.getElementById('btn-logout').addEventListener('click', logout);
});

function marcarActivo(contenedorId, valorActivo) {
  document.querySelectorAll(`#${contenedorId} .chip`).forEach((btn) => {
    btn.classList.toggle('activo', btn.dataset.valor === valorActivo);
  });
}

function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch (e) {
    // localStorage puede fallar en navegación privada — la preferencia
    // simplemente no persiste entre visitas, sin romper la pantalla.
  }
}

function aplicarTema(valor) {
  guardarPreferencia('pref-tema', valor);
  if (valor === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  document.documentElement.style.colorScheme = valor === 'light' ? 'light' : 'dark';
  marcarActivo('grupo-tema', valor);
}

function aplicarTamano(valor) {
  guardarPreferencia('pref-tamano-letra', valor);
  if (valor === 'medium') {
    document.documentElement.removeAttribute('data-font-size');
  } else {
    document.documentElement.setAttribute('data-font-size', valor);
  }
  marcarActivo('grupo-tamano', valor);
}
