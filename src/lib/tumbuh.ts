/** Status gizi & tinggi — Standar Kemenkes RI 2020.
 *  Tabel & rumus DIPORTING APA ADANYA dari app IMUN-KU (repo Masyarakat) —
 *  logika sudah diverifikasi petugas, JANGAN diubah tanpa arahan pemilik.
 *  [median, -2SD, +2SD] per usia-bulan; z = (nilai - median) / (((+2SD) - (-2SD)) / 4). */

export const REF_BB_L: Record<number, [number, number, number]> = {
  0: [3.3, 2.4, 4.4], 1: [4.5, 3.4, 5.7], 2: [5.6, 4.3, 6.9], 3: [6.4, 5.0, 7.9], 4: [7.0, 5.6, 8.6],
  5: [7.5, 6.0, 9.2], 6: [7.9, 6.4, 9.7], 7: [8.3, 6.7, 10.2], 8: [8.6, 7.0, 10.5], 9: [8.9, 7.2, 10.9],
  10: [9.2, 7.5, 11.2], 11: [9.4, 7.6, 11.5], 12: [9.6, 7.8, 11.8], 15: [10.3, 8.4, 12.6],
  18: [11.0, 8.9, 13.4], 24: [12.2, 9.7, 15.3], 36: [14.3, 11.3, 18.3],
};
export const REF_BB_P: Record<number, [number, number, number]> = {
  0: [3.2, 2.4, 4.2], 1: [4.2, 3.2, 5.4], 2: [5.1, 3.9, 6.6], 3: [5.8, 4.5, 7.5], 4: [6.4, 5.0, 8.2],
  5: [6.9, 5.4, 8.8], 6: [7.3, 5.7, 9.3], 7: [7.6, 5.9, 9.8], 8: [7.9, 6.2, 10.2], 9: [8.2, 6.4, 10.5],
  10: [8.5, 6.6, 10.9], 11: [8.7, 6.8, 11.2], 12: [8.9, 7.0, 11.5], 15: [9.6, 7.6, 12.4],
  18: [10.2, 8.1, 13.2], 24: [11.5, 9.0, 14.8], 36: [13.9, 10.8, 18.1],
};
export const REF_TB_L: Record<number, [number, number, number]> = {
  0: [49.9, 46.3, 53.4], 1: [54.7, 51.0, 58.4], 2: [58.4, 54.7, 62.2], 3: [61.4, 57.6, 65.3],
  4: [63.9, 60.0, 67.9], 5: [65.9, 61.9, 70.0], 6: [67.6, 63.6, 71.6], 7: [69.2, 65.1, 73.2],
  8: [70.6, 66.5, 74.7], 9: [72.0, 67.7, 76.2], 10: [73.3, 69.0, 77.6], 11: [74.5, 70.2, 78.9],
  12: [75.7, 71.3, 80.1], 15: [79.1, 74.4, 83.8], 18: [82.3, 77.2, 87.3], 24: [87.8, 82.3, 93.2],
  36: [96.1, 90.1, 102.2],
};
export const REF_TB_P: Record<number, [number, number, number]> = {
  0: [49.1, 45.6, 52.7], 1: [53.7, 49.8, 57.6], 2: [57.1, 53.0, 61.1], 3: [59.8, 55.6, 64.0],
  4: [62.1, 57.8, 66.4], 5: [64.0, 59.6, 68.5], 6: [65.7, 61.2, 70.3], 7: [67.3, 62.7, 71.9],
  8: [68.7, 64.0, 73.5], 9: [70.1, 65.3, 75.0], 10: [71.5, 66.5, 76.5], 11: [72.8, 67.7, 77.8],
  12: [74.0, 68.9, 79.2], 15: [77.5, 72.0, 83.0], 18: [80.7, 75.0, 86.5], 24: [86.4, 80.0, 92.9],
  36: [95.1, 88.3, 101.8],
};

function pilihRef(t: Record<number, [number, number, number]>, bulan: number): [number, number, number] {
  const keys = Object.keys(t).map(Number).sort((a, b) => a - b);
  const k = keys.reduce((prev, cur) => (cur <= bulan ? cur : prev), keys[0]);
  return t[k];
}
export function getRefBB(jk: string, bulan: number) { return pilihRef(jk === "P" ? REF_BB_P : REF_BB_L, bulan); }
export function getRefTB(jk: string, bulan: number) { return pilihRef(jk === "P" ? REF_TB_P : REF_TB_L, bulan); }

export interface StatusUkur { label: string; kls: "normal" | "kurang" | "lebih"; saran: string; z: number }

export function statusGizi(bb: number, ref: [number, number, number]): StatusUkur {
  const [med, sd2min, sd2plus] = ref; const sd = (sd2plus - sd2min) / 4; const z = (bb - med) / sd;
  if (z < -3) return { label: "Sangat Kurus", kls: "lebih", saran: "⚠️ Segera konsultasi dokter anak atau tenaga gizi Puskesmas. Anak perlu penanganan gizi intensif.", z };
  if (z < -2) return { label: "Kurus", kls: "kurang", saran: "Perhatikan asupan makan Si Kecil. Perbanyak makanan bergizi tinggi protein dan lemak sehat. Konsultasi ke Puskesmas.", z };
  if (z > 2) return { label: "Gemuk", kls: "lebih", saran: "Kurangi makanan manis dan berlemak. Tingkatkan aktivitas fisik sesuai usia. Konsultasi ke Puskesmas.", z };
  if (z > 1) return { label: "Risiko Gemuk", kls: "kurang", saran: "Perhatikan porsi makan dan jenis makanan. Perbanyak sayur dan buah. Konsultasi ke Puskesmas.", z };
  return { label: "Normal", kls: "normal", saran: "Pertahankan pola makan seimbang dan ASI/MPASI berkualitas. Tumbuh kembang Si Kecil baik!", z };
}

export function statusTinggi(tb: number, ref: [number, number, number]): StatusUkur {
  const [med, sd2min, sd2plus] = ref; const sd = (sd2plus - sd2min) / 4; const z = (tb - med) / sd;
  if (z < -3) return { label: "Sangat Pendek (Stunting)", kls: "lebih", saran: "⚠️ Segera konsultasi dokter anak atau Puskesmas. Anak memerlukan penanganan stunting intensif.", z };
  if (z < -2) return { label: "Pendek (Stunting)", kls: "kurang", saran: "Perhatikan asupan gizi: protein, zinc, dan kalsium penting untuk pertumbuhan. Konsultasi ke Puskesmas segera.", z };
  if (z > 2) return { label: "Tinggi", kls: "normal", saran: "Tinggi badan di atas rata-rata. Pertahankan gizi seimbang.", z };
  return { label: "Normal", kls: "normal", saran: "Tinggi badan Si Kecil normal. Pertahankan pola makan bergizi.", z };
}
