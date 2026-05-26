import {
  ALL_METRIC_KEYS,
  AIR_QUALITY_KEYS,
  POLLEN_KEYS,
  type OpenMeteoResponse,
  type PrefectureSnapshot,
  type MetricKey,
} from "./openMeteo.types";

const BASE_URL =
  process.env.NEXT_PUBLIC_OPEN_METEO_BASE ?? "https://air-quality-api.open-meteo.com/v1";

export interface FetchPointOptions {
  forecastDays?: number;
  signal?: AbortSignal;
}

export async function fetchPointAirQuality(
  lat: number,
  lng: number,
  opts: FetchPointOptions = {}
): Promise<OpenMeteoResponse> {
  const { forecastDays = 5, signal } = opts;
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    timezone: "Asia/Tokyo",
    forecast_days: String(forecastDays),
    hourly: ALL_METRIC_KEYS.join(","),
    current: ALL_METRIC_KEYS.join(","),
  });
  const url = `${BASE_URL}/air-quality?${params.toString()}`;

  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Open-Meteo API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as OpenMeteoResponse;
}

export interface Prefecture {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

export async function fetchNationwideSnapshot(
  prefs: Prefecture[],
  opts: { signal?: AbortSignal } = {}
): Promise<PrefectureSnapshot[]> {
  const { signal } = opts;
  const results = await Promise.allSettled(
    prefs.map((p) => fetchCurrentOnly(p.lat, p.lng, signal))
  );

  return prefs.map((p, idx) => {
    const r = results[idx];
    if (r.status === "fulfilled" && r.value.current) {
      const current: PrefectureSnapshot["current"] = {};
      for (const key of ALL_METRIC_KEYS) {
        const v = r.value.current[key];
        current[key] = typeof v === "number" ? v : null;
      }
      return {
        code: p.code,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        current,
        fetchedAt: Date.now(),
      };
    }
    const error = r.status === "rejected" ? String(r.reason) : "no data";
    return {
      code: p.code,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      current: {},
      fetchedAt: Date.now(),
      error,
    };
  });
}

async function fetchCurrentOnly(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<OpenMeteoResponse> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    timezone: "Asia/Tokyo",
    current: ALL_METRIC_KEYS.join(","),
  });
  const res = await fetch(`${BASE_URL}/air-quality?${params.toString()}`, {
    signal,
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as OpenMeteoResponse;
}

export function extractCurrentValue(
  response: OpenMeteoResponse | undefined,
  key: MetricKey
): number | null {
  if (!response?.current) return null;
  const v = response.current[key];
  return typeof v === "number" ? v : null;
}

export function extractHourlySeries(
  response: OpenMeteoResponse | undefined,
  key: MetricKey
): { time: string[]; values: (number | null)[] } {
  if (!response?.hourly) return { time: [], values: [] };
  const time = (response.hourly.time as string[]) ?? [];
  const raw = response.hourly[key] as number[] | undefined;
  const values = raw ? raw.map((v) => (typeof v === "number" ? v : null)) : [];
  return { time, values };
}

export { ALL_METRIC_KEYS, AIR_QUALITY_KEYS, POLLEN_KEYS };
