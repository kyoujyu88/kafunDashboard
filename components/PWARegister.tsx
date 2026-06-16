"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount. Only runs in production builds —
 * dev mode would constantly invalidate caches and confuse Next.js HMR.
 */
export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal; the page still works without offline support.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
