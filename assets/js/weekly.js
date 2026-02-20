// ============================================================
// WEEKLY.JS — Ramadhan Anti Mager Club 🌙
// Evaluasi mingguan, 4 minggu
// ============================================================
(() => {
    const WEEK_KEY = 'ramc_week';
    const CACHE_KEY = week => `ramc_weekly_v3:${week}`;
    const PEOPLE = ['neng', 'aa'];
    const FIELDS = ['ibadah_konsisten', 'ibadah_kurang', 'progress_hubungan', 'hal_disyukuri', 'tantangan', 'resolusi'];

    const $ = id => document.getElementById(id);
    const supabase = () => window.RAMC?.supabase;

    const toast = (msg, dur = 2400) => {
        const el = $('toast'); if (!el) return;
        el.textContent = msg; el.className = 'toast show';
        clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), dur);
    };
    const setOffline = v => { const b = $('netBadge'); if (b) b.style.display = v ? 'inline-flex' : 'none'; };
    const cache = { read: k => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }, write: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } } };

    const getWeek = () => Number(localStorage.getItem(WEEK_KEY) || '1');
    const setWeek = v => localStorage.setItem(WEEK_KEY, String(v));

    const updateSegUI = () => {
        const week = getWeek();
        document.querySelectorAll('#weekSeg .seg-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.week) === week));
        const start = (week - 1) * 7 + 1, end = Math.min(30, week * 7);
        const sub = $('subTitle'); if (sub) sub.textContent = `Minggu ke-${week} • Hari ${start}–${end}`;
    };

    const setPersonForm = (nama, data) => {
        for (const f of FIELDS) {
            const el = $(`${nama}_${f}`); if (el) el.value = data?.[f] || '';
        }
        const badge = $(`${nama}Saved`); if (badge) badge.textContent = data ? '✅ Tersimpan' : '—';
    };

    const setSharedForm = data => {
        const el = $('bersama_doa_komitmen'); if (el) el.value = data?.doa_komitmen || '';
        const badge = $('bersamaSaved'); if (badge) badge.textContent = data ? '✅ Tersimpan' : '—';
    };

    const getPersonForm = nama => {
        const out = {};
        for (const f of FIELDS) { const el = $(`${nama}_${f}`); out[f] = el ? el.value.trim() : ''; }
        return out;
    };

    const getSharedForm = () => {
        const el = $('bersama_doa_komitmen');
        return { doa_komitmen: el ? el.value.trim() : '' };
    };

    const loadOne = async (nama, week) => {
        const res = await supabase().from('weekly_eval').select('*').eq('nama', nama).eq('minggu_ke', week).maybeSingle();
        if (res.error) throw res.error;
        return res.data || null;
    };

    const load = async () => {
        const week = getWeek(); updateSegUI();
        const key = CACHE_KEY(week);
        try {
            const [neng, aa, bersama] = await Promise.all([loadOne('neng', week), loadOne('aa', week), loadOne('bersama', week)]);
            setPersonForm('neng', neng); setPersonForm('aa', aa); setSharedForm(bersama);
            cache.write(key, { neng, aa, bersama }); setOffline(false);
        } catch {
            const c = cache.read(key);
            if (c) { setPersonForm('neng', c.neng); setPersonForm('aa', c.aa); setSharedForm(c.bersama); setOffline(true); }
            else setOffline(true);
            toast('Koneksi bermasalah 😅 Data lokal digunakan.');
        }
    };

    const save = async () => {
        const week = getWeek(), key = CACHE_KEY(week);
        const payloads = [
            { nama: 'neng', minggu_ke: week, ...getPersonForm('neng') },
            { nama: 'aa', minggu_ke: week, ...getPersonForm('aa') },
            { nama: 'bersama', minggu_ke: week, ...getSharedForm() },
        ];
        cache.write(key, { neng: payloads[0], aa: payloads[1], bersama: payloads[2] });
        try {
            const res = await Promise.all(payloads.map(p => supabase().from('weekly_eval').upsert(p, { onConflict: 'nama,minggu_ke' })));
            const err = res.find(x => x?.error)?.error; if (err) throw err;
            setOffline(false); toast('Tersimpan! 💚');
            const ns = $('nengSaved'), as = $('aaSaved'), bs = $('bersamaSaved');
            if (ns) ns.textContent = '✅ Tersimpan'; if (as) as.textContent = '✅ Tersimpan'; if (bs) bs.textContent = '✅ Tersimpan';
        } catch { setOffline(true); toast('Koneksi bermasalah 😅 Data disimpan lokal.'); }
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
        // Week seg
        document.querySelectorAll('#weekSeg .seg-btn').forEach(b => b.addEventListener('click', () => { setWeek(Number(b.dataset.week)); load(); }));
        $('reloadBtn')?.addEventListener('click', load);
        $('saveBtn')?.addEventListener('click', save);
        // Debounced autosave
        let t = 0;
        const debounceSave = () => { clearTimeout(t); t = setTimeout(save, 800); };
        for (const n of PEOPLE) for (const f of FIELDS) $(`${n}_${f}`)?.addEventListener('input', debounceSave);
        $('bersama_doa_komitmen')?.addEventListener('input', debounceSave);
        await load();
    };

    if (window.RAMC) { init().catch(() => toast('Waduh, koneksi bermasalah 😅')); }
    else { window.addEventListener('ramc:ready', () => init().catch(() => toast('Waduh, koneksi bermasalah 😅')), { once: true }); }
})();
