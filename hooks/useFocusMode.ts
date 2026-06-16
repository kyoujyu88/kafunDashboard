"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kafun.focusMode";

/**
 * Toggle that hides non-watched metric cards. Persisted in localStorage so the
 * user's preference survives reloads. Default OFF — discoverability matters.
 */
export function useFocusMode() {
  const [focusOnly, setFocusOnly] = useState(false);

  useEffect(() => {
    try {
      setFocusOnly(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setFocusOnly((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { focusOnly, toggle };
}
