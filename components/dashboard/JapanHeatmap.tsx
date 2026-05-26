"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { EChartsWrapper } from "@/components/charts/EChartsWrapper";
import { useNationwide } from "@/hooks/useNationwide";
import { ALL_METRIC_KEYS, type MetricKey } from "@/lib/openMeteo.types";
import { METRICS, INTENSITY_META } from "@/data/metrics.config";
import { PREFECTURES } from "@/lib/regions";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

interface Props {
  selectedCode: string;
  onSelect: (code: string) => void;
  defaultMetric?: MetricKey;
}

export function JapanHeatmap({ selectedCode, onSelect, defaultMetric = "pm2_5" }: Props) {
  const [metric, setMetric] = useState<MetricKey>(defaultMetric);
  const { data, isLoading } = useNationwide();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const option = useMemo(() => {
    const meta = METRICS[metric];
    const points = PREFECTURES.map((p) => {
      const snap = data?.find((s) => s.code === p.code);
      const value = snap?.current?.[metric];
      const v = typeof value === "number" ? value : null;
      return {
        name: p.name,
        value: [p.lng, p.lat, v ?? 0],
        prefCode: p.code,
        rawValue: v,
        isSelected: p.code === selectedCode,
      };
    });

    const validValues = points
      .map((p) => p.rawValue)
      .filter((v): v is number => typeof v === "number");
    const maxValue = validValues.length
      ? Math.max(meta.thresholds.high, ...validValues)
      : meta.thresholds.very_high;

    return {
      animation: true,
      tooltip: {
        trigger: "item" as const,
        backgroundColor: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
        borderColor: dark ? "#334155" : "#e2e8f0",
        textStyle: { color: dark ? "#e2e8f0" : "#0f172a" },
        formatter: (params: unknown) => {
          const p = params as { name: string; data: { rawValue: number | null } };
          const v = p.data.rawValue;
          return `<b>${p.name}</b><br/>${meta.label}: ${v === null ? "—" : `${v.toFixed(1)} ${meta.unit}`}`;
        },
      },
      grid: { left: 0, right: 0, top: 8, bottom: 0, containLabel: false },
      xAxis: {
        type: "value" as const,
        min: 122,
        max: 148,
        show: false,
        splitLine: { show: false },
      },
      yAxis: {
        type: "value" as const,
        min: 24,
        max: 46,
        show: false,
        splitLine: { show: false },
      },
      visualMap: {
        type: "continuous" as const,
        min: 0,
        max: maxValue,
        inRange: {
          color: [
            INTENSITY_META.low.colorHex,
            INTENSITY_META.moderate.colorHex,
            INTENSITY_META.high.colorHex,
            INTENSITY_META.very_high.colorHex,
          ],
        },
        textStyle: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
        bottom: 8,
        right: 8,
        itemWidth: 10,
        itemHeight: 80,
        orient: "vertical" as const,
        calculable: false,
      },
      series: [
        {
          type: "scatter" as const,
          coordinateSystem: "cartesian2d" as const,
          symbolSize: (val: number[]) => {
            const v = val[2];
            const ratio = Math.min(1, Math.max(0.2, v / Math.max(maxValue, 1)));
            return 14 + ratio * 22;
          },
          data: points,
          itemStyle: {
            opacity: 0.85,
            borderWidth: 1,
            borderColor: dark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)",
          },
          emphasis: {
            scale: 1.2,
            itemStyle: { borderColor: "#06b6d4", borderWidth: 2, opacity: 1 },
          },
          z: 2,
        },
        {
          type: "scatter" as const,
          coordinateSystem: "cartesian2d" as const,
          silent: true,
          symbol: "circle",
          symbolSize: 44,
          data: points
            .filter((p) => p.isSelected)
            .map((p) => ({ value: [p.value[0], p.value[1]] })),
          itemStyle: {
            color: "transparent",
            borderColor: "#06b6d4",
            borderWidth: 3,
          },
          z: 1,
        },
      ],
    };
  }, [data, metric, selectedCode, dark]);

  const onEvents = useMemo(
    () => ({
      click: (params: unknown) => {
        const p = params as { data?: { prefCode?: string } };
        if (p.data?.prefCode) onSelect(p.data.prefCode);
      },
    }),
    [onSelect]
  );

  return (
    <div className="rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:ring-slate-700/60 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold sm:text-base">全国マップ</h2>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricKey)}
          className="rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
        >
          {ALL_METRIC_KEYS.map((k) => (
            <option key={k} value={k}>
              {METRICS[k].shortLabel}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
        円の大きさと色が <span className="font-medium">{METRICS[metric].label}</span> の強さを表します。タップで地域選択。
      </p>

      <div className={cn("relative h-[360px] sm:h-[420px]", isLoading && "opacity-60")}>
        {isLoading && !data ? (
          <Skeleton className="absolute inset-0" />
        ) : (
          <EChartsWrapper option={option} onEvents={onEvents} notMerge />
        )}
      </div>
    </div>
  );
}
