// ============================================================
// LEADERBOARD.JS — Ramadhan Anti Mager Club 🌙
// ============================================================
(() => {
  const ITEMS = window.CHECKLIST_DATA || [];
  const BY_ID = window.CHECKLIST_BY_ID || new Map();

  const DAY_KEY = 'ramc_day_override';
  const CACHE_KEY = day => `ramc_lb_v2:${day}`;

  const $ = id => document.getElementById(id);
  const supabase = () => window.RAMC?.supabase;
  const toast = (msg) => { const el = $('toast'); if (!el) return; el.textContent = msg; el.className = 'toast show'; clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2400); };
  const norm = n => n === 'aa' ? 'aa' : 'neng';

  const getDayNum = () => {
    const ov = Number(localStorage.getItem(DAY_KEY) || '');
    if (ov >= 1 && ov <= 30) return ov;
    const diff = Math.floor((Date.now() - new Date('2025-03-01T00:00:00+07:00').getTime()) / 86400000);
    return Math.max(1, Math.min(30, diff + 1));
  };

  const BADGES_DEF = [
    { id: 'antimager7', icon: '🔥', label: 'Anti-Mager 7 Hari', desc: 'Streak 7 hari berturut-turut' },
    { id: 'perfect', icon: '⭐', label: 'Sempurna!', desc: 'Pernah 100% dalam sehari' },
    { id: 'hafiz', icon: '📖', label: 'Hafiz Muda', desc: 'Baca Quran 25+ hari' },
    { id: 'sultan', icon: '💝', label: 'Sultan Sedekah', desc: 'Sedekah 25+ hari' },
    { id: 'istighfar', icon: '🤲', label: 'Rajin Istighfar', desc: 'Istighfar 25+ hari' },
    { id: 'couple', icon: '💑', label: 'Couple Goals', desc: 'Hubungan & Komitmen semua 20+ hari' },
    { id: 'nightowl', icon: '🌙', label: 'Night Owl Soleh', desc: 'Muhasabah malam 25+ hari' },
    { id: 'juara', icon: '🏆', label: 'Juara Anti-Mager', desc: 'Total poin lebih banyak dari pasangan' },
  ];

  const state = { day: getDayNum(), data: [] };

  // ── Stars canvas ─────────────────────────────────────────
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
    const key = CACHE_KEY(state.day);
    try {
      const { data, error } = await supabase().from('daily_progress').select('nama,hari_ke,item_id,selesai,waktu_selesai').lte('hari_ke', state.day);
      if (error) throw error;
      state.data = data || [];
      localStorage.setItem(key, JSON.stringify(state.data));
      const nb = $('netBadge'); if (nb) nb.style.display = 'none';
    } catch {
      const cached = localStorage.getItem(key);
      if (cached) { state.data = JSON.parse(cached); const nb = $('netBadge'); if (nb) nb.style.display = 'inline-flex'; toast('Mode offline aktif'); }
    }
  };

  // ── Process stats ─────────────────────────────────────────
  const processStats = () => {
    const mk = () => ({ points: 0, totalItems: 0, itemFreq: {}, days: {} });
    const stats = { neng: mk(), aa: mk() };
    for (let d = 1; d <= state.day; d++) { stats.neng.days[d] = { pts: 0, items: 0 }; stats.aa.days[d] = { pts: 0, items: 0 }; }

    for (const row of state.data) {
      if (!row.selesai) continue;
      const n = norm(row.nama);
      const d = Number(row.hari_ke); if (d < 1 || d > state.day) continue;
      const it = BY_ID.get(row.item_id); const pts = Number(it?.poin || 0);
      stats[n].points += pts; stats[n].totalItems++;
      stats[n].days[d].pts += pts; stats[n].days[d].items++;
      stats[n].itemFreq[row.item_id] = (stats[n].itemFreq[row.item_id] || 0) + 1;
    }

    ['neng', 'aa'].forEach(who => {
      let cur = 0, max = 0, totalPct = 0;
      let bestDay = 1, bestItems = 0;
      for (let d = 1; d <= state.day; d++) {
        const items = stats[who].days[d].items;
        if (items > bestItems) { bestItems = items; bestDay = d; }
        const p = (items / Math.max(1, ITEMS.length)) * 100;
        if (p >= 80) { cur++; max = Math.max(max, cur); } else cur = 0;
        totalPct += p;
      }
      stats[who].maxStreak = max;
      stats[who].avgPct = Math.round(totalPct / Math.max(1, state.day));
      stats[who].bestDay = bestDay;
      stats[who].bestDayItems = bestItems;
    });
    return stats;
  };

  const getFav = freq => { let id = null, mx = -1; for (const [k, v] of Object.entries(freq)) if (v > mx) { mx = v; id = k; } return id ? (BY_ID.get(id)?.icon || '') + '  ' + (BY_ID.get(id)?.nama || '') : '—'; };
  const getSkip = (freq) => { let id = null, mn = 9999; for (const it of ITEMS) { const v = freq[it.id] || 0; if (v < mn) { mn = v; id = it.id; } } return id ? (BY_ID.get(id)?.icon || '') + '  ' + (BY_ID.get(id)?.nama || '') : '—'; };

  // ── Render duel ───────────────────────────────────────────
  const renderDuel = stats => {
    const nd = stats.neng.days[state.day]; const ad = stats.aa.days[state.day];
    const tot = ITEMS.length;
    const np = Math.round(nd.items / Math.max(1, tot) * 100), ap = Math.round(ad.items / Math.max(1, tot) * 100);
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('duelNengPct', `${np}%`); set('duelNengDone', `${nd.items}/${tot} kegiatan`); set('duelNengPts', `${nd.pts} poin`);
    set('duelAaPct', `${ap}%`); set('duelAaDone', `${ad.items}/${tot} kegiatan`); set('duelAaPts', `${ad.pts} poin`);
    let winner = '🤝 Seri Hari Ini!', diff = '';
    if (nd.pts > ad.pts) { winner = '👩 Neng Menang Hari Ini!'; diff = `+${nd.pts - ad.pts} poin`; }
    else if (ad.pts > nd.pts) { winner = '👨 Aa Menang Hari Ini!'; diff = `+${ad.pts - nd.pts} poin`; }
    set('duelWinner', winner); set('duelDiff', diff);
  };

  // ── Render cards ─────────────────────────────────────────
  const renderCards = stats => {
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('nengTotalPts', `${stats.neng.points} pts`); set('nengAvg', `${stats.neng.avgPct}%`);
    set('nengBestStreak', `${stats.neng.maxStreak} hari`);
    set('nengFav', getFav(stats.neng.itemFreq)); set('nengSkip', getSkip(stats.neng.itemFreq));
    set('aaTotalPts', `${stats.aa.points} pts`); set('aaAvg', `${stats.aa.avgPct}%`);
    set('aaBestStreak', `${stats.aa.maxStreak} hari`);
    set('aaFav', getFav(stats.aa.itemFreq)); set('aaSkip', getSkip(stats.aa.itemFreq));

    // Fun stats
    let nw = 0, aw = 0, dr = 0;
    for (let d = 1; d <= state.day; d++) {
      const np = stats.neng.days[d].pts, ap = stats.aa.days[d].pts;
      if (np > ap) nw++; else if (ap > np) aw++; else dr++;
    }
    set('funNengWins', nw); set('funAaWins', aw); set('funDraws', dr);
    const ov = stats.neng.points > stats.aa.points ? '👩 Neng Juara (Sementara)' : stats.aa.points > stats.neng.points ? '👨 Aa Juara (Sementara)' : '🤝 Seri';
    set('winnerBadge', ov);
    set('funBestDays', `Neng: H${stats.neng.bestDay} (${stats.neng.bestDayItems}item) • Aa: H${stats.aa.bestDay} (${stats.aa.bestDayItems}item)`);
  };

  // ── Render badges ─────────────────────────────────────────
  const computeBadges = (who, stats) => {
    const earned = [];
    const freq = stats[who].itemFreq;
    const daysData = stats[who].days;
    const quranCount = Object.keys(freq).filter(id => id.startsWith('ibadah_1')).reduce((a, id) => a + (freq[id] || 0), 0);
    const sedekahCount = freq['ibadah_6'] || 0;
    const istighfarCount = freq['ibadah_5'] || 0;
    const muhasabahCount = ['muhasabah_1', 'muhasabah_2', 'muhasabah_3', 'muhasabah_4'].reduce((a, id) => a + (freq[id] || 0), 0);
    const hubunganItems = window.CHECKLIST_DATA?.filter(it => it.katKey === 'hubungan').map(it => it.id) || [];
    const hubDays = Math.min(...hubunganItems.map(id => freq[id] || 0));

    if (stats[who].maxStreak >= 7) earned.push(BADGES_DEF.find(b => b.id === 'antimager7'));
    for (let d = 1; d <= state.day; d++) { if (daysData[d]?.items === ITEMS.length) { earned.push(BADGES_DEF.find(b => b.id === 'perfect')); break; } }
    if (quranCount >= 25) earned.push(BADGES_DEF.find(b => b.id === 'hafiz'));
    if (sedekahCount >= 25) earned.push(BADGES_DEF.find(b => b.id === 'sultan'));
    if (istighfarCount >= 25) earned.push(BADGES_DEF.find(b => b.id === 'istighfar'));
    if (hubDays >= 20) earned.push(BADGES_DEF.find(b => b.id === 'couple'));
    if (muhasabahCount >= 25 * 4) earned.push(BADGES_DEF.find(b => b.id === 'nightowl'));
    const other = who === 'neng' ? 'aa' : 'neng';
    if (stats[who].points > stats[other].points) earned.push(BADGES_DEF.find(b => b.id === 'juara'));
    return earned.filter(Boolean);
  };

  const renderBadges = stats => {
    ['neng', 'aa'].forEach(who => {
      const c = $(`${who}Badges`); if (!c) return;
      const badges = computeBadges(who, stats);
      if (!badges.length) { c.innerHTML = '<div class="small muted">Belum ada badge — terus semangat! 💪</div>'; return; }
      c.innerHTML = badges.map(b => `<div class="badge" title="${b.label}: ${b.desc}" style="font-size:16px;padding:6px 10px;cursor:help;">${b.icon}</div>`).join('');
    });
  };

  // ── Render charts ─────────────────────────────────────────
  const renderCharts = stats => {
    if (typeof Chart === 'undefined') return;
    const labels = Array.from({ length: state.day }, (_, i) => `H${i + 1}`);
    const np = labels.map((_, i) => stats.neng.days[i + 1].pts);
    const ap = labels.map((_, i) => stats.aa.days[i + 1].pts);

    Chart.defaults.color = 'rgba(255,253,245,0.6)';

    const cv1 = $('pointsChart');
    if (cv1) {
      if (cv1._chart) cv1._chart.destroy();
      cv1._chart = new Chart(cv1, {
        type: 'bar', data: {
          labels, datasets: [
            { label: 'Neng 👩', data: np, backgroundColor: 'rgba(236,72,153,0.55)', borderRadius: 5 },
            { label: 'Aa 👨', data: ap, backgroundColor: 'rgba(34,197,94,0.55)', borderRadius: 5 }
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,253,245,.7)', font: { family: 'Poppins' } } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: 'rgba(255,253,245,.5)' } }, x: { grid: { display: false }, ticks: { color: 'rgba(255,253,245,.5)' } } } }
      });
    }

    let nc = 0, ac = 0;
    const nLine = np.map(p => nc += p), aLine = ap.map(p => ac += p);
    const cv2 = $('weeklyChart');
    if (cv2) {
      if (cv2._chart) cv2._chart.destroy();
      cv2._chart = new Chart(cv2, {
        type: 'line', data: {
          labels, datasets: [
            { label: 'Neng 👩', data: nLine, borderColor: '#ec4899', tension: 0.3, fill: true, backgroundColor: 'rgba(236,72,153,.1)', pointRadius: 3, pointBackgroundColor: '#ec4899' },
            { label: 'Aa 👨', data: aLine, borderColor: '#22c55e', tension: 0.3, fill: true, backgroundColor: 'rgba(34,197,94,.1)', pointRadius: 3, pointBackgroundColor: '#22c55e' },
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,253,245,.7)', font: { family: 'Poppins' } } } }, scales: { y: { grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: 'rgba(255,253,245,.5)' } }, x: { grid: { display: false }, ticks: { color: 'rgba(255,253,245,.5)' } } } }
      });
    }
  };

  // ── Share Card ────────────────────────────────────────────
  const openShareCard = (stats) => {
    const day = state.day;
    const nPct = stats.nengTodayPct ?? 0;
    const aPct = stats.aaTodayPct ?? 0;
    const nPts = stats.nengTotalPts ?? 0;
    const aPts = stats.aaTotalPts ?? 0;

    const t = $('shareTitle'); if (t) t.textContent = `Hari ke-${day}/30 — Progress Ramadhan`;
    const np = $('shareNengPct'); if (np) np.textContent = `${nPct}%`;
    const ap = $('shareAaPct'); if (ap) ap.textContent = `${aPct}%`;
    const npt = $('shareNengPts'); if (npt) npt.textContent = `${nPts} poin`;
    const apt = $('shareAaPts'); if (apt) apt.textContent = `${aPts} poin`;
    const sw = $('shareWinner'); if (sw) sw.textContent = stats.todayWinner || '—';
    const ss = $('shareStreak'); if (ss) ss.textContent = `Streak Neng ${stats.nengStreak || 0} hari • Aa ${stats.aaStreak || 0} hari`;

    const modal = $('shareModal'); if (modal) { modal.style.display = 'grid'; modal.style.placeItems = 'center'; modal.style.background = 'rgba(0,0,0,.55)'; }
  };

  const closeShareCard = () => {
    const modal = $('shareModal'); if (modal) modal.style.display = 'none';
  };

  const buildWAText = () => {
    const t = $('shareTitle')?.textContent || '';
    const np = $('shareNengPct')?.textContent || '';
    const ap = $('shareAaPct')?.textContent || '';
    const npt = $('shareNengPts')?.textContent || '';
    const apt = $('shareAaPts')?.textContent || '';
    const ss = $('shareStreak')?.textContent || '';
    const sw = $('shareWinner')?.textContent || '';
    return `🌙 *Ramadhan Anti Mager Club*\n${t}\n\n👩 Neng: ${np} (${npt})\n👨 Aa: ${ap} (${apt})\n\n${ss}\n${sw}\n\nYuk anti-mager bareng! 💪`;
  };

  // ── Init ──────────────────────────────────────────────────
  const init = async () => {
    initStars();
    const dl = $('dayLabel'); if (dl) dl.textContent = `Hari ke-${state.day}/30`;

    await loadData();
    const stats = processStats();
    renderDuel(stats);
    renderCards(stats);
    renderBadges(stats);
    renderCharts(stats);

    // Share card
    $('shareBtn')?.addEventListener('click', () => openShareCard(stats));
    $('shareClose')?.addEventListener('click', closeShareCard);
    $('shareModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeShareCard(); });
    $('shareCopyText')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(buildWAText()).then(() => toast('Teks disalin! 📋')).catch(() => {
        prompt('Copy ini:', buildWAText());
      });
    });
    $('shareDownload')?.addEventListener('click', async () => {
      const card = $('shareCard'); if (!card) return;
      const btn = $('shareDownload'); if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
      try {
        const canvas = await (window.html2canvas || html2canvas)(card, { scale: 2, backgroundColor: '#0b1b12', useCORS: true });
        const link = document.createElement('a');
        link.download = `ramc-hari${state.day}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast('PNG tersimpan! 📷');
      } catch { toast('Gagal generate PNG 😅'); }
      finally { if (btn) { btn.disabled = false; btn.textContent = '🖼️ Download PNG'; } }
    });

    // Realtime
    supabase().channel('ramc-lb-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_progress' }, async () => {
        toast('Data diperbarui… ⚡');
        await loadData();
        const s2 = processStats();
        renderDuel(s2); renderCards(s2); renderBadges(s2); renderCharts(s2);
      }).subscribe();
  };

  if (window.RAMC) {
    init().catch(() => toast('Waduh, koneksi bermasalah 😅'));
  } else {
    window.addEventListener('ramc:ready', () => init().catch(() => toast('Waduh, koneksi bermasalah 😅')), { once: true });
  }
})();

