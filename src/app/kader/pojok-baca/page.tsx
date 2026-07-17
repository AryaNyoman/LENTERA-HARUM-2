import KepalaHalaman from "@/components/kepala-halaman";
import PojokBacaKonten from "@/components/pojok-baca-konten";

export default function PojokBacaKader() {
  return (
    <main>
      <KepalaHalaman
        judul="Pojok Baca Imun 📚"
        sub="jadwal hari imunisasi, BPJS, kontak & materi"
        balik="/kader/panduan"
      />
      <PojokBacaKonten peran="kader" />
    </main>
  );
}
