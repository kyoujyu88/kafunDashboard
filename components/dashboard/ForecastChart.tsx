"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { EChartsWrapper } from "@/components/charts/EChartsWrapper";
import { type MetricKey, type OpenMeteoResponse } from "@/lib/openMeteo.types";
import { METRICS, INTENSITY_META } from "@/data/metrics.config";
import { extractHourlySeries } from "@/lib/openMeteo";

interface Props {
  data: OpenMeteoResponse | undefined;
  metric: MetricKey;
}

const PRESET_COLORS = ["#06b6d4", "#f97316", "#22c55e", "#a855f7", "#ef4444", "#eab308"];

export function ForecastChart({ data, metric }: Props) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const option = useMemo(() => {
    const { time, values } = extractHourlySeries(data, metric);
    const meta = METRICS[metric];
    const intensityMarks = meta.thresholds;
    const intensityColors = INTENSITY_META;

    return {
      animationDuration: 400,
      grid: { left: 48, right: 12, top: 30, bottom: 64, containLabel: false },
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
          margin: 10,
          formatter: (value: string) => {
            const d = new Date(value);
            const h = d.getHours();
            if (h === 0) return `${d.getMonth() + 1}/${d.getDate()}\n0:00`;
            if (h % 6 === 0) return `${h}:00`;
            return "";
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
        {
          type: "slider" as const,
          height: 20,
          bottom: 8,
          borderColor: "transparent",
          backgroundColor: dark ? "#1e293b" : "#f1f5f9",
          fillerColor: dark ? "#334155" : "#cbd5e1",
          handleStyle: { color: dark ? "#64748b" : "#94a3b8" },
          moveHandleStyle: { color: dark ? "#475569" : "#cbd5e1" },
          dataBackground: { lineStyle: { color: dark ? "#334155" : "#cbd5e1" }, areaStyle: { color: dark ? "#1e293b" : "#f1f5f9" } },
          showDetail: false,
        },
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
        },
      ],
    };
  }, [data, metric, dark]);

  return (
    <div className="rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:ring-slate-700/60 sm:p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold sm:text-base">
          予報グラフ
          <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            {METRICS[metric].label}・5日間
          </span>
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">{METRICS[metric].unit}</span>
      </div>

      <div className="h-[260px] sm:h-[320px]">
        <EChartsWrapper option={option} notMerge />
      </div>

      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        💡 上のカードをタップすると指標を切り替えできます
      </p>
    </div>
  );
}
