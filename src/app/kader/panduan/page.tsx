import KepalaHalaman from "@/components/kepala-halaman";
import PanduanKonten from "@/components/panduan-konten";

export default function PanduanKader() {
  return (
    <main>
      <KepalaHalaman judul="Panduan Imunisasi 📖" sub="jadwal & catatan penting — konteks NTB" />
      <PanduanKonten peran="kader" />
    </main>
  );
}
