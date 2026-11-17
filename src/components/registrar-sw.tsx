"use client";

import { useEffect } from "react";

export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Sin service worker la app sigue funcionando; solo pierde el aviso sin conexión.
    });
  }, []);
  return null;
}
