// Konfigurasi Supabase Client untuk Ramadhan Anti Mager Club
// Menggunakan credentials yang disediakan

const SUPABASE_CONFIG = {
  // URL Supabase project
  url: 'https://zuqwqdttdiyknkzqphqz.supabase.co',
  
  // Anon key (JWT token yang diberikan)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1cXdxZHR0ZGl5a25renFwaHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTM5NTQsImV4cCI6MjA4Njk4OTk1NH0.VoMlZa3sH72FP6PpY8hsYDBQVLfOUZvSGl01Qq1e75E',
  
  // Service role key (untuk server-side operations)
  serviceRoleKey: 'sb_publishable_CKNo1UctWnbwqsrDZbF1_Q_0v9JhdA6',
  
  // Konfigurasi default
  options: {
    auth: {
      // Auto refresh token
      autoRefreshToken: true,
      // Persist session di localStorage
      persistSession: true,
      // Detect session di URL (untuk OAuth callbacks)
      detectSessionInUrl: true
    },
    // Global headers
    global: {
      'x-application-name': 'ramadhan-anti-mager-club',
      'x-application-version': '1.0.0'
    },
    // Connection settings
    db: {
      schema: 'public'
    },
    // Real-time subscriptions
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
};

// Export untuk penggunaan di modul lain
export default SUPABASE_CONFIG;