/* Seed pengembangan SIMPUS-POSYANDU.
 * - Wilayah (kelurahan+posyandu): daftar dev/fallback — di produksi akan DITIMPA sync SIMPUS
 *   (upsert per id SIMPUS). Urutan kelurahan mengikuti konstanta SIMPUS.
 * - Akun: admin (sandi acak DITAMPILKAN sekali), 1 kader contoh, 1 ortu contoh.
 * - 2 anak baru contoh (fiktif) tersegel dengan KUNCI_SERVER.
 * Jalankan: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, createCipheriv } from "crypto";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ── segel PII (duplikat kecil dari src/lib/brankas.ts agar seed mandiri) ──
function segel(obj: unknown) {
  const hex = process.env.KUNCI_SERVER ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error("KUNCI_SERVER belum diisi — lihat .env.example");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(hex, "hex"), iv);
  const data = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(obj), "utf8")), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}

// ── wilayah: "Lingkungan (Nama Posyandu)" — sumber: app KADER (terverifikasi petugas) ──
const WILAYAH: Record<string, string[]> = {
  "Cakranegara Timur": ["Nesa Timur (Seruni)", "Nesa Barat (Ganesa)", "Kr. Sil. Ut+Sel (Arsa Tunggal)", "Kr. Tulamben Klod (Srikandi)", "Kr. Bedil+Songkang (Tumpang Sari)"],
  "Cakranegara Selatan": ["Kr. Kecicang (Sari Indah)", "Kr. Deha (Melati Putih)", "Kr. Kelebut (Kenanga)", "Batu Aya (Cempaka Merah)", "Kr. Tangkeban (Mawar)", "Kr. Seraya (Tunjung Biru)", "Seganteng Bangket (Mawar Jingga)", "Seganteng Subagan (Mawar Merah)", "Seganteng Gebang (Cempaka)", "Seganteng Gb. Pande (Cempaka Putih)"],
  "Bertais": ["Pengempel Indah (Restu Ibu)", "Bertais Utara Timur (Al-Jihad)", "Bertais Utara Barat (Al-Hidayah II)", "Bertais Selatan (Al-Hidayah I)", "Gontoran Barat (Nurul Huda)", "Karang Rundun (Cendana)", "Butun Indah (Assyfa)"],
  "Mandalika": ["Lendang Lekong (Melati)", "Gr. Butun Timur (Al-Muqarrobin)", "Gr. Butun Barat (Mekarsari)", "Gr. Apit Aik (As-Syifa)", "Gerung Sayo Indah (Asta)", "Gerung Sayo Indah (Edelweis)", "Montong Are (Mawar)", "Montong Are (Anggrek)", "Tembelok (Pelangi)"],
  "Turida": ["Turida Timur - BTN (Gora Permai)", "Lendang Lekong (Sehat Sejahtera)", "Turida Barat Selatan (Subuhussalam I)", "Turida Timur (Teratai Biru)", "Turida Barat Utara (Subuhussalam II)", "Gegerung Indah (Anggrek)", "Sayo Baru (Kenanga)", "Sayo Baru (Mawar)"],
  "Selagalas": ["Jangkuk (At-Taqwa)", "Tegal (Assakinah)", "Jangkuk - Dasan Jangkrik (Assayidah)", "Nyangget (Ningsari)", "Kebun Duren (Pade Angen)", "Selagalas Lama (Mawar)", "Selagalas Baru (Melati)", "Bhineka (Bhineka)"],
};
const URUTAN_KEL = ["Cakranegara Timur", "Cakranegara Selatan", "Bertais", "Mandalika", "Turida", "Selagalas"];

function pecah(label: string): { nama: string; namaPosyandu: string } {
  const m = /^(.*)\(([^)]*)\)\s*$/.exec(label);
  if (!m) return { nama: label.trim(), namaPosyandu: "" };
  return { nama: m[1].trim(), namaPosyandu: m[2].trim() };
}

async function main() {
  // wilayah
  let pid = 0;
  for (let k = 0; k < URUTAN_KEL.length; k++) {
    const namaKel = URUTAN_KEL[k];
    await db.kelurahan.upsert({
      where: { id: k + 1 },
      create: { id: k + 1, nama: namaKel, urutan: k + 1 },
      update: { nama: namaKel, urutan: k + 1 },
    });
    for (const label of WILAYAH[namaKel]) {
      pid++;
      const { nama, namaPosyandu } = pecah(label);
      await db.posyandu.upsert({
        where: { id: pid },
        create: { id: pid, kelurahanId: k + 1, nama, namaPosyandu },
        update: { kelurahanId: k + 1, nama, namaPosyandu },
      });
    }
  }

  // akun admin — sandi acak, DITAMPILKAN SEKALI saat pertama dibuat.
  // Seed ulang TIDAK mengubah sandi admin yang sudah ada.
  let infoAdmin = "admin sudah ada — sandi tidak diubah";
  const adaAdmin = await db.user.findUnique({ where: { username: "admin" } });
  if (!adaAdmin) {
    const sandiAdmin = randomBytes(9).toString("base64url");
    await db.user.create({
      data: {
        peran: "ADMIN",
        nama: "Made Aryawa Putra",
        username: "admin",
        sandiHash: await bcrypt.hash(sandiAdmin, 10),
      },
    });
    infoAdmin = "sandi: " + sandiAdmin + "   (CATAT — hanya tampil sekali)";
  }

  // kader contoh (dev): binaan = posyandu id 1 (Nesa Timur)
  const kader = await db.user.upsert({
    where: { username: "kader.nesa" },
    create: {
      peran: "KADER",
      nama: "Kader Contoh Nesa Timur",
      username: "kader.nesa",
      sandiHash: await bcrypt.hash("kader123", 10),
      perluGantiSandi: true,
    },
    update: {},
  });
  await db.userPosyandu.upsert({
    where: { userId_posyanduId: { userId: kader.id, posyanduId: 1 } },
    create: { userId: kader.id, posyanduId: 1 },
    update: {},
  });

  // ortu contoh (dev): username = No HP
  const ortu = await db.user.upsert({
    where: { username: "081900000001" },
    create: {
      peran: "ORTU",
      nama: "Ni Made Sari",
      username: "081900000001",
      noHp: "081900000001",
      sandiHash: await bcrypt.hash("ortu123", 10),
    },
    update: {},
  });

  // 2 anak baru contoh (fiktif) di posyandu 1
  const adaAnak = await db.anakBaru.count();
  if (adaAnak === 0) {
    const a1 = await db.anakBaru.create({
      data: {
        posyanduId: 1,
        ...segel({
          nama: "Kadek Bayu Pratama", tglLahir: "2026-03-06", jk: "L",
          namaOrtu: "Ni Made Sari", nik: "5271031234560001", noHp: "081900000001",
          alamat: "Jl. Gili Air No. 12", rtRw: "003/001",
          vaksin: { HB0_1_7H: "2026-03-06", BCG: "2026-04-07", POLIO1: "2026-04-07" },
        }),
        dibuatOlehId: kader.id,
      },
    });
    await db.anakBaru.create({
      data: {
        posyanduId: 1,
        ...segel({
          nama: "Putu Ayu Lestari", tglLahir: "2025-11-02", jk: "P",
          namaOrtu: "Kadek Ratna", nik: "", noHp: "081900000002",
          alamat: "Jl. Selaparang 8", rtRw: "",
          vaksin: {
            HB0_1_7H: "2025-11-02", BCG: "2025-12-03", POLIO1: "2025-12-03",
            HEXA1: "2026-01-05", POLIO2: "2026-01-05", ROTARIX1: "2026-01-05",
          },
        }),
        dibuatOlehId: kader.id,
      },
    });
    // klaim ortu contoh → anak pertama
    await db.klaimAnak.create({ data: { userId: ortu.id, anakBaruId: a1.id } });
    // 1 pengukuran tumbuh contoh
    await db.tumbuh.create({
      data: { anakBaruId: a1.id, tgl: "2026-07-06", usiaBulan: 4, bb: 7.0, tb: 63, lk: 41, dicatatOlehId: ortu.id, peranPencatat: "ORTU" },
    });
  }

  console.log("Seed selesai.");
  console.log("  admin     → username: admin      " + infoAdmin);
  console.log("  kader dev → username: kader.nesa sandi: kader123");
  console.log("  ortu dev  → username: 081900000001 sandi: ortu123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
