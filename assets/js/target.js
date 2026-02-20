// ============================================================
// TARGET.JS — Ramadhan Anti Mager Club 🌙
// Manajemen target & resolusi Ramadhan
// ============================================================
(() => {
    const PEOPLE = ['neng', 'aa'];
    const CACHE_KEY = nama => `ramc_targets_v3:${nama}`;

    const $ = id => document.getElementById(id);
    const supabase = () => window.RAMC?.supabase;

    const toast = (msg, dur = 2400) => {
        const el = $('toast'); if (!el) return;
        el.textContent = msg; el.className = 'toast show';
        clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), dur);
    };
    const setOffline = v => { const b = $('netBadge'); if (b) b.style.display = v ? 'inline-flex' : 'none'; };
    const cache = { read: k => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }, write: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } } };

    const state = {
        neng: { items: [], editingId: null },
        aa: { items: [], editingId: null },
    };

    const clearForm = nama => {
        const k = $(`${nama}_kategori`), t = $(`${nama}_target`), c = $(`${nama}_catatan`);
        if (k) k.value = ''; if (t) t.value = ''; if (c) c.value = '';
        state[nama].editingId = null;
        const btn = $(`${nama}_addBtn`); if (btn) btn.textContent = '✚ Tambah Target';
    };

    const setForm = (nama, row) => {
        const k = $(`${nama}_kategori`), t = $(`${nama}_target`), c = $(`${nama}_catatan`);
        if (k) k.value = row?.kategori || ''; if (t) t.value = row?.target || ''; if (c) c.value = row?.catatan || '';
        state[nama].editingId = row?.id || null;
        const btn = $(`${nama}_addBtn`); if (btn) btn.textContent = state[nama].editingId ? '💾 Simpan Perubahan' : '✚ Tambah Target';
    };

    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const renderList = nama => {
        const wrap = $(`${nama}_listWrap`); if (!wrap) return;
        const badge = $(`${nama}CountBadge`); if (badge) badge.textContent = String(state[nama].items.length);
        wrap.innerHTML = '';
        if (!state[nama].items.length) {
            wrap.innerHTML = `<div class="card" style="box-shadow:none; color:var(--muted);">Belum ada target. Tambah satu yuk! 🎯</div>`;
            return;
        }
        for (const row of state[nama].items) {
            const el = document.createElement('div'); el.className = 'card glow'; el.style.boxShadow = 'none'; el.style.cursor = 'pointer';
            el.innerHTML = `
        <div class="row between wrap">
          <div>
            <div class="pill">${esc(row.kategori || 'Umum')}</div>
            <div style="font-weight:900;font-size:15px;margin-top:8px;">${esc(row.target || '—')}</div>
            ${row.catatan ? `<div class="small muted" style="margin-top:4px;">${esc(row.catatan)}</div>` : ''}
          </div>
          <span class="badge">✏️ Edit</span>
        </div>
        <div class="divider"></div>
        <div class="row between">
          <button class="btn ghost" type="button" data-del="${row.id}" style="padding:8px 12px; font-size:12px;">🗑️ Hapus</button>
          <span class="small muted">#${row.id}</span>
        </div>`;
            el.addEventListener('click', e => {
                if (e.target.dataset.del) return;
                setForm(nama, row);
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
            el.querySelector('[data-del]').addEventListener('click', async e => {
                e.stopPropagation();
                await removeTarget(nama, Number(e.currentTarget.dataset.del));
            });
            wrap.appendChild(el);
        }
    };

    const loadOne = async nama => {
        const key = CACHE_KEY(nama);
        try {
            const res = await supabase().from('targets').select('*').eq('nama', nama).order('created_at', { ascending: false });
            if (res.error) throw res.error;
            state[nama].items = res.data || [];
            cache.write(key, state[nama].items); setOffline(false);
        } catch {
            const c = cache.read(key);
            if (c) { state[nama].items = c; setOffline(true); toast('Mode offline aktif'); }
            else setOffline(true);
        }
        renderList(nama);
    };

    const loadAll = async () => { await Promise.all(PEOPLE.map(loadOne)); };

    const upsertTarget = async nama => {
        const kategori = ($(`${nama}_kategori`)?.value || '').trim();
        const target = ($(`${nama}_target`)?.value || '').trim();
        const catatan = ($(`${nama}_catatan`)?.value || '').trim();
        if (!kategori || !target) { toast('Isi kategori & target dulu ya 😊'); return; }
        const payload = { nama, kategori, target, catatan: catatan || null };
        if (state[nama].editingId) payload.id = state[nama].editingId;
        try {
            const res = await supabase().from('targets').upsert(payload);
            if (res.error) throw res.error;
            setOffline(false); toast('Target tersimpan! 🎯');
            clearForm(nama); await loadOne(nama);
        } catch { setOffline(true); toast('Koneksi bermasalah 😅 Coba lagi ya!'); }
    };

    const removeTarget = async (nama, id) => {
        try {
            const res = await supabase().from('targets').delete().eq('id', id);
            if (res.error) throw res.error;
            setOffline(false); toast('Target dihapus!');
            if (state[nama].editingId === id) clearForm(nama);
            await loadOne(nama);
        } catch { setOffline(true); toast('Koneksi bermasalah 😅'); }
    };

    // Stars canvas
    const initStars = () => {
        const cv = $('starsCanvas'); if (!cv) return;
        const ctx = cv.getContext('2d'); let w, h; const stars = [], meteors = []; const rand = (a, b) => a + Math.random() * (b - a);
        const resize = () => { w = cv.width = Math.floor(innerWidth * devicePixelRatio); h = cv.height = Math.floor(innerHeight * devicePixelRatio); };
        const mkS = () => { stars.length = 0; for (let i = 0; i < Math.floor(innerWidth * innerHeight / 9000); i++)stars.push({ x: rand(0, w), y: rand(0, h), r: rand(0.6, 1.7) * devicePixelRatio, a: rand(0.25, 0.9), tw: rand(0.002, 0.01) }); };
        const spawn = () => meteors.push({ x: rand(0, w * 0.9), y: rand(0, h * 0.35), vx: rand(14, 22) * devicePixelRatio, vy: rand(5, 9) * devicePixelRatio, life: rand(28, 44), len: rand(90, 140) * devicePixelRatio });
        const tick = () => { ctx.clearRect(0, 0, w, h); for (const s of stars) { s.a += Math.sin(Date.now() * s.tw) * 0.002; ctx.fillStyle = `rgba(255,253,245,${Math.max(0.12, Math.min(0.9, s.a))})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); } if (Math.random() < 0.018) spawn(); for (let i = meteors.length - 1; i >= 0; i--) { const m = meteors[i]; m.x += m.vx; m.y += m.vy; m.life--; const g = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * 0.35); g.addColorStop(0, 'rgba(251,191,36,.65)'); g.addColorStop(1, 'rgba(255,253,245,0)'); ctx.strokeStyle = g; ctx.lineWidth = 2.2 * devicePixelRatio; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.len, m.y - m.len * 0.35); ctx.stroke(); if (m.life <= 0 || m.x > w + m.len || m.y > h + m.len) meteors.splice(i, 1); } requestAnimationFrame(tick); };
        resize(); addEventListener('resize', () => { resize(); mkS(); }); mkS(); requestAnimationFrame(tick);
    };

    const init = async () => {
        initStars();
        const sub = $('subTitle'); if (sub) sub.textContent = 'Target Neng & Aa';
        $('reloadBtn')?.addEventListener('click', loadAll);
        for (const n of PEOPLE) {
            $(`${n}_clearBtn`)?.addEventListener('click', () => clearForm(n));
            $(`${n}_addBtn`)?.addEventListener('click', () => upsertTarget(n));
        }
        await loadAll();
    };

    if (window.RAMC) { init().catch(() => toast('Waduh, koneksi bermasalah 😅')); }
    else { window.addEventListener('ramc:ready', () => init().catch(() => toast('Waduh, koneksi bermasalah 😅')), { once: true }); }
})();
