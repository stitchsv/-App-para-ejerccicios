// Pantalla de restablecimiento de contraseña. El link del correo de
// recuperación trae el token en el fragmento de la URL; supabase-js lo
// procesa solo al crear el cliente (detectSessionInUrl) y deja una sesión
// temporal de recuperación. No usa auth.js/requireSession porque esta
// página es válida sin sesión "normal" — la sesión de recuperación es lo
// que da permiso para llamar updateUser().

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('form-reset');
  const avisoSinToken = document.getElementById('aviso-sin-token');
  const mensajeError = document.getElementById('mensaje-error');
  const mensajeExito = document.getElementById('mensaje-exito');
  const btnGuardar = document.getElementById('btn-guardar');

  function mostrarFormulario() {
    avisoSinToken.classList.add('d-none');
    form.classList.remove('d-none');
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    mostrarFormulario();
  } else {
    avisoSinToken.classList.remove('d-none');
  }

  // Por si el token todavía se está procesando cuando se corrió el check de arriba.
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') mostrarFormulario();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    mensajeError.classList.add('d-none');

    const nueva = document.getElementById('nueva-password').value;
    const confirmar = document.getElementById('confirmar-password').value;

    if (nueva !== confirmar) {
      mensajeError.textContent = 'Las contraseñas no coinciden.';
      mensajeError.classList.remove('d-none');
      return;
    }

    btnGuardar.disabled = true;
    const { error } = await supabaseClient.auth.updateUser({ password: nueva });

    if (error) {
      mensajeError.textContent = error.message;
      mensajeError.classList.remove('d-none');
      btnGuardar.disabled = false;
      return;
    }

    form.classList.add('d-none');
    mensajeExito.classList.remove('d-none');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  });
});
