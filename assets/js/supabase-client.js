// ============================================================
// SUPABASE CLIENT INITIALIZER
// Ramadhan Anti Mager Club 🌙
// ============================================================
// Memuat SDK Supabase dari CDN, lalu expose window.RAMC.supabase
// Tidak pakai ES module import agar bisa di-load via <script>
// ============================================================

(async () => {
  // Pastikan Supabase SDK sudah dimuat
  if (typeof window.supabase === 'undefined') {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const url = window.SUPABASE_URL || '';
  const key = window.SUPABASE_KEY || '';

  if (!url || url.includes('YOUR_') || !key || key.includes('YOUR_')) {
    console.warn(
      '[RAMC] Supabase belum dikonfigurasi!\n' +
      'Buka config.js dan isi SUPABASE_URL & SUPABASE_KEY.\n' +
      'App tetap berjalan tapi tidak akan tersinkronisasi dengan database.'
    );
    // Buat dummy client agar app tidak crash
    window.RAMC = {
      supabase: {
        from: () => ({ select: () => ({ data: [], error: null }), upsert: () => ({ error: null }), eq: () => ({ data: [], error: null }), in: () => ({ data: [], error: null }), maybeSingle: () => ({ data: null, error: null }), lte: () => ({ data: [], error: null }) }),
        channel: () => ({ on: (_, __, cb) => ({ on: (_, __, cb) => ({ subscribe: () => { } }), subscribe: () => { } }), subscribe: () => { } }),
        removeChannel: () => { },
      },
      offline: true,
    };
    window.dispatchEvent(new CustomEvent('ramc:ready', { detail: { offline: true } }));
    return;
  }

  const client = window.supabase.createClient(url, key, {
    realtime: { params: { eventsPerSecond: 10 } }
  });

  window.RAMC = { supabase: client, offline: false };
  window.dispatchEvent(new CustomEvent('ramc:ready', { detail: { offline: false } }));
})();