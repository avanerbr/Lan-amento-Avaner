// =========================================================================
// Quadro de tarefas — fases em abas, status (A fazer/Em andamento/
// Bloqueada/Concluída), prioridade, desempenho por pessoa, preocupações
// (incluindo o critério de "pronto para anúncios"), timeline.
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

  // Critério de prontidão: pra começar a fase X, a fase anterior listada
  // aqui precisa estar 100% concluída. Só a Fase 2 (Campanhas/anúncios)
  // tem critério por enquanto — é o "quando posso começar a rodar anúncio".
  const READINESS_GATES = {
    'Fase 2: Campanhas': 'Fase 1: Alicerce',
  };

  const STATUS_META = {
    todo: { icon: '○', label: 'A fazer' },
    doing: { icon: '◐', label: 'Em andamento' },
    blocked: { icon: '⛔', label: 'Bloqueada' },
    done: { icon: '✓', label: 'Concluída' },
  };

  let allTasks = [];
  let ownerFilter = 'Todos';
  let activePhase = null;
  let currentMember = null;
  let teamList = [];
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
      status: r.status || (r.done ? 'done' : 'todo'),
      priority: r.priority || 'normal',
      updatedAt: r.updated_at,
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

  // ---- status (otimista: quem chamou re-renderiza antes da gravação
  // confirmar, pra parecer instantâneo) -----------------------------------
  function setStatusLocal(tasks, id, status) {
    const t = tasks.find((x) => x.id === id);
    if (t) {
      t.status = status;
      t.done = status === 'done';
      t.doneBy = status === 'done' ? (currentMember ? currentMember.name : 'Alguém') : null;
      t.updatedAt = new Date().toISOString();
    }
    return tasks;
  }

  async function persistStatus(id, status) {
    const doneBy = status === 'done' ? (currentMember ? currentMember.name : 'Alguém') : null;
    const { error } = await window.supabaseClient
      .from('tasks')
      .update({ status, done: status === 'done', done_by: doneBy, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) console.error('[Avaner] erro ao atualizar status da tarefa', error);
    return !error;
  }

  function setPriorityLocal(tasks, id, priority) {
    const t = tasks.find((x) => x.id === id);
    if (t) t.priority = priority;
    return tasks;
  }

  async function persistPriority(id, priority) {
    const { error } = await window.supabaseClient
      .from('tasks')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) console.error('[Avaner] erro ao atualizar prioridade da tarefa', error);
    return !error;
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

  function computeAdsReadiness(tasks) {
    const gatePhase = READINESS_GATES['Fase 2: Campanhas'];
    const gateTasks = tasks.filter((t) => t.phase === gatePhase);
    const done = gateTasks.filter((t) => t.done).length;
    const total = gateTasks.length;
    const missing = gateTasks.filter((t) => !t.done).map((t) => t.title);
    return { ready: total > 0 && done === total, done, total, missing, gatePhase };
  }

  // Tarefas atrasadas/bloqueadas/pra hoje de uma pessoa específica —
  // alimenta o widget "Minhas pendências" na Visão Geral.
  function getPendingFor(tasks, personName) {
    const mine = tasks.filter((t) => F.taskInvolves(t, personName));
    const overdue = mine.filter((t) => t.status !== 'done' && F.dueState(t.dueDate, t.done) === 'overdue');
    const dueSoon = mine.filter((t) => t.status !== 'done' && F.dueState(t.dueDate, t.done) === 'soon');
    const blocked = mine.filter((t) => t.status === 'blocked');
    return { overdue, dueSoon, blocked };
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

    const readiness = computeAdsReadiness(tasks);
    const readinessCard = readiness.ready
      ? { icon: 'good', title: 'Pronto para anúncios', text: `<b>${readiness.gatePhase.replace(/^Fase \d: /, '')}</b> 100% concluída — pode subir as campanhas da Fase 2.` }
      : {
          icon: readiness.done / (readiness.total || 1) >= 0.7 ? 'warn' : 'serious',
          title: 'Pronto para anúncios',
          text: `Ainda não — <b>${readiness.done}/${readiness.total}</b> da ${readiness.gatePhase.replace(/^Fase \d: /, '')} concluída${readiness.missing.length ? '. Falta: ' + readiness.missing.slice(0, 2).join('; ') + (readiness.missing.length > 2 ? '…' : '') : ''}.`,
        };

    return [pace, overdueCard, phaseCard, readinessCard];
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

  // Linha do tempo — visual azul: fase concluída fica em azul sólido com
  // ✓, a fase atual pulsa/"escaneia", as futuras ficam em azul apagado.
  // O período cobre até a última data de qualquer tarefa (a Fase 5 vai um
  // pouco além da live) — evita cortar o segmento final. Se a barra passa
  // da data da live, um marcador "live" aparece no meio dela.
  function renderTimeline(container, tasks) {
    const byPhase = {};
    tasks.forEach((t) => (byPhase[t.phase] = byPhase[t.phase] || []).push(t));
    const current = getCurrentPhase(tasks);

    const allDueDates = tasks.map((t) => t.dueDate).filter(Boolean).sort();
    const lastDue = allDueDates.length ? new Date(allDueDates[allDueDates.length - 1] + 'T00:00:00') : liveDate;
    const timelineEnd = lastDue > liveDate ? lastDue : liveDate;
    const totalSpan = timelineEnd - startDate;

    let html = '';
    PHASE_ORDER.forEach((p) => {
      const arr = byPhase[p];
      if (!arr || !arr.length) return;
      const dates = arr.map((t) => t.dueDate).sort();
      const start = new Date(dates[0] + 'T00:00:00');
      const end = new Date(dates[dates.length - 1] + 'T00:00:00');
      const widthPct = Math.max(4, ((end - start) / totalSpan) * 100);
      const doneCount = arr.filter((t) => t.status === 'done').length;
      const isDone = doneCount === arr.length;
      const isCurrent = p === current && !isDone;
      const stateClass = isDone ? 'tl-done' : isCurrent ? 'tl-current' : 'tl-upcoming';
      const label = p.replace(/^Fase \d: /, '');
      html += `<div class="tl-seg ${stateClass}" style="width:${widthPct}%" title="${label} — ${doneCount}/${arr.length}">${isDone ? '✓ ' : ''}${label}</div>`;
    });
    // os segmentos ficam num wrapper interno com as pontas arredondadas
    // recortadas; os marcadores (hoje/live) ficam fora dele, senão o
    // recorte corta o "pino" que sobe/desce acima da barra.
    container.innerHTML = `<div class="tl-track-inner">${html}</div>`;

    const now = new Date();
    const nowPct = Math.min(100, Math.max(0, ((now - startDate) / totalSpan) * 100));
    const marker = document.createElement('div');
    marker.className = 'tl-today';
    marker.style.left = nowPct + '%';
    marker.innerHTML = '<span class="tl-today-dot"></span><span class="tl-today-label">hoje</span>';
    container.appendChild(marker);

    if (timelineEnd > liveDate) {
      const livePct = Math.min(100, Math.max(0, ((liveDate - startDate) / totalSpan) * 100));
      const liveMarker = document.createElement('div');
      liveMarker.className = 'tl-live';
      liveMarker.style.left = livePct + '%';
      liveMarker.innerHTML = '<span class="tl-live-label">live</span>';
      container.appendChild(liveMarker);
    }
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

  function setActivePhase(p) {
    activePhase = p;
  }
  function getActivePhase() {
    return activePhase;
  }
  function setOwnerFilter(f) {
    ownerFilter = f;
  }
  function getOwnerFilter() {
    return ownerFilter;
  }

  function renderPhaseTabs(container, tasks, onSelect) {
    const byPhase = {};
    tasks.forEach((t) => (byPhase[t.phase] = byPhase[t.phase] || []).push(t));
    if (!activePhase) activePhase = getCurrentPhase(tasks);

    container.innerHTML = PHASE_ORDER.filter((p) => byPhase[p])
      .map((p, idx) => {
        const arr = byPhase[p];
        const done = arr.filter((t) => t.done).length;
        const pct = arr.length ? (done / arr.length) * 100 : 0;
        const active = p === activePhase;
        return `<button type="button" class="phase-tab ${active ? 'active' : ''}" data-phase="${p}">
          <span class="phase-tab-num">${idx + 1}</span>
          <span class="phase-tab-body">
            <span class="phase-tab-name">${p.replace(/^Fase \d: /, '')}</span>
            <span class="phase-tab-frac">${done}/${arr.length}</span>
            <span class="phase-tab-bar"><span style="width:${pct}%"></span></span>
          </span>
        </button>`;
      })
      .join('');

    container.querySelectorAll('.phase-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activePhase = btn.dataset.phase;
        onSelect(activePhase);
      });
    });
  }

  function renderPhasePanel(container, tasks, onStatusChange, onPriorityChange) {
    if (!activePhase) activePhase = getCurrentPhase(tasks);
    const arr = tasks.filter((t) => t.phase === activePhase).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (a.order || 0) - (b.order || 0));
    const visible = ownerFilter === 'Todos' ? arr : arr.filter((t) => F.taskInvolves(t, ownerFilter));
    const done = arr.filter((t) => t.done).length;
    const dates = arr.map((t) => t.dueDate).sort();
    const range = arr.length ? F.fmtDate(dates[0]) + '–' + F.fmtDate(dates[dates.length - 1]) : '';

    const readiness = READINESS_GATES[activePhase] ? computeAdsReadiness(tasks) : null;
    const toOptions = teamList.map((m) => `<option value="${m.name}">${m.name}</option>`).join('') + '<option value="Todos">Todos</option>';

    container.innerHTML = `
      <div class="phase-panel-head">
        <div>
          <h2>${activePhase.replace(/^Fase \d: /, '')}</h2>
          <div class="phase-range">${range} · ${done}/${arr.length} concluídas</div>
        </div>
        <div class="bar-track" style="width:160px;"><div class="bar-fill" style="width:${arr.length ? (done / arr.length) * 100 : 0}%;background:var(--areia)"></div></div>
      </div>
      ${
        readiness
          ? `<div class="readiness-banner ${readiness.ready ? 'ready' : 'not-ready'}">
              ${readiness.ready ? '✅' : '⏳'}
              <div>
                <b>${readiness.ready ? 'Pronto para começar os anúncios' : 'Ainda não é hora de subir os anúncios'}</b>
                <span>Critério: ${readiness.gatePhase.replace(/^Fase \d: /, '')} 100% concluída (${readiness.done}/${readiness.total})${!readiness.ready && readiness.missing.length ? ' — falta: ' + readiness.missing.join('; ') : ''}.</span>
              </div>
            </div>`
          : ''
      }
      <div class="task-list">
        ${
          visible.length
            ? visible
                .map((t) => {
                  const state = F.dueState(t.dueDate, t.done);
                  const chipBg = F.ownerChipBackground(t.owner);
                  const sMeta = STATUS_META[t.status] || STATUS_META.todo;
                  return `<div class="task ${t.status} ${t.priority === 'urgente' ? 'urgente' : ''}" data-id="${t.id}">
              <div class="status-group" data-id="${t.id}">
                <button type="button" class="status-btn s-todo" data-status="todo" aria-pressed="${t.status === 'todo'}" title="A fazer">○</button>
                <button type="button" class="status-btn s-doing" data-status="doing" aria-pressed="${t.status === 'doing'}" title="Em andamento">◐</button>
                <button type="button" class="status-btn s-blocked" data-status="blocked" aria-pressed="${t.status === 'blocked'}" title="Bloqueada">⛔</button>
                <button type="button" class="status-btn s-done" data-status="done" aria-pressed="${t.status === 'done'}" title="Concluída">✓</button>
              </div>
              <div class="task-body">
                <div class="task-title-row">
                  <div class="task-title">${t.title}</div>
                  <button type="button" class="priority-btn ${t.priority === 'urgente' ? 'active' : ''}" data-id="${t.id}" title="Marcar/desmarcar como urgente">🔥</button>
                </div>
                ${t.detail ? `<div class="task-detail">${t.detail}</div>` : ''}
                <div class="task-meta">
                  <span class="owner-chip" style="background:${chipBg}">${t.owner}</span>
                  <span class="status-pill ${t.status}">${sMeta.label}</span>
                  <span class="due-pill ${state === 'overdue' ? 'overdue' : state === 'soon' ? 'soon' : ''}">${state === 'overdue' ? 'atrasado · ' : ''}${F.fmtDate(t.dueDate)}</span>
                  ${t.done && t.doneBy ? `<span class="doneby">✓ ${t.doneBy}</span>` : ''}
                </div>
                <div class="block-form" data-id="${t.id}" hidden>
                  <select class="block-to">${toOptions}</select>
                  <input type="text" class="block-note" placeholder="O que falta / de quem depende?">
                  <button type="button" class="block-submit">Registrar e pedir</button>
                  <button type="button" class="block-cancel">Cancelar</button>
                </div>
              </div>
            </div>`;
                })
                .join('')
            : '<div class="loading">Nenhuma tarefa dessa pessoa nesta fase.</div>'
        }
      </div>`;

    container.querySelectorAll('.status-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.status-group');
        const id = group.dataset.id;
        const status = btn.dataset.status;
        const row = btn.closest('.task');
        if (status === 'blocked') {
          const form = row.querySelector('.block-form');
          if (form) form.hidden = !form.hidden;
          return;
        }
        if (row) row.classList.add('pulse');
        onStatusChange(id, status);
      });
    });

    container.querySelectorAll('.priority-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const next = btn.classList.contains('active') ? 'normal' : 'urgente';
        onPriorityChange(id, next);
      });
    });

    container.querySelectorAll('.block-submit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const form = btn.closest('.block-form');
        const id = form.dataset.id;
        const toName = form.querySelector('.block-to').value;
        const note = form.querySelector('.block-note').value.trim();
        if (!note) {
          form.querySelector('.block-note').focus();
          return;
        }
        form.hidden = true;
        const row = form.closest('.task');
        if (row) row.classList.add('pulse');
        onStatusChange(id, 'blocked', { toName, note });
      });
    });

    container.querySelectorAll('.block-cancel').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.closest('.block-form').hidden = true;
      });
    });
  }

  function init(opts) {
    currentMember = opts.member;
    startDate = opts.startDate;
    liveDate = opts.liveDate;
    teamList = opts.team || [];
  }

  return {
    PHASE_ORDER,
    STATUS_META,
    fetchAll,
    setStatusLocal,
    persistStatus,
    setPriorityLocal,
    persistPriority,
    renderPhaseTabs,
    renderPhasePanel,
    renderPerf,
    renderRisks,
    renderTimeline,
    getCurrentPhase,
    computeAdsReadiness,
    getPendingFor,
    setOwnerFilter,
    getOwnerFilter,
    setActivePhase,
    getActivePhase,
    init,
    get all() {
      return allTasks;
    },
    set all(v) {
      allTasks = v;
    },
  };
})();
