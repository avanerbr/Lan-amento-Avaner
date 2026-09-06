// =========================================================================
// Quadro de tarefas — fases, desempenho por pessoa, preocupações, timeline.
// =========================================================================

window.AvanerTasks = (function () {
  const F = window.AvanerFormat;

  const PHASE_ORDER = [
    'Fase 1: Alicerce',
    'Fase 2: Campanhas',
    'Fase 3: Captação e Aquecimento dos Leads',
    'Fase 4: Live de Lançamento',
    'Fase 5: Pós-Lançamento',
  ];

  let allTasks = [];
  let ownerFilter = 'Todos';
  let currentMember = null;
  let startDate, liveDate;

  function rowToTask(r) {
    return {
      id: r.id,
      phase: r.phase,
      title: r.title,
      detail: r.detail,
      owner: r.owner,
      dueDate: r.due_date,
      order: r.sort_order,
      done: r.done,
      doneBy: r.done_by,
    };
  }

  async function fetchAll() {
    const { data, error } = await window.supabaseClient.from('tasks').select('*');
    if (error) {
      console.error('[Avaner] erro ao carregar tarefas', error);
      return [];
    }
    return data.map(rowToTask);
  }

  async function toggleTask(id, nowDone) {
    const doneBy = nowDone ? (currentMember ? currentMember.name : 'Alguém') : null;
    const { error } = await window.supabaseClient
      .from('tasks')
      .update({ done: nowDone, done_by: doneBy, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) console.error('[Avaner] erro ao atualizar tarefa', error);
  }

  function getCurrentPhase(tasks) {
    const byPhase = {};
    tasks.forEach((t) => (byPhase[t.phase] = byPhase[t.phase] || []).push(t));
    const todayIso = new Date().toISOString().slice(0, 10);
    let current = null;
    PHASE_ORDER.forEach((p) => {
      const arr = byPhase[p];
      if (!arr) return;
      const dates = arr.map((t) => t.dueDate).sort();
      if (!current && todayIso <= dates[dates.length - 1]) current = p;
    });
    return current || PHASE_ORDER[PHASE_ORDER.length - 1];
  }

  function computeRisks(tasks) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const now = new Date();
    const elapsedPct = Math.min(100, Math.max(0, ((now - startDate) / (liveDate - startDate)) * 100));
    const actualPct = total ? (done / total) * 100 : 0;
    const gap = elapsedPct - actualPct;

    let pace;
    if (gap > 20) pace = { icon: 'crit', title: 'Ritmo do cronograma', text: `Cronograma atrasado: <b>${Math.round(actualPct)}%</b> das tarefas feitas, mas já se passou <b>${Math.round(elapsedPct)}%</b> do prazo até a live.` };
    else if (gap > 8) pace = { icon: 'warn', title: 'Ritmo do cronograma', text: `Ritmo abaixo do ideal: <b>${Math.round(actualPct)}%</b> feito contra <b>${Math.round(elapsedPct)}%</b> do prazo decorrido.` };
    else pace = { icon: 'good', title: 'Ritmo do cronograma', text: `<b>${Math.round(actualPct)}%</b> das tarefas feitas para <b>${Math.round(elapsedPct)}%</b> do prazo decorrido.` };

    const overdue = tasks.filter((t) => !t.done && F.dueState(t.dueDate, t.done) === 'overdue');
    let overdueCard;
    if (overdue.length === 0) overdueCard = { icon: 'good', title: 'Tarefas atrasadas', text: 'Nenhuma tarefa passou da data prevista.' };
    else {
      const names = overdue.slice(0, 3).map((t) => t.title).join('; ');
      overdueCard = {
        icon: overdue.length >= 5 ? 'crit' : 'warn',
        title: `${overdue.length} tarefa${overdue.length > 1 ? 's' : ''} atrasada${overdue.length > 1 ? 's' : ''}`,
        text: names + (overdue.length > 3 ? '…' : ''),
      };
    }

    const currentPhase = getCurrentPhase(tasks);
    const phaseTasks = tasks.filter((t) => t.phase === currentPhase);
    const phaseDone = phaseTasks.filter((t) => t.done).length;
    const phasePct = phaseTasks.length ? Math.round((phaseDone / phaseTasks.length) * 100) : 0;
    const phaseCard = {
      icon: phasePct >= 60 ? 'good' : phasePct >= 30 ? 'warn' : 'serious',
      title: 'Fase em andamento',
      text: `<b>${currentPhase.replace(/^Fase \d: /, '')}</b> — ${phaseDone}/${phaseTasks.length} tarefas (${phasePct}%).`,
    };

    return [pace, overdueCard, phaseCard];
  }

  function renderRisks(container, tasks) {
    const icons = { good: '✓', warn: '!', serious: '!', crit: '✕' };
    container.innerHTML = computeRisks(tasks)
      .map(
        (c) => `
      <div class="risk-card">
        <div class="risk-head"><span class="risk-icon ${c.icon}">${icons[c.icon]}</span>${c.title}</div>
        <div class="risk-body">${c.text}</div>
      </div>`
      )
      .join('');
  }

  function renderTimeline(container, tasks) {
    const byPhase = {};
    tasks.forEach((t) => (byPhase[t.phase] = byPhase[t.phase] || []).push(t));
    const totalSpan = liveDate - startDate;
    const segColors = ['var(--navy)', 'var(--p-guilherme)', 'var(--p-jamille)', 'var(--p-michael)', 'var(--p-team)'];
    let html = '';
    PHASE_ORDER.forEach((p, i) => {
      const arr = byPhase[p];
      if (!arr || !arr.length) return;
      const dates = arr.map((t) => t.dueDate).sort();
      const start = new Date(dates[0] + 'T00:00:00');
      const end = new Date(dates[dates.length - 1] + 'T00:00:00');
      const widthPct = Math.max(4, ((end - start) / totalSpan) * 100);
      html += `<div class="tl-seg" style="width:${widthPct}%;background:${segColors[i % segColors.length]}" title="${p}">${p.replace('Fase ' + (i + 1) + ': ', '')}</div>`;
    });
    container.innerHTML = html;
    const now = new Date();
    const pct = Math.min(100, Math.max(0, ((now - startDate) / totalSpan) * 100));
    const marker = document.createElement('div');
    marker.className = 'tl-today';
    marker.style.left = pct + '%';
    container.appendChild(marker);
  }

  function renderPerf(container, tasks) {
    const people = [
      { name: 'Michael', color: 'var(--p-michael)' },
      { name: 'Guilherme', color: 'var(--p-guilherme)' },
      { name: 'Jamille', color: 'var(--p-jamille)' },
    ];
    container.innerHTML = people
      .map((p) => {
        const mine = tasks.filter((t) => F.taskInvolves(t, p.name));
        const md = mine.filter((t) => t.done).length;
        const pct = mine.length ? Math.round((md / mine.length) * 100) : 0;
        const overdue = mine.filter((t) => !t.done && F.dueState(t.dueDate, t.done) === 'overdue').length;
        const next = mine.filter((t) => !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        return `<div class="perf-card">
        <div class="perf-top">
          <div class="perf-name"><span class="dot" style="background:${p.color};color:${p.color}"></span>${p.name}</div>
          <div class="perf-pct" style="color:${p.color}">${pct}%</div>
        </div>
        <div class="perf-bar-track"><div class="perf-bar-fill" style="width:${pct}%;background:${p.color}"></div></div>
        <div class="perf-meta">
          <span>${md}/${mine.length} tarefas</span>
          ${overdue > 0 ? `<span class="od">${overdue} atrasada${overdue > 1 ? 's' : ''}</span>` : '<span>em dia</span>'}
        </div>
        ${next ? `<div class="perf-meta" style="margin-top:4px;"><span>próxima: ${next.title}</span><span>${F.fmtDate(next.dueDate)}</span></div>` : ''}
      </div>`;
      })
      .join('');
  }

  function renderPhases(container, tasks) {
    if (!tasks.length) {
      container.innerHTML = '<div class="loading">Nenhuma tarefa ainda.</div>';
      return;
    }
    const byPhase = {};
    tasks.forEach((t) => (byPhase[t.phase] = byPhase[t.phase] || []).push(t));
    const currentPhase = getCurrentPhase(tasks);

    container.innerHTML = PHASE_ORDER.filter((p) => byPhase[p])
      .map((p, idx) => {
        const arr = byPhase[p].slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (a.order || 0) - (b.order || 0));
        const visible = ownerFilter === 'Todos' ? arr : arr.filter((t) => F.taskInvolves(t, ownerFilter));
        if (!visible.length) return '';
        const pdone = arr.filter((t) => t.done).length;
        const dates = arr.map((t) => t.dueDate).sort();
        const range = F.fmtDate(dates[0]) + '–' + F.fmtDate(dates[dates.length - 1]);
        const openAttr = p === currentPhase ? 'open' : '';
        return `<details class="phase" ${openAttr}>
        <summary>
          <div class="phase-title">
            <span class="phase-num">${idx + 1}</span>
            <div><h2>${p.replace(/^Fase \d: /, '')}</h2><div class="phase-range">${range}</div></div>
          </div>
          <div class="phase-meta">
            <div class="phase-progress">
              <div class="phase-frac">${pdone}/${arr.length}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${arr.length ? (pdone / arr.length) * 100 : 0}%;background:var(--areia)"></div></div>
            </div>
            <svg class="chev" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </summary>
        <div class="task-list">
          ${visible
            .map((t) => {
              const state = F.dueState(t.dueDate, t.done);
              const chipBg = F.ownerChipBackground(t.owner);
              return `<div class="task ${t.done ? 'done' : ''}">
              <input type="checkbox" class="cb" data-id="${t.id}" ${t.done ? 'checked' : ''}>
              <div class="task-body">
                <div class="task-title">${t.title}</div>
                ${t.detail ? `<div class="task-detail">${t.detail}</div>` : ''}
                <div class="task-meta">
                  <span class="owner-chip" style="background:${chipBg}">${t.owner}</span>
                  <span class="due-pill ${state === 'overdue' ? 'overdue' : state === 'soon' ? 'soon' : ''}">${state === 'overdue' ? 'atrasado · ' : ''}${F.fmtDate(t.dueDate)}</span>
                  ${t.done && t.doneBy ? `<span class="doneby">✓ ${t.doneBy}</span>` : ''}
                </div>
              </div>
            </div>`;
            })
            .join('')}
        </div>
      </details>`;
      })
      .join('');

    container.querySelectorAll('.cb').forEach((cb) => {
      cb.addEventListener('change', async () => {
        cb.disabled = true;
        await toggleTask(cb.dataset.id, cb.checked);
        cb.disabled = false;
      });
    });
  }

  function setOwnerFilter(f) {
    ownerFilter = f;
  }

  function init(opts) {
    currentMember = opts.member;
    startDate = opts.startDate;
    liveDate = opts.liveDate;
  }

  return {
    PHASE_ORDER,
    fetchAll,
    renderPhases,
    renderPerf,
    renderRisks,
    renderTimeline,
    getCurrentPhase,
    setOwnerFilter,
    init,
    get all() {
      return allTasks;
    },
    set all(v) {
      allTasks = v;
    },
  };
})();
