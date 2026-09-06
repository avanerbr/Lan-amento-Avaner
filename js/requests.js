// =========================================================================
// Pedidos — alguém pede algo de outra pessoa e o sistema aponta pra quem
// precisa agir (ex: Guilherme pede um material, Michael vê que precisa
// gravar algo).
// =========================================================================

window.AvanerRequests = (function () {
  async function fetchAll() {
    const { data, error } = await window.supabaseClient
      .from('requests')
      .select('*, tasks(title)')
      .order('created_at', { ascending: false })
      .limit(150);
    if (error) {
      console.error('[Avaner] erro ao carregar pedidos', error);
      return [];
    }
    return data;
  }

  // taskId é opcional — fica preenchido quando o pedido nasceu de uma
  // tarefa marcada como "Bloqueada" no quadro de tarefas.
  async function add({ fromName, toName, body, taskId }) {
    const { error } = await window.supabaseClient
      .from('requests')
      .insert({ from_name: fromName, to_name: toName, body, task_id: taskId || null });
    if (error) throw error;
  }

  async function resolve(id, resolvedBy) {
    const { error } = await window.supabaseClient
      .from('requests')
      .update({ resolved: true, resolved_by: resolvedBy, resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  function countOpenFor(items, name) {
    return items.filter((r) => !r.resolved && (r.to_name === name || r.to_name === 'Todos')).length;
  }

  function render(container, doneContainer, items, currentName) {
    const F = window.AvanerFormat;
    const open = items.filter((r) => !r.resolved);
    const done = items.filter((r) => r.resolved).slice(0, 20);

    function card(r) {
      const chipBg = F.ownerChipBackground(r.to_name === 'Todos' ? 'Equipe' : r.to_name);
      const linkedTitle = r.tasks && r.tasks.title ? r.tasks.title : null;
      return `<div class="request-item ${r.resolved ? 'resolved' : ''}" data-id="${r.id}">
        <div class="request-top">
          <div class="request-route"><b>${r.from_name}</b> → <span class="owner-chip" style="background:${chipBg}">${r.to_name}</span></div>
          <div class="note-time">${F.fmtRelativeTime(r.created_at)}</div>
        </div>
        ${linkedTitle ? `<div class="request-task-tag">🔗 tarefa: ${linkedTitle}</div>` : ''}
        <div class="note-body">${r.body.replace(/</g, '&lt;')}</div>
        ${!r.resolved ? '<div class="creative-actions" style="margin-top:8px;"><button type="button" class="btn-resolve" data-action="resolve">Concluir</button></div>' : `<div class="request-resolved-tag">✓ concluído${r.resolved_by ? ' por ' + r.resolved_by : ''}</div>`}
      </div>`;
    }

    container.innerHTML = open.length ? open.map(card).join('') : '<div class="note-empty">Nenhum pedido pendente.</div>';
    doneContainer.innerHTML = done.length ? done.map(card).join('') : '<div class="note-empty">Nenhum pedido concluído ainda.</div>';

    container.querySelectorAll('[data-action="resolve"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('.request-item').dataset.id;
        btn.disabled = true;
        try {
          await resolve(id, currentName);
        } catch (e) {
          alert('Não foi possível concluir: ' + e.message);
          btn.disabled = false;
        }
      });
    });
  }

  return { fetchAll, add, resolve, countOpenFor, render };
})();
