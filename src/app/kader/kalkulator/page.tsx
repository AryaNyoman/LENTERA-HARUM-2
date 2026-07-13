import KepalaHalaman from "@/components/kepala-halaman";
import KalkulatorJadwal from "@/components/kalkulator-jadwal";

export default function Kalkulator() {
  return (
    <main>
      <KepalaHalaman judul="Kalkulator Jadwal 🧮" sub="masukkan tanggal lahir — jadwal langsung terhitung" />
      <KalkulatorJadwal peran="kader" />
    </main>
  );
}
