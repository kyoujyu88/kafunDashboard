"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import type { EChartsOption } from "echarts";
import { EChartsWrapper } from "@/components/charts/EChartsWrapper";
import { type MetricKey } from "@/lib/openMeteo.types";
import { METRICS, INTENSITY_META } from "@/data/metrics.config";
import { extractHourlySeries } from "@/lib/openMeteo";
import type { HistoryData } from "@/hooks/useHistory";

interface Props {
  data: HistoryData | undefined;
  metric: MetricKey;
}

export function HistoryChart({ data, metric }: Props) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const option = useMemo<EChartsOption>(() => {
    const meta = METRICS[metric];
    const intensity = INTENSITY_META;

    const cur = data ? extractHourlySeries(data.current, metric) : { time: [], values: [] };
    const yoy = data?.previousYear ? extractHourlySeries(data.previousYear, metric) : null;

    const series: EChartsOption["series"] = [
      {
        name: "今期",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: cur.values,
        lineStyle: { width: 2.5, color: "#06b6d4" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: dark ? "rgba(6,182,212,0.35)" : "rgba(6,182,212,0.4)" },
              { offset: 1, color: "rgba(6,182,212,0)" },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          data: [
            { yAxis: meta.thresholds.moderate, lineStyle: { color: intensity.moderate.colorHex, type: "dashed", width: 1.2 } },
            { yAxis: meta.thresholds.high, lineStyle: { color: intensity.high.colorHex, type: "dashed", width: 1.2 } },
            { yAxis: meta.thresholds.very_high, lineStyle: { color: intensity.very_high.colorHex, type: "dashed", width: 1.2 } },
          ],
        },
      },
    ];

    if (yoy && yoy.values.length > 0) {
      // Align YoY values to the current x-axis by index
      const aligned = cur.values.map((_, i) => yoy.values[i] ?? null);
      (series as unknown[]).push({
        name: "前年",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: aligned,
        lineStyle: { width: 1.5, color: dark ? "#94a3b8" : "#64748b", type: "dashed" },
        z: 1,
      });
    }

    return {
      animationDuration: 400,
      grid: { left: 48, right: 12, top: 30, bottom: 40, containLabel: false },
      legend: yoy
        ? {
            data: ["今期", "前年"],
            textStyle: { color: dark ? "#cbd5e1" : "#475569", fontSize: 11 },
            top: 6,
          }
        : { show: false },
      tooltip: {
        trigger: "axis",
        backgroundColor: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
        borderColor: dark ? "#334155" : "#e2e8f0",
        textStyle: { color: dark ? "#e2e8f0" : "#0f172a" },
        valueFormatter: (v: unknown) => (typeof v === "number" ? `${v.toFixed(1)} ${meta.unit}` : "—"),
      },
      xAxis: {
        type: "category",
        data: cur.time,
        axisLabel: {
          color: dark ? "#94a3b8" : "#64748b",
          fontSize: 10,
          margin: 8,
          formatter: (value: string) => {
            const d = new Date(value);
            const h = d.getHours();
            if (h === 0) return `${d.getMonth() + 1}/${d.getDate()}`;
            return "";
          },
          hideOverlap: true,
        },
        axisLine: { lineStyle: { color: dark ? "#475569" : "#cbd5e1" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: dark ? "#1e293b" : "#e2e8f0" } },
      },
      series,
    };
  }, [data, metric, dark]);

  return (
    <div className="h-[220px] sm:h-[260px]">
      <EChartsWrapper option={option} notMerge />
    </div>
  );
}
