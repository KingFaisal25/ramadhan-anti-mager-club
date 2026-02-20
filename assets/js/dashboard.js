// ============================================================
// DASHBOARD.JS — Ramadhan Anti Mager Club 🌙
// ============================================================
(() => {
  const ITEMS = window.CHECKLIST_DATA || [];
  const BY_ID = window.CHECKLIST_BY_ID || new Map();
  const QUOTES = window.DAILY_QUOTES || [];
  const JADWAL = window.JADWAL || {};
  const NAME_KEY = 'ramc_nama';
  const DAY_OVERRIDE = 'ramc_day_override';

  const $ = id => document.getElementById(id);

  // ── helpers ───────────────────────────────────────────────
  const toast = (msg, dur = 2400) => {
    const el = $('toast'); if (!el) return;
    el.textContent = msg;
    el.className = 'toast show';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), dur);
  };
  const pad2 = n => String(n).padStart(2, '0');
  const cache = { read: k => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }, write: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } } };
  const setOffline = v => { const el = $('netBadge'); if (el) el.style.display = v ? 'inline-flex' : 'none'; };

  const getDayNum = () => {
    const ov = Number(localStorage.getItem(DAY_OVERRIDE) || '');
    if (ov >= 1 && ov <= 30) return ov;
    const start = new Date('2025-03-01T00:00:00+07:00');
    const diff = Math.floor((Date.now() - start.getTime()) / 86400000);
    return Math.max(1, Math.min(30, diff + 1));
  };

  const getNama = () => (localStorage.getItem(NAME_KEY) || 'neng') === 'aa' ? 'aa' : 'neng';
  const setNama = v => localStorage.setItem(NAME_KEY, v === 'aa' ? 'aa' : 'neng');
  const sumPts = rows => rows.reduce((a, r) => { if (!r.selesai) return a; return a + Number(BY_ID.get(r.item_id)?.poin || 0); }, 0);
  const cntDone = rows => new Set(rows.filter(r => r.selesai).map(r => r.item_id)).size;
  const pct = done => Math.round(done / Math.max(1, ITEMS.length) * 100);
  const formatDateID = () => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  // ── DOM init ──────────────────────────────────────────────
  const state = { day: 1, countdownTimer: 0, channel: null, lastKey: '' };

  const renderHeader = () => {
    state.day = getDayNum();
    const label = $('dayLabel'); if (label) label.textContent = `Hari ke-${state.day} Ramadhan`;
    const dateSub = $('dateSub'); if (dateSub) dateSub.textContent = formatDateID();
    const greet = $('greetingPill'); if (greet) {
      const h = new Date().getHours();
      greet.textContent = h < 12 ? "Assalamu'alaikum 🌸" : h < 18 ? "Selamat siang 🌤️" : "Selamat malam 🌙";
    }
    const qel = $('dailyQuote');
    if (qel) qel.textContent = '💭 ' + (QUOTES[(state.day - 1) % QUOTES.length] || QUOTES[0]);
    const ms = $('monthSub'); if (ms) ms.textContent = `Update sampai hari ke-${state.day}/30`;
    const hint = $('liveHint'); if (hint) hint.textContent = 'Koneksi real-time aktif. Notifikasi muncul otomatis.';
  };

  const renderNameSeg = () => {
    const nama = getNama();
    const seg = $('nameSeg'); if (!seg) return;
    seg.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.nama === nama));
    const lbl = $('activeNameLabel'); if (lbl) lbl.textContent = nama === 'neng' ? 'Neng' : 'Aa';
    const badge = $('activeNameBadge'); if (badge) badge.textContent = nama === 'neng' ? '👩 Neng' : '👨 Aa';
  };

  const renderSchedule = () => {
    const el = $('sholatSchedule'); if (!el) return;
    const j = JADWAL[state.day];
    if (!j) { el.innerHTML = `<div class="small muted" style="grid-column:1/-1;text-align:center;">Jadwal belum tersedia</div>`; return; }
    const slots = [
      { l: 'Imsak', t: j.imsak },
      { l: 'Subuh', t: j.subuh },
      { l: 'Maghrib', t: j.maghrib },
    ];
    el.innerHTML = slots.map(s => `
      <div class="kpi-box center" style="padding:8px 4px; border-radius:14px; background:rgba(255,253,245,.06); border:1px solid rgba(255,253,245,.1);">
        <div style="font-size:10px; color:var(--muted); font-weight:600;">${s.l}</div>
        <div style="font-size:15px; font-weight:900; margin-top:2px;">${s.t}</div>
      </div>`).join('');
  };

  const startCountdown = () => {
    const el = $('iftarCountdown'), sub = $('iftarSub');
    if (!el) return;
    clearInterval(state.countdownTimer);
    const tick = () => {
      const j = JADWAL[state.day];
      const mag = j?.maghrib || '18:05';
      // Build target date using today's date in WIB
      const now = new Date();
      const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const [hh, mm] = mag.split(':').map(Number);
      const target = new Date(wib.getFullYear(), wib.getMonth(), wib.getDate(), hh, mm, 0);
      const diff = target - wib;
      if (diff <= 0) {
        el.textContent = '🎉 Waktunya buka!';
        if (sub) sub.textContent = `Alhamdulillah, sudah Maghrib • ${mag} WIB`;
        return;
      }
      const s = Math.floor(diff / 1000);
      el.textContent = `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
      if (sub) sub.textContent = `Countdown buka puasa • Maghrib ${mag} WIB`;
    };
    tick();
    state.countdownTimer = setInterval(tick, 1000);
  };

  const renderToday = rows => {
    const byName = { neng: [], aa: [] };
    for (const r of rows) {
      const n = r.nama === 'aa' ? 'aa' : 'neng';
      byName[n].push(r);
    }
    const nd = cntDone(byName.neng), ad = cntDone(byName.aa);
    const np = pct(nd), ap = pct(ad);
    const npts = sumPts(byName.neng), apts = sumPts(byName.aa);

    const nel = $('nengPct'); if (nel) nel.textContent = `${np}%`;
    const ael = $('aaPct'); if (ael) ael.textContent = `${ap}%`;

    const total = npts + apts || 1;
    const bar = $('todayBar'); if (bar) bar.style.width = `${Math.round(npts / total * 100)}%`;

    let winner = '🤝 Kompak!';
    if (np > ap) winner = '👩 Neng unggul!';
    else if (ap > np) winner = '👨 Aa unggul!';
    else if (npts > apts) winner = '👩 Neng unggul (poin)!';
    else if (apts > npts) winner = '👨 Aa unggul (poin)!';
    const tw = $('todayWinner'); if (tw) tw.textContent = winner;
    const ts = $('todaySub'); if (ts) ts.textContent = `Neng ${npts} pts  •  Aa ${apts} pts`;

    const banner = $('togetherBanner');
    if (banner) banner.style.display = np === 100 && ap === 100 ? 'block' : 'none';
  };

  const renderMonth = rows => {
    const dayMap = { neng: {}, aa: {} };
    for (const r of rows) {
      const n = r.nama === 'aa' ? 'aa' : 'neng';
      const d = Number(r.hari_ke);
      if (!dayMap[n][d]) dayMap[n][d] = [];
      dayMap[n][d].push(r);
    }
    const calc = who => {
      let pts = 0; const pcts = [];
      for (let d = 1; d <= state.day; d++) {
        const rs = dayMap[who][d] || [];
        pts += sumPts(rs);
        pcts.push(pct(cntDone(rs)));
      }
      return { pts, avg: Math.round(pcts.reduce((a, b) => a + b, 0) / Math.max(1, pcts.length)) };
    };
    const neng = calc('neng'), aa = calc('aa');
    const nmp = $('nengMonthPts'); if (nmp) nmp.textContent = String(neng.pts);
    const amp = $('aaMonthPts'); if (amp) amp.textContent = String(aa.pts);
    const nav = $('nengAvg'); if (nav) nav.textContent = `${neng.avg}%`;
    const aav = $('aaAvg'); if (aav) aav.textContent = `${aa.avg}%`;
    const mw = $('monthWinner');
    if (mw) mw.textContent = neng.pts > aa.pts ? '👩 Neng unggul' : aa.pts > neng.pts ? '👨 Aa unggul' : '🤝 Seri';
  };

  const supabase = () => window.RAMC?.supabase;

  const loadToday = async () => {
    const key = `ramc_dash_today_v2:${state.day}`;
    try {
      const { data, error } = await supabase().from('daily_progress').select('nama,hari_ke,item_id,selesai').eq('hari_ke', state.day);
      if (error) throw error;
      cache.write(key, data || []);
      setOffline(false);
      return data || [];
    } catch {
      setOffline(true);
      return cache.read(key) || [];
    }
  };

  const loadMonth = async () => {
    const key = `ramc_dash_month_v2:${state.day}`;
    try {
      const { data, error } = await supabase().from('daily_progress').select('nama,hari_ke,item_id,selesai').lte('hari_ke', state.day);
      if (error) throw error;
      cache.write(key, data || []);
      setOffline(false);
      return data || [];
    } catch {
      setOffline(true);
      return cache.read(key) || [];
    }
  };

  let refreshTimer = 0;
  const refresh = async () => {
    const [today, month] = await Promise.all([loadToday(), loadMonth()]);
    renderToday(today);
    renderMonth(month);
  };
  const debouncedRefresh = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, 200); };

  const subscribeRealtime = () => {
    if (state.channel) supabase().removeChannel(state.channel);
    state.channel = supabase().channel('ramc-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_progress', filter: `hari_ke=eq.${state.day}` }, payload => {
        const n = payload.new;
        if (n?.selesai === true) {
          const key = `${n.nama}:${n.item_id}:${n.hari_ke}`;
          if (key !== state.lastKey) {
            state.lastKey = key;
            const it = BY_ID.get(n.item_id);
            toast(`${n.nama === 'aa' ? 'Aa' : 'Neng'} selesai ${it?.nama || 'item'}! ${it?.icon || '✅'}`);
            const hint = $('liveHint');
            if (hint) hint.textContent = `Update: ${n.nama === 'aa' ? 'Aa' : 'Neng'} menyelesaikan ${it?.nama || ''}`;
          }
        }
        debouncedRefresh();
      }).subscribe();
  };

  // ── Stars canvas ─────────────────────────────────────────
  const initStars = () => {
    const cv = $('starsCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let w, h, raf = 0;
    const stars = [], meteors = [];
    const rand = (a, b) => a + Math.random() * (b - a);
    const resize = () => { w = cv.width = Math.floor(innerWidth * devicePixelRatio); h = cv.height = Math.floor(innerHeight * devicePixelRatio); };
    const makeStars = () => { stars.length = 0; for (let i = 0; i < Math.floor(innerWidth * innerHeight / 9000); i++) stars.push({ x: rand(0, w), y: rand(0, h), r: rand(0.6, 1.7) * devicePixelRatio, a: rand(0.25, 0.9), tw: rand(0.002, 0.01) }); };
    const spawn = () => meteors.push({ x: rand(0, w * 0.9), y: rand(0, h * 0.35), vx: rand(14, 22) * devicePixelRatio, vy: rand(5, 9) * devicePixelRatio, life: rand(28, 44), len: rand(90, 140) * devicePixelRatio });
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) { s.a += Math.sin(Date.now() * s.tw) * 0.002; ctx.fillStyle = `rgba(255,253,245,${Math.max(0.12, Math.min(0.9, s.a))})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
      if (Math.random() < 0.018) spawn();
      for (let i = meteors.length - 1; i >= 0; i--) { const m = meteors[i]; m.x += m.vx; m.y += m.vy; m.life--; const g = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * 0.35); g.addColorStop(0, 'rgba(251,191,36,.65)'); g.addColorStop(1, 'rgba(255,253,245,0)'); ctx.strokeStyle = g; ctx.lineWidth = 2.2 * devicePixelRatio; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.len, m.y - m.len * 0.35); ctx.stroke(); if (m.life <= 0 || m.x > w + m.len || m.y > h + m.len) meteors.splice(i, 1); }
      raf = requestAnimationFrame(tick);
    };
    resize(); addEventListener('resize', () => { resize(); makeStars(); }); makeStars(); raf = requestAnimationFrame(tick);
  };

  // ── init ──────────────────────────────────────────────────
  const init = async () => {
    initStars();
    renderHeader();
    renderNameSeg();
    renderSchedule();
    startCountdown();

    // Name seg click
    const seg = $('nameSeg');
    if (seg) seg.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
      setNama(b.dataset.nama); renderNameSeg();
    }));

    await refresh();
    subscribeRealtime();
  };

  // Wait for RAMC ready
  if (window.RAMC) {
    init().catch(() => toast('Waduh, koneksi bermasalah 😅'));
  } else {
    window.addEventListener('ramc:ready', () => init().catch(() => toast('Waduh, koneksi bermasalah 😅')), { once: true });
  }
})();
