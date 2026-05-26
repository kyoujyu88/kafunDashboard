"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useNationwide } from "@/hooks/useNationwide";
import { ALL_METRIC_KEYS, type MetricKey } from "@/lib/openMeteo.types";
import { METRICS, INTENSITY_META } from "@/data/metrics.config";
import { PREFECTURES } from "@/lib/regions";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

// Load echarts only on client
const EChartsReact = dynamic(() => import("echarts-for-react").then((m) => m.default), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0" />,
});

interface Props {
  selectedCode: string;
  onSelect: (code: string) => void;
  defaultMetric?: MetricKey;
}

// name → code lookup
const NAME_TO_CODE = Object.fromEntries(PREFECTURES.map((p) => [p.name, p.code]));

export function JapanHeatmap({ selectedCode, onSelect, defaultMetric = "pm2_5" }: Props) {
  const [metric, setMetric] = useState<MetricKey>(defaultMetric);
  const { data, isLoading } = useNationwide();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [geoReady, setGeoReady] = useState(false);
  const registeredRef = useRef(false);

  // Load and register GeoJSON once
  useEffect(() => {
    if (registeredRef.current) {
      setGeoReady(true);
      return;
    }
    let cancelled = false;
    Promise.all([
      import("echarts").then((m) => m.registerMap),
      fetch("/japan.geo.json").then((r) => r.json()),
    ]).then(([registerMap, geoJson]) => {
      if (cancelled) return;
      registerMap("japan", geoJson);
      registeredRef.current = true;
      setGeoReady(true);
    }).catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, []);

  const option = useMemo(() => {
    if (!geoReady) return {};

    const meta = METRICS[metric];

    // Build name→value pairs from nationwide snapshot
    const selectedName = PREFECTURES.find((p) => p.code === selectedCode)?.name;
    const mapData = PREFECTURES.map((p) => {
      const snap = data?.find((s) => s.code === p.code);
      const raw = snap?.current?.[metric];
      const value = typeof raw === "number" ? raw : null;
      return { name: p.name, value, selected: p.name === selectedName };
    });

    const validValues = mapData
      .map((d) => d.value)
      .filter((v): v is number => typeof v === "number");
    const maxValue = validValues.length
      ? Math.max(meta.thresholds.high * 1.5, ...validValues)
      : meta.thresholds.very_high;

    return {
      animation: true,
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item" as const,
        backgroundColor: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
        borderColor: dark ? "#334155" : "#e2e8f0",
        textStyle: { color: dark ? "#e2e8f0" : "#0f172a" },
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number | null };
          const v = p.value;
          return `<b>${p.name}</b><br/>${meta.label}: ${v === null || isNaN(v) ? "データなし" : `${Number(v).toFixed(1)} ${meta.unit}`}`;
        },
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
        bottom: 16,
        right: 8,
        itemWidth: 10,
        itemHeight: 70,
        orient: "vertical" as const,
        calculable: false,
        precision: 1,
        text: ["高", "低"],
      },
      series: [
        {
          type: "map" as const,
          map: "japan",
          roam: true,
          scaleLimit: { min: 0.8, max: 5 },
          zoom: 1.1,
          center: [136.5, 35.5],
          // データレベルで選択中の県だけラベル＋枠線を付与 (selectedModeは使わない)
          data: mapData.map((d) => ({
            name: d.name,
            value: d.value,
            selected: false, // selectedModeを無効にするためfalse固定
            label: d.name === selectedName
              ? {
                  show: true,
                  color: dark ? "#f1f5f9" : "#0f172a",
                  fontSize: 11,
                  fontWeight: "bold" as const,
                  textBorderColor: dark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)",
                  textBorderWidth: 2,
                }
              : { show: false },
            itemStyle: d.name === selectedName
              ? {
                  borderColor: "#06b6d4",
                  borderWidth: 2.5,
                }
              : undefined,
          })),
          nameProperty: "nam_ja",
          selectedMode: false,
          label: { show: false },
          itemStyle: {
            borderColor: dark ? "#1e293b" : "#e2e8f0",
            borderWidth: 0.5,
            areaColor: dark ? "#334155" : "#cbd5e1",
          },
          emphasis: {
            disabled: false,
            label: {
              show: true,
              color: dark ? "#f1f5f9" : "#0f172a",
              fontSize: 11,
              fontWeight: "bold" as const,
              textBorderColor: dark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)",
              textBorderWidth: 2,
            },
            itemStyle: {
              // areaColorを指定しない → visualMapの色を維持したままborderだけ強調
              borderColor: "#e2e8f0",
              borderWidth: 1.5,
            },
          },
        },
      ],
    };
  }, [geoReady, data, metric, dark, selectedCode]);

  const onEvents = useMemo(
    () => ({
      click: (params: unknown) => {
        const p = params as { name?: string };
        if (!p.name) return;
        const code = NAME_TO_CODE[p.name];
        if (code) onSelect(code);
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
        色が <span className="font-medium">{METRICS[metric].label}</span> の強さを表します。タップで地域選択。
      </p>

      <div className={cn("relative h-[360px] sm:h-[440px]", isLoading && !data && "opacity-60")}>
        {!geoReady ? (
          <Skeleton className="absolute inset-0" />
        ) : (
          <EChartsReact
            option={option}
            style={{ height: "100%", width: "100%" }}
            onEvents={onEvents}
            notMerge={false}
            lazyUpdate
          />
        )}
      </div>
    </div>
  );
}
