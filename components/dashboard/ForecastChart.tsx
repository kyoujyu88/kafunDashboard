"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { EChartsWrapper } from "@/components/charts/EChartsWrapper";
import { ALL_METRIC_KEYS, type MetricKey, type OpenMeteoResponse } from "@/lib/openMeteo.types";
import { METRICS, INTENSITY_META } from "@/data/metrics.config";
import { extractHourlySeries } from "@/lib/openMeteo";
import { cn } from "@/lib/cn";

interface Props {
  data: OpenMeteoResponse | undefined;
  defaultMetric?: MetricKey;
}

const PRESET_COLORS = ["#06b6d4", "#f97316", "#22c55e", "#a855f7", "#ef4444", "#eab308"];

export function ForecastChart({ data, defaultMetric = "pm2_5" }: Props) {
  const [selected, setSelected] = useState<MetricKey>(defaultMetric);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const option = useMemo(() => {
    const { time, values } = extractHourlySeries(data, selected);
    const meta = METRICS[selected];
    const intensityMarks = meta.thresholds;
    const intensityColors = INTENSITY_META;

    return {
      animationDuration: 400,
      grid: { left: 44, right: 16, top: 30, bottom: 40 },
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
          color: dark ? "#94a3b8" : "#64748b",
          fontSize: 10,
          formatter: (value: string) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
          },
          hideOverlap: true,
        },
        axisLine: { lineStyle: { color: dark ? "#475569" : "#cbd5e1" } },
      },
      yAxis: {
        type: "value" as const,
        axisLabel: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: dark ? "#1e293b" : "#e2e8f0" } },
      },
      dataZoom: [
        { type: "inside" as const, throttle: 50 },
        { type: "slider" as const, height: 18, bottom: 6, borderColor: "transparent", fillerColor: dark ? "#334155" : "#cbd5e1" },
      ],
      series: [
        {
          name: meta.label,
          type: "line" as const,
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
            data: [
              { yAxis: intensityMarks.moderate, lineStyle: { color: intensityColors.moderate.colorHex, type: "dashed" as const } },
              { yAxis: intensityMarks.high, lineStyle: { color: intensityColors.high.colorHex, type: "dashed" as const } },
              { yAxis: intensityMarks.very_high, lineStyle: { color: intensityColors.very_high.colorHex, type: "dashed" as const } },
            ],
          },
        },
      ],
    };
  }, [data, selected, dark]);

  return (
    <div className="rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:ring-slate-700/60 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold sm:text-base">予報グラフ(5日間)</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">{METRICS[selected].unit}</span>
      </div>

      <div className="-mx-3 mb-3 flex gap-1 overflow-x-auto px-3 pb-1 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible">
        {ALL_METRIC_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setSelected(k)}
            type="button"
            className={cn(
              "shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95",
              selected === k
                ? "bg-cyan-500 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {METRICS[k].shortLabel}
          </button>
        ))}
      </div>

      <div className="h-[260px] sm:h-[320px]">
        <EChartsWrapper option={option} notMerge />
      </div>
    </div>
  );
}
