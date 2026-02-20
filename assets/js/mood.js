// ============================================================
// MOOD.JS — Ramadhan Anti Mager Club 🌙
// Mood/Semangat Meter harian — Refactored & Synced
// ============================================================
(() => {
    // Sesuai constraint database
    const MOODS = [
        { v: '😊 Senang', emoji: '😊', label: 'Senang' },
        { v: '😐 Biasa', emoji: '😐', label: 'Biasa' },
        { v: '😢 Sedih', emoji: '😢', label: 'Sedih' },
        { v: '😴 Lelah', emoji: '😴', label: 'Lelah' },
        { v: '😠 Marah', emoji: '😠', label: 'Marah' },
        { v: '🤔 Pikir', emoji: '🤔', label: 'Pikir' },
        { v: '❤️ Cinta', emoji: '❤️', label: 'Cinta' }
    ];
    
    const CACHE_KEY = (nama, hari) => `ramc_mood_v2:${nama}:${hari}`;
    const supabase = () => window.RAMC?.supabase;
    const syncManager = () => window.SyncManager;

    const getDayNum = () => {
        const ov = Number(localStorage.getItem('ramc_day_override') || '');
        if (ov >= 1 && ov <= 30) return ov;
        const diff = Math.floor((Date.now() - new Date('2025-03-01T00:00:00+07:00').getTime()) / 86400000);
        return Math.max(1, Math.min(30, diff + 1));
    };

    // ── Render mood picker on any page ───────────────────────
    window.MoodMeter = {
        MOODS,
        render: (containerId, nama) => {
            const wrap = document.getElementById(containerId); if (!wrap) return;
            const day = getDayNum();
            const cacheKey = CACHE_KEY(nama, day);
            const savedVal = localStorage.getItem(cacheKey); // Stored as string value

            wrap.innerHTML = `
        <div class="mood-label" id="moodLabel_${nama}">
          ${savedVal ? savedVal : 'Gimana perasaanmu hari ini?'}
        </div>
        <div class="mood-btns" role="group" aria-label="Pilih mood ${nama}">
          ${MOODS.map(m => `
            <button type="button" class="mood-btn${savedVal === m.v ? ' active' : ''}" 
              data-val="${m.v}" data-nama="${nama}" 
              title="${m.label}" aria-label="${m.label}" aria-pressed="${savedVal === m.v}">
              ${m.emoji}
            </button>`).join('')}
        </div>`;

            wrap.querySelectorAll('.mood-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const val = btn.dataset.val; // String value
                    const n = btn.dataset.nama;
                    
                    // Optimistic update UI
                    wrap.querySelectorAll('.mood-btn').forEach(b => {
                        const match = b.dataset.val === val;
                        b.classList.toggle('active', match);
                        b.setAttribute('aria-pressed', String(match));
                    });
                    
                    const lbl = document.getElementById(`moodLabel_${n}`);
                    if (lbl) lbl.textContent = val;
                    
                    // Save Local
                    localStorage.setItem(CACHE_KEY(n, day), val);
                    if (navigator.vibrate) navigator.vibrate(30);

                    // Sync
                    const payload = { nama: n, hari_ke: day, mood: val, created_at: new Date().toISOString() };
                    if (syncManager()) {
                        syncManager().add('daily_mood', payload, `mood:${n}:${day}`);
                    } else {
                        // Fallback direct
                        supabase()?.from('daily_mood').upsert(payload, { onConflict: 'nama,hari_ke' }).then(({error}) => {
                            if(error) console.error('Mood sync error', error);
                        });
                    }
                });
            });

            // Try to load from Supabase (if online)
            if (navigator.onLine) {
                (async () => {
                    try {
                        const { data } = await supabase().from('daily_mood').select('mood')
                            .eq('nama', nama).eq('hari_ke', day).maybeSingle();
                        
                        if (data?.mood) {
                            localStorage.setItem(cacheKey, data.mood);
                            // Update UI if changed
                            if (data.mood !== savedVal) {
                                wrap.querySelectorAll('.mood-btn').forEach(b => {
                                    const match = b.dataset.val === data.mood;
                                    b.classList.toggle('active', match);
                                    b.setAttribute('aria-pressed', String(match));
                                });
                                const lbl = document.getElementById(`moodLabel_${nama}`);
                                if (lbl) lbl.textContent = data.mood;
                            }
                        }
                    } catch (e) { console.warn('Mood fetch failed', e); }
                })();
            }
        },

        // Fetch mood summary (for leaderboard/calendar)
        fetchAll: async (maxDay) => {
            try {
                const { data } = await supabase().from('daily_mood').select('nama,hari_ke,mood')
                    .lte('hari_ke', maxDay);
                return data || [];
            } catch { return []; }
        },
    };

    // Auto-init
    const tryAutoInit = () => {
        if (document.getElementById('moodNengWrap')) window.MoodMeter.render('moodNengWrap', 'neng');
        if (document.getElementById('moodAaWrap')) window.MoodMeter.render('moodAaWrap', 'aa');
    };

    if (window.RAMC) tryAutoInit();
    else window.addEventListener('ramc:ready', tryAutoInit, { once: true });
})();
