import { ALL_METRIC_KEYS, type MetricKey, type OpenMeteoResponse } from "./openMeteo.types";

const BASE_URL =
  process.env.NEXT_PUBLIC_OPEN_METEO_BASE ?? "https://air-quality-api.open-meteo.com/v1";

export interface FetchHistoryOptions {
  /** YYYY-MM-DD in JST */
  startDate: string;
  /** YYYY-MM-DD in JST */
  endDate: string;
  hourly?: MetricKey[];
  signal?: AbortSignal;
}

export async function fetchAirQualityHistory(
  lat: number,
  lng: number,
  opts: FetchHistoryOptions
): Promise<OpenMeteoResponse> {
  const { startDate, endDate, hourly = ALL_METRIC_KEYS, signal } = opts;
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    timezone: "Asia/Tokyo",
    start_date: startDate,
    end_date: endDate,
    hourly: hourly.join(","),
  });
  const res = await fetch(`${BASE_URL}/air-quality?${params.toString()}`, {
    signal,
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo history error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as OpenMeteoResponse;
}

const JST_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayJst(): string {
  return JST_DATE_FORMAT.format(new Date());
}

export function jstDateAddDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return JST_DATE_FORMAT.format(d);
}
