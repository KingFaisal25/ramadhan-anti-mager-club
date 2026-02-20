-- ============================================================
-- MIGRASI DATABASE RAMADHAN ANTI MAGER CLUB - VERSI SIMPLE
-- Script yang lebih aman untuk Supabase SQL Editor
-- ============================================================

-- Hapus trigger lama jika ada (opsional)
DROP TRIGGER IF EXISTS trigger_daily_progress_updated_at ON daily_progress;
DROP TRIGGER IF EXISTS trigger_weekly_eval_updated_at ON weekly_eval;
DROP TRIGGER IF EXISTS trigger_targets_updated_at ON targets;

-- Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ==================== FUNGSI UPDATE_TIMESTAMP ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TABEL daily_progress ====================
CREATE TABLE IF NOT EXISTS daily_progress (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  hari_ke INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  selesai BOOLEAN DEFAULT FALSE,
  waktu_selesai TIMESTAMP WITH TIME ZONE,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_daily_progress UNIQUE(nama, hari_ke, item_id),
  CONSTRAINT check_hari_ke_range CHECK (hari_ke >= 1 AND hari_ke <= 30),
  CONSTRAINT valid_nama CHECK (nama IN ('neng', 'aa'))
);

-- ==================== TABEL weekly_eval ====================
CREATE TABLE IF NOT EXISTS weekly_eval (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  minggu_ke INTEGER NOT NULL,
  ibadah_konsisten TEXT,
  ibadah_kurang TEXT,
  hubungan_baik TEXT,
  hubungan_kurang TEXT,
  target_mingguan TEXT,
  refleksi_pribadi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_weekly_eval UNIQUE(nama, minggu_ke),
  CONSTRAINT check_minggu_ke_range CHECK (minggu_ke >= 1 AND minggu_ke <= 4),
  CONSTRAINT valid_weekly_nama CHECK (nama IN ('neng', 'aa', 'bersama'))
);

-- ==================== TABEL targets ====================
CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  target TEXT NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_target_nama CHECK (nama IN ('neng', 'aa'))
);

-- ==================== TABEL love_notes ====================
CREATE TABLE IF NOT EXISTS love_notes (
  id SERIAL PRIMARY KEY,
  dari_nama TEXT NOT NULL,
  untuk_nama TEXT NOT NULL,
  pesan TEXT NOT NULL,
  dibuat_pada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dibaca BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_love_note_names CHECK (
    (dari_nama IN ('neng', 'aa') AND untuk_nama IN ('neng', 'aa') AND dari_nama <> untuk_nama)
  )
);

-- ==================== TABEL daily_mood ====================
CREATE TABLE IF NOT EXISTS daily_mood (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  hari_ke INTEGER NOT NULL,
  mood TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_daily_mood UNIQUE(nama, hari_ke),
  CONSTRAINT check_mood_hari_range CHECK (hari_ke >= 1 AND hari_ke <= 30),
  CONSTRAINT valid_mood_nama CHECK (nama IN ('neng', 'aa')),
  CONSTRAINT valid_mood_values CHECK (mood IN ('😊 Senang', '😐 Biasa', '😢 Sedih', '😠 Marah', '😴 Lelah', '🤔 Pikir', '❤️ Cinta'))
);

-- ==================== INDEXES ====================
-- Index untuk daily_progress
CREATE INDEX IF NOT EXISTS idx_daily_progress_nama_hari ON daily_progress(nama, hari_ke);
CREATE INDEX IF NOT EXISTS idx_daily_progress_item_id ON daily_progress(item_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_selesai ON daily_progress(selesai);

-- Index untuk weekly_eval
CREATE INDEX IF NOT EXISTS idx_weekly_eval_nama_minggu ON weekly_eval(nama, minggu_ke);

-- Index untuk targets
CREATE INDEX IF NOT EXISTS idx_targets_nama ON targets(nama);
CREATE INDEX IF NOT EXISTS idx_targets_kategori ON targets(kategori);

-- Index untuk love_notes
CREATE INDEX IF NOT EXISTS idx_love_notes_dari ON love_notes(dari_nama);
CREATE INDEX IF NOT EXISTS idx_love_notes_untuk ON love_notes(untuk_nama);
CREATE INDEX IF NOT EXISTS idx_love_notes_dibaca ON love_notes(dibaca);

-- Index untuk daily_mood
CREATE INDEX IF NOT EXISTS idx_daily_mood_nama_hari ON daily_mood(nama, hari_ke);

-- ==================== TRIGGERS ====================
-- Trigger untuk daily_progress
CREATE OR REPLACE TRIGGER trigger_daily_progress_updated_at
  BEFORE UPDATE ON daily_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk weekly_eval
CREATE OR REPLACE TRIGGER trigger_weekly_eval_updated_at
  BEFORE UPDATE ON weekly_eval
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk targets
CREATE OR REPLACE TRIGGER trigger_targets_updated_at
  BEFORE UPDATE ON targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== KOMENTAR TABEL ====================
COMMENT ON TABLE daily_progress IS 'Tabel untuk menyimpan progress harian checklist ibadah Neng dan Aa';
COMMENT ON TABLE weekly_eval IS 'Tabel untuk evaluasi mingguan dan refleksi Neng, Aa, dan bersama';
COMMENT ON TABLE targets IS 'Tabel untuk target personal yang ingin dicapai';
COMMENT ON TABLE love_notes IS 'Tabel untuk catatan cinta antara Neng dan Aa';
COMMENT ON TABLE daily_mood IS 'Tabel untuk mood harian Neng dan Aa';

-- ==================== NOTIFICATION ====================
DO $$
BEGIN
  RAISE NOTICE '✅ Database migration berhasil!';
  RAISE NOTICE '📋 Tabel daily_progress, weekly_eval, targets, love_notes, daily_mood telah dibuat';
  RAISE NOTICE '🔐 Trigger untuk auto-update timestamp telah di-setup';
END
$$;