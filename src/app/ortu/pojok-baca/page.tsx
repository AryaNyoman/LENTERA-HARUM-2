import KepalaHalaman from "@/components/kepala-halaman";
import PojokBacaKonten from "@/components/pojok-baca-konten";

/** Pojok Baca ORTU = konten sama dengan versi kader, aksen warna coral. */
export default function PojokBacaOrtu() {
  return (
    <main>
      <KepalaHalaman
        judul="Pojok Baca Imun 📚"
        sub="jadwal hari imunisasi, BPJS, kontak & materi"
        balik="/ortu/panduan"
        peran="ortu"
      />
      <PojokBacaKonten peran="ortu" />
    </main>
  );
}
