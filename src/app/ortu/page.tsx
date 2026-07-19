/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Kepala from "@/components/kepala";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { anakKlaim } from "@/lib/ortu";
import { buka, type IsiAnak } from "@/lib/brankas";
import { hitungUsiaBulan, kelompokUsia } from "@/lib/anak";
import { DOSIS_REGISTRY, UMUR_IDEAL, adaDosis, dosisTakBerlaku, lengkap, SYARAT_IDL } from "@/lib/vaksin";
import { formatWaktuIndo } from "@/lib/waktu";

/** Sapaan hangat: nama panggilan (lewati partikel Bali "Ni/I" → pakai kata terakhir),
 *  fallback "Bunda/Ayah" bila nama kosong. */
function sapaan(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return "Halo, Bunda/Ayah!";
  const depan = /^(ni|i)$/i.test(kata[0]) && kata.length > 1 ? kata[kata.length - 1] : kata[0];
  return `Halo, ${depan}!`;
}

function tambahBulanIso(iso: string, n: number): Date {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Tip harian dashboard ortu — berganti tiap hari (index = hari-ke-dalam-tahun % panjang). */
const TIPS = [
  "Minta kode QR ke kader untuk melihat progres imunisasi anakmu secara live!",
  "Anda juga bisa menambahkan anak lain di menu Anakku!",
  "Jangan lupa pantau selalu jadwal imunisasi Si Kecil ya!",
  "Menu Kalkulator bisa langsung menghitung jadwal — tinggal masukkan tanggal lahir Si Kecil 🧮",
  "Sudah diberikan di faskes lain? Catat sendiri lewat kartu imunisasi anak, kader akan memverifikasi 🟡",
];

function tipHariIni(): string {
  const awalTahun = new Date(new Date().getFullYear(), 0, 0);
  const hariKe = Math.floor((Date.now() - awalTahun.getTime()) / 86400000);
  return TIPS[hariKe % TIPS.length];
}

/** Dashboard ORTU = statistik POSYANDU keseluruhan (posyandu tempat anak-anaknya),
 *  bukan cuma anak sendiri — sesuai keputusan pemilik. Angka = agregat tanpa nama. */
export default async function DashboardOrtu() {
  const user = await wajibUser("ORTU", "ADMIN");
  const anakku = await anakKlaim(user);
  const posyanduIds = [...new Set(anakku.map((a) => a.posyanduId))];
  // Waktu tarikan SIMPUS terakhir = baris CACHE sinkron saja (kunci "puskesmas" /
  // "kelurahan:*" / "posyandu:*"). Tabel yang sama juga menyimpan baris pengaturan
  // (kunci "pengaturan:*", lihat src/lib/pengaturan.ts) yang BUKAN penanda tarikan —
  // tanpa saringan ini, admin menyimpan link Pojok Baca ikut menggeser waktu tarikan.
  const cache = await db.cacheDashboard.findFirst({
    where: { OR: [{ kunci: "puskesmas" }, { kunci: { startsWith: "kelurahan:" } }, { kunci: { startsWith: "posyandu:" } }] },
    orderBy: { sinkronPada: "desc" },
  });

  const statistik: { label: string; kelurahan: string; total: number; bayi: number; baduta: number; idl: number }[] = [];
  for (const pid of posyanduIds) {
    const pos = await db.posyandu.findUnique({ where: { id: pid }, include: { kelurahan: true } });
    const [simpus, baru] = await Promise.all([
      db.anakSimpus.findMany({ where: { posyanduId: pid } }),
      db.anakBaru.findMany({ where: { posyanduId: pid, status: { not: "MASUK_SIMPUS" } } }),
    ]);
    let total = 0, bayi = 0, baduta = 0, idl = 0;
    const now = new Date();
    for (const row of [...simpus, ...baru]) {
      try {
        const isi = buka<IsiAnak>({ iv: row.iv, tag: row.tag, data: row.data });
        total++;
        const u = kelompokUsia(hitungUsiaBulan(isi.tglLahir, now));
        if (u === "0-11") bayi++; else if (u === "12-24") baduta++;
        if (lengkap(isi.vaksin, SYARAT_IDL)) idl++;
      } catch { /* lewati data rusak */ }
    }
    statistik.push({
      label: pos ? `Posyandu ${pos.namaPosyandu || pos.nama}` : `Posyandu ${pid}`,
      kelurahan: pos ? pos.nama : "",
      total, bayi, baduta, idl,
    });
  }

  // Pengingat: dosis belum-diterima yang jatuh temponya paling awal (paling terlambat).
  const hariIni = new Date(); hariIni.setHours(0, 0, 0, 0);
  let pengingat: { anak: string; dosis: string; telat: number } | null = null;
  for (const a of anakku) {
    for (const d of DOSIS_REGISTRY) {
      if (dosisTakBerlaku(d.kode, a.isi.vaksin) || adaDosis(a.isi.vaksin, d.kode)) continue;
      const jt = tambahBulanIso(a.isi.tglLahir, UMUR_IDEAL[d.kode] ?? 0);
      const telat = Math.round((hariIni.getTime() - jt.getTime()) / 86400000);
      if (telat > 0 && (!pengingat || telat > pengingat.telat)) {
        pengingat = { anak: a.isi.nama.split(/\s+/).slice(0, 2).join(" "), dosis: d.nama, telat };
      }
    }
  }

  return (
    <main className="pb-4">
      <div
        className="relative overflow-hidden px-4 pb-6 pt-3.5"
        style={{ background: "linear-gradient(160deg,#e8704a,#f0906e)" }}
      >
        <div
          className="absolute right-[70px] top-3.5 h-[26px] w-[26px] rounded-full"
          style={{ background: "rgba(255,244,214,.5)", animation: "floaty 6s ease-in-out infinite" }}
        />
        <div
          className="absolute right-[26px] top-11 h-10 w-10 rounded-full"
          style={{ background: "rgba(255,244,214,.35)", animation: "floaty 8s ease-in-out infinite" }}
        />
        <div className="relative mx-auto max-w-md">
          <Kepala user={user} />
          <div className="mt-3 flex items-center gap-3">
            <div className="pop min-w-0 flex-1">
              <h1 className="font-judul text-[23px] font-bold leading-tight text-white">{sapaan(user.nama)} 🧡</h1>
              <p className="mt-0.5 text-xs font-semibold text-white/90">Semoga Si Kecil sehat &amp; ceria hari ini</p>
            </div>
            <img
              src="/gambar/anak-laki.png"
              alt=""
              width={70}
              height={70}
              className="h-[70px] w-[70px] shrink-0 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,.18)]"
              style={{ animation: "floaty 5.5s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
      <div className="scallop" style={{ "--scallop": "#f0906e" } as React.CSSProperties} />

      <div className="mx-auto max-w-md px-4 pt-2.5">
        {anakku.length === 0 ? (
          <div className="pop rounded-[26px] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] p-6 text-center">
            <img
              src="/gambar/bayi-duduk.png" alt="" width={88} height={88}
              className="mx-auto h-[88px] w-[88px] object-contain"
              style={{ animation: "floaty 5.5s ease-in-out infinite" }}
            />
            <p className="font-judul mt-2 text-[17px] font-bold text-[var(--coral-gelap)]">Belum ada anak di sini</p>
            <p className="mt-1 text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
              Hubungkan Si Kecil dulu lewat menu <b>Anakku</b> — isi sendiri atau pakai kode QR dari kader.
            </p>
            <Link href="/ortu/anakku" prefetch={false} className="btn3d btn3d-coral mt-3.5 inline-flex h-11 items-center rounded-[14px] px-5 text-sm">
              Buka Anakku
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {statistik.map((s) => (
              <section key={s.label} className="pop rounded-[22px] border-2 border-[var(--coral-pastel)] bg-[var(--kartu)] px-4 py-3.5">
                <h2 className="font-judul mb-2.5 text-sm font-bold text-[var(--coral-gelap)]">
                  🏡 {s.label}{s.kelurahan ? ` — ${s.kelurahan}` : ""}
                </h2>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { n: s.total, l: "ANAK" },
                    { n: s.bayi, l: "BAYI" },
                    { n: s.baduta, l: "BADUTA" },
                    { n: s.idl, l: "IDL ✓", hijau: true },
                  ].map((k) => (
                    <div key={k.l} className="rounded-2xl px-0.5 py-2" style={{ background: k.hijau ? "var(--hijau-muda)" : "var(--coral-muda)" }}>
                      <p className="font-judul text-[21px] font-bold leading-none" style={{ color: k.hijau ? "var(--hijau-teks)" : "#d95f38" }}>{k.n}</p>
                      <p className="mt-0.5 text-[9px] font-extrabold text-[var(--abu)]">{k.l}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {pengingat && (
              <Link
                href="/ortu/jadwal"
                prefetch={false}
                className="pop pop-1 flex items-center gap-3 rounded-[22px] border-2 bg-[var(--kartu)] px-3.5 py-3 transition-transform active:scale-[.97]"
                style={{ borderColor: "var(--kuning-pastel)" }}
              >
                <span
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl text-[22px]"
                  style={{ background: "var(--kuning-muda)", animation: "wiggle 2.2s ease-in-out infinite" }}
                >
                  ⏰
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-judul block text-[13.5px] font-bold" style={{ color: "var(--kuning-teks)" }}>
                    Jangan lupa: {pengingat.dosis}
                  </span>
                  <span className="block text-[11px] font-semibold leading-snug text-[var(--teks-sekunder)]">
                    {pengingat.anak} · terlewat {pengingat.telat} hari — masih bisa dikejar kok!
                  </span>
                </span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#c9911d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            )}

            <div className="pop pop-2 grid grid-cols-3 gap-2">
              {[
                { href: "/ortu/jadwal", e: "📅", l: "Jadwal" },
                { href: "/ortu/kalkulator", e: "🧮", l: "Kalkulator" },
                { href: "/ortu/panduan", e: "📖", l: "Panduan" },
              ].map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  prefetch={false}
                  className="rounded-[20px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-1.5 py-3 text-center transition-transform active:scale-[.92]"
                >
                  <span className="block text-[22px]">{p.e}</span>
                  <span className="font-judul mt-0.5 block text-[11.5px] font-bold text-[var(--teks-3)]">{p.l}</span>
                </Link>
              ))}
            </div>

            <div className="pop pop-3 rounded-2xl border-2 px-3.5 py-2.5" style={{ borderColor: "var(--kuning-pastel)", background: "var(--kartu)" }}>
              <p className="font-judul mb-0.5 text-[10.5px] font-bold" style={{ color: "var(--kuning-teks)" }}>💡 Tips</p>
              <p className="text-[10.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">{tipHariIni()}</p>
            </div>

            <p className="pop pop-4 rounded-2xl bg-[var(--teal-muda)] px-3.5 py-2.5 text-[10.5px] font-semibold leading-relaxed text-[var(--teal-tua)]">
              {cache
                ? `Data SIMPUS terakhir ditarik ${formatWaktuIndo(cache.sinkronPada)} 💚`
                : "Cakupan resmi puskesmas tampil setelah data SIMPUS ditarik petugas 💚"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
