// =========================================================================
// Materiais criativos — upload real (Supabase Storage) ou link externo.
// =========================================================================

window.AvanerCreatives = (function () {
  const BUCKET = 'criativos';

  function publicUrl(path) {
    const { data } = window.supabaseClient.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function fetchAll() {
    const { data, error } = await window.supabaseClient.from('creative_assets').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('[Avaner] erro ao carregar criativos', error);
      return [];
    }
    return data;
  }

  async function addLink({ title, phase, url, uploadedBy }) {
    const { error } = await window.supabaseClient.from('creative_assets').insert({
      title,
      phase: phase || null,
      kind: 'link',
      url,
      uploaded_by: uploadedBy,
    });
    if (error) throw error;
  }

  async function addUpload({ title, phase, file, uploadedBy, onProgress }) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${Date.now()}-${safeName}`;

    if (onProgress) onProgress('Enviando arquivo…');
    const { error: upErr } = await window.supabaseClient.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (upErr) throw upErr;

    const { error } = await window.supabaseClient.from('creative_assets').insert({
      title,
      phase: phase || null,
      kind: 'upload',
      storage_path: path,
      uploaded_by: uploadedBy,
    });
    if (error) throw error;
  }

  async function remove(item) {
    if (item.storage_path) {
      await window.supabaseClient.storage.from(BUCKET).remove([item.storage_path]);
    }
    const { error } = await window.supabaseClient.from('creative_assets').delete().eq('id', item.id);
    if (error) throw error;
  }

  function isImage(name) {
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(name || '');
  }
  function isVideo(name) {
    return /\.(mp4|mov|webm)$/i.test(name || '');
  }

  function render(container, items) {
    const F = window.AvanerFormat;
    if (!items.length) {
      container.innerHTML = '<div class="creative-empty">Nenhum criativo enviado ainda. Use o formulário abaixo para adicionar o primeiro.</div>';
      return;
    }
    container.innerHTML = items
      .map((item) => {
        const href = item.kind === 'upload' ? publicUrl(item.storage_path) : item.url;
        const fileName = item.kind === 'upload' ? item.storage_path : item.url;
        let thumb = '🔗';
        if (item.kind === 'upload' && isImage(fileName)) thumb = `<img src="${href}" alt="">`;
        else if (item.kind === 'upload' && isVideo(fileName)) thumb = `<video src="${href}" muted></video>`;
        else if (item.kind === 'upload') thumb = '📄';
        return `<div class="creative-card" data-id="${item.id}">
        <div class="creative-thumb">${thumb}</div>
        <div class="creative-body">
          <div class="creative-title">${item.title}</div>
          <div class="creative-meta"><span>${item.phase ? item.phase.replace(/^Fase \d: /, '') : 'Geral'}</span><span>${F.fmtRelativeTime(item.created_at)}</span></div>
          <div class="creative-meta"><span>${item.uploaded_by || '—'}</span><span>${item.kind === 'upload' ? 'arquivo' : 'link'}</span></div>
          <div class="creative-actions">
            <a href="${href}" target="_blank" rel="noopener">Abrir</a>
            <button type="button" class="danger" data-action="delete">Excluir</button>
          </div>
        </div>
      </div>`;
      })
      .join('');

    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const card = btn.closest('.creative-card');
        const item = items.find((i) => i.id === card.dataset.id);
        if (!item) return;
        if (!confirm(`Excluir "${item.title}"?`)) return;
        btn.disabled = true;
        try {
          await remove(item);
        } catch (e) {
          alert('Não foi possível excluir: ' + e.message);
          btn.disabled = false;
        }
      });
    });
  }

  return { fetchAll, addLink, addUpload, remove, render, publicUrl };
})();
