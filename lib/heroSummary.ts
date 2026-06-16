import { METRICS } from "@/data/metrics.config";
import { extractCurrentValue, extractHourlySeries } from "@/lib/openMeteo";
import { classifyIntensity } from "@/lib/intensity";
import { ALL_METRIC_KEYS, type MetricKey, type OpenMeteoResponse } from "@/lib/openMeteo.types";
import type { IntensityLevel } from "@/data/metrics.config";

export interface HeroSummaryItem {
  metric: MetricKey;
  value: number;
  level: IntensityLevel;
}

export type Tone = "calm" | "moderate" | "high" | "very_high";

export interface HeroSummary {
  /** Plain-language headline. */
  headline: string;
  /** The metric driving the headline (worst of the candidate pool). */
  primary: HeroSummaryItem;
  /** Practical, metric-specific advice (one short sentence). */
  advice: string;
  /** Hour-over-hour direction for the primary metric. */
  trend: "up" | "down" | "flat" | null;
  /** Up to 3 next-worst metrics for the chip strip. */
  others: HeroSummaryItem[];
  /** Overall tone used for the gradient background. */
  tone: Tone;
  /** True iff the primary came from the user's watched list (vs. global fallback). */
  fromWatched: boolean;
}

const LEVEL_RANK: Record<IntensityLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  very_high: 3,
};

const TONE_BY_LEVEL: Record<IntensityLevel, Tone> = {
  low: "calm",
  moderate: "moderate",
  high: "high",
  very_high: "very_high",
};

export function computeHeroSummary(
  data: OpenMeteoResponse | undefined,
  watched: MetricKey[]
): HeroSummary | null {
  if (!data) return null;

  const candidates = watched.length > 0 ? watched : ALL_METRIC_KEYS;
  const items: HeroSummaryItem[] = [];
  for (const metric of candidates) {
    const value = extractCurrentValue(data, metric);
    if (value === null) continue;
    const level = classifyIntensity(metric, value);
    if (!level) continue;
    items.push({ metric, value, level });
  }
  if (items.length === 0) return null;

  items.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]);
  const primary = items[0];

  return {
    headline: buildHeadline(primary, watched.length > 0),
    primary,
    advice: buildAdvice(primary),
    trend: computeTrend(data, primary.metric),
    others: items.slice(1, 4),
    tone: TONE_BY_LEVEL[primary.level],
    fromWatched: watched.length > 0,
  };
}

function buildHeadline(primary: HeroSummaryItem, hasWatched: boolean): string {
  const meta = METRICS[primary.metric];
  const isPollen = meta.category === "pollen";
  const subject = meta.shortLabel;
  switch (primary.level) {
    case "very_high":
      return isPollen
        ? `${subject}が非常に多く飛んでいます`
        : `${subject}が非常に高い水準です`;
    case "high":
      return isPollen ? `${subject}が多めです` : `${subject}が高めです`;
    case "moderate":
      return isPollen ? `${subject}はやや多め` : `${subject}はやや高め`;
    default:
      return hasWatched
        ? "注目項目はおおむね穏やかです"
        : "全体的に穏やかです";
  }
}

function buildAdvice(primary: HeroSummaryItem): string {
  const meta = METRICS[primary.metric];
  if (primary.level === "low") return "今のところ特別な対策は不要そうです。";
  if (meta.category === "pollen") {
    if (primary.level === "very_high")
      return "マスク・メガネ・帽子を着けて外出。帰宅時は花粉を払ってから室内へ。";
    if (primary.level === "high")
      return "外出時はマスクを。帰宅時の手洗い・うがいを習慣に。";
    return "敏感な方はマスクを推奨。窓開けは短時間に。";
  }
  if (primary.metric === "pm2_5" || primary.metric === "pm10") {
    if (primary.level === "very_high")
      return "屋外運動は控え、窓を閉めて空気清浄機を稼働させましょう。";
    if (primary.level === "high")
      return "長時間の屋外活動は控えめに。換気は短時間で。";
    return "敏感な方は屋外運動を控えめに。";
  }
  if (primary.metric === "uv_index") {
    if (primary.level === "very_high")
      return "日焼け止め(SPF30+)・帽子・サングラスを。10〜14時の外出は短時間に。";
    if (primary.level === "high") return "外出時は日焼け止めと帽子を。";
    return "長時間外出時は日焼け対策を。";
  }
  if (primary.metric === "ozone") {
    if (LEVEL_RANK[primary.level] >= LEVEL_RANK.high)
      return "屋外での激しい運動は避け、こまめに水分補給を。";
    return "敏感な方は屋外運動を控えめに。";
  }
  return "ご注意ください。";
}

function computeTrend(
  data: OpenMeteoResponse,
  metric: MetricKey
): "up" | "down" | "flat" | null {
  const { time, values } = extractHourlySeries(data, metric);
  if (time.length < 2) return null;

  // Find the index for "now" (or the most recent non-null value).
  const now = Date.now();
  let currIdx = -1;
  for (let i = time.length - 1; i >= 0; i--) {
    if (new Date(time[i]).getTime() <= now && values[i] !== null) {
      currIdx = i;
      break;
    }
  }
  if (currIdx < 1) return null;

  const curr = values[currIdx];
  const prev = values[currIdx - 1];
  if (curr === null || prev === null) return null;

  const delta = curr - prev;
  // 5% of prev or a small absolute floor, whichever is bigger — avoids noisy flips near zero.
  const threshold = Math.max(0.2, Math.abs(prev) * 0.05);
  if (delta > threshold) return "up";
  if (delta < -threshold) return "down";
  return "flat";
}
