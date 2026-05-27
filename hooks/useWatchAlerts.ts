"use client";

import { useMemo } from "react";
import type { WatchProfile } from "@/hooks/useWatchProfile";
import { classifyIntensity, isLevelAtOrAbove } from "@/lib/intensity";
import { extractCurrentValue, extractHourlySeries } from "@/lib/openMeteo";
import type { MetricKey, OpenMeteoResponse } from "@/lib/openMeteo.types";
import { METRICS } from "@/data/metrics.config";

export interface WatchAlertItem {
  metric: MetricKey;
  label: string;
  currentValue: number | null;
  level: "moderate" | "high" | "very_high" | null;
  upcomingPeakAt?: string;
  upcomingPeakValue?: number;
}

export function useWatchAlerts(
  profile: WatchProfile,
  data: OpenMeteoResponse | undefined
): { alerts: WatchAlertItem[]; highestLevel: "moderate" | "high" | "very_high" | null } {
  return useMemo(() => {
    const watched: MetricKey[] = [...profile.pollens, ...profile.airQuality];
    if (!data || watched.length === 0) return { alerts: [], highestLevel: null };

    const alerts: WatchAlertItem[] = [];
    let highestLevel: "moderate" | "high" | "very_high" | null = null;

    for (const metric of watched) {
      const currentValue = extractCurrentValue(data, metric);
      const level = classifyIntensity(metric, currentValue);
      const meetsThreshold = isLevelAtOrAbove(level, profile.alertLevel);

      const { time, values } = extractHourlySeries(data, metric);
      let upcomingPeakAt: string | undefined;
      let upcomingPeakValue: number | undefined;
      const now = Date.now();
      const limit = now + 24 * 60 * 60 * 1000;
      for (let i = 0; i < time.length; i++) {
        const ts = new Date(time[i]).getTime();
        if (ts < now || ts > limit) continue;
        const v = values[i];
        if (typeof v !== "number") continue;
        const futLevel = classifyIntensity(metric, v);
        if (isLevelAtOrAbove(futLevel, profile.alertLevel)) {
          if (upcomingPeakValue === undefined || v > upcomingPeakValue) {
            upcomingPeakValue = v;
            upcomingPeakAt = time[i];
          }
        }
      }

      if (meetsThreshold || upcomingPeakValue !== undefined) {
        alerts.push({
          metric,
          label: METRICS[metric].shortLabel,
          currentValue,
          level: meetsThreshold ? (level as "moderate" | "high" | "very_high") : null,
          upcomingPeakAt,
          upcomingPeakValue,
        });
        if (meetsThreshold && level) {
          const rank = { moderate: 0, high: 1, very_high: 2 } as const;
          if (
            highestLevel === null ||
            rank[level as keyof typeof rank] > rank[highestLevel]
          ) {
            highestLevel = level as "moderate" | "high" | "very_high";
          }
        }
      }
    }

    return { alerts, highestLevel };
  }, [profile, data]);
}
