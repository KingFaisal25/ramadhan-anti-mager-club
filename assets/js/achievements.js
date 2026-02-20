// ============================================================
// ACHIEVEMENTS.JS — Ramadhan Anti Mager Club 🌙
// Badge gallery — computed dari daily_progress Supabase
// ============================================================
(() => {
  const supabase = () => window.RAMC?.supabase;
  const TOTAL = window.TOTAL_ITEMS || 27;
  const $ = id => document.getElementById(id);

  const toast = (msg, dur = 2400) => {
    const el = $('toast'); if (!el) return;
    el.textContent = msg; el.className = 'toast show';
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), dur);
  };

  // ── Badge definitions ─────────────────────────────────────
  const BADGES = [
    // CONSISTENCY
    { id: 'streak_3', who: 'both', icon: '🔥', title: 'Konsisten 3 Hari', desc: 'Checklist ≥80% selama 3 hari berturut-turut', check: (s) => s.maxStreak >= 3 },
    { id: 'streak_7', who: 'both', icon: '💎', title: 'Anti-Mager 7 Hari', desc: 'Checklist ≥80% selama 7 hari berturut-turut', check: (s) => s.maxStreak >= 7 },
    { id: 'streak_15', who: 'both', icon: '🌟', title: 'Tangguh 15 Hari', desc: 'Checklist ≥80% selama 15 hari berturut-turut', check: (s) => s.maxStreak >= 15 },
    { id: 'streak_30', who: 'both', icon: '👑', title: 'Ramadhan Champion!', desc: 'Checklist ≥80% penuh 30 hari!', check: (s) => s.maxStreak >= 30 },
    // COMPLETION
    { id: 'perfect_1', who: 'both', icon: '⭐', title: 'Hari Sempurna', desc: 'Selesaikan 100% checklist dalam 1 hari', check: (s) => s.days100 >= 1 },
    { id: 'perfect_5', who: 'both', icon: '🌙', title: '5 Hari Sempurna', desc: '100% checklist di 5 hari berbeda', check: (s) => s.days100 >= 5 },
    { id: 'perfect_10', who: 'both', icon: '✨', title: '10 Hari Sempurna', desc: '100% checklist di 10 hari berbeda', check: (s) => s.days100 >= 10 },
    // POINTS
    { id: 'pts_1000', who: 'both', icon: '💰', title: 'Ribuan Poin', desc: 'Kumpulkan total 1.000 poin', check: (s) => s.totalPts >= 1000 },
    { id: 'pts_5000', who: 'both', icon: '💎', title: '5.000 Poin!', desc: 'Kumpulkan total 5.000 poin', check: (s) => s.totalPts >= 5000 },
    // CATEGORY
    { id: 'ibadah_king', who: 'both', icon: '🕌', title: 'Ibadah Rajin', desc: 'Selesaikan seluruh item Ibadah selama 7 hari', check: (s) => s.catDays.ibadah >= 7 },
    { id: 'hubungan_king', who: 'both', icon: '💑', title: 'Pasangan Kompak', desc: 'Selesaikan seluruh item Hubungan selama 7 hari', check: (s) => s.catDays.hubungan >= 7 },
    { id: 'diri_king', who: 'both', icon: '🚀', title: 'Self Developer', desc: 'Selesaikan seluruh item Pengembangan Diri selama 7 hari', check: (s) => s.catDays.diri >= 7 },
    { id: 'muhasabah_king', who: 'both', icon: '🌃', title: 'Malam Berzikir', desc: 'Selesaikan seluruh item Muhasabah selama 7 hari', check: (s) => s.catDays.muhasabah >= 7 },
    // SPECIAL
    { id: 'neng_first', who: 'neng', icon: '👩', title: 'Neng Juara!', desc: 'Neng unggul di 10 hari duel', check: (s) => s.duelWins >= 10 },
    { id: 'aa_first', who: 'aa', icon: '👨', title: 'Aa Juara!', desc: 'Aa unggul di 10 hari duel', check: (s) => s.duelWins >= 10 },
  ];

  const CAT_ITEMS = {
    ibadah: window.CHECKLIST_DATA?.filter(x => x.katKey === 'ibadah').map(x => x.id) || [],
    hubungan: window.CHECKLIST_DATA?.filter(x => x.katKey === 'hubungan').map(x => x.id) || [],
    diri: window.CHECKLIST_DATA?.filter(x => x.katKey === 'diri').map(x => x.id) || [],
    muhasabah: window.CHECKLIST_DATA?.filter(x => x.katKey === 'muhasabah').map(x => x.id) || [],
  };

  const state = { filter: 'all', stats: {} };

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

  // ── Load & Compute stats ──────────────────────────────────
  const computeStats = (rows, who) => {
    const dayMap = {};
    for (const r of rows.filter(x => x.nama === who)) {
      if (!dayMap[r.hari_ke]) dayMap[r.hari_ke] = new Set();
      if (r.selesai) dayMap[r.hari_ke].add(r.item_id);
    }

    let maxStreak = 0, streak = 0, days100 = 0, totalPts = 0;
    const catDays = { ibadah: 0, hubungan: 0, diri: 0, muhasabah: 0 };

    for (let d = 1; d <= 30; d++) {
      const doneSet = dayMap[d] || new Set();
      const pct = Math.round(doneSet.size / Math.max(1, TOTAL) * 100);
      if (pct >= 80) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0;
      if (pct === 100) days100++;
      for (const item of doneSet) {
        totalPts += (window.CHECKLIST_BY_ID?.get(item)?.poin || 10);
      }
      for (const [cat, ids] of Object.entries(CAT_ITEMS)) {
        if (ids.every(id => doneSet.has(id))) catDays[cat]++;
      }
    }
    return { maxStreak, days100, totalPts, catDays, duelWins: 0 /* computed next */ };
  };

  const computeDuelWins = (rows) => {
    const wins = { neng: 0, aa: 0 };
    for (let d = 1; d <= 30; d++) {
      const n = rows.filter(r => r.nama === 'neng' && r.hari_ke === d && r.selesai).length;
      const a = rows.filter(r => r.nama === 'aa' && r.hari_ke === d && r.selesai).length;
      if (n > a) wins.neng++;
      else if (a > n) wins.aa++;
    }
    return wins;
  };

  const loadData = async () => {
    const loader = $('loadingIndicator'); if (loader) loader.style.display = 'block';
    try {
      const { data, error } = await supabase().from('daily_progress').select('*');
      if (error) throw error;
      const rows = data || [];
      const ns = computeStats(rows, 'neng');
      const as = computeStats(rows, 'aa');
      const duelWins = computeDuelWins(rows);
      ns.duelWins = duelWins.neng;
      as.duelWins = duelWins.aa;
      state.stats = { neng: ns, aa: as };

      // Count total days
      const allDays = new Set(rows.map(r => r.hari_ke)).size;
      const sn = $('daysCompleted'); if (sn) sn.textContent = String(allDays);
      const cs = $('currentStreakStat'); if (cs) cs.textContent = `${Math.max(ns.maxStreak, as.maxStreak)} hari`;

    } catch {
      toast('Koneksi bermasalah 😅 Data kosong');
      state.stats = { neng: { maxStreak: 0, days100: 0, totalPts: 0, catDays: { ibadah: 0, hubungan: 0, diri: 0, muhasabah: 0 }, duelWins: 0 }, aa: { maxStreak: 0, days100: 0, totalPts: 0, catDays: { ibadah: 0, hubungan: 0, diri: 0, muhasabah: 0 }, duelWins: 0 } };
    } finally {
      if (loader) loader.style.display = 'none';
    }
  };

  // ── Render ────────────────────────────────────────────────
  const getBadgeState = (badge, who) => {
    const s = state.stats[who];
    if (!s) return { unlocked: false, progress: 0 };
    const unlocked = badge.check(s);
    return { unlocked, progress: unlocked ? 100 : 0 };
  };

  const renderGrid = () => {
    const grid = $('achievementGrid'); if (!grid) return;
    const f = state.filter;

    const visible = BADGES.filter(b => {
      if (f === 'neng') return b.who === 'neng' || b.who === 'both';
      if (f === 'aa') return b.who === 'aa' || b.who === 'both';
      if (f === 'completed') {
        const sn = getBadgeState(b, 'neng'), sa = getBadgeState(b, 'aa');
        return sn.unlocked || sa.unlocked;
      }
      if (f === 'locked') {
        const sn = getBadgeState(b, 'neng'), sa = getBadgeState(b, 'aa');
        return !sn.unlocked || !sa.unlocked;
      }
      return true;
    });

    if (!visible.length) {
      grid.innerHTML = `<div class="card" style="text-align:center;padding:28px;color:var(--muted);">Belum ada badge yang cocok 😊</div>`;
      renderStats(); return;
    }

    const whoList = f === 'neng' ? ['neng'] : f === 'aa' ? ['aa'] : ['neng', 'aa'];
    grid.innerHTML = visible.map(b => {
      const snState = getBadgeState(b, 'neng'), saState = getBadgeState(b, 'aa');
      const nUnlocked = snState.unlocked, aUnlocked = saState.unlocked;
      const anyUnlocked = nUnlocked || aUnlocked;

      return `<div class="ach-card${anyUnlocked ? '' : ' ach-locked'}" data-id="${b.id}">
        <div class="ach-icon">${anyUnlocked ? b.icon : '🔒'}</div>
        <div class="ach-title">${b.title}</div>
        <div class="ach-desc">${b.desc}</div>
        <div class="ach-who">
          ${whoList.includes('neng') ? `<span class="badge ${nUnlocked ? '' : 'badge-locked'}">👩 ${nUnlocked ? '✅' : '—'}</span>` : ''}
          ${whoList.includes('aa') ? `<span class="badge ${aUnlocked ? '' : 'badge-locked'}">👨 ${aUnlocked ? '✅' : '—'}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    // Animate in
    grid.querySelectorAll('.ach-card').forEach((card, i) => {
      card.style.opacity = '0'; card.style.transform = 'translateY(14px)';
      setTimeout(() => { card.style.transition = 'opacity .35s ease,transform .35s ease'; card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, i * 60);
    });

    renderStats();
  };

  const renderStats = () => {
    const ns = state.stats.neng, as = state.stats.aa;
    if (!ns || !as) return;
    const totalBadges = BADGES.length;
    const nUnlocked = BADGES.filter(b => getBadgeState(b, 'neng').unlocked).length;
    const aUnlocked = BADGES.filter(b => getBadgeState(b, 'aa').unlocked).length;
    const pct = Math.round((nUnlocked + aUnlocked) / (totalBadges * 2) * 100);

    const op = $('overallProgress'); if (op) op.textContent = `${pct}%`;
    const au = $('achievementsUnlocked'); if (au) au.textContent = `${nUnlocked + aUnlocked}/${totalBadges * 2}`;
    const ga = $('goalsAchieved'); if (ga) ga.textContent = `${pct}%`;

    // Animate progress ring
    const ring = document.querySelector('.progress-ring-fill');
    if (ring) {
      const circ = 2 * Math.PI * 54;
      ring.style.strokeDasharray = `${circ}`;
      ring.style.strokeDashoffset = String(circ - (pct / 100) * circ);
    }
  };

  // ── Init ──────────────────────────────────────────────────
  const init = async () => {
    initStars();
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter || 'all';
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderGrid();
    }));
    await loadData();
    renderGrid();
  };

  if (window.RAMC) init().catch(() => toast('Koneksi bermasalah 😅'));
  else window.addEventListener('ramc:ready', () => init().catch(() => toast('Koneksi bermasalah 😅')), { once: true });
})();