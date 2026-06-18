"use client";

import { Cloud, CloudFog, CloudRain, Snowflake, Sun, Zap } from "lucide-react";
import { classifyWeatherCode, extractWeatherCurrent } from "@/lib/weather";
import type { WeatherIcon, WeatherResponse } from "@/lib/weather.types";
import { WindCompass } from "./WindCompass";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

interface Props {
  data: WeatherResponse | undefined;
}

const ICON_MAP: Record<WeatherIcon, typeof Sun> = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  fog: CloudFog,
  storm: Zap,
};

const ICON_TONE: Record<WeatherIcon, string> = {
  sun: "text-amber-500 dark:text-amber-300",
  cloud: "text-slate-500 dark:text-slate-300",
  rain: "text-sky-500 dark:text-sky-300",
  snow: "text-sky-400 dark:text-sky-200",
  fog: "text-slate-400 dark:text-slate-400",
  storm: "text-purple-500 dark:text-purple-300",
};

export function WeatherSummaryCard({ data }: Props) {
  if (!data) return null;

  const temp = extractWeatherCurrent(data, "temperature_2m");
  const humidity = extractWeatherCurrent(data, "relative_humidity_2m");
  const precip = extractWeatherCurrent(data, "precipitation");
  const windSpeed = extractWeatherCurrent(data, "wind_speed_10m");
  const windDir = extractWeatherCurrent(data, "wind_direction_10m");
  const code = extractWeatherCurrent(data, "weather_code");
  const { label, icon } = classifyWeatherCode(code);
  const Icon = ICON_MAP[icon];

  // Open-Meteo の current.time は timezone=Asia/Tokyo を渡しているのでタイムゾーン
  // 指定なし文字列で返る。Date が UTC として解釈してしまうのを避けるため +09:00 を補う。
  const observedAt =
    data.current?.time && data.timezone === "Asia/Tokyo"
      ? new Date(`${data.current.time}:00+09:00`).getTime()
      : data.current?.time
        ? new Date(data.current.time).getTime()
        : null;
  const ageMin = observedAt !== null ? Math.floor((Date.now() - observedAt) / 60_000) : null;
  const stale = ageMin !== null && ageMin >= 60;

  return (
    <section
      aria-label="気象サマリー"
      className="rounded-2xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-slate-200/70 sm:px-4 sm:py-2.5 dark:bg-slate-900/60 dark:ring-slate-700/60"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex shrink-0 items-center gap-2">
          <Icon size={28} className={cn("shrink-0", ICON_TONE[icon])} />
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50 sm:text-2xl">
              {temp !== null ? `${temp.toFixed(0)}°` : "—"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
              {label}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs sm:gap-5 sm:text-sm">
          <Stat label="湿度" value={humidity !== null ? `${humidity.toFixed(0)}%` : "—"} />
          <Stat label="降水" value={precip !== null ? `${precip.toFixed(1)}mm` : "—"} />
          <WindCompass degrees={windDir} speedMs={windSpeed} size={26} />
        </div>
      </div>
      {observedAt !== null && (
        <p
          className={cn(
            "mt-1 text-[10px] tabular-nums",
            stale
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-400 dark:text-slate-500"
          )}
        >
          観測 {formatRelative(observedAt)}
          {stale && " (古い可能性あり)"}
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100 sm:text-sm">
        {value}
      </span>
    </div>
  );
}
