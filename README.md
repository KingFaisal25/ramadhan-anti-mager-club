# Ramadhan Anti Mager Club 🌙

Web app tracking ibadah & kegiatan Ramadhan untuk dua orang: **Neng** dan **Aa**. Data tersimpan real-time di **Supabase** dan bisa dideploy ke **GitHub Pages**.

## 1) Cara buat Supabase project baru

- Buka https://supabase.com → buat project baru.
- Catat **Project URL** dan **anon public key** (Settings → API).

## 2) Cara jalankan SQL migrations

- Buka **SQL Editor** → jalankan migrasi berikut (schema + RLS + seed checklist).

```sql
-- Profil user
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nama TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🌙',
  total_poin INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Item checklist
CREATE TABLE checklist_items (
  id SERIAL PRIMARY KEY,
  kategori TEXT NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  deskripsi TEXT,
  poin INTEGER DEFAULT 10,
  icon TEXT,
  urutan INTEGER DEFAULT 0
);

-- Progress harian
CREATE TABLE daily_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  hari_ke INTEGER NOT NULL,
  item_id INTEGER REFERENCES checklist_items(id),
  selesai BOOLEAN DEFAULT FALSE,
  waktu_selesai TIMESTAMP,
  catatan TEXT,
  UNIQUE(user_id, hari_ke, item_id)
);

-- RLS Policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lihat semua profil" ON profiles FOR SELECT USING (true);
CREATE POLICY "Edit profil sendiri" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Lihat semua progress" ON daily_progress FOR SELECT USING (true);
CREATE POLICY "Edit progress sendiri" ON daily_progress FOR ALL USING (auth.uid() = user_id);

-- Seed data checklist
INSERT INTO checklist_items (kategori, nama_kegiatan, deskripsi, poin, icon) VALUES
('Ibadah Wajib','Sahur','Makan sahur sebelum imsak',15,'🌅'),
('Ibadah Wajib','Sholat Subuh','Sholat Subuh tepat waktu',20,'🕌'),
('Ibadah Wajib','Sholat Dzuhur','Sholat Dzuhur tepat waktu',15,'🕌'),
('Ibadah Wajib','Sholat Ashar','Sholat Ashar tepat waktu',15,'🕌'),
('Ibadah Wajib','Buka Puasa','Buka puasa tepat waktu',15,'🍽️'),
('Ibadah Wajib','Sholat Maghrib','Sholat Maghrib tepat waktu',15,'🌇'),
('Ibadah Wajib','Sholat Isya','Sholat Isya tepat waktu',15,'🌙'),
('Ibadah Sunnah','Sholat Tarawih','8 atau 20 rakaat',30,'🌟'),
('Ibadah Sunnah','Tadarus Al-Quran','Baca Al-Quran minimal 1 halaman',25,'📖'),
('Ibadah Sunnah','Dzikir Pagi','Dzikir pagi setelah Subuh',20,'📿'),
('Ibadah Sunnah','Dzikir Sore','Dzikir sore setelah Ashar',20,'📿'),
('Ibadah Sunnah','Sholat Dhuha','Minimal 2 rakaat',25,'☀️'),
('Ibadah Sunnah','Sedekah','Bersedekah hari ini',30,'💝'),
('Produktivitas','Olahraga Ringan','Minimal 15 menit',20,'🏃'),
('Produktivitas','Belajar/Baca Buku','Minimal 30 menit',20,'📚'),
('Produktivitas','Minum Air Cukup','8 gelas di luar waktu puasa',15,'💧'),
('Produktivitas','Batasi Sosmed','Maksimal 1 jam per hari',25,'📵'),
('Produktivitas','Tidur Teratur','Tidur sebelum jam 11 malam',15,'😴'),
('Kebersamaan','Kirim Doa/Pesan ke Pasangan','Doa atau semangat untuk pasangan',20,'💌'),
('Kebersamaan','Buka Bersama','Virtual atau fisik',35,'❤️'),
('Kebersamaan','Sahur Bersama','Virtual atau fisik',30,'🌙'),
('Self Care','Mood Positif','Jaga pikiran tetap positif',15,'😊'),
('Self Care','Tidak Marah-Marah','Kontrol emosi sepanjang hari',25,'🧘'),
('Self Care','Bersyukur','Catat 3 hal yang disyukuri',20,'🙏');
```
y
## 3) Cara isi SUPABASE_URL & SUPABASE_ANON_KEY

- Edit file [supabase-config.js](file:///c:/Users/KingFaisal/Downloads/ceklis%20aa%20neng/ramadhan-anti-mager-club/assets/js/supabase-config.js), lalu isi:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

## 4) Cara buat 2 akun di Supabase Auth (Neng & Aa)

- Supabase Dashboard → **Authentication → Users** → **Add user**.
- Buat 2 user: Neng dan Aa (email + password).
- Saat login, tombol “Masuk sebagai Neng/Aa” hanya untuk mengisi label peran di UI.

## 5) Cara fork repo & aktifkan GitHub Pages

- Fork repo ini ke akun GitHub kamu.
- Pastikan branch default adalah `main`, lalu push perubahanmu.
- GitHub → **Actions**: pastikan workflow [deploy.yml](file:///c:/Users/KingFaisal/Downloads/ceklis%20aa%20neng/ramadhan-anti-mager-club/.github/workflows/deploy.yml) berjalan sukses.
- GitHub → **Settings → Pages**:
  - Source: **Deploy from a branch**
  - Branch: `gh-pages` / `(root)`

## Jalankan di Browser

- Buka `index.html` (redirect ke login) atau langsung `login.html`.
