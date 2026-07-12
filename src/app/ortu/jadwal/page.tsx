/* eslint-disable @next/next/no-img-element */
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { anakKlaim } from "@/lib/ortu";
import { DOSIS_REGISTRY, UMUR_IDEAL, adaDosis, dosisTakBerlaku } from "@/lib/vaksin";

const BULAN_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function tambahBulanIso(iso: string, n: number): Date {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d;
}
function fmtPendek(d: Date): string {
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

interface Kunjungan { um: number; jt: Date; dosis: string[] }

/** Jadwal ORTU: dosis yang BELUM diterima, dikelompokkan per kunjungan usia (mockup b-ojadwal). */
export default async function JadwalOrtu() {
  const user = await wajibUser("ORTU", "ADMIN");
  const daftar = await anakKlaim(user);
  const now = new Date(); now.setHours(0, 0, 0, 0);

  const perAnak = daftar.map((a) => {
    const kunjungan: Kunjungan[] = [];
    for (const d of DOSIS_REGISTRY) {
      if (dosisTakBerlaku(d.kode, a.isi.vaksin) || adaDosis(a.isi.vaksin, d.kode)) continue;
      const um = UMUR_IDEAL[d.kode] ?? 0;
      const k = kunjungan.find((x) => x.um === um);
      if (k) k.dosis.push(d.nama);
      else kunjungan.push({ um, jt: tambahBulanIso(a.isi.tglLahir, um), dosis: [d.nama] });
    }
    kunjungan.sort((x, y) => x.jt.getTime() - y.jt.getTime());
    return { anak: a, kunjungan, total: kunjungan.reduce((n, k) => n + k.dosis.length, 0) };
  });

  const sub =
    daftar.length === 1
      ? `${daftar[0].isi.nama.split(/\s+/).slice(0, 2).join(" ")} · dosis yang belum diterima`
      : "dosis yang belum diterima Si Kecil";

  return (
    <main>
      <KepalaHalaman judul="Jadwal Imunisasi 📅" sub={sub} peran="ortu" />

      <div className="mx-auto max-w-md px-4 pt-4">
        {daftar.length === 0 && (
          <p className="pop rounded-[22px] border-[2.5px] border-dashed border-[#ead9c4] bg-[var(--kartu)] p-6 text-center text-sm font-semibold text-[var(--teks-sekunder)]">
            Hubungkan anak dulu di menu <b>Anakku</b>.
          </p>
        )}

        {perAnak.map(({ anak, kunjungan, total }) => {
          const terlewat = kunjungan.filter((k) => k.jt.getTime() < now.getTime());
          const mendatang = kunjungan.filter((k) => k.jt.getTime() >= now.getTime());
          const pertamaMendatang = mendatang[0];
          const sisaMendatang = mendatang.slice(1);

          return (
            <section key={anak.ref} className="mb-5">
              {daftar.length > 1 && (
                <h2 className="font-judul mb-2 text-sm font-bold text-[var(--coral-gelap)]">{anak.isi.nama}</h2>
              )}

              {total === 0 ? (
                <p className="pop rounded-[20px] bg-[var(--hijau-muda)] px-4 py-3 text-xs font-bold text-[var(--hijau-teks)]">
                  🎉 Semua dosis terjadwal sudah diterima!
                </p>
              ) : (
                <>
                  <div className="pop flex items-center gap-2.5 rounded-[20px] border-2 bg-[var(--kartu)] px-3.5 py-3" style={{ borderColor: "var(--kuning-pastel)" }}>
                    <img src="/gambar/edukasi-demam.png" alt="" width={42} height={42} className="h-[42px] w-[42px] shrink-0 object-contain" />
                    <p className="text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
                      <b style={{ color: "var(--kuning-teks)" }}>{total} dosis menunggu — santai, bisa dikejar!</b>{" "}
                      Datang ke posyandu &amp; bawa buku KIA ya 🤗
                    </p>
                  </div>

                  <div className="mt-3.5 flex flex-col gap-3">
                    {terlewat.map((k, i) => {
                      const telat = Math.round((now.getTime() - k.jt.getTime()) / 86400000);
                      const gaya =
                        telat <= 14
                          ? { border: "var(--kuning-border)", stikerBg: "var(--kuning)", stikerFg: "var(--kuning-gelap)", kotakBg: "var(--kuning-muda)", fg: "var(--kuning-teks)", teks: `baru terlewat ${telat} hari!`, wiggle: true }
                          : telat <= 45
                            ? { border: "var(--coral-border)", stikerBg: "var(--coral)", stikerFg: "#fff", kotakBg: "var(--coral-muda)", fg: "var(--coral-gelap)", teks: `terlewat ${telat} hari`, wiggle: false }
                            : { border: "var(--merah-border)", stikerBg: "var(--merah)", stikerFg: "#fff", kotakBg: "var(--merah-muda)", fg: "var(--merah-teks)", teks: `terlewat ${telat} hari`, wiggle: false };
                      return (
                        <div
                          key={k.um}
                          className={`pop pop-${Math.min(i + 1, 6)} relative mt-1 rounded-[22px] border-2 bg-[var(--kartu)] px-3.5 py-3`}
                          style={{ borderColor: gaya.border }}
                        >
                          <span
                            className="font-judul absolute -top-2.5 left-3.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                            style={{
                              background: gaya.stikerBg, color: gaya.stikerFg,
                              transform: i % 2 === 0 ? "rotate(-1.5deg)" : "rotate(1.5deg)",
                              animation: gaya.wiggle ? "wiggle 2.4s ease-in-out infinite" : undefined,
                            }}
                          >
                            {gaya.teks}
                          </span>
                          <div className="mt-1 flex items-center gap-2.5">
                            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl" style={{ background: gaya.kotakBg, color: gaya.fg }}>
                              <span className="font-judul text-[15px] font-bold leading-none">{k.jt.getDate()}</span>
                              <span className="text-[8px] font-extrabold uppercase">{BULAN_ID[k.jt.getMonth()]}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-judul text-[13px] font-bold" style={{ color: gaya.fg }}>
                                {k.um === 0 ? "Saat lahir" : `Usia ${k.um} bulan`} · {k.dosis.length} dosis
                              </p>
                              <p className="text-[11px] font-semibold leading-snug text-[var(--teks-sekunder)]">{k.dosis.join(" · ")}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {pertamaMendatang && (
                      <div className="pop rounded-[22px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--teal-muda)] text-[var(--teal-gelap)]">
                            <span className="font-judul text-[15px] font-bold leading-none">{pertamaMendatang.jt.getDate()}</span>
                            <span className="text-[8px] font-extrabold uppercase">{BULAN_ID[pertamaMendatang.jt.getMonth()]}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-judul text-[13px] font-bold text-[var(--teal-gelap)]">
                              {pertamaMendatang.um === 0 ? "Saat lahir" : `Usia ${pertamaMendatang.um} bulan`} ·{" "}
                              {Math.round((pertamaMendatang.jt.getTime() - now.getTime()) / 86400000)} hari lagi ⏳
                            </p>
                            <p className="text-[11px] font-semibold leading-snug text-[var(--teks-sekunder)]">
                              {pertamaMendatang.dosis.join(" · ")}
                            </p>
                          </div>
                        </div>
                        {sisaMendatang.length > 0 && (
                          <p className="mt-2 border-t-[1.5px] border-dashed border-[#e2ece7] pt-2 text-[10.5px] font-semibold text-[var(--abu)]">
                            Selanjutnya: {sisaMendatang.map((k) => `${k.dosis.join(" & ")} (${fmtPendek(k.jt)})`).join(" · ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          );
        })}

        {daftar.length > 0 && (
          <div className="pop flex items-start gap-2.5 rounded-[18px] bg-[var(--teal-muda)] px-3.5 py-2.5">
            <span className="shrink-0 text-[15px]">📘</span>
            <p className="text-[10.5px] font-semibold leading-relaxed text-[var(--teal-tua)]">
              Jadwal = usia ideal. Terlewat bukan berarti gagal — ada jadwal kejar di posyandu/puskesmas.
              Selalu bawa buku KIA ya.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
