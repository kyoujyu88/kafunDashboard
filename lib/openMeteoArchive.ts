import { ALL_METRIC_KEYS, type MetricKey, type OpenMeteoResponse } from "./openMeteo.types";

const BASE_URL =
  process.env.NEXT_PUBLIC_OPEN_METEO_BASE ?? "https://air-quality-api.open-meteo.com/v1";

export interface FetchHistoryOptions {
  /**
   * Use the past_days parameter (1-92). Required for pollen metrics —
   * the Air Quality API only returns pollen values when fetched via past_days
   * (past_days replays past forecast values, while start_date/end_date does not).
   */
  pastDays?: number;
  /** Alternative: explicit date range (YYYY-MM-DD JST). Pollen values may be null. */
  startDate?: string;
  endDate?: string;
  hourly?: MetricKey[];
  signal?: AbortSignal;
}

export async function fetchAirQualityHistory(
  lat: number,
  lng: number,
  opts: FetchHistoryOptions
): Promise<OpenMeteoResponse> {
  const { pastDays, startDate, endDate, hourly = ALL_METRIC_KEYS, signal } = opts;
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    timezone: "Asia/Tokyo",
    hourly: hourly.join(","),
  });
  if (typeof pastDays === "number") {
    params.set("past_days", String(Math.min(Math.max(pastDays, 1), 92)));
    params.set("forecast_days", "0");
  } else if (startDate && endDate) {
    params.set("start_date", startDate);
    params.set("end_date", endDate);
  } else {
    throw new Error("fetchAirQualityHistory requires either pastDays or startDate/endDate");
  }
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
