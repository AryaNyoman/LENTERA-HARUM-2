/* eslint-disable @next/next/no-img-element */
import KepalaHalaman from "@/components/kepala-halaman";
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
  const user = await wajibUser("ORTU");
  const { galat } = await searchParams;

  const [posyandu, akun] = await Promise.all([
    db.posyandu.findMany({
      where: { aktif: true },
      include: { kelurahan: true },
      orderBy: { id: "asc" },
    }),
    db.user.findUnique({ where: { id: user.id }, include: { kelurahan: true } }),
  ]);
  // kelurahan dikunci ke domisili ortu; ortu lama (belum punya domisili) tetap bebas memilih
  const kunciKelurahan = akun?.kelurahan?.nama;

  return (
    <main>
      <KepalaHalaman judul="Tambah Anak Saya 👶" sub="kembali ke Anakku" balik="/ortu/anakku" peran="ortu" />
      <div className="mx-auto max-w-md px-4 pt-3.5">
        <div className="pop mb-3 flex items-center gap-2.5 rounded-[18px] border-2 border-[var(--coral-border)] bg-[var(--coral-muda)] px-3.5 py-3">
          <img src="/gambar/bayi-duduk.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
          <p className="text-[11px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
            Isi data Si Kecil &amp; pilih <b className="text-[var(--coral-gelap)]">posyandu tempat ia diperiksa</b>.
            Kader posyandu itu akan melihat &amp; memverifikasi datanya.
          </p>
        </div>
        <FormAnak
          posyandu={posyandu.map((p) => ({
            id: p.id,
            label: p.namaPosyandu ? `${p.nama} (${p.namaPosyandu})` : p.nama,
            kelurahan: p.kelurahan.nama,
          }))}
          galat={galat}
          action={simpanAnakOrtu}
          labelSimpan="Tambah anak saya 🧡"
          aksen="var(--coral)"
          aksenTua="var(--coral-gelap)"
          tema="ortu"
          kunciKelurahan={kunciKelurahan}
          namaOrtuTetap={user.nama}
          catatan={
            <>
              Anak akan berstatus <b>belum diverifikasi</b> sampai kader posyandu memeriksanya —
              biasanya saat kunjungan berikutnya.
            </>
          }
        />
      </div>
    </main>
  );
}
