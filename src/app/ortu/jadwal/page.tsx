import { wajibUser } from "@/lib/sesi";
import { anakKlaim } from "@/lib/ortu";
import { hitungUsiaBulan, fmtTglId } from "@/lib/anak";
import { DOSIS_REGISTRY, UMUR_IDEAL, adaDosis, dosisTakBerlaku } from "@/lib/vaksin";

function tambahBulanIso(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function statusHari(isoJatuhTempo: string): { label: string; bg: string; fg: string } {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const beda = Math.round((new Date(isoJatuhTempo + "T00:00:00").getTime() - now.getTime()) / 86400000);
  if (beda < 0) return { label: `terlewat ${-beda} hari`, bg: "#fdecea", fg: "var(--merah)" };
  if (beda === 0) return { label: "hari ini 🎯", bg: "var(--teal-muda)", fg: "var(--teal-tua)" };
  if (beda <= 14) return { label: `${beda} hari lagi`, bg: "#fef7e0", fg: "#a16207" };
  return { label: `${beda} hari lagi`, bg: "var(--bg)", fg: "var(--teks-sekunder)" };
}

/** Jadwal ORTU: dosis yang BELUM diterima tiap anak, urut jatuh tempo. */
export default async function JadwalOrtu() {
  const user = await wajibUser("ORTU", "ADMIN");
  const daftar = await anakKlaim(user);

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Jadwal Imunisasi</h1>
      <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
        Dosis yang belum diterima Si Kecil — urut dari yang paling dekat.
      </p>

      {daftar.length === 0 && (
        <p className="mt-5 rounded-2xl border border-dashed border-[var(--garis)] bg-[var(--kartu)] p-6 text-center text-sm text-[var(--teks-sekunder)]">
          Hubungkan anak dulu di menu <b>Anakku</b>.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {daftar.map((a) => {
          const usia = hitungUsiaBulan(a.isi.tglLahir);
          const belum = DOSIS_REGISTRY
            .filter((d) => !dosisTakBerlaku(d.kode, a.isi.vaksin) && !adaDosis(a.isi.vaksin, d.kode))
            .map((d) => ({ d, jt: tambahBulanIso(a.isi.tglLahir, UMUR_IDEAL[d.kode] ?? 0) }))
            .sort((x, y) => x.jt.localeCompare(y.jt));
          return (
            <section key={a.ref} className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4">
              <h2 className="text-sm font-extrabold">{a.isi.nama}</h2>
              {belum.length === 0 ? (
                <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-[var(--hijau)]">
                  🎉 Semua dosis terjadwal sudah diterima!
                </p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {belum.map(({ d, jt }) => {
                    const st = statusHari(jt);
                    return (
                      <div key={d.kode} className="flex items-center justify-between gap-2 text-sm">
                        <span>
                          {d.nama}
                          <span className="ml-1 text-[11px] text-[var(--teks-sekunder)]">
                            (usia {UMUR_IDEAL[d.kode] ?? 0} bln{usia > (UMUR_IDEAL[d.kode] ?? 0) ? "" : ""})
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-[var(--teks-sekunder)]">{fmtTglId(jt)}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: st.bg, color: st.fg }}>
                            {st.label}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {daftar.length > 0 && (
        <p className="mt-3 rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-[11px] leading-relaxed text-[var(--teal-tua)]">
          Jadwal = usia ideal. Bila terlewat jangan panik — datangi posyandu/puskesmas, ada jadwal
          kejar. Bawa buku KIA setiap kunjungan.
        </p>
      )}
    </main>
  );
}
