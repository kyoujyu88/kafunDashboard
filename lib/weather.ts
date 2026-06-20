import {
  WEATHER_CURRENT_KEYS,
  WEATHER_HOURLY_KEYS,
  type WeatherCurrentKey,
  type WeatherHourlyKey,
  type WeatherIcon,
  type WeatherResponse,
} from "./weather.types";

const BASE_URL =
  process.env.NEXT_PUBLIC_OPEN_METEO_WEATHER_BASE ?? "https://api.open-meteo.com/v1/forecast";

export interface FetchWeatherOptions {
  forecastDays?: number;
  signal?: AbortSignal;
}

export async function fetchPointWeather(
  lat: number,
  lng: number,
  opts: FetchWeatherOptions = {}
): Promise<WeatherResponse> {
  const { forecastDays = 5, signal } = opts;
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    timezone: "Asia/Tokyo",
    forecast_days: String(forecastDays),
    wind_speed_unit: "ms",
    hourly: WEATHER_HOURLY_KEYS.join(","),
    current: WEATHER_CURRENT_KEYS.join(","),
  });
  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    signal,
    // ルートハンドラ側で Cache-Control を動的に組み立てるため、Next.js のデータ
    // キャッシュ(R2 + DO 経由の long-lived ISR)をここでは持たせない。
    // 上流の更新サイクルに沿った CDN キャッシュだけが効くようにする。
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo weather error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as WeatherResponse;
}

/**
 * Open-Meteo の `current.time` をミリ秒 epoch に変換する。
 * timezone=Asia/Tokyo 指定時は `"2026-06-18T14:45"` のように TZ オフセットなし
 * 文字列で返るので、明示的に +09:00 を補ってから Date 化する。
 */
export function parseObservedTime(
  iso: string | undefined,
  timezone: string | undefined
): number | null {
  if (!iso) return null;
  const hasOffset = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(iso);
  const target = hasOffset
    ? iso
    : timezone === "Asia/Tokyo"
      ? `${iso}:00+09:00`
      : `${iso}Z`;
  const t = new Date(target).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Open-Meteo の `current` は毎時 00/15/30/45 分の四半期境界で更新される。
 * その更新スケジュールに合わせて、レスポンスを「次の境界 + 上流伝搬バッファ」
 * までキャッシュするための CDN 用 TTL を返す。
 *
 * これにより:
 * - 上流が新しい値を公開した瞬間にエッジが取りに行く(常に最新)
 * - 同じ値を無駄に何度もリフェッチしない
 * - 上流遅延時は短い SWR でカバー
 */
export function nextWeatherUpdateTtl(
  currentTimeIso: string | undefined,
  timezone: string | undefined,
  now: number = Date.now()
): { maxAge: number; swr: number } {
  const observed = parseObservedTime(currentTimeIso, timezone);
  if (observed === null) return { maxAge: 60, swr: 180 };

  const SLOT_MS = 15 * 60 * 1000;
  const PROPAGATION_BUFFER_MS = 90 * 1000;
  const targetMs = observed + SLOT_MS + PROPAGATION_BUFFER_MS;
  const secondsUntil = Math.floor((targetMs - now) / 1000);

  // 30秒未満まで詰めると CDN が空転気味になるので下限 30 秒、
  // 16.5分(SLOT + buffer)を上限としてキャップ。
  const maxAge = Math.max(30, Math.min(secondsUntil, 16 * 60 + 30));
  return { maxAge, swr: 180 };
}

export function extractWeatherCurrent(
  response: WeatherResponse | undefined,
  key: WeatherCurrentKey
): number | null {
  if (!response?.current) return null;
  const v = response.current[key];
  return typeof v === "number" ? v : null;
}

export function extractWeatherHourly(
  response: WeatherResponse | undefined,
  key: WeatherHourlyKey
): { time: string[]; values: (number | null)[] } {
  if (!response?.hourly) return { time: [], values: [] };
  const time = (response.hourly.time as string[]) ?? [];
  const raw = response.hourly[key] as number[] | undefined;
  const values = raw ? raw.map((v) => (typeof v === "number" ? v : null)) : [];
  return { time, values };
}

/**
 * WMO weather code → icon + JP label.
 * https://open-meteo.com/en/docs#weathervariables
 */
export function classifyWeatherCode(code: number | null): { label: string; icon: WeatherIcon } {
  if (code === null || Number.isNaN(code)) return { label: "—", icon: "cloud" };
  if (code === 0) return { label: "快晴", icon: "sun" };
  if (code === 1) return { label: "晴れ", icon: "sun" };
  if (code === 2) return { label: "薄曇り", icon: "cloud" };
  if (code === 3) return { label: "曇り", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "霧", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "霧雨", icon: "rain" };
  if (code >= 61 && code <= 67) return { label: "雨", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "雪", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "にわか雨", icon: "rain" };
  if (code === 85 || code === 86) return { label: "にわか雪", icon: "snow" };
  if (code === 95) return { label: "雷雨", icon: "storm" };
  if (code === 96 || code === 99) return { label: "雹を伴う雷雨", icon: "storm" };
  return { label: "—", icon: "cloud" };
}

/**
 * Convert wind direction degrees → 8-direction Japanese kanji.
 * Open-Meteo returns the direction the wind is coming FROM.
 * 0=N, 90=E, 180=S, 270=W.
 */
export function windDirectionLabel(deg: number | null): string {
  if (deg === null || Number.isNaN(deg)) return "—";
  const dirs = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return dirs[idx];
}
