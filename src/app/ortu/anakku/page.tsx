import Link from "next/link";
import { wajibUser } from "@/lib/sesi";
import { anakKlaim } from "@/lib/ortu";
import { hitungUsiaBulan, labelUsia } from "@/lib/anak";
import { DOSIS_REGISTRY, adaDosis, dosisTakBerlaku, lengkap, SYARAT_IDL } from "@/lib/vaksin";

export default async function Anakku() {
  const user = await wajibUser("ORTU", "ADMIN");
  const daftar = await anakKlaim(user);
  const now = new Date();

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Anakku</h1>
          <p className="text-xs text-[var(--teks-sekunder)]">{daftar.length} anak terhubung</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/ortu/anak-baru" className="rounded-xl bg-[var(--coral)] px-3 py-2 text-xs font-bold text-white">
            + Tambah anak
          </Link>
          <Link href="/ortu/klaim" className="rounded-xl border border-[var(--coral)] px-3 py-2 text-xs font-bold text-[var(--coral)]">
            Hubungkan (QR)
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {daftar.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--garis)] bg-[var(--kartu)] p-6 text-center text-sm text-[var(--teks-sekunder)]">
            Belum ada anak. Tekan <b>+ Tambah anak</b> untuk mengisi sendiri, atau{" "}
            <b>Hubungkan (QR)</b> dengan kode dari kader posyandu.
          </div>
        )}
        {daftar.map((a) => {
          const usia = hitungUsiaBulan(a.isi.tglLahir, now);
          const relevan = DOSIS_REGISTRY.filter((d) => !dosisTakBerlaku(d.kode, a.isi.vaksin));
          const sudah = relevan.filter((d) => adaDosis(a.isi.vaksin, d.kode)).length;
          const persen = Math.round((sudah / relevan.length) * 100);
          const idl = lengkap(a.isi.vaksin, SYARAT_IDL);
          return (
            <Link
              key={a.ref}
              href={`/ortu/anak/${a.ref}`}
              className="block rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.isi.jk === "P" ? "/gambar/anak-perempuan.png" : "/gambar/anak-laki.png"}
                  alt="" width={48} height={48}
                  className="h-12 w-12 shrink-0 rounded-xl bg-[var(--bg)] object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{a.isi.nama}</p>
                  <p className="text-[11px] text-[var(--teks-sekunder)]">
                    {labelUsia(usia)} · {a.posyanduLabel}
                  </p>
                </div>
                {idl && (
                  <span className="shrink-0 rounded bg-green-50 px-2 py-0.5 text-[11px] font-bold text-[var(--hijau)]">
                    IDL ✓
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-bold text-[var(--teks-sekunder)]">
                  <span>Imunisasi {sudah}/{relevan.length} dosis</span>
                  <span>{persen}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${persen}%`, background: persen >= 100 ? "var(--hijau)" : "var(--coral)" }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
