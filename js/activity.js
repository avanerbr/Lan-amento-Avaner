// =========================================================================
// Atividade recente — junta eventos de tarefas, criativos, notas e pedidos
// num único feed ordenado por tempo, pra dar "pulso" de time acontecendo
// (a ideia do ClickUp de um feed de atividade, só que enxuta).
// =========================================================================

window.AvanerActivity = (function () {
  function fromTasks(tasks) {
    const labels = { doing: 'começou', blocked: 'bloqueou', done: 'concluiu' };
    return tasks
      .filter((t) => t.status && t.status !== 'todo' && t.updatedAt)
      .map((t) => ({
        ts: t.updatedAt,
        icon: t.status === 'done' ? '✓' : t.status === 'blocked' ? '⛔' : '◐',
        text: `<b>${(t.status === 'done' && t.doneBy) || t.owner}</b> ${labels[t.status] || 'atualizou'} "${t.title}"`,
      }));
  }

  function fromCreatives(items) {
    return items.map((c) => ({
      ts: c.created_at,
      icon: '🎬',
      text: `<b>${c.uploaded_by || 'Alguém'}</b> adicionou o criativo "${c.title}"`,
    }));
  }

  function fromNotes(items) {
    return items.map((n) => ({
      ts: n.created_at,
      icon: '📝',
      text: `<b>${n.author}</b> anotou: "${n.body.length > 60 ? n.body.slice(0, 60) + '…' : n.body}"`,
    }));
  }

  function fromRequests(items) {
    const out = [];
    items.forEach((r) => {
      out.push({ ts: r.created_at, icon: '✉️', text: `<b>${r.from_name}</b> pediu algo pra <b>${r.to_name}</b>` });
      if (r.resolved && r.resolved_at) {
        out.push({ ts: r.resolved_at, icon: '✅', text: `<b>${r.resolved_by || r.to_name}</b> concluiu o pedido de ${r.from_name}` });
      }
    });
    return out;
  }

  function build({ tasks, creatives, notes, requests }) {
    const all = [
      ...fromTasks(tasks || []),
      ...fromCreatives(creatives || []),
      ...fromNotes(notes || []),
      ...fromRequests(requests || []),
    ].filter((e) => e.ts);
    all.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return all.slice(0, 12);
  }

  function render(container, events) {
    const F = window.AvanerFormat;
    container.innerHTML = events.length
      ? events
          .map(
            (e) => `<div class="activity-item">
        <span class="activity-icon">${e.icon}</span>
        <span class="activity-text">${e.text}</span>
        <span class="activity-time">${F.fmtRelativeTime(e.ts)}</span>
      </div>`
          )
          .join('')
      : '<div class="note-empty">Nenhuma atividade ainda.</div>';
  }

  return { build, render };
})();
