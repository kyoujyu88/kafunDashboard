import { AIR_LEVEL_LABELS, INTENSITY_META, METRICS, type IntensityLevel } from "@/data/metrics.config";
import type { MetricKey } from "@/lib/openMeteo.types";

export function classifyIntensity(metric: MetricKey, value: number | null | undefined): IntensityLevel | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const t = METRICS[metric].thresholds;
  if (value >= t.very_high) return "very_high";
  if (value >= t.high) return "high";
  if (value >= t.moderate) return "moderate";
  return "low";
}

export interface IntensityInfo {
  level: IntensityLevel | null;
  label: string;
  colorHex: string;
  bgClass: string;
  ringClass: string;
  textClass: string;
}

export function getIntensityInfo(metric: MetricKey, value: number | null | undefined): IntensityInfo {
  const level = classifyIntensity(metric, value);
  if (!level) {
    return {
      level: null,
      label: "—",
      colorHex: "#94a3b8",
      bgClass: "from-slate-300/20 to-slate-500/10",
      ringClass: "ring-slate-300/40",
      textClass: "text-slate-500 dark:text-slate-400",
    };
  }
  const meta = INTENSITY_META[level];
  const isAir = METRICS[metric].category === "air";
  const UV_LABELS: Record<IntensityLevel, string> = {
    low: "弱い",
    moderate: "中程度",
    high: "強い",
    very_high: "非常に強い",
  };
  const label =
    metric === "uv_index"
      ? UV_LABELS[level]
      : isAir
      ? AIR_LEVEL_LABELS[level]
      : meta.label;
  return {
    level,
    label,
    colorHex: meta.colorHex,
    bgClass: meta.bgClass,
    ringClass: meta.ringClass,
    textClass: meta.textClass,
  };
}

const LEVEL_ORDER: Record<IntensityLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  very_high: 3,
};

export function isLevelAtOrAbove(level: IntensityLevel | null, threshold: IntensityLevel): boolean {
  if (!level) return false;
  return LEVEL_ORDER[level] >= LEVEL_ORDER[threshold];
}
