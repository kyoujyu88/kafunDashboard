export type WeatherHourlyKey =
  | "temperature_2m"
  | "relative_humidity_2m"
  | "precipitation"
  | "precipitation_probability"
  | "wind_speed_10m"
  | "wind_direction_10m"
  | "surface_pressure"
  | "weather_code";

export type WeatherCurrentKey =
  | "temperature_2m"
  | "relative_humidity_2m"
  | "precipitation"
  | "wind_speed_10m"
  | "wind_direction_10m"
  | "weather_code";

export const WEATHER_HOURLY_KEYS: WeatherHourlyKey[] = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "precipitation_probability",
  "wind_speed_10m",
  "wind_direction_10m",
  "surface_pressure",
  "weather_code",
];

export const WEATHER_CURRENT_KEYS: WeatherCurrentKey[] = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "wind_speed_10m",
  "wind_direction_10m",
  "weather_code",
];

export interface WeatherCurrent {
  time: string;
  interval?: number;
  [k: string]: number | string | undefined;
}

export interface WeatherHourly {
  time: string[];
  [k: string]: number[] | string[] | undefined;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  current?: WeatherCurrent;
  current_units?: Record<string, string>;
  hourly?: WeatherHourly;
  hourly_units?: Record<string, string>;
}

export type WeatherIcon = "sun" | "cloud" | "rain" | "snow" | "fog" | "storm";
