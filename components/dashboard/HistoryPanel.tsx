"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import * as Tabs from "@radix-ui/react-tabs";
import { useHistory } from "@/hooks/useHistory";
import { usePollenCalendar } from "@/hooks/usePollenCalendar";
import { Skeleton } from "@/components/ui/Skeleton";
import { METRICS } from "@/data/metrics.config";
import type { MetricKey } from "@/lib/openMeteo.types";
import { cn } from "@/lib/cn";

const HistoryChart = dynamic(
  () => import("./HistoryChart").then((m) => m.HistoryChart),
  { ssr: false, loading: () => <Skeleton className="h-[220px] rounded-xl sm:h-[260px]" /> }
);

const PollenCalendarHeatmap = dynamic(
  () => import("./PollenCalendarHeatmap").then((m) => m.PollenCalendarHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-[200px] rounded-xl" /> }
);

interface Props {
  regionCode: string | null;
  selectedMetric: MetricKey;
}

type TabId = "week" | "yoy" | "calendar";

function formatRange(range: { startDate: string; endDate: string } | undefined) {
  if (!range) return "";
  const s = range.startDate.slice(5).replace("-", "/");
  const e = range.endDate.slice(5).replace("-", "/");
  return `${s} – ${e}`;
}

export function HistoryPanel({ regionCode, selectedMetric }: Props) {
  const [tab, setTab] = useState<TabId>("week");
  const week = useHistory(tab === "week" ? regionCode : null, { days: 7 });
  const yoy = useHistory(tab === "yoy" ? regionCode : null, { days: 30, compare: "yoy" });
  const calendar = usePollenCalendar(tab === "calendar" ? regionCode : null);

  return (
    <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabId)}>
      <Tabs.List
        className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60"
        aria-label="履歴ビュー"
      >
        <TabTrigger value="week">過去7日</TabTrigger>
        <TabTrigger value="yoy">前年比 (30日)</TabTrigger>
        <TabTrigger value="calendar">花粉カレンダー</TabTrigger>
      </Tabs.List>

      <Tabs.Content value="week" className="mt-3 focus:outline-none">
        <div className="mb-1 flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{METRICS[selectedMetric].label} の推移</span>
          <span>{formatRange(week.data?.range)}</span>
        </div>
        {week.isLoading || !week.data ? (
          <Skeleton className="h-[220px] rounded-xl sm:h-[260px]" />
        ) : (
          <HistoryChart data={week.data} metric={selectedMetric} />
        )}
      </Tabs.Content>

      <Tabs.Content value="yoy" className="mt-3 focus:outline-none">
        <div className="mb-1 flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{METRICS[selectedMetric].label}・今期 vs 前年</span>
          <span>{formatRange(yoy.data?.range)}</span>
        </div>
        {yoy.isLoading || !yoy.data ? (
          <Skeleton className="h-[220px] rounded-xl sm:h-[260px]" />
        ) : (
          <HistoryChart data={yoy.data} metric={selectedMetric} />
        )}
      </Tabs.Content>

      <Tabs.Content value="calendar" className="mt-3 focus:outline-none">
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          直近1年の月別平均(grains/m³)
        </p>
        {calendar.isLoading || !calendar.data ? (
          <Skeleton className="h-[200px] rounded-xl" />
        ) : (
          <PollenCalendarHeatmap data={calendar.data} />
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}

function TabTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition",
        "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
        "dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50",
      )}
    >
      {children}
    </Tabs.Trigger>
  );
}
