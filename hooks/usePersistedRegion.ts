"use client";

import { useCallback, useEffect, useState } from "react";
import { PREFECTURES_BY_CODE } from "@/lib/regions";

const STORAGE_KEY = "kafun.region";
const DEFAULT_CODE = process.env.NEXT_PUBLIC_DEFAULT_REGION_CODE ?? "13";

export function usePersistedRegion() {
  const [code, setCodeState] = useState<string>(DEFAULT_CODE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && PREFECTURES_BY_CODE[saved]) {
        setCodeState(saved);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const setCode = useCallback((next: string) => {
    if (!PREFECTURES_BY_CODE[next]) return;
    setCodeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return { code, setCode, hydrated };
}
