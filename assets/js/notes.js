// ============================================================
// NOTES.JS — Ramadhan Anti Mager Club 🌙
// Love Notes — pesan tersembunyi antar pasangan
// ============================================================
(() => {
    const PEOPLE = ['neng', 'aa'];
    const supabase = () => window.RAMC?.supabase;
    const $ = id => document.getElementById(id);
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const toast = (msg, dur = 2400) => {
        const el = $('toast'); if (!el) return;
        el.textContent = msg; el.className = 'toast show';
        clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), dur);
    };

    const state = { notes: [], viewing: 'neng', sending: 'neng' };
    const UNREAD_KEY = 'ramc_notes_unread';

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

    const formatTime = iso => {
        if (!iso) return '';
        return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    };

    // ── Render notes list ─────────────────────────────────────
    const renderNotes = () => {
        const inbox = state.notes.filter(n => n.untuk === state.viewing);
        const outbox = state.notes.filter(n => n.dari === state.viewing);
        const wrap = $('notesWrap'); if (!wrap) return;

        const tab = $('viewSeg')?.querySelector('.active')?.dataset.tab || 'inbox';
        const list = tab === 'inbox' ? inbox : outbox;

        if (!list.length) {
            wrap.innerHTML = `<div class="card" style="text-align:center;padding:28px;color:var(--muted);">${tab === 'inbox' ? '💌 Belum ada pesan untukmu…' : '✉️ Belum ada pesan yang kamu kirim…'}</div>`;
            return;
        }

        wrap.innerHTML = list.map(n => {
            const isUnread = tab === 'inbox' && !n.dibaca;
            return `<div class="card note-card${isUnread ? ' note-unread' : ''}${n.dibaca ? '' : ' glow'}" data-id="${n.id}">
        <div class="row between wrap">
          <div class="row" style="gap:10px;">
            <span style="font-size:22px;">${n.dari === 'neng' ? '👩' : '👨'}</span>
            <div>
              <div style="font-weight:900; font-size:14px;">${n.dari === 'neng' ? 'Neng' : 'Aa'} → ${n.untuk === 'neng' ? 'Neng' : 'Aa'}</div>
              <div class="small muted">${formatTime(n.created_at)}</div>
            </div>
          </div>
          ${isUnread ? '<span class="badge" style="background:rgba(251,113,133,.25);border-color:rgba(251,113,133,.4);">💌 Baru</span>' : ''}
        </div>
        <div class="divider"></div>
        <div class="note-text">${esc(n.pesan)}</div>
        ${tab === 'inbox' && isUnread ? `<button class="btn secondary" type="button" data-read="${n.id}" style="margin-top:12px;font-size:12px;padding:8px 12px;">✅ Tandai dibaca</button>` : ''}
        ${tab === 'outbox' ? `<button class="btn ghost" type="button" data-delete="${n.id}" style="margin-top:12px;font-size:12px;padding:8px 12px;">🗑️ Hapus</button>` : ''}
      </div>`;
        }).join('');

        // Bind buttons
        wrap.querySelectorAll('[data-read]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.read);
                try {
                    await supabase().from('love_notes').update({ dibaca: true }).eq('id', id);
                    const note = state.notes.find(n => n.id === id);
                    if (note) note.dibaca = true;
                    updateUnreadBadge();
                    renderNotes();
                } catch { toast('Gagal update 😅'); }
            });
        });
        wrap.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.delete);
                try {
                    await supabase().from('love_notes').delete().eq('id', id);
                    state.notes = state.notes.filter(n => n.id !== id);
                    renderNotes(); toast('Pesan dihapus');
                } catch { toast('Gagal hapus 😅'); }
            });
        });
    };

    const updateUnreadBadge = () => {
        const unread = state.notes.filter(n => n.untuk === state.viewing && !n.dibaca).length;
        localStorage.setItem(UNREAD_KEY, JSON.stringify({ neng: 0, aa: 0, ...JSON.parse(localStorage.getItem(UNREAD_KEY) || '{}'), [state.viewing]: unread }));
        const b = $('unreadBadge');
        if (b) { b.textContent = `${unread} pesan baru`; b.style.display = unread ? 'inline-flex' : 'none'; }
    };

    // ── Send note ─────────────────────────────────────────────
    const sendNote = async () => {
        const dari = state.sending;
        const untuk = dari === 'neng' ? 'aa' : 'neng';
        const pesan = $('noteText')?.value?.trim();
        if (!pesan) { toast('Tulis pesannya dulu ya 💌'); return; }
        if (pesan.length > 500) { toast('Pesan maksimal 500 karakter'); return; }

        const btn = $('sendBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Mengirim…'; }
        try {
            const { data, error } = await supabase().from('love_notes').insert(
                { dari, untuk, pesan, dibaca: false }
            ).select().single();
            if (error) throw error;
            state.notes.unshift(data);
            const inp = $('noteText'); if (inp) inp.value = '';
            const ctr = $('charCount'); if (ctr) ctr.textContent = '0/500';
            toast(`💌 Pesan terkirim ke ${untuk === 'neng' ? 'Neng' : 'Aa'}!`);
            renderNotes();
        } catch { toast('Koneksi bermasalah 😅'); }
        finally { if (btn) { btn.disabled = false; btn.textContent = '💌 Kirim Pesan'; } }
    };

    // ── Load ──────────────────────────────────────────────────
    const loadNotes = async () => {
        try {
            const { data, error } = await supabase().from('love_notes').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            state.notes = data || [];
            updateUnreadBadge();
            renderNotes();
        } catch {
            toast('Koneksi bermasalah 😅');
            renderNotes();
        }
    };

    // ── Realtime ──────────────────────────────────────────────
    const subscribeRealtime = () => {
        supabase().channel('ramc-notes-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'love_notes' }, payload => {
                const n = payload.new;
                state.notes.unshift(n);
                if (n.untuk === state.viewing) {
                    toast(`💌 Ada pesan baru dari ${n.dari === 'neng' ? 'Neng' : 'Aa'}!`);
                    updateUnreadBadge();
                }
                renderNotes();
            }).subscribe();
    };

    // ── Init ──────────────────────────────────────────────────
    const init = async () => {
        initStars();

        // Sender seg
        const sendSeg = $('sendSeg');
        sendSeg?.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
            state.sending = b.dataset.nama;
            sendSeg.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('active', x === b));
            const lbl = $('sendingLabel'); if (lbl) lbl.textContent = `${state.sending === 'neng' ? '👩 Neng' : '👨 Aa'} → ${state.sending === 'neng' ? '👨 Aa' : '👩 Neng'}`;
        }));

        // Viewer seg
        const viewSeg = $('viewSeg');
        viewSeg?.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
            if (b.dataset.nama) { state.viewing = b.dataset.nama; }
            viewSeg.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('active', x === b));
            renderNotes();
        }));
        viewSeg?.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
            viewSeg.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b));
            renderNotes();
        }));

        // Send button
        $('sendBtn')?.addEventListener('click', sendNote);

        // Char counter
        const ta = $('noteText');
        const ctr = $('charCount');
        ta?.addEventListener('input', () => {
            if (ctr) ctr.textContent = `${ta.value.length}/500`;
        });

        await loadNotes();
        subscribeRealtime();
    };

    if (window.RAMC) init().catch(() => toast('Koneksi bermasalah 😅'));
    else window.addEventListener('ramc:ready', () => init().catch(() => toast('Koneksi bermasalah 😅')), { once: true });

    // Export for dashboard unread count
    window.NotesHelper = {
        getUnreadCount: (untuk) => {
            const raw = localStorage.getItem(UNREAD_KEY);
            return raw ? (JSON.parse(raw)[untuk] || 0) : 0;
        },
    };
})();
