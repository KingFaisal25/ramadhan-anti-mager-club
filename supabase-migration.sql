-- ============================================================
-- MIGRASI DATABASE RAMADHAN ANTI MAGER CLUB
-- Script ini kompatibel dengan Supabase SQL Editor
-- ============================================================

-- Hapus tabel lama jika ada (opsional, hati-hati di production)
-- DROP TABLE IF EXISTS daily_progress CASCADE;
-- DROP TABLE IF EXISTS weekly_eval CASCADE;
-- DROP TABLE IF EXISTS targets CASCADE;
-- DROP TABLE IF EXISTS love_notes CASCADE;
-- DROP TABLE IF EXISTS daily_mood CASCADE;

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
  
  -- Constraints untuk integritas data
  CONSTRAINT unique_daily_progress UNIQUE(nama, hari_ke, item_id),
  CONSTRAINT check_hari_ke_range CHECK (hari_ke >= 1 AND hari_ke <= 30),
  CONSTRAINT valid_nama CHECK (nama IN ('neng', 'aa'))
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_daily_progress_nama_hari ON daily_progress(nama, hari_ke);
CREATE INDEX IF NOT EXISTS idx_daily_progress_item_id ON daily_progress(item_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_selesai ON daily_progress(selesai);

-- ==================== TABEL weekly_eval ====================
CREATE TABLE IF NOT EXISTS weekly_eval (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  minggu_ke INTEGER NOT NULL,
  ibadah_konsisten TEXT,
  ibadah_kurang TEXT,
  progress_hubungan TEXT,
  hal_disyukuri TEXT,
  tantangan TEXT,
  resolusi TEXT,
  doa_komitmen TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_weekly_eval UNIQUE(nama, minggu_ke),
  CONSTRAINT check_minggu_ke_range CHECK (minggu_ke >= 1 AND minggu_ke <= 4),
  CONSTRAINT valid_weekly_nama CHECK (nama IN ('neng', 'aa', 'bersama'))
);

CREATE INDEX IF NOT EXISTS idx_weekly_eval_nama_minggu ON weekly_eval(nama, minggu_ke);

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

CREATE INDEX IF NOT EXISTS idx_targets_nama ON targets(nama);
CREATE INDEX IF NOT EXISTS idx_targets_kategori ON targets(kategori);

-- ==================== TABEL love_notes ====================
CREATE TABLE IF NOT EXISTS love_notes (
  id SERIAL PRIMARY KEY,
  dari TEXT NOT NULL,
  untuk TEXT NOT NULL,
  pesan TEXT NOT NULL,
  dibaca BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_love_note_names CHECK (dari IN ('neng', 'aa') AND untuk IN ('neng', 'aa')),
  CONSTRAINT different_sender_receiver CHECK (dari <> untuk)
);

CREATE INDEX IF NOT EXISTS idx_love_notes_dari ON love_notes(dari);
CREATE INDEX IF NOT EXISTS idx_love_notes_untuk ON love_notes(untuk);
CREATE INDEX IF NOT EXISTS idx_love_notes_dibaca ON love_notes(dibaca);

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

CREATE INDEX IF NOT EXISTS idx_daily_mood_nama_hari ON daily_mood(nama, hari_ke);

-- ==================== FUNGSI UPDATE_TIMESTAMP ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGER UNTUK UPDATE_TIMESTAMP ====================

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

-- ==================== SAMPLE DATA (Opsional) ====================
-- INSERT INTO daily_progress (nama, hari_ke, item_id, selesai, waktu_selesai) VALUES
-- ('neng', 1, 'sholat_subuh', true, NOW()),
-- ('aa', 1, 'sholat_subuh', true, NOW());

-- ==================== KOMENTAR TABEL ====================
COMMENT ON TABLE daily_progress IS 'Tabel untuk menyimpan progress harian checklist ibadah Neng dan Aa';
COMMENT ON TABLE weekly_eval IS 'Tabel untuk evaluasi mingguan dan refleksi Neng, Aa, dan bersama';
COMMENT ON TABLE targets IS 'Tabel untuk target personal yang ingin dicapai';
COMMENT ON TABLE love_notes IS 'Tabel untuk catatan cinta antara Neng dan Aa';
COMMENT ON TABLE daily_mood IS 'Tabel untuk mood harian Neng dan Aa';

-- ==================== NOTIFICATION ====================
DO $$
BEGIN
  RAISE NOTICE '✅ Database migration script siap digunakan!';
  RAISE NOTICE '📋 Copy-paste script ini ke SQL Editor Supabase';
  RAISE NOTICE '🔐 Pastikan RLS (Row Level Security) diatur sesuai kebutuhan';
END
$$;