"use client";

import { useMemo } from "react";
import { windDirectionLabel } from "@/lib/weather";
import type { WeatherResponse } from "@/lib/weather.types";
import { cn } from "@/lib/cn";

interface Props {
  weather: WeatherResponse | undefined;
  /** Sample interval in hours. */
  stepHours?: number;
  className?: string;
}

interface WindSample {
  iso: string;
  hour: number;
  isDayStart: boolean;
  dateLabel: string;
  deg: number | null;
  speed: number | null;
}

/** Wind speed (m/s) → color tier. Beaufort-ish thresholds. */
function windColor(speed: number | null): string {
  if (speed === null) return "#94a3b8";
  if (speed < 2) return "#38bdf8"; // calm — sky
  if (speed < 5) return "#10b981"; // light — emerald
  if (speed < 8) return "#eab308"; // moderate — yellow
  if (speed < 12) return "#f97316"; // fresh — orange
  return "#dc2626"; // strong — red
}

export function WindLane({ weather, stepHours = 6, className }: Props) {
  const samples = useMemo<WindSample[]>(() => {
    if (!weather?.hourly) return [];
    const time = (weather.hourly.time as string[]) ?? [];
    const dir = (weather.hourly.wind_direction_10m as number[]) ?? [];
    const spd = (weather.hourly.wind_speed_10m as number[]) ?? [];
    const out: WindSample[] = [];
    for (let i = 0; i < time.length; i += stepHours) {
      const iso = time[i];
      const d = new Date(iso);
      const hour = d.getHours();
      out.push({
        iso,
        hour,
        isDayStart: hour === 0,
        dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
        deg: typeof dir[i] === "number" ? dir[i] : null,
        speed: typeof spd[i] === "number" ? spd[i] : null,
      });
    }
    return out;
  }, [weather, stepHours]);

  if (samples.length === 0) return null;

  return (
    <div className={cn("mt-1", className)}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          風向・風速
        </span>
        <span className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500">
          弱
          <span className="inline-flex overflow-hidden rounded-full">
            <i className="h-2 w-3" style={{ background: "#38bdf8" }} />
            <i className="h-2 w-3" style={{ background: "#10b981" }} />
            <i className="h-2 w-3" style={{ background: "#eab308" }} />
            <i className="h-2 w-3" style={{ background: "#f97316" }} />
            <i className="h-2 w-3" style={{ background: "#dc2626" }} />
          </span>
          強
        </span>
      </div>

      <div className="flex items-end">
        {samples.map((s) => {
          const color = windColor(s.speed);
          // Arrow points in the direction the wind is BLOWING TOWARD (deg + 180).
          const rotation = s.deg !== null ? (s.deg + 180) % 360 : 0;
          const title =
            s.deg !== null && s.speed !== null
              ? `${s.dateLabel} ${s.hour}:00 ${windDirectionLabel(s.deg)}の風 ${s.speed.toFixed(1)}m/s`
              : `${s.dateLabel} ${s.hour}:00 データなし`;
          return (
            <div
              key={s.iso}
              title={title}
              className="flex flex-1 flex-col items-center gap-0.5"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
                <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "12px 12px" }}>
                  {/* shaft + arrowhead for clear directionality */}
                  <line x1="12" y1="19" x2="12" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 4 L16.5 11 L12 8.8 L7.5 11 Z" fill={color} />
                </g>
              </svg>
              <span
                className="text-[8px] tabular-nums leading-none"
                style={{ color }}
              >
                {s.speed !== null ? s.speed.toFixed(0) : "–"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-0.5 flex">
        {samples.map((s) => (
          <span
            key={s.iso}
            className="flex-1 text-center text-[8px] text-slate-400 dark:text-slate-500"
          >
            {s.isDayStart ? s.dateLabel : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
