// SIMPUS-POSYANDU Service Worker — OFFLINE RINGAN
// Halaman & data TERAKHIR yang pernah dibuka tetap terbaca tanpa sinyal;
// input baru (POST/server action) tetap butuh koneksi.
// Naikkan versi ini setiap rilis supaya HP pengguna dapat versi baru.
const CACHE_NAME = "simpus-posyandu-v3";

// Aset dasar yang di-cache saat install.
const ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/gambar/bayi-baru-lahir.png",
  "/gambar/bayi-duduk.png",
  "/gambar/bayi-berdiri.png",
  "/gambar/baduta-jalan.png",
  "/gambar/anak-laki.png",
  "/gambar/anak-perempuan.png",
  "/gambar/edukasi-demam.png",
  "/gambar/edukasi-bengkak.png",
  "/gambar/edukasi-tetes-oral.png",
  "/gambar/edukasi-benjolan.png",
  "/gambar/petugas-kesehatan.png",
  "/gambar/puskesmas.png",
  "/gambar/vaksin-vial.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // input butuh koneksi — biarkan gagal jujur
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/kader/export") return;

  // Network-first: selalu coba jaringan (data segar), simpan salinan;
  // offline → sajikan salinan terakhir bila ada.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "default")) {
          const salinan = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, salinan));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: false }).then((c) => c || caches.match("/login"))),
  );
});
