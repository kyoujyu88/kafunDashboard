"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { METRICS } from "@/data/metrics.config";
import { getIntensityInfo } from "@/lib/intensity";
import { cn } from "@/lib/cn";
import type { HeroSummary } from "@/lib/heroSummary";
import type { MetricKey } from "@/lib/openMeteo.types";

interface Props {
  summary: HeroSummary | null;
  onSelectMetric?: (metric: MetricKey) => void;
}

const TONE_BG: Record<HeroSummary["tone"], string> = {
  calm: "from-emerald-50 via-cyan-50 to-cyan-100 dark:from-emerald-950/30 dark:via-cyan-950/30 dark:to-cyan-900/30",
  moderate: "from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-amber-900/30",
  high: "from-orange-50 via-amber-50 to-orange-100 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-orange-900/40",
  very_high: "from-rose-50 via-red-50 to-rose-100 dark:from-rose-950/40 dark:via-red-950/40 dark:to-rose-900/40",
};

const TONE_RING: Record<HeroSummary["tone"], string> = {
  calm: "ring-cyan-200/70 dark:ring-cyan-800/50",
  moderate: "ring-amber-200/70 dark:ring-amber-800/50",
  high: "ring-orange-200/70 dark:ring-orange-800/50",
  very_high: "ring-rose-200/70 dark:ring-rose-800/50",
};

export function HeroSummaryCard({ summary, onSelectMetric }: Props) {
  if (!summary) return null;

  const meta = METRICS[summary.primary.metric];
  const info = getIntensityInfo(summary.primary.metric, summary.primary.value);

  return (
    <motion.section
      aria-label="今日のサマリ"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 shadow-sm ring-1 sm:p-5",
        TONE_BG[summary.tone],
        TONE_RING[summary.tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Sparkles size={12} />
            {summary.fromWatched ? "注目項目の今" : "今のおすすめ"}
          </p>
          <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900 dark:text-slate-50 sm:text-xl">
            {summary.headline}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {summary.advice}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectMetric?.(summary.primary.metric)}
          aria-label={`${meta.label} を予報グラフに表示`}
          className="shrink-0 rounded-xl bg-white/60 px-3 py-2 text-right shadow-sm ring-1 ring-white/80 backdrop-blur transition hover:bg-white/80 active:scale-95 dark:bg-slate-900/40 dark:ring-slate-700/60 dark:hover:bg-slate-900/60"
        >
          <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {meta.shortLabel}
          </p>
          <p className="flex items-baseline justify-end gap-0.5">
            <span className={cn("text-2xl font-bold tabular-nums sm:text-3xl", info.textClass)}>
              <AnimatedNumber value={summary.primary.value} />
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {meta.unit}
            </span>
          </p>
          <p className="mt-0.5 flex items-center justify-end gap-1">
            <Badge tone={summary.primary.level}>{info.label}</Badge>
            <TrendIcon trend={summary.trend} />
          </p>
        </button>
      </div>

      {summary.others.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            その他:
          </span>
          {summary.others.map((it) => (
            <OtherChip key={it.metric} item={it} onClick={onSelectMetric} />
          ))}
        </div>
      )}
    </motion.section>
  );
}

function TrendIcon({ trend }: { trend: HeroSummary["trend"] }) {
  if (!trend) return null;
  const common = "inline";
  if (trend === "up")
    return (
      <TrendingUp size={14} className={cn(common, "text-rose-600 dark:text-rose-400")} aria-label="1時間前より上昇" />
    );
  if (trend === "down")
    return (
      <TrendingDown
        size={14}
        className={cn(common, "text-emerald-600 dark:text-emerald-400")}
        aria-label="1時間前より低下"
      />
    );
  return (
    <Minus size={14} className={cn(common, "text-slate-400")} aria-label="ほぼ横ばい" />
  );
}

function OtherChip({
  item,
  onClick,
}: {
  item: HeroSummary["others"][number];
  onClick?: (metric: MetricKey) => void;
}) {
  const meta = METRICS[item.metric];
  return (
    <button
      type="button"
      onClick={() => onClick?.(item.metric)}
      className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-white/80 transition hover:bg-white/80 active:scale-95 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/60"
    >
      <span>{meta.shortLabel}</span>
      <Badge tone={item.level} className="px-1.5 py-0">
        {/* Reuse the metric's level label inline. */}
        <span aria-hidden>
          {item.level === "very_high"
            ? "非"
            : item.level === "high"
            ? "高"
            : item.level === "moderate"
            ? "中"
            : "低"}
        </span>
      </Badge>
    </button>
  );
}
