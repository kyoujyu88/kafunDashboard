"use client";

import { Atom } from "lucide-react";
import { useRadiation } from "@/hooks/useRadiation";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

interface Props {
  regionCode: string | null;
}

interface LevelMeta {
  label: string;
  textClass: string;
  bgClass: string;
  badgeClass: string;
}

function classifyRadiation(v: number): LevelMeta {
  if (v >= 1.0) {
    return {
      label: "非常に高い",
      textClass: "text-red-700 dark:text-red-300",
      bgClass: "from-red-500/20 to-red-700/10",
      badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
  }
  if (v >= 0.23) {
    return {
      label: "高い",
      textClass: "text-orange-700 dark:text-orange-300",
      bgClass: "from-orange-400/20 to-orange-600/10",
      badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    };
  }
  if (v >= 0.10) {
    return {
      label: "やや高",
      textClass: "text-yellow-700 dark:text-yellow-300",
      bgClass: "from-yellow-300/20 to-yellow-500/10",
      badgeClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
  }
  return {
    label: "良好",
    textClass: "text-emerald-600 dark:text-emerald-300",
    bgClass: "from-emerald-400/20 to-emerald-600/10",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
}

function formatLatestAt(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "本日";
    if (days < 30) return `${days}日前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `約${months}ヶ月前`;
    return `約${Math.floor(months / 12)}年前`;
  } catch {
    return "";
  }
}

export function RadiationCard({ regionCode }: Props) {
  const { data, isLoading } = useRadiation(regionCode);

  if (isLoading && !data) {
    return <Skeleton className="h-24 rounded-2xl" />;
  }

  const value = data?.valueMicroSvH ?? null;
  const level = value !== null ? classifyRadiation(value) : null;
  const latestLabel = formatLatestAt(data?.latestAt ?? null);

  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br p-3 shadow-sm ring-1 ring-slate-200/70 sm:p-4 dark:ring-slate-700/60",
        level?.bgClass ?? "from-slate-200/20 to-slate-300/10"
      )}
    >
      <div className="flex items-center gap-2">
        <Atom
          size={16}
          className={level?.textClass ?? "text-slate-400"}
        />
        <h3 className="text-xs font-semibold text-slate-700 sm:text-sm dark:text-slate-200">
          放射線量
        </h3>
        {data?.status === "sparse" && (
          <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-300">
            ⚠ サンプル少
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums sm:text-3xl",
              level?.textClass ?? "text-slate-400"
            )}
          >
            {value !== null ? value.toFixed(3) : "—"}
          </span>
          {value !== null && (
            <span className="text-[10px] text-slate-500 sm:text-xs dark:text-slate-400">
              µSv/h
            </span>
          )}
        </div>

        {level && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
              level.badgeClass
            )}
          >
            {level.label}
          </span>
        )}

        {!level && data?.status !== "nodata" && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            データなし
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>
          SAFECAST
          {data?.count ? ` (${data.count}件)` : ""}
        </span>
        {latestLabel && <span>最終 {latestLabel}</span>}
      </div>
    </div>
  );
}
