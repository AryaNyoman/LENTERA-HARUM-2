# SIMPUS-POSYANDU

Portal terpadu **kader posyandu & orang tua** — imunisasi + tumbuh kembang anak.
Puskesmas Cakranegara, Mataram, NTB. Satu website; fungsi mengikuti peran login
(**Admin / Kader / Orang tua**). Penerus gabungan app *SIMPUS-IMUN Kader* dan *IMUN-KU*.

## Menjalankan (pengembangan)

```bash
npm install
cp .env.example .env   # isi KUNCI_SERVER (petunjuk di dalam file)
npm run db:push        # siapkan database dev (SQLite)
npm run db:seed        # akun awal & data contoh
npm run dev            # buka http://localhost:3000
```

## Hubungan dengan sistem lain

- **SIMPUS-IMUN petugas** = sumber kebenaran. Website ini membaca ringkasannya lewat
  sinkron terjadwal, dan menyetor anak baru lewat **export Excel** berformat persis
  menu *Impor Data Anak* SIMPUS.
- Dokumentasi arsitektur & aturan medis: lihat `CLAUDE.md`.
