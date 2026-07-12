/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import KepalaHalaman from "@/components/kepala-halaman";
import PilihAnak from "@/components/pilih-anak";
import { wajibUser } from "@/lib/sesi";
import { anakKlaim } from "@/lib/ortu";
import { hitungUsiaBulan, labelUsia } from "@/lib/anak";
import TumbuhBagian from "@/components/tumbuh-bagian";

/** Tab Tumbuh ORTU: kartu angka + form catat. Punya >1 anak? Pilih dulu lewat pil. */
export default async function TumbuhOrtu({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string; anak?: string }>;
}) {
  const user = await wajibUser("ORTU", "ADMIN");
  const { galat, anak: anakParam } = await searchParams;
  const daftar = await anakKlaim(user);
  const terpilih = daftar.find((a) => a.ref === anakParam) ?? daftar[0];

  return (
    <main>
      <KepalaHalaman judul="Tumbuh Kembang 📏" sub="catat BB · TB · lingkar kepala tiap bulan" peran="ortu" />

      <div className="mx-auto max-w-md px-4 pt-4">
        {galat && (
          <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">{galat}</p>
        )}

        {daftar.length === 0 && (
          <p className="pop rounded-[22px] border-[2.5px] border-dashed border-[#ead9c4] bg-[var(--kartu)] p-6 text-center text-sm font-semibold text-[var(--teks-sekunder)]">
            Hubungkan anak dulu di menu{" "}
            <Link href="/ortu/anakku" className="font-bold text-[var(--coral)]">Anakku</Link>.
          </p>
        )}

        {terpilih && (
          <>
            <PilihAnak daftar={daftar} aktifRef={terpilih.ref} dasar="/ortu/tumbuh" />
            <TumbuhBagian
              refAnak={terpilih.ref}
              jk={terpilih.isi.jk}
              balik={`/ortu/tumbuh?anak=${encodeURIComponent(terpilih.ref)}`}
              penuh
              kepala={
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: "linear-gradient(135deg,#fdf0e9,#fbe9dd)" }}>
                  <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--coral)] bg-white">
                    <img src={terpilih.isi.jk === "P" ? "/gambar/anak-perempuan.png" : "/gambar/anak-laki.png"} alt="" width={38} height={38} className="h-[38px] w-[38px] object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-judul text-base font-bold leading-tight">{terpilih.isi.nama}</p>
                    <p className="text-[11px] font-semibold text-[#8a6a5c]">{labelUsia(hitungUsiaBulan(terpilih.isi.tglLahir))}</p>
                  </div>
                </div>
              }
            />
          </>
        )}
      </div>
    </main>
  );
}
