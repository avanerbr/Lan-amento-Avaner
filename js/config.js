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
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
  SUPABASE_ANON_KEY: 'SUA-CHAVE-ANON-AQUI',

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
  // 4) Time — o e-mail é o mesmo que a pessoa usa pra logar (criado em
  //    Authentication → Users no Supabase). O "slot" define a cor de
  //    identidade dela nos gráficos (não mude os slots, são as 3 únicas
  //    cores validadas para contraste e daltonismo sobre o azul-marinho
  //    da marca — troque só os e-mails e nomes).
  // -----------------------------------------------------------------------
  TEAM: [
    { email: 'michael@avaner.com.br',   name: 'Michael',   role: 'Fundador',                slot: 'michael' },
    { email: 'jamille@avaner.com.br',   name: 'Jamille',   role: 'Customer Success',         slot: 'jamille' },
    { email: 'guilherme@avaner.com.br', name: 'Guilherme', role: 'Coprodutor de Marketing',  slot: 'guilherme' },
  ],
};
