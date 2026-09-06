// =========================================================================
// Metas do lançamento (faturamento / grupo) + histórico para o gráfico de
// evolução.
// =========================================================================

window.AvanerMetrics = (function () {
  async function fetch() {
    const { data, error } = await window.supabaseClient.from('metrics').select('*').eq('id', 'main').maybeSingle();
    if (error) {
      console.error('[Avaner] erro ao carregar metas', error);
      return { revenueCurrent: 0, groupCount: 0 };
    }
    return {
      revenueCurrent: (data && data.revenue_current) || 0,
      groupCount: (data && data.group_count) || 0,
    };
  }

  async function update({ revenueCurrent, groupCount }) {
    const payload = { id: 'main', updated_at: new Date().toISOString() };
    if (revenueCurrent !== undefined) payload.revenue_current = revenueCurrent;
    if (groupCount !== undefined) payload.group_count = groupCount;

    const { error } = await window.supabaseClient.from('metrics').upsert(payload);
    if (error) {
      console.error('[Avaner] erro ao salvar metas', error);
      return;
    }

    // snapshot do dia, pra alimentar o gráfico de evolução — se já existe
    // um snapshot de hoje, atualiza; senão cria.
    const current = await fetch();
    const today = new Date().toISOString().slice(0, 10);
    const { error: histError } = await window.supabaseClient
      .from('metrics_history')
      .upsert({ day: today, revenue: current.revenueCurrent, group_count: current.groupCount }, { onConflict: 'day' });
    if (histError) console.error('[Avaner] erro ao salvar histórico', histError);
  }

  async function fetchHistory() {
    const { data, error } = await window.supabaseClient
      .from('metrics_history')
      .select('*')
      .order('day', { ascending: true })
      .limit(120);
    if (error) {
      console.error('[Avaner] erro ao carregar histórico', error);
      return [];
    }
    return data.map((r) => ({ day: r.day, revenue: r.revenue, groupCount: r.group_count }));
  }

  return { fetch, update, fetchHistory };
})();
