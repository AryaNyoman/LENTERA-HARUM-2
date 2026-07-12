import Link from "next/link";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { simpanAnakOrtu } from "@/lib/anak-actions";
import FormAnak from "@/app/kader/anak-baru/form";

/** Orang tua menambah anaknya sendiri. Anak langsung terhubung ke akun ini (tanpa QR),
 *  ditandai "diisi ortu · belum diverifikasi" sampai kader posyandu memverifikasi. */
export default async function OrtuAnakBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  await wajibUser("ORTU");
  const { galat } = await searchParams;

  const posyandu = await db.posyandu.findMany({
    where: { aktif: true },
    include: { kelurahan: true },
    orderBy: { id: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <Link href="/ortu/anakku" className="text-xs font-bold text-[var(--teks-sekunder)]">
        ← Kembali
      </Link>
      <h1 className="font-judul mt-2 text-lg font-extrabold text-[var(--coral-gelap)]">Tambah Anak Saya 👶</h1>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-[var(--teks-sekunder)]">
        Isi data anak Anda. Pilih <b>posyandu</b> tempat anak diperiksa. Anak akan muncul di{" "}
        <b>Anakku</b> dan bisa dilihat kader posyandu untuk diverifikasi.
      </p>
      <FormAnak
        posyandu={posyandu.map((p) => ({
          id: p.id,
          label: p.namaPosyandu ? `${p.nama} (${p.namaPosyandu})` : p.nama,
          kelurahan: p.kelurahan.nama,
        }))}
        galat={galat}
        action={simpanAnakOrtu}
        labelSimpan="Tambah anak saya"
        aksen="var(--coral)"
        aksenTua="var(--coral-gelap)"
        catatan={
          <>
            Anak akan berstatus <b>belum diverifikasi</b> sampai kader posyandu memeriksanya.
          </>
        }
      />
    </main>
  );
}
