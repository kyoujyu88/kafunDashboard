"use client";

import { windDirectionLabel } from "@/lib/weather";
import { cn } from "@/lib/cn";

interface Props {
  /** Direction (degrees) the wind is coming FROM. */
  degrees: number | null;
  /** Wind speed in m/s. */
  speedMs?: number | null;
  size?: number;
  className?: string;
}

/**
 * Small compass-style arrow indicating wind direction.
 * The arrow points in the direction the wind is BLOWING TOWARD
 * (rotated 180° from the "from" direction Open-Meteo returns) for intuitive reading.
 */
export function WindCompass({ degrees, speedMs, size = 28, className }: Props) {
  const label = windDirectionLabel(degrees);
  const rotation = degrees !== null ? (degrees + 180) % 360 : 0;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="shrink-0 text-slate-600 dark:text-slate-300"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "12px 12px" }}>
          <path
            d="M12 4 L16 14 L12 11.5 L8 14 Z"
            fill="currentColor"
          />
        </g>
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100">
          {label}
        </span>
        {typeof speedMs === "number" && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {speedMs.toFixed(1)}m/s
          </span>
        )}
      </div>
    </div>
  );
}
