// ============================================================
// TARGET.JS — Ramadhan Anti Mager Club 🌙
// Manajemen target & resolusi Ramadhan — Refactored & Synced
// ============================================================
(() => {
    const PEOPLE = ['neng', 'aa'];
    const CACHE_KEY = nama => `ramc_targets_v3:${nama}`;

    const $ = id => document.getElementById(id);
    const supabase = () => window.RAMC?.supabase;
    const syncManager = () => window.SyncManager;

    const toast = (msg, dur = 2400) => {
        const el = $('toast'); if (!el) return;
        el.textContent = msg; el.className = 'toast show';
        clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), dur);
    };
    
    const cache = { 
        read: k => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }, 
        write: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } } 
    };

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
        
        // Sort items (newest first)
        const sorted = [...state[nama].items].sort((a, b) => (b.id || 0) - (a.id || 0));

        for (const row of sorted) {
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
          <span class="small muted">#${row.id || 'new'}</span>
        </div>`;
            
            el.addEventListener('click', e => {
                if (e.target.dataset.del) return;
                setForm(nama, row);
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
            
            el.querySelector('[data-del]').addEventListener('click', e => {
                e.stopPropagation();
                if (confirm('Yakin mau hapus target ini?')) {
                    removeTarget(nama, Number(e.currentTarget.dataset.del));
                }
            });
            wrap.appendChild(el);
        }
    };

    const loadOne = async nama => {
        const key = CACHE_KEY(nama);
        
        // 1. Load Cache
        const cached = cache.read(key);
        if (cached) {
            state[nama].items = cached;
            renderList(nama);
        }

        // 2. Fetch Remote
        if (navigator.onLine) {
            try {
                const res = await supabase().from('targets').select('*').eq('nama', nama).order('created_at', { ascending: false });
                if (res.error) throw res.error;
                state[nama].items = res.data || [];
                cache.write(key, state[nama].items);
                renderList(nama);
            } catch (e) { console.warn('Fetch targets failed', e); }
        }
    };

    const loadAll = async () => { await Promise.all(PEOPLE.map(loadOne)); };

    const upsertTarget = async nama => {
        const kategori = ($(`${nama}_kategori`)?.value || '').trim();
        const target = ($(`${nama}_target`)?.value || '').trim();
        const catatan = ($(`${nama}_catatan`)?.value || '').trim();
        
        if (!kategori || !target) { toast('Isi kategori & target dulu ya 😊'); return; }
        
        const isEdit = !!state[nama].editingId;
        const tempId = isEdit ? state[nama].editingId : Date.now(); // Temp ID for optimistic
        
        const payload = { 
            nama, 
            kategori, 
            target, 
            catatan: catatan || null,
            updated_at: new Date().toISOString()
        };
        
        if (isEdit) payload.id = state[nama].editingId;
        else payload.created_at = new Date().toISOString();

        // Optimistic Update
        if (isEdit) {
            const idx = state[nama].items.findIndex(i => i.id === payload.id);
            if (idx >= 0) state[nama].items[idx] = { ...state[nama].items[idx], ...payload };
        } else {
            // New item: add with temp ID (will be replaced by reload later or ignored)
            // Ideally we wait for server ID, but for offline support we use temp ID
            // NOTE: SyncManager upsert usually works fine, but without ID database will gen one.
            // For true offline new items, we'd need UUIDs generated client-side.
            // Here we assume online mostly or simple sync.
            state[nama].items.unshift({ ...payload, id: tempId });
        }
        
        cache.write(CACHE_KEY(nama), state[nama].items);
        renderList(nama);
        clearForm(nama);
        toast('Target tersimpan! 🎯');

        // Sync
        if (syncManager()) {
            // If new item, we let DB gen ID. If editing, we pass ID.
            // Warning: If we created a new item offline, we don't have real ID. 
            // This is a limitation of serial IDs. UUIDs are better for offline.
            // For now, we sync payload. If ID missing, DB creates new.
            // We strip temp ID if it's large (timestamp)
            if (!isEdit && payload.id > 2000000000) delete payload.id; 
            
            syncManager().add('targets', payload, `target:${nama}:${tempId}`);
            
            // Reload after a delay to get real IDs if online
            if (navigator.onLine) setTimeout(() => loadOne(nama), 2000);
        }
    };

    const removeTarget = (nama, id) => {
        // Optimistic Delete
        state[nama].items = state[nama].items.filter(i => i.id !== id);
        cache.write(CACHE_KEY(nama), state[nama].items);
        renderList(nama);
        if (state[nama].editingId === id) clearForm(nama);
        toast('Target dihapus!');

        // Sync
        if (syncManager()) {
            syncManager().add('targets', {}, `del_target:${id}`, 'delete', { id: id });
        }
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
