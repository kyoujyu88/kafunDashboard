export type PollenKey =
  | "alder_pollen"
  | "birch_pollen"
  | "grass_pollen"
  | "mugwort_pollen"
  | "olive_pollen"
  | "ragweed_pollen";

export type AirQualityKey =
  | "pm10"
  | "pm2_5"
  | "carbon_monoxide"
  | "nitrogen_dioxide"
  | "sulphur_dioxide"
  | "ozone"
  | "european_aqi"
  | "dust"
  | "uv_index";

export type MetricKey = PollenKey | AirQualityKey;

export const POLLEN_KEYS: PollenKey[] = [
  "alder_pollen",
  "birch_pollen",
  "grass_pollen",
  "mugwort_pollen",
  "olive_pollen",
  "ragweed_pollen",
];

export const AIR_QUALITY_KEYS: AirQualityKey[] = [
  "pm2_5",
  "pm10",
  "dust",
  "uv_index",
  "ozone",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "carbon_monoxide",
  "european_aqi",
];

export const ALL_METRIC_KEYS: MetricKey[] = [...POLLEN_KEYS, ...AIR_QUALITY_KEYS];

export interface OpenMeteoCurrent {
  time: string;
  interval?: number;
  [k: string]: number | string | undefined;
}

export interface OpenMeteoHourly {
  time: string[];
  [k: string]: number[] | string[] | undefined;
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  current?: OpenMeteoCurrent;
  current_units?: Record<string, string>;
  hourly?: OpenMeteoHourly;
  hourly_units?: Record<string, string>;
}

export interface PrefectureSnapshot {
  code: string;
  name: string;
  lat: number;
  lng: number;
  current: Partial<Record<MetricKey, number | null>>;
  fetchedAt: number;
  error?: string;
}
