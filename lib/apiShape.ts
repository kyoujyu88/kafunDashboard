import { METRICS, type IntensityLevel } from "@/data/metrics.config";
import {
  aggregateDaily,
  extractCurrentValue,
  extractHourlySeries,
  parseJstTimestamp,
} from "@/lib/openMeteo";
import { ALL_METRIC_KEYS, type MetricKey, type OpenMeteoResponse } from "@/lib/openMeteo.types";
import { classifyIntensity, getIntensityInfo } from "@/lib/intensity";
import type { Prefecture } from "@/lib/regions";

export interface MetricSnapshot {
  value: number | null;
  unit: string;
  level: IntensityLevel | null;
  label: string;
}

export interface UpcomingPeak {
  metric: MetricKey;
  peakAt: string;
  peakValue: number;
  level: IntensityLevel;
}

export interface RegionApiShape {
  region: Prefecture;
  fetchedAt: string;
  current: Record<MetricKey, MetricSnapshot>;
  upcoming24h: UpcomingPeak[];
}

export function buildRegionSnapshot(
  region: Prefecture,
  response: OpenMeteoResponse
): RegionApiShape {
  const current = {} as Record<MetricKey, MetricSnapshot>;
  for (const key of ALL_METRIC_KEYS) {
    const v = extractCurrentValue(response, key);
    const info = getIntensityInfo(key, v);
    current[key] = {
      value: v,
      unit: METRICS[key].unit,
      level: info.level,
      label: info.label,
    };
  }

  const upcoming24h: UpcomingPeak[] = [];
  const now = Date.now();
  const limit = now + 24 * 60 * 60 * 1000;

  for (const key of ALL_METRIC_KEYS) {
    const { time, values } = extractHourlySeries(response, key);
    let peakAt: string | undefined;
    let peakValue: number | undefined;
    let peakLevel: IntensityLevel | null = null;

    for (let i = 0; i < time.length; i++) {
      const ts = parseJstTimestamp(time[i]);
      if (ts < now || ts > limit) continue;
      const v = values[i];
      if (typeof v !== "number") continue;
      const level = classifyIntensity(key, v);
      if (level === "high" || level === "very_high") {
        if (peakValue === undefined || v > peakValue) {
          peakValue = v;
          peakAt = time[i];
          peakLevel = level;
        }
      }
    }

    if (peakAt && peakValue !== undefined && peakLevel) {
      upcoming24h.push({ metric: key, peakAt, peakValue, level: peakLevel });
    }
  }

  return {
    region,
    fetchedAt: new Date().toISOString(),
    current,
    upcoming24h,
  };
}

export interface DayDigest {
  date: string;
  metrics: Partial<Record<MetricKey, { max: number | null; level: IntensityLevel | null; label: string; unit: string }>>;
}

/** For a single prefecture: produces one DayDigest per JST day, summarising the worst level reached. */
export function buildDailyDigests(response: OpenMeteoResponse): DayDigest[] {
  const byDate = new Map<string, DayDigest>();
  for (const key of ALL_METRIC_KEYS) {
    const daily = aggregateDaily(response, key);
    for (const d of daily) {
      let entry = byDate.get(d.date);
      if (!entry) {
        entry = { date: d.date, metrics: {} };
        byDate.set(d.date, entry);
      }
      const info = getIntensityInfo(key, d.max);
      entry.metrics[key] = {
        max: d.max,
        level: info.level,
        label: info.label,
        unit: METRICS[key].unit,
      };
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
