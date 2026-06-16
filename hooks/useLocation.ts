"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PREFECTURES_BY_CODE,
  findSubRegion,
  getSubRegions,
} from "@/lib/regions";

const STORAGE_KEY = "kafun.region";
const DEFAULT_CODE = process.env.NEXT_PUBLIC_DEFAULT_REGION_CODE ?? "13";

/**
 * Persisted location state. `prefCode` is always present so existing per-prefecture
 * features (Japan heatmap, history, calendar) keep working. `subKey` refines the
 * point within the prefecture, and `gps` overrides both with raw coordinates.
 */
export interface LocationState {
  prefCode: string;
  subKey?: string;
  gps?: { lat: number; lng: number; label?: string };
}

/** Everything the dashboard needs to render and fetch data for a chosen location. */
export interface ResolvedLocation {
  /** Prefecture code — drives the Japan heatmap and prefecture-scoped APIs. */
  prefCode: string;
  /** Optional sub-region key when the user picked a specific city/island. */
  subKey?: string;
  /** Primary display label, e.g. "札幌" / "新宿区" / "現在地". */
  label: string;
  /** Secondary label, e.g. "北海道" / "東京都". Empty when redundant. */
  sublabel: string;
  /** Resolved coordinates used for the live air-quality and weather fetches. */
  lat: number;
  lng: number;
  /** True when coordinates came from the browser's Geolocation API. */
  fromGps: boolean;
}

function parsePersisted(raw: string | null): LocationState | null {
  if (!raw) return null;
  // Backward-compat: previous version stored bare prefecture codes like "13".
  if (/^\d{1,2}$/.test(raw)) {
    return PREFECTURES_BY_CODE[raw] ? { prefCode: raw } : null;
  }
  try {
    const parsed = JSON.parse(raw) as LocationState;
    if (!parsed?.prefCode || !PREFECTURES_BY_CODE[parsed.prefCode]) return null;
    return parsed;
  } catch {
    return null;
  }
}

function resolve(state: LocationState): ResolvedLocation {
  const pref = PREFECTURES_BY_CODE[state.prefCode] ?? PREFECTURES_BY_CODE[DEFAULT_CODE];
  if (state.gps) {
    return {
      prefCode: pref.code,
      label: state.gps.label ?? "現在地",
      sublabel: pref.name,
      lat: state.gps.lat,
      lng: state.gps.lng,
      fromGps: true,
    };
  }
  const sub = state.subKey ? findSubRegion(pref.code, state.subKey) : null;
  if (sub) {
    return {
      prefCode: pref.code,
      subKey: sub.key,
      label: sub.name,
      sublabel: pref.name,
      lat: sub.lat,
      lng: sub.lng,
      fromGps: false,
    };
  }
  return {
    prefCode: pref.code,
    label: pref.name,
    sublabel: pref.capital,
    lat: pref.lat,
    lng: pref.lng,
    fromGps: false,
  };
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ prefCode: DEFAULT_CODE });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const parsed = parsePersisted(window.localStorage.getItem(STORAGE_KEY));
      if (parsed) setState(parsed);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: LocationState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setPrefecture = useCallback(
    (prefCode: string) => {
      if (!PREFECTURES_BY_CODE[prefCode]) return;
      persist({ prefCode });
    },
    [persist]
  );

  const setSubRegion = useCallback(
    (prefCode: string, subKey: string | null) => {
      if (!PREFECTURES_BY_CODE[prefCode]) return;
      if (subKey && !findSubRegion(prefCode, subKey)) {
        persist({ prefCode });
        return;
      }
      persist(subKey ? { prefCode, subKey } : { prefCode });
    },
    [persist]
  );

  const setGps = useCallback(
    (lat: number, lng: number, label?: string) => {
      // Snap to the nearest prefecture for the Japan map / prefecture-scoped fetches,
      // but keep the raw GPS coordinates for live data.
      const pref = nearestPrefByCoord(lat, lng);
      persist({ prefCode: pref, gps: { lat, lng, label } });
    },
    [persist]
  );

  const clearGps = useCallback(() => {
    persist({ prefCode: state.prefCode });
  }, [persist, state.prefCode]);

  return {
    state,
    location: resolve(state),
    hydrated,
    availableSubRegions: getSubRegions(state.prefCode),
    setPrefecture,
    setSubRegion,
    setGps,
    clearGps,
  };
}

function nearestPrefByCoord(lat: number, lng: number): string {
  // Inline copy of haversine to avoid a circular import — the alternative would
  // be moving nearestPrefecture here, but it's also used elsewhere by code.
  const toRad = (d: number) => (d * Math.PI) / 180;
  let bestCode = DEFAULT_CODE;
  let bestDist = Infinity;
  for (const code in PREFECTURES_BY_CODE) {
    const p = PREFECTURES_BY_CODE[code];
    const dLat = toRad(p.lat - lat);
    const dLng = toRad(p.lng - lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(p.lat)) * Math.sin(dLng / 2) ** 2;
    const d = 2 * 6371 * Math.asin(Math.sqrt(h));
    if (d < bestDist) {
      bestDist = d;
      bestCode = code;
    }
  }
  return bestCode;
}
