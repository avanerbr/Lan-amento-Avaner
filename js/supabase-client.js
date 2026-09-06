// =========================================================================
// Cliente Supabase — inicializado a partir de window.AVANER_CONFIG
// (js/config.js precisa ser carregado ANTES deste arquivo no <script>).
// =========================================================================

(function () {
  const cfg = window.AVANER_CONFIG || {};

  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes('SEU-PROJETO')) {
    console.error(
      '[Avaner] js/config.js ainda não foi preenchido com a URL e a chave ' +
      'do seu projeto Supabase. Edite SUPABASE_URL e SUPABASE_ANON_KEY.'
    );
  }

  window.supabaseClient = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  // Resolve o e-mail logado para {name, role, slot} usando a lista TEAM do
  // config.js. Se o e-mail não estiver na lista (alguém logou mas não foi
  // cadastrado no config), cai num fallback neutro baseado no e-mail.
  window.resolveTeamMember = function (email) {
    const found = (cfg.TEAM || []).find(
      (m) => m.email.toLowerCase() === (email || '').toLowerCase()
    );
    if (found) return found;
    return {
      email: email || '',
      name: (email || 'Convidado').split('@')[0],
      role: '',
      slot: 'team',
    };
  };
})();
