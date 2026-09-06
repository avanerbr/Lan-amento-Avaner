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

// Chamado em login.html. Em vez de digitar e-mail, a pessoa escolhe seu
// nome numa lista (vinda de config.js → TEAM) e só digita a senha —
// evita erro de digitação de e-mail e deixa a tela mais rápida de usar.
window.setupLoginForm = function () {
  const cfg = window.AVANER_CONFIG;
  const picker = document.getElementById('login-picker');
  const form = document.getElementById('login-form');
  const selectedBox = document.getElementById('login-selected');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const backBtn = document.getElementById('login-back');

  // Se já está logado, pula direto pro painel.
  window.supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session) window.location.href = 'index.html';
  });

  const slotColor = (slot) =>
    ({ michael: '#2a78d6', guilherme: '#eb6834', jamille: '#199e70' }[slot] || '#65676B');

  picker.innerHTML = (cfg.TEAM || [])
    .map(
      (m) => `<button type="button" class="login-person" data-email="${m.email}" data-name="${m.name}">
      <span class="login-person-dot" style="background:${slotColor(m.slot)}"></span>
      <span>
        <span class="login-person-name">${m.name}</span>
        <span class="login-person-role">${m.role || ''}</span>
      </span>
    </button>`
    )
    .join('');

  function selectPerson(email, name) {
    emailInput.value = email;
    selectedBox.textContent = name;
    picker.hidden = true;
    form.hidden = false;
    errorBox.hidden = true;
    passwordInput.value = '';
    passwordInput.focus();
  }

  picker.querySelectorAll('.login-person').forEach((btn) => {
    btn.addEventListener('click', () => selectPerson(btn.dataset.email, btn.dataset.name));
  });

  backBtn.addEventListener('click', () => {
    form.hidden = true;
    picker.hidden = false;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorBox.textContent =
        error.message === 'Invalid login credentials'
          ? 'Senha incorreta.'
          : 'Não foi possível entrar: ' + error.message;
      errorBox.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
      return;
    }

    window.location.href = 'index.html';
  });
};
