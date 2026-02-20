// ============================================================
// MOOD.JS — Ramadhan Anti Mager Club 🌙
// Mood/Semangat Meter harian — disimpan ke Supabase daily_mood
// ============================================================
(() => {
    const MOODS = [
        { v: 1, emoji: '😞', label: 'Lesu banget' },
        { v: 2, emoji: '😐', label: 'Biasa aja' },
        { v: 3, emoji: '🙂', label: 'Lumayan' },
        { v: 4, emoji: '😄', label: 'Semangat!' },
        { v: 5, emoji: '🔥', label: 'Luar biasa!' },
    ];
    const CACHE_KEY = (nama, hari) => `ramc_mood_v1:${nama}:${hari}`;

    const supabase = () => window.RAMC?.supabase;
    const getDayNum = () => {
        const ov = Number(localStorage.getItem('ramc_day_override') || '');
        if (ov >= 1 && ov <= 30) return ov;
        const diff = Math.floor((Date.now() - new Date('2025-03-01T00:00:00+07:00').getTime()) / 86400000);
        return Math.max(1, Math.min(30, diff + 1));
    };

    // ── Render mood picker on any page ───────────────────────
    // Call renderMoodPicker(containerId, nama) from the page JS
    window.MoodMeter = {
        MOODS,
        render: (containerId, nama) => {
            const wrap = document.getElementById(containerId); if (!wrap) return;
            const day = getDayNum();
            const cacheKey = CACHE_KEY(nama, day);
            const saved = Number(localStorage.getItem(cacheKey) || '0');

            wrap.innerHTML = `
        <div class="mood-label" id="moodLabel_${nama}">
          ${saved ? `${MOODS[saved - 1].emoji} ${MOODS[saved - 1].label}` : 'Gimana semangat ibadahmu hari ini?'}
        </div>
        <div class="mood-btns" role="group" aria-label="Pilih mood ${nama}">
          ${MOODS.map(m => `
            <button type="button" class="mood-btn${saved === m.v ? ' active' : ''}" 
              data-val="${m.v}" data-nama="${nama}" 
              title="${m.label}" aria-label="${m.label}" aria-pressed="${saved === m.v}">
              ${m.emoji}
            </button>`).join('')}
        </div>`;

            wrap.querySelectorAll('.mood-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const val = Number(btn.dataset.val);
                    const n = btn.dataset.nama;
                    // Optimistic update
                    wrap.querySelectorAll('.mood-btn').forEach(b => {
                        b.classList.toggle('active', Number(b.dataset.val) === val);
                        b.setAttribute('aria-pressed', String(Number(b.dataset.val) === val));
                    });
                    const mood = MOODS[val - 1];
                    const lbl = document.getElementById(`moodLabel_${n}`);
                    if (lbl) lbl.textContent = `${mood.emoji} ${mood.label}`;
                    localStorage.setItem(CACHE_KEY(n, day), String(val));
                    if (navigator.vibrate) navigator.vibrate(30);
                    try {
                        const { error } = await supabase().from('daily_mood').upsert(
                            { nama: n, hari_ke: day, mood: val, updated_at: new Date().toISOString() },
                            { onConflict: 'nama,hari_ke' }
                        );
                        if (error) throw error;
                    } catch { /* offline - cached locally already */ }
                });
            });

            // Try to load from Supabase
            (async () => {
                try {
                    const { data } = await supabase().from('daily_mood').select('mood')
                        .eq('nama', nama).eq('hari_ke', day).maybeSingle();
                    if (data?.mood) {
                        localStorage.setItem(cacheKey, String(data.mood));
                        wrap.querySelectorAll('.mood-btn').forEach(b => {
                            const match = Number(b.dataset.val) === data.mood;
                            b.classList.toggle('active', match);
                            b.setAttribute('aria-pressed', String(match));
                        });
                        const mood = MOODS[data.mood - 1];
                        const lbl = document.getElementById(`moodLabel_${nama}`);
                        if (lbl) lbl.textContent = `${mood.emoji} ${mood.label}`;
                    }
                } catch { /* use cache */ }
            })();
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

    // Auto-init if containers exist (index.html uses specific IDs)
    const tryAutoInit = () => {
        if (document.getElementById('moodNengWrap')) window.MoodMeter.render('moodNengWrap', 'neng');
        if (document.getElementById('moodAaWrap')) window.MoodMeter.render('moodAaWrap', 'aa');
    };

    if (window.RAMC) tryAutoInit();
    else window.addEventListener('ramc:ready', tryAutoInit, { once: true });
})();
