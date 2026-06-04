"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import type { EChartsOption } from "echarts";
import { EChartsWrapper } from "@/components/charts/EChartsWrapper";
import { type MetricKey, type OpenMeteoResponse } from "@/lib/openMeteo.types";
import { METRICS, INTENSITY_META } from "@/data/metrics.config";
import { extractHourlySeries } from "@/lib/openMeteo";
import type { WeatherResponse } from "@/lib/weather.types";
import { WindLane } from "./WindLane";

interface Props {
  data: OpenMeteoResponse | undefined;
  weather?: WeatherResponse;
  metric: MetricKey;
}

const PRESET_COLORS = ["#06b6d4", "#f97316", "#22c55e", "#a855f7", "#ef4444", "#eab308"];

const WEEKDAYS_JP = ["日", "月", "火", "水", "木", "金", "土"];

function formatDateRange(time: string[]): string {
  if (time.length === 0) return "";
  const first = new Date(time[0]);
  const last = new Date(time[time.length - 1]);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(first)} – ${fmt(last)}`;
}

export function ForecastChart({ data, weather, metric }: Props) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const dateRange = formatDateRange(extractHourlySeries(data, metric).time);

  const option = useMemo(() => {
    const { time, values } = extractHourlySeries(data, metric);
    const meta = METRICS[metric];
    const intensityMarks = meta.thresholds;
    const intensityColors = INTENSITY_META;

    // Align precipitation to the air-quality time index by ISO string
    const precipByTime = new Map<string, number>();
    if (weather?.hourly) {
      const wt = (weather.hourly.time as string[]) ?? [];
      const wp = (weather.hourly.precipitation as number[]) ?? [];
      for (let i = 0; i < wt.length; i++) {
        if (typeof wp[i] === "number") precipByTime.set(wt[i], wp[i]);
      }
    }
    const hasWeather = precipByTime.size > 0;
    const precipAligned = hasWeather ? time.map((t) => precipByTime.get(t) ?? null) : [];

    const yAxes: unknown[] = [
      {
        type: "value" as const,
        axisLabel: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: dark ? "#1e293b" : "#e2e8f0" } },
      },
    ];
    if (hasWeather) {
      yAxes.push({
        type: "value" as const,
        position: "right" as const,
        name: "mm",
        nameTextStyle: { color: dark ? "#64748b" : "#94a3b8", fontSize: 10, padding: [0, 0, 0, 12] },
        min: 0,
        max: (v: { max: number }) => Math.max(Math.ceil(v.max * 1.5), 4),
        axisLabel: { color: dark ? "#64748b" : "#94a3b8", fontSize: 9 },
        splitLine: { show: false },
      });
    }

    const series: unknown[] = [];
    if (hasWeather) {
      series.push({
        name: "降水",
        type: "bar" as const,
        yAxisIndex: 1,
        z: 1,
        data: precipAligned,
        itemStyle: {
          color: dark ? "rgba(56,189,248,0.45)" : "rgba(14,165,233,0.4)",
          borderRadius: [2, 2, 0, 0],
        },
        barCategoryGap: "30%",
      });
    }
    series.push({
      name: meta.label,
      type: "line" as const,
      yAxisIndex: 0,
      z: 2,
      smooth: true,
      showSymbol: false,
      data: values,
      lineStyle: { width: 2.5, color: PRESET_COLORS[0] },
      areaStyle: {
        color: {
          type: "linear" as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: dark ? "rgba(6,182,212,0.35)" : "rgba(6,182,212,0.4)" },
            { offset: 1, color: "rgba(6,182,212,0.0)" },
          ],
        },
      },
      markLine: {
        silent: true,
        symbol: "none",
        label: { show: false },
        data: [
          {
            yAxis: intensityMarks.moderate,
            lineStyle: { color: intensityColors.moderate.colorHex, type: "dashed" as const, width: 1.5 },
          },
          {
            yAxis: intensityMarks.high,
            lineStyle: { color: intensityColors.high.colorHex, type: "dashed" as const, width: 1.5 },
          },
          {
            yAxis: intensityMarks.very_high,
            lineStyle: { color: intensityColors.very_high.colorHex, type: "dashed" as const, width: 1.5 },
          },
        ],
      },
    });

    const opt = {
      animationDuration: 400,
      grid: {
        left: 48,
        right: hasWeather ? 36 : 12,
        top: 18,
        bottom: 36,
        containLabel: false,
      },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
        borderColor: dark ? "#334155" : "#e2e8f0",
        textStyle: { color: dark ? "#e2e8f0" : "#0f172a" },
        valueFormatter: (v: unknown) => (typeof v === "number" ? `${v.toFixed(1)} ${meta.unit}` : "—"),
      },
      xAxis: {
        type: "category" as const,
        data: time,
        axisLabel: {
          color: dark ? "#cbd5e1" : "#475569",
          fontSize: 10,
          margin: 10,
          interval: (_idx: number, value: string) => {
            // Label only at noon of each day → 5 evenly spaced major ticks for a 5-day forecast.
            return new Date(value).getHours() === 12;
          },
          formatter: (value: string) => {
            const d = new Date(value);
            const day = WEEKDAYS_JP[d.getDay()];
            return `${d.getMonth() + 1}/${d.getDate()}\n(${day})`;
          },
        },
        axisTick: {
          alignWithLabel: false,
          interval: (_idx: number, value: string) => new Date(value).getHours() === 0,
          lineStyle: { color: dark ? "#475569" : "#cbd5e1" },
        },
        splitLine: {
          show: true,
          interval: (_idx: number, value: string) => new Date(value).getHours() === 0,
          lineStyle: { color: dark ? "#334155" : "#e2e8f0", type: "dashed" as const },
        },
        axisLine: { lineStyle: { color: dark ? "#475569" : "#cbd5e1" } },
      },
      yAxis: yAxes,
      dataZoom: [{ type: "inside" as const, throttle: 50 }],
      series,
    };
    return opt as EChartsOption;
  }, [data, metric, dark, weather]);

  return (
    <div className="rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:ring-slate-700/60 sm:p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold sm:text-base">
          予報グラフ
          <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            {METRICS[metric].label}
            {dateRange && <span className="ml-1">・{dateRange} (5日間)</span>}
          </span>
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">{METRICS[metric].unit}</span>
      </div>

      <div className="h-[260px] sm:h-[320px]">
        <EChartsWrapper option={option} notMerge />
      </div>

      {weather && (
        <div className="mt-1 border-t border-slate-200/60 pt-2 dark:border-slate-700/50">
          <WindLane weather={weather} />
        </div>
      )}

      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        💡 上のカードをタップすると指標を切り替えできます{weather ? "・薄い水色のバーは降水量、矢印は風が吹く向きで色は風の強さ" : ""}
      </p>
    </div>
  );
}
