/** Konten edukasi per jenis vaksin — dipisah dari panduan-konten.tsx jadi data murni,
 *  gampang diedit petugas kesehatan tanpa menyentuh kode tampilan.
 *  Tiap vaksin WAJIB 4 seksi berurutan: manfaat (Manfaat & Tujuan Imunisasi),
 *  pasca (Edukasi Pasca Imunisasi), batasUsia (Batas Usia Pemberian),
 *  kejar (Panduan Kejar Imunisasi).
 *  Angka usia bersumber dari JADWAL & Catatan NTB yang sudah ada di panduan-konten.tsx
 *  (selaras UMUR_IDEAL/ATURAN_DOSIS @/lib/vaksin — TIDAK mengubah aturan tersebut, teks saja).
 *  Batas usia/aturan kejar yang belum dikonfirmasi pemilik sengaja ditulis aman
 *  ("konsultasikan ke petugas") — lihat PLAN-2026-07-16-lentera-harum.md § "Ditunda". */

export interface PanduanVaksin {
  id: string;
  nama: string;
  manfaat: string;
  pasca: string;
  batasUsia: string;
  kejar: string;
}

export const PANDUAN_VAKSIN: PanduanVaksin[] = [
  {
    id: "hb0",
    nama: "HB0 (Hepatitis B0)",
    manfaat:
      "Melindungi bayi dari infeksi virus Hepatitis B sedini mungkin, terutama penularan dari ibu ke bayi saat proses kelahiran. Virus ini bisa menular sejak jam-jam pertama kehidupan, jadi vaksin ini perlu diberikan secepatnya.",
    pasca:
      "Bekas suntikan boleh sedikit bengkak atau anak rewel sebentar — ini wajar dan biasanya reda sendiri dalam 1–2 hari. Kompres hangat bila perlu, dan tetap susui seperti biasa.",
    batasUsia:
      "Idealnya diberikan kurang dari 24 jam setelah lahir, paling lambat sebelum usia 7 hari. Semakin cepat diberikan setelah lahir, semakin baik perlindungannya.",
    kejar:
      "Bila usia 7 hari sudah terlewat, tetap segera bawa bayi ke Puskesmas/Posyandu terdekat — jangan ditunda lebih lama. Petugas kesehatan akan memeriksa dan menentukan jadwal susulan yang tepat untuk bayi.",
  },
  {
    id: "bcg",
    nama: "BCG",
    manfaat:
      "Mencegah TBC berat pada anak, terutama TBC selaput otak (meningitis TBC) dan TBC milier yang berbahaya bagi bayi. Vaksin ini penting diberikan sejak dini karena bayi sangat rentan terhadap bentuk TBC yang parah.",
    pasca:
      "Setelah disuntik, biasanya muncul benjolan kecil yang lalu menjadi luka kecil dan sembuh sendiri dalam beberapa minggu — ini tanda vaksin bekerja, bukan infeksi. Jangan dipencet, ditekan, atau diberi obat/salep tanpa anjuran petugas.",
    batasUsia:
      "Bisa diberikan sejak lahir hingga sebelum anak berusia 12 bulan (ulang tahun pertama), idealnya saat bayi berusia 1 bulan. Bila bayi sudah berusia lebih dari 6 bulan dan belum BCG, perlu uji tuberkulin (mantoux) dulu sebelum disuntik.",
    kejar:
      "Sebelum usia 6 bulan, BCG masih bisa langsung dikejar tanpa uji tambahan — segera bawa anak ke Posyandu/Puskesmas. Antara usia 6 hingga 11 bulan, tetap bisa disusulkan tapi perlu pemeriksaan tuberkulin lebih dulu — konsultasikan ke petugas kesehatan. Setelah usia 12 bulan, jadwal BCG di sistem ini sudah di luar jendela standar; sampaikan ke petugas Puskesmas untuk penanganan lebih lanjut.",
  },
  {
    id: "polio-tetes",
    nama: "Polio tetes (bOPV)",
    manfaat:
      "Melindungi anak dari virus polio yang bisa menyebabkan kelumpuhan permanen. Pemberian lewat tetes mulut membantu membentuk kekebalan usus yang kuat terhadap virus polio liar.",
    pasca:
      "Jangan beri anak makan atau minum dulu sekitar 10 menit setelah tetes agar vaksin tidak termuntahkan atau terminum air. Bila anak muntah banyak tak lama setelah tetes, laporkan ke petugas — mungkin perlu diulang.",
    batasUsia:
      "bOPV 1 bisa diberikan sejak lahir hingga sebelum usia 12 bulan, biasanya bersamaan dengan BCG. bOPV 2, 3, dan 4 mulai diberikan berturut-turut di usia 2, 3, dan 4 bulan, dengan jarak minimal 4 minggu antar dosis. Seluruh dosis bOPV masih bisa dikejar hingga anak berusia hampir 5 tahun.",
    kejar:
      "Bila ada dosis yang tertunda atau terlambat, lanjutkan dari dosis terakhir yang sudah diterima — tidak perlu mengulang dari awal. Kejar dosis 2 sampai 4 masih bisa dilakukan hingga usia anak mendekati 5 tahun. Konsultasikan ke petugas kesehatan untuk jadwal susulan yang tepat sesuai usia anak saat ini.",
  },
  {
    id: "penta-hexa",
    nama: "DPT-HB-Hib (Penta/Hexa)",
    manfaat:
      "Melindungi anak sekaligus dari beberapa penyakit berbahaya: Difteri, Pertusis (batuk rejan), Tetanus, Hepatitis B, dan Hib (penyebab meningitis & pneumonia). Versi Hexavalen sekaligus mengandung perlindungan Polio (IPV) dalam satu suntikan.",
    pasca:
      "Demam ringan, rewel, atau bengkak di bekas suntikan adalah reaksi wajar dalam 1–2 hari. Beri kompres hangat dan ASI/minum lebih sering; segera ke faskes bila demam di atas 39°C atau berlangsung lebih dari 2 hari.",
    batasUsia:
      "Diberikan 3 kali (dosis 1 sampai 3): dosis 1 mulai usia 2 bulan, dosis 2 di usia 3 bulan, dan dosis 3 di usia 4 bulan, dengan jarak minimal 4 minggu antar dosis. Ketiga dosis ini masih bisa dikejar hingga anak berusia 5 tahun. Dilanjutkan dosis Baduta mulai usia 18 bulan, juga masih bisa diberikan sampai usia 5 tahun.",
    kejar:
      "Bila terlewat, lanjutkan dari dosis terakhir tanpa mengulang dari awal — jarak antar dosis tetap minimal 4 minggu. Dosis 1 sampai 3 dan dosis Baduta sama-sama masih bisa dikejar hingga usia 5 tahun. Setelah itu, konsultasikan ke petugas Puskesmas untuk opsi terbaik bagi anak.",
  },
  {
    id: "pcv",
    nama: "PCV",
    manfaat:
      "Melindungi anak dari infeksi bakteri pneumokokus, penyebab pneumonia (radang paru), meningitis, dan infeksi telinga berat. Penyakit-penyakit ini bisa sangat serius pada bayi dan balita.",
    pasca:
      "Reaksi yang mungkin muncul serupa vaksin suntik lainnya: demam ringan atau bengkak di bekas suntikan. Kompres hangat dan pantau suhu tubuh anak seperti biasa.",
    batasUsia:
      "Dosis 1 mulai usia 2 bulan dan dosis 2 di usia 3 bulan, keduanya masih bisa dikejar hingga anak berusia 5 tahun. Dosis penguat (PCV3) diberikan pada rentang usia 12 sampai 24 bulan. Catatan NTB: PCV saat ini tidak dihitung sebagai syarat IDL/IBL, namun tetap penting diberikan untuk melindungi anak.",
    kejar:
      "Dosis 1 dan 2 masih bisa dikejar sampai anak berusia 5 tahun — semakin cepat semakin baik. Dosis penguat (PCV3) hanya berlaku pada rentang usia 12 sampai 24 bulan. Bila usia anak sudah lewat 24 bulan dan PCV3 belum diberikan, konsultasikan ke petugas kesehatan.",
  },
  {
    id: "rotavirus",
    nama: "Rotavirus",
    manfaat:
      "Mencegah diare berat akibat infeksi rotavirus, penyebab utama diare parah dan dehidrasi pada bayi. Diare berat pada bayi bisa berbahaya bila tidak dicegah sejak dini.",
    pasca:
      "Sama seperti vaksin tetes lain, jangan beri makan/minum dulu sekitar 10 menit setelah pemberian. Gumoh sedikit adalah wajar, namun bila anak muntah banyak segera lapor ke petugas.",
    batasUsia:
      "Rotarix cukup 2 dosis, Rotavac perlu 3 dosis — jangan mencampur merek di tengah seri. Batas usianya SANGAT KETAT: dosis 1 harus usia 2 sampai 4 bulan, dosis 2 usia 3 sampai 6 bulan, dan dosis 3 (Rotavac) usia 4 sampai 8 bulan. Rentang ini jauh lebih sempit dibanding kebanyakan vaksin lain, jadi jangan sampai terlewat.",
    kejar:
      "Karena jendela usianya SANGAT KETAT (2 sampai 4, 3 sampai 6, dan 4 sampai 8 bulan untuk tiap dosis), segera bawa anak ke Puskesmas/Posyandu begitu jadwalnya dekat atau ada dosis tertunda. Jangan ditunda-tunda, sebab lewat batas atas usia berarti dosis itu umumnya tidak bisa dikejar lagi. Konsultasikan ke petugas kesehatan untuk memastikan jadwal yang tepat bagi anak.",
  },
  {
    id: "ipv",
    nama: "IPV",
    manfaat:
      "Memberi perlindungan tambahan terhadap virus polio lewat jalur suntikan, melengkapi perlindungan dari vaksin tetes (bOPV). Kombinasi tetes dan suntik ini memberikan perlindungan polio yang lebih menyeluruh.",
    pasca:
      "Reaksi yang mungkin muncul sama seperti vaksin suntik lain: bengkak ringan atau rewel sebentar. Kompres hangat bila perlu.",
    batasUsia:
      "Diberikan 2 kali: IPV 1 mulai usia 4 bulan, IPV 2 mulai usia 9 bulan (bersamaan MR). Keduanya masih bisa dikejar hingga anak berusia hampir 5 tahun. Anak yang mendapat vaksin Hexavalen (6-in-1) sudah termasuk IPV di dalamnya, jadi tidak perlu suntik IPV terpisah.",
    kejar:
      "Bila terlewat, IPV tetap bisa disusulkan hingga anak berusia hampir 5 tahun. Sampaikan riwayat vaksin Penta/Hexa anak ke petugas agar dosis IPV disesuaikan dengan tepat. Setelah usia 5 tahun, konsultasikan langsung ke petugas kesehatan untuk opsi lain.",
  },
  {
    id: "mr",
    nama: "Campak-Rubella (MR)",
    manfaat:
      "Melindungi anak dari Campak (measles) yang mudah menular dan bisa berkomplikasi berat, serta Rubella yang berbahaya bila menulari ibu hamil di sekitarnya. Kedua penyakit ini termasuk yang paling mudah menyebar bila anak belum diimunisasi.",
    pasca:
      "Demam ringan dan ruam kulit halus beberapa hari setelah suntikan adalah reaksi wajar dan akan hilang sendiri. Kompres hangat dan pantau suhu tubuh anak seperti biasa.",
    batasUsia:
      "Dosis pertama diberikan mulai usia 9 bulan, dan masih bisa dikejar hingga anak berusia hampir 5 tahun bila terlewat. Dilanjutkan dosis Baduta di usia 18 bulan, dengan jarak minimal 6 bulan dari dosis pertama.",
    kejar:
      "Bila terlewat dari usia 9 bulan, tetap segera berikan begitu memungkinkan — jangan menunggu jadwal berikutnya. MR dosis pertama masih bisa dikejar hingga anak berusia hampir 5 tahun. Konsultasikan ke petugas kesehatan untuk jadwal dosis lanjutannya.",
  },
  {
    id: "baduta",
    nama: "Dosis Baduta (DPT-HB-Hib & MR lanjutan)",
    manfaat:
      "Dosis penguat (booster) yang memperkuat dan memperpanjang kekebalan yang sudah dibentuk dosis-dosis sebelumnya. Tujuannya agar perlindungan anak bertahan sampai usia sekolah.",
    pasca:
      "Reaksi mengikuti jenis vaksinnya: demam/bengkak ringan untuk DPT-HB-Hib Baduta, atau demam ringan dan ruam untuk MR Baduta. Penanganannya sama seperti dosis-dosis sebelumnya — kompres hangat, ASI/minum lebih sering, pantau suhu.",
    batasUsia:
      "DPT-HB-Hib Baduta diberikan pada rentang usia 18 bulan sampai 5 tahun (jarak minimal 12 bulan dari dosis ke-3). MR Baduta diberikan pada rentang usia 18 bulan hingga sebelum usia 5 tahun (jarak minimal 6 bulan dari MR dosis pertama).",
    kejar:
      "Bila terlewat dari usia 18 bulan, tetap segera berikan — jangan ditunda terlalu lama karena memengaruhi status IBL (Imunisasi Baduta Lengkap) anak. Kedua dosis ini masih bisa dikejar sampai menjelang usia 5 tahun. Konsultasikan ke petugas Puskesmas untuk jadwal terbaik.",
  },
];
