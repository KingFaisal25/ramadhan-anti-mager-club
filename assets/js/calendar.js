// ============================================================
// CALENDAR.JS — Ramadhan Anti Mager Club 🌙
// Streak Heatmap — 30 hari × warna berdasarkan % completion
// ============================================================
(() => {
    const ITEMS = window.CHECKLIST_DATA || [];
    const BY_ID = window.CHECKLIST_BY_ID || new Map();
    const TOTAL = window.TOTAL_ITEMS || 27;
    const MOODMETER = window.MoodMeter;

    const supabase = () => window.RAMC?.supabase;
    const $ = id => document.getElementById(id);

    const toast = (msg) => {
        const el = $('toast'); if (!el) return;
        el.textContent = msg; el.className = 'toast show';
        clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2400);
    };

    const getDayNum = () => {
        const ov = Number(localStorage.getItem('ramc_day_override') || '');
        if (ov >= 1 && ov <= 30) return ov;
        const diff = Math.floor((Date.now() - new Date('2025-03-01T00:00:00+07:00').getTime()) / 86400000);
        return Math.max(1, Math.min(30, diff + 1));
    };

    const startWIB = () => new Date('2025-03-01T00:00:00+07:00');
    const dateForDay = d => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' })
        .format(new Date(startWIB().getTime() + (d - 1) * 86400000));

    // pct → CSS color class
    const heatClass = pct => {
        if (pct === 0 || pct === undefined) return 'heat-0';
        if (pct < 30) return 'heat-1';
        if (pct < 60) return 'heat-2';
        if (pct < 85) return 'heat-3';
        if (pct < 100) return 'heat-4';
        return 'heat-5';
    };

    const state = { data: { neng: {}, aa: {} }, moods: { neng: {}, aa: {} }, today: getDayNum() };

    // ── Stars ─────────────────────────────────────────────────
    const initStars = () => {
        const cv = $('starsCanvas'); if (!cv) return;
        const ctx = cv.getContext('2d'); let w, h; const stars = [], meteors = []; const rand = (a, b) => a + Math.random() * (b - a);
        const resize = () => { w = cv.width = Math.floor(innerWidth * devicePixelRatio); h = cv.height = Math.floor(innerHeight * devicePixelRatio); };
        const mkS = () => { stars.length = 0; for (let i = 0; i < Math.floor(innerWidth * innerHeight / 9000); i++)stars.push({ x: rand(0, w), y: rand(0, h), r: rand(0.6, 1.7) * devicePixelRatio, a: rand(0.25, 0.9), tw: rand(0.002, 0.01) }); };
        const spawn = () => meteors.push({ x: rand(0, w * 0.9), y: rand(0, h * 0.35), vx: rand(14, 22) * devicePixelRatio, vy: rand(5, 9) * devicePixelRatio, life: rand(28, 44), len: rand(90, 140) * devicePixelRatio });
        const tick = () => { ctx.clearRect(0, 0, w, h); for (const s of stars) { s.a += Math.sin(Date.now() * s.tw) * 0.002; ctx.fillStyle = `rgba(255,253,245,${Math.max(0.12, Math.min(0.9, s.a))})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); } if (Math.random() < 0.018) spawn(); for (let i = meteors.length - 1; i >= 0; i--) { const m = meteors[i]; m.x += m.vx; m.y += m.vy; m.life--; const g = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * 0.35); g.addColorStop(0, 'rgba(251,191,36,.65)'); g.addColorStop(1, 'rgba(255,253,245,0)'); ctx.strokeStyle = g; ctx.lineWidth = 2.2 * devicePixelRatio; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.len, m.y - m.len * 0.35); ctx.stroke(); if (m.life <= 0 || m.x > w + m.len || m.y > h + m.len) meteors.splice(i, 1); } requestAnimationFrame(tick); };
        resize(); addEventListener('resize', () => { resize(); mkS(); }); mkS(); requestAnimationFrame(tick);
    };

    // ── Load data ─────────────────────────────────────────────
    const loadData = async () => {
        try {
            const { data, error } = await supabase().from('daily_progress')
                .select('nama,hari_ke,item_id,selesai').lte('hari_ke', 30);
            if (error) throw error;
            state.data = { neng: {}, aa: {} };
            for (const r of data || []) {
                const n = r.nama === 'aa' ? 'aa' : 'neng';
                if (!state.data[n][r.hari_ke]) state.data[n][r.hari_ke] = [];
                state.data[n][r.hari_ke].push(r);
            }
        } catch {
            toast('Mode offline 😅 data dari cache');
        }

        if (MOODMETER) {
            const moods = await MOODMETER.fetchAll(30);
            state.moods = { neng: {}, aa: {} };
            for (const m of moods) {
                const n = m.nama === 'aa' ? 'aa' : 'neng';
                state.moods[n][m.hari_ke] = m.mood;
            }
        }
    };

    const calcPct = (nama, day) => {
        const rows = state.data[nama][day] || [];
        const done = new Set(rows.filter(r => r.selesai).map(r => r.item_id)).size;
        return Math.round(done / Math.max(1, TOTAL) * 100);
    };

    const MOOD_EMOJI = ['', '😞', '😐', '🙂', '😄', '🔥'];

    // ── Render heatmap ────────────────────────────────────────
    const renderHeatmap = () => {
        ['neng', 'aa'].forEach(who => {
            const grid = $(`${who}Grid`); if (!grid) return;
            grid.innerHTML = '';
            let streak = 0, maxStreak = 0, totalPct = 0, days100 = 0;

            for (let d = 1; d <= 30; d++) {
                const pct = calcPct(who, d);
                const mood = state.moods[who][d] || 0;
                const isFuture = d > state.today;
                const isToday = d === state.today;
                totalPct += isFuture ? 0 : pct;

                if (!isFuture && pct >= 80) { streak++; if (streak > maxStreak) maxStreak = streak; }
                else if (!isFuture) streak = 0;
                if (pct === 100) days100++;

                const cell = document.createElement('button');
                cell.type = 'button';
                cell.className = `heat-cell ${isFuture ? 'heat-future' : heatClass(pct)}${isToday ? ' heat-today' : ''}`;
                cell.title = isFuture
                    ? `Hari ke-${d} (${dateForDay(d)}) — belum tiba`
                    : `Hari ke-${d} (${dateForDay(d)}) — ${pct}%${mood ? ' ' + MOOD_EMOJI[mood] : ''}`;
                cell.innerHTML = `
          <span class="heat-day">${d}</span>
          ${!isFuture && pct === 100 ? '<span class="heat-star">⭐</span>' : ''}
          ${mood && !isFuture ? `<span class="heat-mood">${MOOD_EMOJI[mood]}</span>` : ''}`;

                if (!isFuture) {
                    cell.addEventListener('click', () => {
                        localStorage.setItem('ramc_checklist_day', String(d));
                        window.location.href = 'checklist.html';
                    });
                }
                grid.appendChild(cell);
            }

            // Stats below grid
            const avgPct = Math.round(totalPct / Math.max(1, state.today));
            const ms = $(`${who}GridStats`);
            if (ms) ms.innerHTML = `
        <span class="badge">🔥 Streak terpanjang: ${maxStreak} hari</span>
        <span class="badge">⭐ 100%: ${days100} hari</span>
        <span class="badge">📊 Rata-rata: ${avgPct}%</span>`;
        });
    };

    // ── Render legend ─────────────────────────────────────────
    const renderLegend = () => {
        const leg = $('heatLegend'); if (!leg) return;
        const steps = [
            { cls: 'heat-0', label: '0%' },
            { cls: 'heat-1', label: '<30%' },
            { cls: 'heat-2', label: '<60%' },
            { cls: 'heat-3', label: '<85%' },
            { cls: 'heat-4', label: '<100%' },
            { cls: 'heat-5', label: '100%! ⭐' },
        ];
        leg.innerHTML = steps.map(s => `<div class="legend-item"><div class="heat-cell ${s.cls}" style="width:28px;height:28px;pointer-events:none;"></div><span>${s.label}</span></div>`).join('');
    };

    // ── Init ──────────────────────────────────────────────────
    const init = async () => {
        initStars();
        const dl = $('dayLabel'); if (dl) dl.textContent = `Hari ke-${state.today}/30`;
        renderLegend();
        await loadData();
        renderHeatmap();
    };

    if (window.RAMC) init().catch(() => toast('Koneksi bermasalah 😅'));
    else window.addEventListener('ramc:ready', () => init().catch(() => toast('Koneksi bermasalah 😅')), { once: true });
})();
