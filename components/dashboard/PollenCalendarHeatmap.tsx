"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import type { EChartsOption } from "echarts";
import { EChartsWrapper } from "@/components/charts/EChartsWrapper";
import { METRICS, INTENSITY_META } from "@/data/metrics.config";
import { type PollenKey } from "@/lib/openMeteo.types";
import type { PollenCalendarResponse } from "@/app/api/region/[code]/pollen-calendar/route";

interface Props {
  data: PollenCalendarResponse | undefined;
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function PollenCalendarHeatmap({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const option = useMemo<EChartsOption>(() => {
    const entries = Object.entries(data?.monthly ?? {}) as [PollenKey, number[]][];
    const yLabels = entries.map(([k]) => METRICS[k].shortLabel);
    const points: [number, number, number][] = [];
    let maxVal = 0;
    entries.forEach(([, arr], y) => {
      arr.forEach((v, m) => {
        points.push([m, y, v]);
        if (v > maxVal) maxVal = v;
      });
    });

    const visualMax = Math.max(maxVal, 50);

    return {
      animationDuration: 400,
      grid: { left: 64, right: 16, top: 10, bottom: 50, containLabel: false },
      tooltip: {
        position: "top",
        backgroundColor: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
        borderColor: dark ? "#334155" : "#e2e8f0",
        textStyle: { color: dark ? "#e2e8f0" : "#0f172a", fontSize: 11 },
        formatter: (params: unknown) => {
          const p = params as { data: [number, number, number] };
          const [m, y, v] = p.data;
          return `${yLabels[y]}・${MONTHS[m]}<br/>平均 ${v.toFixed(1)} grains/m³`;
        },
      },
      xAxis: {
        type: "category",
        data: MONTHS,
        splitArea: { show: true },
        axisLabel: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
        axisLine: { lineStyle: { color: dark ? "#475569" : "#cbd5e1" } },
      },
      yAxis: {
        type: "category",
        data: yLabels,
        splitArea: { show: true },
        axisLabel: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
        axisLine: { lineStyle: { color: dark ? "#475569" : "#cbd5e1" } },
      },
      visualMap: {
        min: 0,
        max: visualMax,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemHeight: 80,
        itemWidth: 12,
        textStyle: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
        inRange: {
          color: [
            INTENSITY_META.low.colorHex,
            INTENSITY_META.moderate.colorHex,
            INTENSITY_META.high.colorHex,
            INTENSITY_META.very_high.colorHex,
          ],
        },
      },
      series: [
        {
          name: "花粉量",
          type: "heatmap",
          data: points,
          label: { show: false },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.4)" } },
        },
      ],
    };
  }, [data, dark]);

  if (!data || Object.keys(data.monthly).length === 0) {
    return (
      <div className="grid place-items-center py-8 text-xs text-slate-500 dark:text-slate-400">
        この地域では主要な花粉のデータがありません
      </div>
    );
  }

  const seriesCount = Object.keys(data.monthly).length;
  const height = Math.max(160, seriesCount * 38);

  return (
    <div style={{ height }}>
      <EChartsWrapper option={option} notMerge />
    </div>
  );
}
