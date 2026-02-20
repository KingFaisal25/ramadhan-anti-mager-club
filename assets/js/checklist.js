// ============================================================
// CHECKLIST.JS — Ramadhan Anti Mager Club 🌙
// Halaman checklist harian — paling penting!
// ============================================================
(() => {
  const NAMES = ['neng', 'aa'];
  const ITEMS = window.CHECKLIST_DATA || [];
  const CATS = window.CHECKLIST_CATEGORIES || [];
  const BY_ID = window.CHECKLIST_BY_ID || new Map();
  const TOTAL = window.TOTAL_ITEMS || 27;

  const DAY_KEY = 'ramc_checklist_day';
  const OVERRIDE_KEY = 'ramc_day_override';
  const VIEW_KEY = 'ramc_view_mode';
  const CUSTOM_KEY = 'ramc_custom_v2';

  let CUSTOM_ITEMS = [];
  let ALL_ITEMS = [];
  let ALL_CATS = [];

  const $ = id => document.getElementById(id);
  const supabase = () => window.RAMC?.supabase;

  const toast = (msg, dur = 2400) => {
    const el = $('toast'); if (!el) return;
    el.textContent = msg; el.className = 'toast show';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), dur);
  };

  const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cache = { read: k => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }, write: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } } };
  const setOffline = v => { const el = $('netBadge'); if (el) el.style.display = v ? 'inline-flex' : 'none'; };

  // ── Day helpers ───────────────────────────────────────────
  const startWIB = () => new Date('2025-03-01T00:00:00+07:00');
  const clamp = d => Math.max(1, Math.min(30, Number(d) || 1));
  const getTodayN = () => {
    const ov = Number(localStorage.getItem(OVERRIDE_KEY) || '');
    if (ov >= 1 && ov <= 30) return ov;
    const diff = Math.floor((Date.now() - startWIB().getTime()) / 86400000);
    return Math.max(1, Math.min(30, diff + 1));
  };
  const getViewDay = () => clamp(localStorage.getItem(DAY_KEY) || getTodayN());
  const setViewDay = d => localStorage.setItem(DAY_KEY, String(clamp(d)));
  const formatDate = d => {
    const date = new Date(startWIB().getTime() + (clamp(d) - 1) * 86400000);
    return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };

  // ── View mode ─────────────────────────────────────────────
  const getViewMode = () => localStorage.getItem(VIEW_KEY) || 'all';
  const setViewMode = v => localStorage.setItem(VIEW_KEY, v);

  // ── State ─────────────────────────────────────────────────
  const state = {
    day: 1,
    progress: { neng: new Map(), aa: new Map() },
    channel: null,
    confetti: null,
    celebratedCats: new Set(),
    lastFullDay: null,
    lastNotifKey: '',
    viewMode: 'all',
  };

  // ── Audio ─────────────────────────────────────────────────
  const playCheck = () => { try { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; const c = new A(); const g = c.createGain(); g.gain.value = 0.04; g.connect(c.destination); const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 880; o.connect(g); o.start(c.currentTime); o.stop(c.currentTime + 0.08); setTimeout(() => c.close(), 200); } catch { } };
  const playCelebrate = () => { try { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; const c = new A(); const g = c.createGain(); g.gain.value = 0.06; g.connect(c.destination); const tone = (f, t, d) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + d); }; const t0 = c.currentTime; tone(784, t0 + 0.02, 0.09); tone(988, t0 + 0.14, 0.1); tone(1175, t0 + 0.27, 0.12); setTimeout(() => c.close(), 700); } catch { } };

  // ── Confetti ──────────────────────────────────────────────
  const Confetti = cv => {
    const ctx = cv.getContext('2d'); let w = 0, h = 0, raf = 0, parts = [];
    const colors = ['#f59e0b', '#fbbf24', '#22c55e', '#fffdf5', '#fb7185'];
    const resize = () => { w = cv.width = Math.floor(innerWidth * devicePixelRatio); h = cv.height = Math.floor(innerHeight * devicePixelRatio); };
    resize(); addEventListener('resize', resize);
    const tick = () => { ctx.clearRect(0, 0, w, h); for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, p.life / 120); ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); ctx.restore(); if (p.life <= 0 || p.y > h + 80) parts.splice(i, 1); } if (parts.length) raf = requestAnimationFrame(tick); else { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, w, h); } };
    const burst = (opts = {}) => { const x = (opts.x ?? innerWidth / 2) * devicePixelRatio; const y = (opts.y ?? innerHeight / 2) * devicePixelRatio; const cnt = opts.count ?? 90; const pw = opts.power ?? 18; for (let i = 0; i < cnt; i++) { const a = Math.random() * Math.PI * 2; const sp = (0.4 + Math.random() * 0.6) * pw * devicePixelRatio; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6 * devicePixelRatio, g: 0.32 * devicePixelRatio, r: (2 + Math.random() * 3) * devicePixelRatio, rot: Math.random() * Math.PI, vr: -0.12 + Math.random() * 0.24, life: 80 + Math.random() * 40, c: colors[Math.floor(Math.random() * colors.length)] }); } if (!raf) raf = requestAnimationFrame(tick); };
    return { burst };
  };

  // ── Stars ─────────────────────────────────────────────────
  const initStars = () => {
    const cv = $('starsCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d'); let w, h; const stars = [], meteors = []; const rand = (a, b) => a + Math.random() * (b - a);
    const resize = () => { w = cv.width = Math.floor(innerWidth * devicePixelRatio); h = cv.height = Math.floor(innerHeight * devicePixelRatio); };
    const mkStars = () => { stars.length = 0; for (let i = 0; i < Math.floor(innerWidth * innerHeight / 9000); i++)stars.push({ x: rand(0, w), y: rand(0, h), r: rand(0.6, 1.7) * devicePixelRatio, a: rand(0.25, 0.9), tw: rand(0.002, 0.01) }); };
    const spawn = () => meteors.push({ x: rand(0, w * 0.9), y: rand(0, h * 0.35), vx: rand(14, 22) * devicePixelRatio, vy: rand(5, 9) * devicePixelRatio, life: rand(28, 44), len: rand(90, 140) * devicePixelRatio });
    const tick = () => { ctx.clearRect(0, 0, w, h); for (const s of stars) { s.a += Math.sin(Date.now() * s.tw) * 0.002; ctx.fillStyle = `rgba(255,253,245,${Math.max(0.12, Math.min(0.9, s.a))})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); } if (Math.random() < 0.018) spawn(); for (let i = meteors.length - 1; i >= 0; i--) { const m = meteors[i]; m.x += m.vx; m.y += m.vy; m.life--; const g = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * 0.35); g.addColorStop(0, 'rgba(251,191,36,.65)'); g.addColorStop(1, 'rgba(255,253,245,0)'); ctx.strokeStyle = g; ctx.lineWidth = 2.2 * devicePixelRatio; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.len, m.y - m.len * 0.35); ctx.stroke(); if (m.life <= 0 || m.x > w + m.len || m.y > h + m.len) meteors.splice(i, 1); } requestAnimationFrame(tick); };
    resize(); addEventListener('resize', () => { resize(); mkStars(); }); mkStars(); requestAnimationFrame(tick);
  };

  // ── Float points animation ────────────────────────────────
  const spawnPts = (x, y, pts) => {
    if (typeof x !== 'number') return;
    const el = document.createElement('div'); el.className = 'float-pts';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.textContent = `+${pts}pt`; document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 900);
  };

  // ── Custom items ──────────────────────────────────────────
  const loadCustom = () => { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; } };
  const addCustom = name => {
    const it = { id: `custom_${Date.now()}`, kategori: 'Target Personal', katKey: 'other', icon: '🎯', nama: name, poin: 20 };
    const cur = loadCustom(); cur.push(it); localStorage.setItem(CUSTOM_KEY, JSON.stringify(cur));
    ALL_ITEMS.push(it); BY_ID.set(it.id, it);
    if (!ALL_CATS.includes('Target Personal')) ALL_CATS.push('Target Personal');
    render(); toast('Target personal ditambahkan 🎯');
  };

  // ── Data helpers ──────────────────────────────────────────
  const norm = n => n === 'aa' ? 'aa' : 'neng';
  const getRow = (nama, id) => state.progress[norm(nama)]?.get(id) || null;
  const isDone = (nama, id) => Boolean(getRow(nama, id)?.selesai);
  const cntDone = (nama, list) => list.reduce((a, it) => a + (isDone(nama, it.id) ? 1 : 0), 0);
  const calcPts = nama => ALL_ITEMS.reduce((a, it) => a + (isDone(nama, it.id) ? Number(it.poin || 0) : 0), 0);

  // ── Category styling ──────────────────────────────────────
  const catClass = key => ({ ibadah: 'cat-ibadah', hubungan: 'cat-hubungan', diri: 'cat-diri', muhasabah: 'cat-muhasabah' }[key] || '');
  const catEmoji = key => ({ ibadah: '🕌', hubungan: '💑', diri: '🌱', muhasabah: '🌙', other: '🎯' }[key] || '✨');

  // ── Render ────────────────────────────────────────────────
  const render = () => { updateHeader(); renderStats(); renderCategories(); };

  const updateHeader = () => {
    const dl = $('dayLabel'); if (dl) dl.textContent = `Hari ke-${state.day}/30 • ${formatDate(state.day)}`;
    const dp = $('datePill'); if (dp) dp.textContent = `Hari ke-${state.day}/30 • ${formatDate(state.day)}`;
    const prev = $('prevDayBtn'), next = $('nextDayBtn');
    if (prev) prev.disabled = state.day <= 1;
    if (next) next.disabled = state.day >= 30;
    ['all', 'neng', 'aa'].forEach(m => {
      const b = $(`view${m.charAt(0).toUpperCase() + m.slice(1)}Btn`);
      if (b) b.classList.toggle('active', state.viewMode === m);
    });
  };

  const renderStats = () => {
    const tot = ALL_ITEMS.length || TOTAL;
    const nd = cntDone('neng', ALL_ITEMS), ad = cntDone('aa', ALL_ITEMS);
    const np = Math.round(nd / Math.max(1, tot) * 100), ap = Math.round(ad / Math.max(1, tot) * 100);
    const npts = calcPts('neng'), apts = calcPts('aa');

    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set('nengCount', `${nd}/${tot}`); set('nengPct', `${np}%`); set('nengPts', `${npts} pts`);
    set('aaCount', `${ad}/${tot}`); set('aaPct', `${ap}%`); set('aaPts', `${apts} pts`);
    set('nengSub', np === 100 ? 'Masya Allah, 100%! 🌟' : 'Bismillah, lanjutkan 💪');
    set('aaSub', ap === 100 ? 'Masya Allah, 100%! 🌟' : 'Bismillah, lanjutkan 💪');

    const nb = $('nengBar'), ab = $('aaBar');
    if (nb) nb.style.width = `${np}%`;
    if (ab) ab.style.width = `${ap}%`;

    // Toggle card visibility by viewMode
    const nCard = $('nengStatCard'), aCard = $('aaStatCard'), sg = $('statsGrid');
    if (nCard && aCard && sg) {
      if (state.viewMode === 'all') { nCard.style.display = ''; aCard.style.display = ''; sg.className = 'grid cols-2'; sg.style.gap = '12px'; }
      else if (state.viewMode === 'neng') { nCard.style.display = ''; aCard.style.display = 'none'; sg.className = 'grid'; }
      else { nCard.style.display = 'none'; aCard.style.display = ''; sg.className = 'grid'; }
    }

    // Full 100% celebration
    if (ALL_ITEMS.length && nd === tot && ad === tot && state.lastFullDay !== state.day) {
      state.lastFullDay = state.day;
      state.confetti?.burst({ count: 160, power: 16 });
      playCelebrate();
      toast('Masya Allah! Kalian kompak 100% hari ini! 🎉🏆');
    }
  };

  const renderCategories = () => {
    const wrap = $('categoriesWrap'); if (!wrap) return;
    wrap.innerHTML = '';

    for (const cat of ALL_CATS) {
      const list = ALL_ITEMS.filter(it => it.kategori === cat);
      if (!list.length) continue;

      const katKey = list[0].katKey || 'other';
      const nd = cntDone('neng', list), ad = cntDone('aa', list);
      const np = Math.round(nd / Math.max(1, list.length) * 100), ap = Math.round(ad / Math.max(1, list.length) * 100);

      const sec = document.createElement('section');
      sec.className = `card glow ${catClass(katKey)}`;
      sec.dataset.cat = cat;

      // Header
      const showNeng = state.viewMode !== 'aa';
      const showAa = state.viewMode !== 'neng';
      const counters = [showNeng ? `Neng ${nd}/${list.length}` : null, showAa ? `Aa ${ad}/${list.length}` : null].filter(Boolean).join(' • ');
      const badges = [showNeng ? `<span class="badge">Neng ${np}%</span>` : '', showAa ? `<span class="badge">Aa ${ap}%</span>` : ''].join('');
      const star = (np === 100 || ap === 100) ? ' ⭐' : '';

      sec.innerHTML = `
        <div class="row between wrap">
          <div>
            <div class="pill">${catEmoji(katKey)} ${escHtml(cat)}${star}</div>
            <div class="small muted" style="margin-top:8px;">${counters}</div>
          </div>
          <div class="row" style="gap:8px;">${badges}</div>
        </div>
        <div class="divider"></div>
        <div class="pair-grid" style="display:grid; gap:10px; grid-template-columns:${state.viewMode === 'all' ? '1fr 1fr' : '1fr'};"></div>`;

      const grid = sec.querySelector('.pair-grid');

      for (const it of list) {
        const nDone = isDone('neng', it.id), aDone = isDone('aa', it.id);
        const nNote = Boolean(getRow('neng', it.id)?.catatan), aNote = Boolean(getRow('aa', it.id)?.catatan);

        const mkCell = (nama, done, hasNote) => `
          <button type="button" class="pair-cell${done ? ' done' : ''}" data-nama="${nama}" data-item="${escHtml(it.id)}" aria-label="${nama === 'neng' ? 'Neng' : 'Aa'}: ${escHtml(it.nama)}" style="width:100%;text-align:left;border-radius:16px;border:1px solid rgba(255,255,255,${done ? '.0' : '.12'});background:${done ? 'linear-gradient(180deg,rgba(34,197,94,.18),rgba(34,197,94,.06))' : 'linear-gradient(180deg,rgba(255,253,245,.06),rgba(255,253,245,.03))'};border-color:${done ? 'rgba(34,197,94,.3)' : 'rgba(255,255,255,.12)'};padding:14px 12px;cursor:pointer;display:flex;flex-direction:column;gap:6px;color:var(--cream);transition:transform .15s,border-color .15s,background .15s;">
            <span style="font-size:18px;">${done ? '✅' : '⬜'}</span>
            <span style="font-weight:800;font-size:13px;line-height:1.35;">${escHtml(it.icon)} ${escHtml(it.nama)}</span>
            <span style="font-size:11px;color:rgba(255,253,245,.68);">${hasNote ? '📝 ' : ''}<span class="pts-label">+${Number(it.poin || 0)}pt</span></span>
          </button>`;

        // Build wrapper per person
        const mkWrapper = (nama, done, hasNote) => {
          const wrap = document.createElement('div');
          wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.gap = '4px';
          wrap.innerHTML = mkCell(nama, done, hasNote);
          return wrap;
        };

        if (state.viewMode === 'all') {
          // 2-col layout: each item takes a pair row
          const row = document.createElement('div');
          row.style.gridColumn = '1/-1';
          row.style.display = 'grid';
          row.style.gridTemplateColumns = '1fr 1fr';
          row.style.gap = '10px';
          row.appendChild(mkWrapper('neng', nDone, nNote));
          row.appendChild(mkWrapper('aa', aDone, aNote));
          grid.appendChild(row);
        } else {
          const nama = state.viewMode;
          const done = nama === 'neng' ? nDone : aDone;
          const hasNote = nama === 'neng' ? nNote : aNote;
          grid.appendChild(mkWrapper(nama, done, hasNote));
        }
      }

      // Bind clicks
      sec.querySelectorAll('[data-nama]').forEach(cell => {
        cell.addEventListener('click', e => onToggle(cell.dataset.nama, cell.dataset.item, e));
      });

      wrap.appendChild(sec);

      // Category confetti
      requestAnimationFrame(() => {
        const r = sec.getBoundingClientRect();
        const kN = `${state.day}:${cat}:neng`, kA = `${state.day}:${cat}:aa`;
        if (np === 100 && !state.celebratedCats.has(kN)) { state.celebratedCats.add(kN); state.confetti?.burst({ x: r.left + r.width * 0.25, y: r.top + 20, count: 28, power: 11 }); }
        if (ap === 100 && !state.celebratedCats.has(kA)) { state.celebratedCats.add(kA); state.confetti?.burst({ x: r.left + r.width * 0.75, y: r.top + 20, count: 28, power: 11 }); }
      });
    }
  };

  // ── Toggle ────────────────────────────────────────────────
  const onToggle = async (nama, itemId, ev) => {
    const n = norm(nama);
    const it = BY_ID.get(itemId);
    const prev = getRow(n, itemId) || { nama: n, hari_ke: state.day, item_id: itemId, selesai: false, waktu_selesai: null, catatan: '' };
    const next = !prev.selesai;

    state.progress[n].set(itemId, { ...prev, selesai: next, waktu_selesai: next ? new Date().toISOString() : null });
    cache.write(`ramc_prog_v3:${n}:${state.day}`, Array.from(state.progress[n].entries()));
    render();

    if (navigator.vibrate) navigator.vibrate(50);
    if (next) { spawnPts(ev?.clientX, ev?.clientY, it?.poin || 0); playCheck(); state.confetti?.burst({ x: ev?.clientX, y: ev?.clientY, count: 14, power: 7 }); }

    try {
      const { error } = await supabase().from('daily_progress').upsert({ nama: n, hari_ke: state.day, item_id: itemId, selesai: next, waktu_selesai: next ? new Date().toISOString() : null, catatan: prev.catatan || null }, { onConflict: 'nama,hari_ke,item_id' });
      if (error) throw error;
      setOffline(false);
      if (next) toast(`${n === 'neng' ? 'Neng' : 'Aa'} +${Number(it?.poin || 0)}pt ✅`);
    } catch {
      state.progress[n].set(itemId, prev);
      cache.write(`ramc_prog_v3:${n}:${state.day}`, Array.from(state.progress[n].entries()));
      render(); setOffline(true);
      toast('Koneksi bermasalah 😅 Data disimpan lokal dulu ya!');
    }
  };

  // ── Load data ─────────────────────────────────────────────
  const setSkeleton = on => {
    const wrap = $('categoriesWrap'); if (!wrap || !on) return;
    wrap.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('section'); c.className = 'card glow';
      c.innerHTML = `<div class="skeleton" style="height:18px;width:40%;border-radius:10px;"></div><div style="height:10px;"></div><div class="skeleton" style="height:58px;border-radius:16px;"></div><div style="height:8px;"></div><div class="skeleton" style="height:58px;border-radius:16px;"></div>`;
      wrap.appendChild(c);
    }
  };

  const loadData = async () => {
    setSkeleton(true);
    state.day = getViewDay();
    state.viewMode = getViewMode();
    updateHeader();

    // Load from cache first
    for (const n of NAMES) {
      const c = cache.read(`ramc_prog_v3:${n}:${state.day}`);
      state.progress[n] = c ? new Map(c) : new Map();
    }

    try {
      const { data, error } = await supabase().from('daily_progress').select('*').eq('hari_ke', state.day).in('nama', NAMES);
      if (error) throw error;
      state.progress.neng = new Map(); state.progress.aa = new Map();
      for (const r of data || []) { const n = norm(r.nama); state.progress[n].set(r.item_id, r); }
      for (const n of NAMES) cache.write(`ramc_prog_v3:${n}:${state.day}`, Array.from(state.progress[n].entries()));
      setOffline(false);
    } catch {
      setOffline(true);
      toast('Koneksi bermasalah 😅 Data lokal digunakan.');
    } finally {
      setSkeleton(false);
      render();
      subscribeRealtime();
    }
  };

  const subscribeRealtime = () => {
    if (state.channel) supabase().removeChannel(state.channel);
    state.channel = supabase().channel('ramc-checklist-live-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_progress', filter: `hari_ke=eq.${state.day}` }, payload => {
        const row = payload.new; if (!row) return;
        const n = norm(row.nama);
        state.progress[n].set(row.item_id, { ...(getRow(n, row.item_id) || {}), ...row });
        cache.write(`ramc_prog_v3:${n}:${state.day}`, Array.from(state.progress[n].entries()));
        if (row.selesai === true && (!payload.old || payload.old.selesai !== true)) {
          const key = `${row.nama}:${row.item_id}:${row.hari_ke}`;
          if (key !== state.lastNotifKey) {
            state.lastNotifKey = key;
            const it = BY_ID.get(row.item_id);
            toast(`${n === 'neng' ? 'Neng' : 'Aa'} selesai ${it?.nama || 'item'}! ${it?.icon || '✅'}`);
          }
        }
        render();
      }).subscribe();
  };

  // ── Init ──────────────────────────────────────────────────
  const init = async () => {
    // Build combined item list
    CUSTOM_ITEMS = loadCustom();
    ALL_ITEMS = [...ITEMS, ...CUSTOM_ITEMS];
    ALL_CATS = [...CATS];
    if (CUSTOM_ITEMS.length && !ALL_CATS.includes('Target Personal')) ALL_CATS.push('Target Personal');
    CUSTOM_ITEMS.forEach(it => BY_ID.set(it.id, it));

    state.confetti = Confetti($('confettiCanvas'));
    initStars();

    // Day nav
    $('prevDayBtn')?.addEventListener('click', async () => { setViewDay(state.day - 1); await loadData(); });
    $('nextDayBtn')?.addEventListener('click', async () => { setViewDay(state.day + 1); await loadData(); });
    $('todayBtn')?.addEventListener('click', async () => { setViewDay(getTodayN()); await loadData(); });

    // View mode
    const bindView = (id, mode) => $(id)?.addEventListener('click', () => { state.viewMode = mode; setViewMode(mode); render(); });
    bindView('viewAllBtn', 'all'); bindView('viewNengBtn', 'neng'); bindView('viewAaBtn', 'aa');

    // Add custom
    $('addItemBtn')?.addEventListener('click', () => {
      const name = prompt('Nama target personal baru:');
      if (name?.trim()) addCustom(name.trim());
    });



    await loadData();
  };

  if (window.RAMC) {
    init().catch(() => toast('Waduh, koneksi bermasalah 😅'));
  } else {
    window.addEventListener('ramc:ready', () => init().catch(() => toast('Waduh, koneksi bermasalah 😅')), { once: true });
  }
})();
