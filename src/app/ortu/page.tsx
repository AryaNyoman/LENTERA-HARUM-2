import Link from "next/link";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { anakKlaim } from "@/lib/ortu";
import { buka, type IsiAnak } from "@/lib/brankas";
import { hitungUsiaBulan, kelompokUsia } from "@/lib/anak";
import { lengkap, SYARAT_IDL } from "@/lib/vaksin";

/** Sapaan hangat: kata pertama nama, fallback "Bunda/Ayah" bila nama kosong. */
function sapaan(nama: string): string {
  const depan = nama.trim().split(/\s+/)[0];
  return depan ? `Halo, ${depan}` : "Halo, Bunda/Ayah";
}

/** Dashboard ORTU = statistik POSYANDU keseluruhan (posyandu tempat anak-anaknya),
 *  bukan cuma anak sendiri — sesuai keputusan pemilik. Angka = agregat tanpa nama. */
export default async function DashboardOrtu() {
  const user = await wajibUser("ORTU", "ADMIN");
  const anakku = await anakKlaim(user);
  const posyanduIds = [...new Set(anakku.map((a) => a.posyanduId))];
  const cache = await db.cacheDashboard.findFirst({ orderBy: { sinkronPada: "desc" } });

  const statistik: { label: string; total: number; bayi: number; baduta: number; idl: number }[] = [];
  for (const pid of posyanduIds) {
    const pos = await db.posyandu.findUnique({ where: { id: pid } });
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
      label: pos ? (pos.namaPosyandu ? `${pos.nama} (${pos.namaPosyandu})` : pos.nama) : `Posyandu ${pid}`,
      total, bayi, baduta, idl,
    });
  }

  let jadwalMendesak = 0;
  for (const a of anakku) {
    // dihitung ringan di halaman: apakah ada label "IDL belum" saja dipakai sbg sinyal pengingat
    if (!lengkap(a.isi.vaksin, SYARAT_IDL)) jadwalMendesak++;
  }

  return (
    <main className="min-h-[calc(100dvh-56px)] bg-titik-ortu pb-6">
      <div
        className="relative px-4 pb-7 pt-5 text-white"
        style={{ background: "linear-gradient(160deg,#e8704a,#f0906e)", "--scallop": "#f0906e" } as React.CSSProperties}
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="font-judul text-lg font-extrabold">{sapaan(user.nama)} 👋</h1>
          <p className="mt-0.5 text-xs text-white/90">
            Kondisi imunisasi di posyandu Si Kecil{cache ? " · + data SIMPUS" : ""}
          </p>
        </div>
      </div>
      <div className="scallop" style={{ "--scallop": "#f0906e" } as React.CSSProperties} />

      <div className="mx-auto -mt-1 max-w-3xl px-4">
        {anakku.length === 0 ? (
          <div className="pop rounded-[var(--r-kartu)] border-2 border-dashed border-[var(--garis-ortu)] bg-[var(--kartu)] p-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gambar/anak-perempuan.png" alt="" width={64} height={64} className="mx-auto" />
            <p className="mt-2 text-sm font-bold">Belum ada anak terhubung</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--teks-sekunder)]">
              Minta <b>kode QR</b> ke kader posyandu Anda, atau isi data anak sendiri.
              Setelah terhubung, dashboard posyandu tampil di sini.
            </p>
            <Link href="/ortu/anakku" className="btn3d btn3d-coral mt-3 inline-block px-4 py-2 text-xs">
              Buka Anakku
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {statistik.map((s) => (
              <section key={s.label} className="pop rounded-[var(--r-kartu)] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] p-4">
                <h2 className="font-judul text-sm font-extrabold text-[var(--coral-gelap)]">{s.label}</h2>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    { n: s.total, l: "Anak" },
                    { n: s.bayi, l: "Bayi 0–11" },
                    { n: s.baduta, l: "Baduta" },
                    { n: s.idl, l: "IDL ✓", hijau: true },
                  ].map((k) => (
                    <div key={k.l} className="rounded-2xl py-2" style={{ background: "var(--krem-input)" }}>
                      <p className="font-judul text-xl font-extrabold" style={{ color: k.hijau ? "var(--hijau-teks)" : "var(--coral-gelap)" }}>{k.n}</p>
                      <p className="text-[10px] font-bold text-[var(--teks-sekunder)]">{k.l}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {jadwalMendesak > 0 && (
              <Link
                href="/ortu/jadwal"
                className="pop flex items-center gap-3 rounded-[var(--r-kartu)] border-2 p-4"
                style={{ borderColor: "var(--kuning-border)", background: "var(--kuning-muda)" }}
              >
                <span style={{ display: "inline-block", animation: "wiggle 2s ease-in-out infinite" }}>🔔</span>
                <span className="text-xs" style={{ color: "var(--kuning-teks)" }}>
                  Ada jadwal imunisasi menunggu — <b>lihat Jadwal →</b>
                </span>
              </Link>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Link href="/ortu/anakku" className="rounded-2xl border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] py-3 text-center text-xs font-bold">
                👶<br />Anakku
              </Link>
              <Link href="/ortu/jadwal" className="rounded-2xl border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] py-3 text-center text-xs font-bold">
                📅<br />Jadwal
              </Link>
              <Link href="/ortu/tumbuh" className="rounded-2xl border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] py-3 text-center text-xs font-bold">
                📈<br />Tumbuh
              </Link>
            </div>

            <p className="rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-[11px] leading-relaxed text-[var(--teal-tua)]">
              {cache
                ? `Data SIMPUS terakhir ditarik ${cache.sinkronPada.toLocaleString("id-ID")}.`
                : "Cakupan resmi puskesmas (tarikan SIMPUS) akan tampil setelah sinkron aktif."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
