"use client";

import { useEffect } from "react";

export default function UnregisterServiceWorker() {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister().catch(() => {}));
        }).catch(() => {});
      }

      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => {
          return Promise.all(keys.map((k) => caches.delete(k))).catch(() => {});
        }).catch(() => {});
      }
    } catch (e) {
      // best-effort cleanup; ignore errors
    }
  }, []);

  return null;
}
