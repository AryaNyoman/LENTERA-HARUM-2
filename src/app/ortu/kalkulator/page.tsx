import KepalaHalaman from "@/components/kepala-halaman";
import KalkulatorJadwal from "@/components/kalkulator-jadwal";

export default function KalkulatorOrtu() {
  return (
    <main>
      <KepalaHalaman judul="Kalkulator Jadwal 🧮" sub="masukkan tanggal lahir — jadwal langsung terhitung" peran="ortu" />
      <KalkulatorJadwal peran="ortu" />
    </main>
  );
}
