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
    next: { revalidate: 600 },
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo weather error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as WeatherResponse;
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
