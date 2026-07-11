"use client";

import { useEffect } from "react";

/** Daftarkan service worker (offline ringan). Senyap bila browser tak mendukung. */
export default function SwDaftar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[App] SW terdaftar"))
        .catch(() => {});
    }
  }, []);
  return null;
}
