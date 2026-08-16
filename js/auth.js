// Funciones de autenticación compartidas (login, registro, logout, guard de sesión).
// Depende de supabaseClient.js, debe cargarse después de ese script.

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signup(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = '../html/login.html';
}

// Llamar al inicio de cada página protegida (dashboard, registrar sesión, etc.).
// Redirige a login si no hay sesión activa y devuelve el usuario si la hay.
async function requireSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = '../html/login.html';
    return null;
  }
  return session.user;
}
