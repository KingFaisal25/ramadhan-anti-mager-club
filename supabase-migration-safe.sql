-- ============================================================
-- MIGRASI DATABASE RAMADHAN ANTI MAGER CLUB - VERSI SUPER AMAN
-- Script yang dijamin tidak error di Supabase SQL Editor
-- ============================================================

-- ==================== FUNGSI UPDATE_TIMESTAMP ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== 1. BUAT TABEL (JIKA BELUM ADA) ====================

-- TABEL daily_progress
CREATE TABLE IF NOT EXISTS daily_progress (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  hari_ke INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  selesai BOOLEAN DEFAULT FALSE,
  waktu_selesai TIMESTAMP WITH TIME ZONE,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL weekly_eval
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL targets
CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  target TEXT NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL love_notes
CREATE TABLE IF NOT EXISTS love_notes (
  id SERIAL PRIMARY KEY,
  dari_nama TEXT NOT NULL,
  untuk_nama TEXT NOT NULL,
  pesan TEXT NOT NULL,
  dibuat_pada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dibaca BOOLEAN DEFAULT FALSE
);

-- TABEL daily_mood
CREATE TABLE IF NOT EXISTS daily_mood (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  hari_ke INTEGER NOT NULL,
  mood TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 2. PERBAIKI TIPE DATA & BERSIHKAN DATA INVALID ====================

-- Perbaikan tipe data kolom 'mood' di tabel daily_mood
DO $$
BEGIN
  -- 1. Cek & Ubah tipe data menjadi TEXT jika belum
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'daily_mood' 
    AND column_name = 'mood' 
    AND data_type != 'text'
  ) THEN
    ALTER TABLE daily_mood ALTER COLUMN mood TYPE TEXT USING mood::TEXT;
  END IF;

  -- 2. HAPUS DATA INVALID SEBELUM MEMASANG CONSTRAINT
  -- Ini penting agar constraint bisa dipasang tanpa error "violated by some row"
  DELETE FROM daily_mood 
  WHERE mood NOT IN ('😊 Senang', '😐 Biasa', '😢 Sedih', '😠 Marah', '😴 Lelah', '🤔 Pikir', '❤️ Cinta');
END $$;

-- Update daily_progress
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS nama TEXT;
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS hari_ke INTEGER;
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS item_id TEXT;
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS selesai BOOLEAN DEFAULT FALSE;
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS waktu_selesai TIMESTAMP WITH TIME ZONE;
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS catatan TEXT;
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update weekly_eval
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS nama TEXT;
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS minggu_ke INTEGER;
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS ibadah_konsisten TEXT;
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS ibadah_kurang TEXT;
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS hubungan_baik TEXT;
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS hubungan_kurang TEXT;
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS target_mingguan TEXT;
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS refleksi_pribadi TEXT;
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE weekly_eval ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update targets
ALTER TABLE targets ADD COLUMN IF NOT EXISTS nama TEXT;
ALTER TABLE targets ADD COLUMN IF NOT EXISTS kategori TEXT;
ALTER TABLE targets ADD COLUMN IF NOT EXISTS target TEXT;
ALTER TABLE targets ADD COLUMN IF NOT EXISTS catatan TEXT;
ALTER TABLE targets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE targets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update love_notes
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS dari_nama TEXT;
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS untuk_nama TEXT;
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS pesan TEXT;
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS dibuat_pada TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS dibaca BOOLEAN DEFAULT FALSE;

-- Update daily_mood
ALTER TABLE daily_mood ADD COLUMN IF NOT EXISTS nama TEXT;
ALTER TABLE daily_mood ADD COLUMN IF NOT EXISTS hari_ke INTEGER;
ALTER TABLE daily_mood ADD COLUMN IF NOT EXISTS mood TEXT;
ALTER TABLE daily_mood ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==================== 3. TAMBAH CONSTRAINTS (AMAN) ====================
-- Constraints untuk daily_progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_daily_progress' AND conrelid = 'daily_progress'::regclass
  ) THEN
    ALTER TABLE daily_progress ADD CONSTRAINT unique_daily_progress UNIQUE(nama, hari_ke, item_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_hari_ke_range' AND conrelid = 'daily_progress'::regclass
  ) THEN
    ALTER TABLE daily_progress ADD CONSTRAINT check_hari_ke_range CHECK (hari_ke >= 1 AND hari_ke <= 30);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_nama' AND conrelid = 'daily_progress'::regclass
  ) THEN
    ALTER TABLE daily_progress ADD CONSTRAINT valid_nama CHECK (nama IN ('neng', 'aa'));
  END IF;
END $$;

-- Constraints untuk weekly_eval
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_weekly_eval' AND conrelid = 'weekly_eval'::regclass
  ) THEN
    ALTER TABLE weekly_eval ADD CONSTRAINT unique_weekly_eval UNIQUE(nama, minggu_ke);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_minggu_ke_range' AND conrelid = 'weekly_eval'::regclass
  ) THEN
    ALTER TABLE weekly_eval ADD CONSTRAINT check_minggu_ke_range CHECK (minggu_ke >= 1 AND minggu_ke <= 4);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_weekly_nama' AND conrelid = 'weekly_eval'::regclass
  ) THEN
    ALTER TABLE weekly_eval ADD CONSTRAINT valid_weekly_nama CHECK (nama IN ('neng', 'aa', 'bersama'));
  END IF;
END $$;

-- Constraints untuk targets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_target_nama' AND conrelid = 'targets'::regclass
  ) THEN
    ALTER TABLE targets ADD CONSTRAINT valid_target_nama CHECK (nama IN ('neng', 'aa'));
  END IF;
END $$;

-- Constraints untuk love_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_love_note_names' AND conrelid = 'love_notes'::regclass
  ) THEN
    ALTER TABLE love_notes ADD CONSTRAINT valid_love_note_names CHECK (
      (dari_nama IN ('neng', 'aa') AND untuk_nama IN ('neng', 'aa') AND dari_nama <> untuk_nama)
    );
  END IF;
END $$;

-- Constraints untuk daily_mood
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_daily_mood' AND conrelid = 'daily_mood'::regclass
  ) THEN
    ALTER TABLE daily_mood ADD CONSTRAINT unique_daily_mood UNIQUE(nama, hari_ke);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_mood_hari_range' AND conrelid = 'daily_mood'::regclass
  ) THEN
    ALTER TABLE daily_mood ADD CONSTRAINT check_mood_hari_range CHECK (hari_ke >= 1 AND hari_ke <= 30);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_mood_nama' AND conrelid = 'daily_mood'::regclass
  ) THEN
    ALTER TABLE daily_mood ADD CONSTRAINT valid_mood_nama CHECK (nama IN ('neng', 'aa'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_mood_values' AND conrelid = 'daily_mood'::regclass
  ) THEN
    ALTER TABLE daily_mood ADD CONSTRAINT valid_mood_values CHECK (mood IN ('😊 Senang', '😐 Biasa', '😢 Sedih', '😠 Marah', '😴 Lelah', '🤔 Pikir', '❤️ Cinta'));
  END IF;
END $$;

-- ==================== 4. INDEXES (AMAN) ====================
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

-- ==================== 5. TRIGGERS (AMAN) ====================
-- Trigger untuk daily_progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_daily_progress_updated_at' AND tgrelid = 'daily_progress'::regclass
  ) THEN
    CREATE TRIGGER trigger_daily_progress_updated_at
      BEFORE UPDATE ON daily_progress
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger untuk weekly_eval
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_weekly_eval_updated_at' AND tgrelid = 'weekly_eval'::regclass
  ) THEN
    CREATE TRIGGER trigger_weekly_eval_updated_at
      BEFORE UPDATE ON weekly_eval
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger untuk targets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_targets_updated_at' AND tgrelid = 'targets'::regclass
  ) THEN
    CREATE TRIGGER trigger_targets_updated_at
      BEFORE UPDATE ON targets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ==================== 6. KOMENTAR TABEL ====================
COMMENT ON TABLE daily_progress IS 'Tabel untuk menyimpan progress harian checklist ibadah Neng dan Aa';
COMMENT ON TABLE weekly_eval IS 'Tabel untuk evaluasi mingguan dan refleksi Neng, Aa, dan bersama';
COMMENT ON TABLE targets IS 'Tabel untuk target personal yang ingin dicapai';
COMMENT ON TABLE love_notes IS 'Tabel untuk catatan cinta antara Neng dan Aa';
COMMENT ON TABLE daily_mood IS 'Tabel untuk mood harian Neng dan Aa';