"use client";

import { useCallback, useEffect, useState } from "react";
import type { AirQualityKey, PollenKey } from "@/lib/openMeteo.types";
import type { IntensityLevel } from "@/data/metrics.config";

export interface WatchProfile {
  version: 1;
  pollens: PollenKey[];
  airQuality: AirQualityKey[];
  alertLevel: Extract<IntensityLevel, "moderate" | "high" | "very_high">;
  enableBrowserNotification: boolean;
  onboarded: boolean;
  updatedAt: number;
}

const STORAGE_KEY = "kafun.watchProfile";
const LEGACY_KEY = "kafun.allergyProfile"; // migrate from old key

const DEFAULT_PROFILE: WatchProfile = {
  version: 1,
  pollens: [],
  airQuality: [],
  alertLevel: "high",
  enableBrowserNotification: false,
  onboarded: false,
  updatedAt: 0,
};

function loadProfile(): WatchProfile {
  try {
    // Try new key first
    let raw = window.localStorage.getItem(STORAGE_KEY);

    // Migrate from legacy key
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
      if (legacyRaw) {
        window.localStorage.setItem(STORAGE_KEY, legacyRaw);
        window.localStorage.removeItem(LEGACY_KEY);
        raw = legacyRaw;
      }
    }

    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<WatchProfile>;
    if (parsed.version !== 1) return DEFAULT_PROFILE;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      pollens: Array.isArray(parsed.pollens) ? (parsed.pollens as PollenKey[]) : [],
      airQuality: Array.isArray(parsed.airQuality) ? (parsed.airQuality as AirQualityKey[]) : [],
    } as WatchProfile;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useWatchProfile() {
  const [profile, setProfile] = useState<WatchProfile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  const save = useCallback((next: WatchProfile) => {
    const stamped = { ...next, updatedAt: Date.now() };
    setProfile(stamped);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
    } catch {
      // ignore
    }
  }, []);

  const update = useCallback(
    (patch: Partial<WatchProfile>) => {
      save({ ...profile, ...patch });
    },
    [profile, save]
  );

  const togglePollen = useCallback(
    (key: PollenKey) => {
      const exists = profile.pollens.includes(key);
      const pollens = exists ? profile.pollens.filter((k) => k !== key) : [...profile.pollens, key];
      save({ ...profile, pollens });
    },
    [profile, save]
  );

  const toggleAir = useCallback(
    (key: AirQualityKey) => {
      const exists = profile.airQuality.includes(key);
      const airQuality = exists
        ? profile.airQuality.filter((k) => k !== key)
        : [...profile.airQuality, key];
      save({ ...profile, airQuality });
    },
    [profile, save]
  );

  const reset = useCallback(() => {
    save({ ...DEFAULT_PROFILE, onboarded: true });
  }, [save]);

  return { profile, hydrated, save, update, togglePollen, toggleAir, reset };
}

export const WATCH_PROFILE_KEY = STORAGE_KEY;
