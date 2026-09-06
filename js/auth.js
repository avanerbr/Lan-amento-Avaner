// =========================================================================
// Autenticação — login, logout e guarda de sessão.
// Depende de js/config.js e js/supabase-client.js (carregados antes).
// =========================================================================

// Chamado no topo do index.html. Redireciona pra login.html se não houver
// sessão válida. Devolve o usuário logado (com nome/cor resolvidos) quando
// há sessão.
window.requireSession = async function () {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error || !data.session) {
    window.location.href = 'login.html';
    return null;
  }
  const email = data.session.user.email;
  const member = window.resolveTeamMember(email);

  window.supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.href = 'login.html';
  });

  return member;
};

window.doLogout = async function () {
  await window.supabaseClient.auth.signOut();
  window.location.href = 'login.html';
};

// Chamado em login.html.
window.setupLoginForm = function () {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  // Se já está logado, pula direto pro painel.
  window.supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session) window.location.href = 'index.html';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const { error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorBox.textContent =
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar: ' + error.message;
      errorBox.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
      return;
    }

    window.location.href = 'index.html';
  });
};
