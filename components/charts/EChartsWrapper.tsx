"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react").then((m) => m.default), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-slate-200/50 dark:bg-slate-800/50" />,
});

interface Props {
  option: EChartsOption;
  style?: CSSProperties;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  notMerge?: boolean;
  theme?: string;
}

export function EChartsWrapper({ option, style, className, onEvents, notMerge = false, theme }: Props) {
  return (
    <ReactECharts
      option={option}
      style={style ?? { height: "100%", width: "100%" }}
      className={className}
      onEvents={onEvents}
      notMerge={notMerge}
      lazyUpdate
      theme={theme}
    />
  );
}
