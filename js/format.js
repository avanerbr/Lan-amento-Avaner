// =========================================================================
// Helpers de formatação e datas, compartilhados pelos outros módulos.
// =========================================================================

window.AvanerFormat = (function () {
  function fmtDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function fmtDateLong(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function fmtMoney(n) {
    return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }

  function fmtRelativeTime(isoTimestamp) {
    const diffMs = Date.now() - new Date(isoTimestamp).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.round(hours / 24);
    if (days < 7) return `há ${days}d`;
    return fmtDateLong(isoTimestamp.slice(0, 10));
  }

  function dueState(iso, done) {
    if (done) return 'done';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(iso + 'T00:00:00');
    const diff = (d - today) / 86400000;
    if (diff < 0) return 'overdue';
    if (diff <= 3) return 'soon';
    return 'normal';
  }

  function taskInvolves(task, person) {
    return task.owner === person || task.owner.includes(person) || task.owner === 'Equipe';
  }

  // Cor (ou gradiente) do chip de responsável — pessoa individual usa a
  // cor categórica dela; combinações ("Michael/Jamille") misturam as duas;
  // "Equipe" usa o 4º slot (amarelo), reservado pra dependência coletiva.
  function ownerChipBackground(owner) {
    const has = (name) => owner.includes(name);
    if (owner === 'Equipe') return 'var(--p-team)';
    if (has('Michael') && has('Jamille')) return 'color-mix(in oklch, var(--p-michael) 50%, var(--p-jamille) 50%)';
    if (has('Michael')) return 'var(--p-michael)';
    if (has('Guilherme')) return 'var(--p-guilherme)';
    if (has('Jamille')) return 'var(--p-jamille)';
    return 'var(--grafite)';
  }

  function slotColorVar(slot) {
    return { michael: 'var(--p-michael)', guilherme: 'var(--p-guilherme)', jamille: 'var(--p-jamille)', team: 'var(--p-team)' }[slot] || 'var(--grafite)';
  }

  return { fmtDate, fmtDateLong, fmtMoney, fmtRelativeTime, dueState, taskInvolves, ownerChipBackground, slotColorVar };
})();
