import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { binaanIds } from "@/lib/anak";
import { isiUntukEdit } from "@/lib/anak-actions";
import FormAnak from "./form";

export default async function AnakBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; galat?: string }>;
}) {
  const user = await wajibUser("KADER", "ADMIN");
  const { ref, galat } = await searchParams;

  const ids = await binaanIds(user);
  const posyandu = await db.posyandu.findMany({
    where: { id: { in: ids }, aktif: true },
    include: { kelurahan: true },
    orderBy: { id: "asc" },
  });

  let idEdit: number | undefined;
  let awal: Awaited<ReturnType<typeof isiUntukEdit>> = null;
  const m = ref ? /^b:(\d+)$/.exec(ref) : null;
  if (m) {
    idEdit = Number(m[1]);
    awal = await isiUntukEdit(idEdit);
    if (!awal) notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <Link
        href={idEdit ? `/kader/anak/b:${idEdit}` : "/kader/daftar-bayi"}
        className="text-xs font-bold text-[var(--teks-sekunder)]"
      >
        ← Kembali
      </Link>
      <h1 className="mt-2 mb-4 text-lg font-extrabold text-[var(--teal-tua)]">
        {idEdit ? "Edit Anak" : "Daftarkan Anak Baru"}
      </h1>
      <FormAnak
        posyandu={posyandu.map((p) => ({
          id: p.id,
          label: p.namaPosyandu ? `${p.nama} (${p.namaPosyandu})` : p.nama,
          kelurahan: p.kelurahan.nama,
        }))}
        idEdit={idEdit}
        awal={awal ?? undefined}
        galat={galat}
      />
    </main>
  );
}
