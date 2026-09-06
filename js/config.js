// =========================================================================
// CONFIGURAÇÃO — edite os valores abaixo antes de publicar.
// Você pode editar este arquivo direto pelo editor web do GitHub, sem
// precisar de terminal. Depois de editar e commitar, o Coolify publica a
// versão nova sozinho.
// =========================================================================

window.AVANER_CONFIG = {
  // -----------------------------------------------------------------------
  // 1) Supabase — pegue em Project Settings → API no seu projeto Supabase
  //    (crie um projeto NOVO e dedicado, separado do Código Vermelho e do
  //    CRM — é o que evita o problema de conexão que vocês já tiveram).
  // -----------------------------------------------------------------------
  SUPABASE_URL: 'https://lnhfvkkgqvuhjqoxcgjz.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_xoOSKs3Ch5t5Rt311VMW7Q_xHAD_acA',

  // -----------------------------------------------------------------------
  // 2) Datas do lançamento
  // -----------------------------------------------------------------------
  START_DATE: '2026-09-06T00:00:00-03:00',
  LIVE_DATE: '2026-10-20T19:00:00-03:00',
  LIVE_PLATFORM: 'Zoom',

  // -----------------------------------------------------------------------
  // 3) Metas
  // -----------------------------------------------------------------------
  GOAL_REVENUE_MIN: 1000000,
  GOAL_REVENUE_MAX: 3000000,
  GOAL_GROUP_COUNT: 200,
  GOAL_GROUP_DATE: '2026-10-12',

  // -----------------------------------------------------------------------
  // 4) Time — aparece como opções de login (em vez de digitar e-mail). O
  //    e-mail é o mesmo cadastrado em Authentication → Users no Supabase.
  //    O "slot" define a cor de identidade da pessoa nos gráficos — use
  //    só 'michael', 'jamille' ou 'guilherme' (são as 3 únicas cores
  //    validadas para contraste e daltonismo sobre o azul-marinho da
  //    marca; qualquer outro valor cai numa cor cinza neutra).
  //    Adicione as linhas da Jamille e do Guilherme aqui assim que criar
  //    os usuários deles no Supabase, pra eles aparecerem na tela de
  //    login também.
  // -----------------------------------------------------------------------
  TEAM: [
    { email: 'avanerbr@gmail.com', name: 'Michael', role: 'Fundador', slot: 'michael' },
  ],
};
