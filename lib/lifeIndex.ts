import type { OpenMeteoResponse, MetricKey, PollenKey, AirQualityKey } from "./openMeteo.types";
import type { WeatherResponse } from "./weather.types";
import { POLLEN_KEYS } from "./openMeteo.types";
import { classifyIntensity } from "./intensity";
import type { IntensityLevel } from "@/data/metrics.config";
import type { WatchProfile } from "@/hooks/useWatchProfile";

export type IndexScore = "excellent" | "good" | "caution" | "poor";
export type LifeIndexKey = "mask" | "laundry" | "futon" | "outdoorWindow";

export interface IndexResult {
  key: LifeIndexKey;
  score: IndexScore;
  symbol: "◎" | "○" | "△" | "✕";
  level: IntensityLevel;
  title: string;
  headline: string;
  reason: string;
  relatedMetrics: MetricKey[];
  starred?: boolean;
  bestWindow?: { startISO: string; endISO: string };
}

interface ComputeInputs {
  air: OpenMeteoResponse | undefined;
  weather: WeatherResponse | undefined;
  profile?: WatchProfile;
  nowMs?: number;
}

const SYMBOL: Record<IndexScore, IndexResult["symbol"]> = {
  excellent: "◎",
  good: "○",
  caution: "△",
  poor: "✕",
};

const SCORE_LEVEL: Record<IndexScore, IntensityLevel> = {
  excellent: "low",
  good: "low",
  caution: "moderate",
  poor: "very_high",
};

const LEVEL_NUMERIC: Record<IntensityLevel, number> = {
  low: 0,
  moderate: 1,
  high: 3,
  very_high: 6,
};

const LEVEL_ORDER: IntensityLevel[] = ["low", "moderate", "high", "very_high"];

export function computeLifeIndices(inputs: ComputeInputs): IndexResult[] {
  const { air, weather, profile, nowMs = Date.now() } = inputs;
  if (!air?.current) return [];

  const watchedPollens = profile?.pollens ?? [];
  const watchedAir = profile?.airQuality ?? [];
  const pollenWatcher = watchedPollens.length > 0;
  const outdoorPerson = watchedAir.includes("uv_index");

  return [
    computeMaskIndex(air, watchedPollens, pollenWatcher),
    computeLaundryIndex(air, weather, watchedPollens, nowMs),
    computeFutonIndex(air, weather, watchedPollens, nowMs, pollenWatcher),
    computeOutdoorWindow(air, weather, watchedPollens, watchedAir, nowMs, outdoorPerson),
  ];
}

function computeMaskIndex(
  air: OpenMeteoResponse,
  watchedPollens: PollenKey[],
  pollenWatcher: boolean,
): IndexResult {
  const pm25 = getCurrentNumber(air, "pm2_5");
  const dust = getCurrentNumber(air, "dust");
  const pm25Level = classifyIntensity("pm2_5", pm25);
  const dustLevel = classifyIntensity("dust", dust);

  let topPollenKey: PollenKey | null = null;
  let topPollenLevel: IntensityLevel | null = null;
  for (const k of POLLEN_KEYS) {
    const lvl = classifyIntensity(k, getCurrentNumber(air, k));
    if (lvl && (!topPollenLevel || LEVEL_NUMERIC[lvl] > LEVEL_NUMERIC[topPollenLevel])) {
      topPollenLevel = lvl;
      topPollenKey = k;
    }
  }

  // Watched pollens get a one-level bump
  let weightedPollenLevel = topPollenLevel;
  if (watchedPollens.length > 0) {
    let watchedMax: IntensityLevel | null = null;
    for (const k of watchedPollens) {
      const lvl = classifyIntensity(k, getCurrentNumber(air, k));
      if (lvl && (!watchedMax || LEVEL_NUMERIC[lvl] > LEVEL_NUMERIC[watchedMax])) watchedMax = lvl;
    }
    if (watchedMax) {
      const bumped = bumpLevel(watchedMax, 1);
      if (!weightedPollenLevel || LEVEL_NUMERIC[bumped] > LEVEL_NUMERIC[weightedPollenLevel]) {
        weightedPollenLevel = bumped;
      }
    }
  }

  const overall = maxLevel([pm25Level, dustLevel, weightedPollenLevel]);
  let score: IndexScore;
  let headline: string;
  let reason: string;
  if (overall === "very_high") {
    score = "poor";
    headline = "マスク必須";
    reason = "花粉や PM2.5 が非常に多めです";
  } else if (overall === "high") {
    score = "caution";
    headline = "マスク推奨";
    reason = "花粉・PM2.5 が多めです";
  } else if (overall === "moderate") {
    score = "good";
    headline = "気になる方は着用";
    reason = "やや多めの指標があります";
  } else {
    score = "excellent";
    headline = "マスク不要";
    reason = "空気は落ち着いています";
  }

  const related: MetricKey[] = ["pm2_5", "dust"];
  if (topPollenKey && !related.includes(topPollenKey)) related.push(topPollenKey);

  return {
    key: "mask",
    score,
    symbol: SYMBOL[score],
    level: SCORE_LEVEL[score],
    title: "マスク必要度",
    headline,
    reason,
    relatedMetrics: related,
    starred: pollenWatcher,
  };
}

function computeLaundryIndex(
  air: OpenMeteoResponse,
  weather: WeatherResponse | undefined,
  watchedPollens: PollenKey[],
  nowMs: number,
): IndexResult {
  if (!weather?.hourly) {
    return {
      key: "laundry",
      score: "good",
      symbol: SYMBOL.good,
      level: SCORE_LEVEL.good,
      title: "洗濯指数",
      headline: "—",
      reason: "気象データ取得中",
      relatedMetrics: ["pm2_5"],
    };
  }

  const wt = (weather.hourly.time as string[]) ?? [];
  const wp = (weather.hourly.precipitation as number[]) ?? [];
  const ws = (weather.hourly.wind_speed_10m as number[]) ?? [];
  const wh = (weather.hourly.relative_humidity_2m as number[]) ?? [];
  const i0 = findCurrentHourIndex(wt, nowMs);
  let precipSum = 0;
  const winds: number[] = [];
  const humids: number[] = [];
  for (let i = i0; i < Math.min(i0 + 12, wt.length); i++) {
    if (typeof wp[i] === "number") precipSum += wp[i];
    if (typeof ws[i] === "number") winds.push(ws[i]);
    if (typeof wh[i] === "number") humids.push(wh[i]);
  }
  const avgWind = winds.length ? winds.reduce((s, v) => s + v, 0) / winds.length : 0;
  const avgHumid = humids.length ? humids.reduce((s, v) => s + v, 0) / humids.length : 80;

  const watchedPollenLevel = maxWatchedPollenLevel(air, watchedPollens);
  const pollenBad = watchedPollenLevel === "high" || watchedPollenLevel === "very_high";

  let score: IndexScore;
  let headline: string;
  let reason: string;
  if (precipSum > 1) {
    score = "poor";
    headline = "室内干し推奨";
    reason = `今後12hで降水 ${precipSum.toFixed(1)}mm の予報`;
  } else if (precipSum > 0.1) {
    score = "caution";
    headline = "雨に注意";
    reason = "弱い雨の予報あり";
  } else if (avgHumid < 70 && avgWind >= 2 && avgWind <= 5 && !pollenBad) {
    score = "excellent";
    headline = "絶好の洗濯日和";
    reason = `湿度 ${avgHumid.toFixed(0)}%・風 ${avgWind.toFixed(1)}m/s`;
  } else if (pollenBad) {
    score = "good";
    headline = "外干しは花粉に注意";
    reason = "花粉付着の可能性あり";
  } else {
    score = "good";
    headline = "洗濯OK";
    reason = `湿度 ${avgHumid.toFixed(0)}%`;
  }

  const related: MetricKey[] = ["pm2_5", ...watchedPollens];
  return {
    key: "laundry",
    score,
    symbol: SYMBOL[score],
    level: SCORE_LEVEL[score],
    title: "洗濯指数",
    headline,
    reason,
    relatedMetrics: related.slice(0, 4),
  };
}

function computeFutonIndex(
  air: OpenMeteoResponse,
  weather: WeatherResponse | undefined,
  watchedPollens: PollenKey[],
  nowMs: number,
  pollenWatcher: boolean,
): IndexResult {
  if (!weather?.hourly) {
    return {
      key: "futon",
      score: "good",
      symbol: SYMBOL.good,
      level: SCORE_LEVEL.good,
      title: "布団干し指数",
      headline: "—",
      reason: "気象データ取得中",
      relatedMetrics: ["uv_index"],
      starred: pollenWatcher,
    };
  }

  const wt = (weather.hourly.time as string[]) ?? [];
  const wp = (weather.hourly.precipitation as number[]) ?? [];
  const wh = (weather.hourly.relative_humidity_2m as number[]) ?? [];
  const i0 = findCurrentHourIndex(wt, nowMs);
  let precipSum = 0;
  const humids: number[] = [];
  for (let i = i0; i < Math.min(i0 + 12, wt.length); i++) {
    if (typeof wp[i] === "number") precipSum += wp[i];
    if (typeof wh[i] === "number") humids.push(wh[i]);
  }
  const avgHumid = humids.length ? humids.reduce((s, v) => s + v, 0) / humids.length : 80;
  const uv = getCurrentNumber(air, "uv_index") ?? 0;
  const watchedPollenLevel = maxWatchedPollenLevel(air, watchedPollens);
  const pollenBad = watchedPollenLevel === "high" || watchedPollenLevel === "very_high";

  let score: IndexScore;
  let headline: string;
  let reason: string;
  if (precipSum > 0.5) {
    score = "poor";
    headline = "外干し不可";
    reason = `今後12hで降水 ${precipSum.toFixed(1)}mm`;
  } else if (avgHumid < 60 && uv >= 3 && !pollenBad) {
    score = "excellent";
    headline = "絶好の布団干し日和";
    reason = `湿度 ${avgHumid.toFixed(0)}%・UV ${uv.toFixed(1)}`;
  } else if (pollenBad) {
    score = "caution";
    headline = "花粉付着に注意";
    reason = "外干しは控えめに";
  } else if (avgHumid > 75) {
    score = "caution";
    headline = "湿度高め";
    reason = `湿度 ${avgHumid.toFixed(0)}%`;
  } else {
    score = "good";
    headline = "外干しOK";
    reason = `湿度 ${avgHumid.toFixed(0)}%・UV ${uv.toFixed(1)}`;
  }

  const related: MetricKey[] = ["uv_index", ...watchedPollens];
  return {
    key: "futon",
    score,
    symbol: SYMBOL[score],
    level: SCORE_LEVEL[score],
    title: "布団干し指数",
    headline,
    reason,
    relatedMetrics: related.slice(0, 4),
    starred: pollenWatcher,
  };
}

function computeOutdoorWindow(
  air: OpenMeteoResponse,
  weather: WeatherResponse | undefined,
  watchedPollens: PollenKey[],
  watchedAir: AirQualityKey[],
  nowMs: number,
  outdoorPerson: boolean,
): IndexResult {
  const at = (air.hourly?.time as string[] | undefined) ?? [];
  if (at.length === 0) {
    return {
      key: "outdoorWindow",
      score: "good",
      symbol: SYMBOL.good,
      level: SCORE_LEVEL.good,
      title: "外出おすすめ",
      headline: "—",
      reason: "予報データ取得中",
      relatedMetrics: ["pm2_5"],
      starred: outdoorPerson,
    };
  }

  const ai0 = findCurrentHourIndex(at, nowMs);
  const endIdx = Math.min(ai0 + 24, at.length);

  const airKeysToCheck: MetricKey[] = Array.from(
    new Set<MetricKey>([...watchedPollens, ...watchedAir, "pm2_5", "dust"]),
  );

  const wt = (weather?.hourly?.time as string[] | undefined) ?? [];
  const wp = (weather?.hourly?.precipitation as number[] | undefined) ?? [];
  const wsArr = (weather?.hourly?.wind_speed_10m as number[] | undefined) ?? [];
  const wIdxByTime = new Map<string, number>();
  for (let i = 0; i < wt.length; i++) wIdxByTime.set(wt[i], i);

  const scores: number[] = [];
  for (let i = ai0; i < endIdx; i++) {
    let s = 0;
    for (const k of airKeysToCheck) {
      const arr = air.hourly?.[k] as number[] | undefined;
      const v = arr?.[i];
      const lvl = classifyIntensity(k, typeof v === "number" ? v : null);
      if (lvl) s += LEVEL_NUMERIC[lvl];
    }
    const widx = wIdxByTime.get(at[i]);
    if (typeof widx === "number") {
      if (typeof wp[widx] === "number" && wp[widx] > 0.5) s += 3;
      if (typeof wsArr[widx] === "number" && wsArr[widx] > 7) s += 1;
    }
    scores.push(s);
  }

  let bestStart = 0;
  let bestSum = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 1 < scores.length; i++) {
    const sum = scores[i] + scores[i + 1];
    if (sum < bestSum) {
      bestSum = sum;
      bestStart = i;
    }
  }

  let score: IndexScore;
  if (bestSum < 2) score = "excellent";
  else if (bestSum < 6) score = "good";
  else if (bestSum < 12) score = "caution";
  else score = "poor";

  const startISO = at[ai0 + bestStart];
  const endISO = at[ai0 + bestStart + 2] ?? at[ai0 + bestStart + 1] ?? startISO;
  const startHour = parseHourJst(startISO);
  const endHour = parseHourJst(endISO);

  const headline =
    score === "excellent"
      ? "気持ちよく外出◎"
      : score === "good"
      ? "短時間ならOK"
      : score === "caution"
      ? "対策必須"
      : "外出は控えめに";
  const reason = `${startHour}時〜${endHour}時 が最も負荷低`;

  return {
    key: "outdoorWindow",
    score,
    symbol: SYMBOL[score],
    level: SCORE_LEVEL[score],
    title: "外出おすすめ",
    headline,
    reason,
    relatedMetrics: airKeysToCheck.slice(0, 3),
    starred: outdoorPerson,
    bestWindow: { startISO, endISO },
  };
}

// ---------- helpers ----------

function getCurrentNumber(air: OpenMeteoResponse, key: MetricKey): number | null {
  const v = air.current?.[key];
  return typeof v === "number" ? v : null;
}

function maxLevel(levels: (IntensityLevel | null)[]): IntensityLevel | null {
  let max: IntensityLevel | null = null;
  for (const l of levels) {
    if (!l) continue;
    if (!max || LEVEL_NUMERIC[l] > LEVEL_NUMERIC[max]) max = l;
  }
  return max;
}

function bumpLevel(l: IntensityLevel, by: number): IntensityLevel {
  const idx = Math.min(LEVEL_ORDER.length - 1, LEVEL_ORDER.indexOf(l) + by);
  return LEVEL_ORDER[idx];
}

function maxWatchedPollenLevel(air: OpenMeteoResponse, watched: PollenKey[]): IntensityLevel | null {
  let max: IntensityLevel | null = null;
  for (const k of watched) {
    const lvl = classifyIntensity(k, getCurrentNumber(air, k));
    if (lvl && (!max || LEVEL_NUMERIC[lvl] > LEVEL_NUMERIC[max])) max = lvl;
  }
  return max;
}

function findCurrentHourIndex(timeArr: string[], nowMs: number): number {
  if (!timeArr.length) return 0;
  for (let i = 0; i < timeArr.length; i++) {
    const t = new Date(timeArr[i] + "+09:00").getTime();
    if (t >= nowMs) return Math.max(0, i - 1);
  }
  return timeArr.length - 1;
}

function parseHourJst(iso: string): number {
  const m = /T(\d{2}):/.exec(iso);
  return m ? parseInt(m[1], 10) : 0;
}
