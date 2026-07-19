import Link from "next/link";
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { labelUsia } from "@/lib/anak";
import { daftarVaksinAdmin } from "@/lib/vaksin-admin-actions";

export default async function AdminVaksinPage({
  searchParams,
}: {
  searchParams: Promise<{ posyanduId?: string; galat?: string; ok?: string }>;
}) {
  await wajibUser("ADMIN");
  const { posyanduId: raw, galat, ok } = await searchParams;
  const posyanduId = Number(raw) || 0;

  const kelurahan = await db.kelurahan.findMany({
    orderBy: { urutan: "asc" },
    include: { posyandu: { where: { aktif: true }, orderBy: { id: "asc" } } },
  });
  const posyanduAktif = posyanduId
    ? kelurahan.flatMap((k) => k.posyandu).find((p) => p.id === posyanduId)
    : undefined;
  const daftar = posyanduAktif ? await daftarVaksinAdmin(posyanduAktif.id) : [];

  return (
    <main>
      <KepalaHalaman judul="Isi Tanggal Vaksin 💉" sub="hanya anak belum masuk SIMPUS" balik="/admin" />
      <div className="mx-auto max-w-md px-4 pb-8 pt-3.5">
        {galat && (
          <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">{galat}</p>
        )}
        {ok && (
          <p className="mb-3 rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-xs font-bold text-[var(--teal-tua)]">{ok}</p>
        )}
        <p className="rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-[10.5px] font-semibold leading-relaxed text-[var(--teal-tua)]">
          Anak yang sudah masuk SIMPUS diisi lewat SIMPUS — daftar di bawah hanya anak draf/sudah disetor yang belum tercocok.
        </p>

        {/* Selalu terlihat (tak bergantung posyandu terpilih) — /kader/export sudah
            admin-compatible lewat binaanIds (ADMIN → semua posyandu), jadi tautkan langsung. */}
        <Link
          href="/kader/export"
          prefetch={false}
          className="btn3d btn3d-teal mt-3 flex h-11 items-center justify-center rounded-[14px] text-[13px]"
          style={{ boxShadow: "0 4px 0 var(--teal-tua)" }}
        >
          📤 Export Semua Anak Siap Disetor
        </Link>
        <p className="mt-1.5 text-center text-[10px] font-semibold text-[var(--abu)]">
          Mengekspor SEMUA posyandu (bukan cuma yang sedang dipilih), sesuai status setor terbaru.
        </p>

        <p className="font-judul mt-4 text-xs font-bold text-[var(--teks-3)]">Pilih posyandu</p>
        <div className="mt-1.5 flex flex-col gap-2">
          {kelurahan.map((k) => (
            <details key={k.id} open={posyanduAktif?.kelurahanId === k.id} className="group rounded-[16px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-2.5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[12.5px] font-bold text-[var(--teks-3)] [&::-webkit-details-marker]:hidden">
                <span className="truncate">{k.nama}</span>
                <span className="text-[10px] font-semibold text-[var(--abu)] group-open:hidden">▾</span>
                <span className="hidden text-[10px] font-semibold text-[var(--abu)] group-open:inline">▴</span>
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {k.posyandu.map((p) => {
                  const aktif = p.id === posyanduId;
                  return (
                    <Link
                      key={p.id}
                      href={`/admin/vaksin?posyanduId=${p.id}`}
                      prefetch={false}
                      className="font-judul rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                      style={
                        aktif
                          ? { background: "var(--teal)", color: "#fff" }
                          : { background: "#f0f5f2", color: "var(--teks-sekunder)" }
                      }
                    >
                      {p.namaPosyandu ? `${p.nama} (${p.namaPosyandu})` : p.nama}
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}
        </div>

        {posyanduAktif && (
          <section className="mt-4">
            <p className="font-judul text-sm font-bold text-[var(--teal-gelap)]">
              {posyanduAktif.namaPosyandu ? `${posyanduAktif.nama} (${posyanduAktif.namaPosyandu})` : posyanduAktif.nama}{" "}
              <span className="font-judul rounded-full bg-[var(--teal-muda)] px-2 py-0.5 text-[11px] font-bold text-[var(--teal-gelap)]">
                {daftar.length}
              </span>
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {daftar.length === 0 && (
                <p className="text-xs font-semibold text-[var(--teks-sekunder)]">
                  Belum ada anak draf/belum masuk SIMPUS di posyandu ini.
                </p>
              )}
              {daftar.map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/vaksin/${a.id}`}
                  prefetch={false}
                  className="pop flex items-center justify-between gap-2 rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-3 transition-transform active:scale-[.97]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{a.nama}</p>
                    <p className="truncate text-[11px] font-semibold text-[var(--abu)]">{labelUsia(a.usiaBulan)}</p>
                  </div>
                  <span className="font-judul shrink-0 text-[11px] font-bold text-[var(--teal-gelap)]">
                    {a.sudah}/{a.total} dosis
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
