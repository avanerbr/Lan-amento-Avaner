// =========================================================================
// Observações — mural de notas sobre o andamento do lançamento.
// =========================================================================

window.AvanerNotes = (function () {
  async function fetchAll() {
    const { data, error } = await window.supabaseClient.from('notes').select('*').order('created_at', { ascending: false }).limit(80);
    if (error) {
      console.error('[Avaner] erro ao carregar observações', error);
      return [];
    }
    return data;
  }

  async function add({ author, body }) {
    const { error } = await window.supabaseClient.from('notes').insert({ author, body });
    if (error) throw error;
  }

  async function remove(id) {
    const { error } = await window.supabaseClient.from('notes').delete().eq('id', id);
    if (error) throw error;
  }

  function render(container, items, currentName) {
    const F = window.AvanerFormat;
    if (!items.length) {
      container.innerHTML = '<div class="note-empty">Nenhuma observação ainda. Registre como está indo o lançamento abaixo.</div>';
      return;
    }
    container.innerHTML = items
      .map((n) => {
        const chipBg = F.ownerChipBackground(n.author);
        return `<div class="note-item" data-id="${n.id}">
        <div class="note-top">
          <div class="note-author"><span class="dot" style="background:${chipBg};color:${chipBg}"></span>${n.author}</div>
          <div class="note-time">${F.fmtRelativeTime(n.created_at)}</div>
        </div>
        <div class="note-body">${n.body.replace(/</g, '&lt;')}</div>
        ${n.author === currentName ? '<div class="creative-actions" style="margin-top:8px;"><button type="button" class="danger" data-action="delete">Excluir</button></div>' : ''}
      </div>`;
      })
      .join('');

    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('.note-item').dataset.id;
        btn.disabled = true;
        try {
          await remove(id);
        } catch (e) {
          alert('Não foi possível excluir: ' + e.message);
          btn.disabled = false;
        }
      });
    });
  }

  return { fetchAll, add, remove, render };
})();
