import KepalaHalaman from "@/components/kepala-halaman";
import PanduanKonten from "@/components/panduan-konten";

/** Panduan ORTU = konten sama dengan panduan kader (jadwal, catatan NTB, edukasi),
 *  aksen warna coral. */
export default function PanduanOrtu() {
  return (
    <main>
      <KepalaHalaman judul="Panduan Imunisasi 📖" sub="jadwal & tips merawat Si Kecil setelah imunisasi" peran="ortu" />
      <PanduanKonten peran="ortu" />
    </main>
  );
}
