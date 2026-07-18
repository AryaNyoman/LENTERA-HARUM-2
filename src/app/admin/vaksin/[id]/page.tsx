/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { hitungUsiaBulan, labelUsia, fmtTglId } from "@/lib/anak";
import { ambilVaksinAdmin, simpanVaksinAdmin } from "@/lib/vaksin-admin-actions";
import DosisFormAdmin from "./dosis-form";

export default async function VaksinAdminDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ galat?: string; ok?: string }>;
}) {
  await wajibUser("ADMIN");
  const { id: idRaw } = await params;
  const { galat, ok } = await searchParams;
  const id = Number(idRaw) || 0;
  const anak = await ambilVaksinAdmin(id);
  if (!anak) notFound();

  const usia = hitungUsiaBulan(anak.tglLahir);

  return (
    <main>
      <KepalaHalaman judul="Isi Tanggal Vaksin" sub={anak.posyanduLabel} balik="/admin/vaksin" />
      <div className="mx-auto max-w-md px-4 pb-8 pt-3.5">
        {galat && (
          <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">{galat}</p>
        )}
        {ok && (
          <p className="mb-3 rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-xs font-bold text-[var(--teal-tua)]">{ok}</p>
        )}

        <section className="pop flex items-center gap-3 rounded-[22px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={anak.jk === "P" ? { background: "var(--coral-muda)", border: "3px solid var(--coral)" } : { background: "var(--teal-muda)", border: "3px solid var(--teal)" }}
          >
            <img src={anak.jk === "P" ? "/gambar/anak-perempuan.png" : "/gambar/anak-laki.png"} alt="" width={38} height={38} className="h-[38px] w-[38px] object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-judul truncate text-base font-bold">{anak.nama}</p>
            <p className="truncate text-[11px] font-semibold text-[var(--teks-sekunder)]">
              {anak.jk === "P" ? "Perempuan" : "Laki-laki"} · lahir {fmtTglId(anak.tglLahir)} · {labelUsia(usia)}
            </p>
          </div>
        </section>
        <p className="mt-2 rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-[10.5px] font-semibold leading-relaxed text-[var(--teal-tua)]">
          Identitas diedit lewat menu Kader/Ortu — di sini hanya tanggal dosis.
        </p>

        <DosisFormAdmin id={anak.id} tglLahir={anak.tglLahir} vaksin={anak.vaksin} action={simpanVaksinAdmin} />
      </div>
    </main>
  );
}
