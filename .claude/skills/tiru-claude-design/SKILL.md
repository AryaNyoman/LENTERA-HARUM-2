---
name: tiru-claude-design
description: Use when the user asks to imitate, apply, or implement a design they made in Claude Design (claude.ai/design) — e.g. "terapkan design dari claude-design", "tiru 100% mirip", a claude.ai/design URL, a handoff ZIP/bundle, or .dc.html files — including when a previous implementation is being corrected for not matching the design.
---

# Tiru Claude Design

## Overview

Meniru desain buatan user di Claude Design sampai benar-benar cocok.

**Prinsip inti: untuk urusan VISUAL, satu-satunya sumber kebenaran adalah file mockup `.dc.html` — dibaca PENUH. Dokumen teks (HANDOFF.md dsb.) hanya untuk batasan teknis & konteks, BUKAN acuan tampilan.**

Insiden nyata (SIMPUS-POSYANDU, Jul 2026): implementasi dikerjakan dari HANDOFF.md saja → 22 halaman meleset (aset PNG tak terpakai, header salah posisi, judul salah, kartu salah bentuk) → seluruhnya dibangun ulang.

## Aturan gerbang — SEBELUM menulis kode apa pun

**Tanpa file mockup `.dc.html` di tangan, DILARANG mengimplementasi.** URL claude.ai/design tidak bisa dibuka tanpa login user; dokumen teks selalu lebih miskin detail daripada mockup-nya.

Kalau user hanya memberi URL / dokumen teks / screenshot → **berhenti, minta bundle dulu**: "Tolong export handoff ZIP-nya dari claude.ai/design (menu Share/Download), atau kirim file `.dc.html` + folder asetnya."

**No exceptions:**
- Jangan "kerjakan dulu dari teks, nanti disesuaikan" — itu persis insiden 22 halaman.
- Jangan mengarang warna/font/ukuran "yang kira-kira cocok" untuk menambal detail yang tak ada.
- Jangan anggap HANDOFF.md yang menyebut dirinya "resep utama" sebagai pengganti mockup.
- Screenshot dari user = pelengkap, bukan pengganti file mockup.
- Menemukan bundle sendiri di disk (folder lama, Downloads)? Konfirmasi dulu ke user bahwa itu memang bundle yang dimaksud & versi TERBARU — desain bisa saja sudah direvisi.

## Urutan kerja (setelah bundle ada)

1. **Baca file pemandu dulu** (README / "Mulai di Sini") — ia menunjuk file mana acuan visual utama vs prototipe interaktif vs handoff fitur.
2. **Baca SEMUA `.dc.html` acuan sampai habis**, chunk demi chunk kalau besar (150KB+ tetap dibaca penuh). Berhenti karena "sudah kebayang" = sumber insiden.
3. **Inventaris aset**: bandingkan folder `gambar/` bundle dengan `public/` proyek; salin yang kurang; catat tiap gambar dipakai di layar mana + ukurannya.
4. **Per layar (id `b-*` dst.), tulis daftar-cocok dari mockup**: struktur blok (mis. header DI DALAM hero vs terpisah), warna hex persis, ukuran px (radius, tinggi tombol, ikon), copy/teks persis termasuk emoji, stiker/badge + derajat rotasinya, animasi, lebar kolom (biasanya 390px). Implementasi = melunasi daftar itu, bukan menginterpretasi.
5. **Dokumen teks dipakai untuk BATASAN**: aturan "jangan ubah lib/aturan medis/nama field", urutan commit, cara verifikasi. Konflik soal tampilan → mockup menang; soal batasan teknis → teks menang.
6. **Verifikasi sebelum klaim selesai**: jalankan app, screenshot TIAP layar pada lebar mockup (390px) + 320px via Playwright MCP, bandingkan berdampingan dengan mockup-nya. Tanpa ini, "sudah mirip" cuma tebakan.
7. **Deviasi sadar** (data nyata tak muat pola mockup, aksesibilitas, gender tak diketahui, dsb.) → putuskan yang terbaik, lalu **laporkan daftar deviasinya** ke user. Jangan diam-diam.

## Rasionalisasi vs realita

| Rasionalisasi | Realita |
|---|---|
| "HANDOFF.md = resep utama, mockup cuma pelengkap" | Teks tak memuat hex, px, aset, posisi header. Mockup-lah desainnya. |
| "Kerjakan dulu dari brief, nanti disesuaikan" | Menghasilkan tebakan yang harus dibongkar total. Minta bundle = 1 kalimat. |
| "Detail yang hilang kuisi dengan judgment desainku" | User minta MENIRU desain MEREKA, bukan desainmu. |
| "File mockup besar, cukup skim" | Yang meleset selalu detail yang tak di-skim. |
| "Aset gambar urusan nanti" | Ilustrasi = separuh rasa desain. Inventaris di langkah 3, bukan belakangan. |
| "Sudah mirip kok" (tanpa pembanding) | Klaim cocok tanpa screenshot berdampingan = tebakan. |

## Red flags — berhenti, kembali ke urutan

- Menulis kode padahal belum ada satu pun `.dc.html` di workspace.
- Menulis kode padahal `.dc.html` ada tapi belum dibaca habis.
- Tidak bisa menyebut isi folder `gambar/` bundle.
- Mengetik copy/judul "yang kira-kira sama" alih-alih menyalin persis.
- Hendak bilang "selesai, 100% sesuai" tanpa screenshot pembanding per layar.
