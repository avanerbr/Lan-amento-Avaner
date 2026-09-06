// =========================================================================
// app.js — bootstrap do painel. Amarra os módulos (tasks, metrics,
// creatives, notes, charts) à página e ao Supabase Realtime.
// =========================================================================

(async function () {
  const cfg = window.AVANER_CONFIG;
  const F = window.AvanerFormat;
  const T = window.AvanerTasks;
  const M = window.AvanerMetrics;
  const C = window.AvanerCreatives;
  const N = window.AvanerNotes;
  const Charts = window.AvanerCharts;

  const member = await window.requireSession();
  if (!member) return; // já foi redirecionado pro login

  const START_DATE = new Date(cfg.START_DATE);
  const LIVE_DATE = new Date(cfg.LIVE_DATE);

  T.init({ member, startDate: START_DATE, liveDate: LIVE_DATE });

  // ---- header -----------------------------------------------------------
  document.getElementById('user-dot').style.background = F.slotColorVar(member.slot);
  document.getElementById('user-name').textContent = member.name;
  document.getElementById('user-role').textContent = member.role || '';
  document.getElementById('logout-btn').addEventListener('click', window.doLogout);
  document.getElementById('countdown-platform').textContent =
    cfg.LIVE_PLATFORM + ' · ' + LIVE_DATE.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  function updateCountdown() {
    const diff = Math.ceil((LIVE_DATE - new Date()) / 86400000);
    document.getElementById('countdown-n').textContent = diff >= 0 ? diff : 0;
    document.getElementById('stat-days').textContent = diff >= 0 ? diff : 0;
  }
  updateCountdown();
  setInterval(updateCountdown, 60 * 60 * 1000);

  // ---- metas estáticas (rótulos vêm do config.js) ------------------------
  document.getElementById('revenue-sub').textContent = `meta ${F.fmtMoney(cfg.GOAL_REVENUE_MIN)}–${F.fmtMoney(cfg.GOAL_REVENUE_MAX)} na live`;
  document.getElementById('group-sub').textContent = `meta ${cfg.GOAL_GROUP_COUNT} até ${F.fmtDate(cfg.GOAL_GROUP_DATE)}`;

  // ---- filtros de responsável --------------------------------------------
  document.querySelectorAll('.chip-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip-filter').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      T.setOwnerFilter(btn.dataset.owner);
      T.renderPhases(document.getElementById('phases'), T.all);
    });
  });

  // ---- render geral a partir das tarefas ---------------------------------
  function renderTasksUI(tasks) {
    T.all = tasks;
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const pct = total ? (done / total) * 100 : 0;

    Charts.ring(document.getElementById('progress-ring'), pct, 'var(--areia)');
    document.getElementById('stat-done').textContent = `${done} / ${total} tarefas`;

    T.renderPerf(document.getElementById('perf'), tasks);
    T.renderRisks(document.getElementById('risks'), tasks);
    T.renderTimeline(document.getElementById('tl-track'), tasks);
    T.renderPhases(document.getElementById('phases'), tasks);
  }

  async function loadTasks() {
    renderTasksUI(await T.fetchAll());
  }

  // ---- metas: inputs + gráficos de evolução ------------------------------
  function paintGoalBars(m) {
    const revPct = Math.min(100, (m.revenueCurrent / cfg.GOAL_REVENUE_MAX) * 100);
    const grpPct = Math.min(100, (m.groupCount / cfg.GOAL_GROUP_COUNT) * 100);
    document.getElementById('revenue-bar').style.width = revPct + '%';
    document.getElementById('group-bar').style.width = grpPct + '%';
  }

  async function loadMetrics() {
    const m = await M.fetch();
    const revenueInput = document.getElementById('revenue');
    const groupInput = document.getElementById('group-count');
    if (document.activeElement !== revenueInput) revenueInput.value = m.revenueCurrent || 0;
    if (document.activeElement !== groupInput) groupInput.value = m.groupCount || 0;
    paintGoalBars(m);
  }

  async function loadHistory() {
    const history = await M.fetchHistory();
    const revenueSeries = history.map((h) => ({ day: h.day, value: h.revenue }));
    const groupSeries = history.map((h) => ({ day: h.day, value: h.groupCount }));

    const cs = getComputedStyle(document.documentElement);
    const michaelColor = cs.getPropertyValue('--p-michael').trim();
    const guilhermeColor = cs.getPropertyValue('--p-guilherme').trim();

    const revEl = document.getElementById('trend-revenue');
    const grpEl = document.getElementById('trend-group');
    const revOk = Charts.trend(revEl, revenueSeries, michaelColor);
    const grpOk = Charts.trend(grpEl, groupSeries, guilhermeColor);
    document.getElementById('trend-revenue-empty').hidden = revOk;
    document.getElementById('trend-group-empty').hidden = grpOk;
    revEl.hidden = !revOk;
    grpEl.hidden = !grpOk;

    if (history.length) {
      const last = history[history.length - 1];
      document.getElementById('trend-revenue-value').textContent = F.fmtMoney(last.revenue);
      document.getElementById('trend-group-value').textContent = last.groupCount;
    }
  }

  let revenueTimer, groupTimer;
  document.getElementById('revenue').addEventListener('input', (e) => {
    clearTimeout(revenueTimer);
    const val = Math.max(0, parseInt(e.target.value || '0', 10));
    revenueTimer = setTimeout(async () => {
      await M.update({ revenueCurrent: val });
      loadHistory();
    }, 600);
  });
  document.getElementById('group-count').addEventListener('input', (e) => {
    clearTimeout(groupTimer);
    const val = Math.max(0, parseInt(e.target.value || '0', 10));
    groupTimer = setTimeout(async () => {
      await M.update({ groupCount: val });
      loadHistory();
    }, 600);
  });

  // ---- criativos ----------------------------------------------------------
  const phaseSelect = document.getElementById('creative-phase');
  phaseSelect.innerHTML =
    '<option value="">Geral / sem fase</option>' + T.PHASE_ORDER.map((p) => `<option value="${p}">${p}</option>`).join('');

  let creativeKind = 'upload';
  document.querySelectorAll('.kind-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      creativeKind = btn.dataset.kind;
      document.querySelectorAll('.kind-toggle button').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      document.getElementById('creative-file-field').hidden = creativeKind !== 'upload';
      document.getElementById('creative-url-field').hidden = creativeKind !== 'link';
    });
  });

  async function loadCreatives() {
    C.render(document.getElementById('creatives'), await C.fetchAll());
  }

  document.getElementById('creative-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('creative-title').value.trim();
    const phase = phaseSelect.value;
    const btn = document.getElementById('creative-submit');
    const progress = document.getElementById('creative-progress');
    if (!title) return;

    btn.disabled = true;
    try {
      if (creativeKind === 'link') {
        const url = document.getElementById('creative-url').value.trim();
        if (!url) throw new Error('Informe o link.');
        await C.addLink({ title, phase, url, uploadedBy: member.name });
      } else {
        const file = document.getElementById('creative-file').files[0];
        if (!file) throw new Error('Selecione um arquivo.');
        await C.addUpload({
          title,
          phase,
          file,
          uploadedBy: member.name,
          onProgress: (msg) => (progress.textContent = msg),
        });
      }
      e.target.reset();
      progress.textContent = '';
      await loadCreatives();
    } catch (err) {
      alert('Não foi possível salvar: ' + err.message);
    } finally {
      btn.disabled = false;
    }
  });

  // ---- observações ----------------------------------------------------------
  async function loadNotes() {
    N.render(document.getElementById('notes'), await N.fetchAll(), member.name);
  }

  document.getElementById('note-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const textarea = document.getElementById('note-body');
    const body = textarea.value.trim();
    if (!body) return;
    const btn = document.getElementById('note-submit');
    btn.disabled = true;
    try {
      await N.add({ author: member.name, body });
      textarea.value = '';
      await loadNotes();
    } catch (err) {
      alert('Não foi possível salvar: ' + err.message);
    } finally {
      btn.disabled = false;
    }
  });

  // ---- realtime -------------------------------------------------------------
  const sb = window.supabaseClient;
  sb.channel('tasks-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks).subscribe();
  sb.channel('metrics-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'metrics' }, loadMetrics).subscribe();
  sb.channel('metrics-history-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'metrics_history' }, loadHistory).subscribe();
  sb.channel('creative-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'creative_assets' }, loadCreatives).subscribe();
  sb.channel('notes-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, loadNotes).subscribe();

  // ---- carga inicial ----------------------------------------------------------
  await Promise.all([loadTasks(), loadMetrics(), loadHistory(), loadCreatives(), loadNotes()]);
})();
