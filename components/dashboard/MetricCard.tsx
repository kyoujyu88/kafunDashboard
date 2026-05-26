"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { METRICS } from "@/data/metrics.config";
import { getIntensityInfo } from "@/lib/intensity";
import { cn } from "@/lib/cn";
import type { MetricKey } from "@/lib/openMeteo.types";

interface Props {
  metric: MetricKey;
  value: number | null;
  highlighted?: boolean;
}

export function MetricCard({ metric, value, highlighted = false }: Props) {
  const meta = METRICS[metric];
  const info = getIntensityInfo(metric, value);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-3 shadow-sm ring-1 ring-slate-200/70 transition sm:p-4 dark:ring-slate-700/60",
        info.bgClass,
        highlighted && "ring-2 shadow-lg",
        highlighted && info.ringClass,
      )}
    >
      {highlighted && (
        <span
          aria-label="あなたの注目項目"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/80 text-rose-500 shadow-sm dark:bg-slate-800/80"
        >
          <Heart size={14} fill="currentColor" />
        </span>
      )}

      <div className="flex items-center justify-between gap-1">
        <h3 className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-200 sm:text-sm">
          {meta.label}
        </h3>
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn("text-2xl font-bold tabular-nums sm:text-3xl", info.textClass)}>
          <AnimatedNumber value={value} />
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
          {meta.unit}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <Badge tone={info.level ?? "neutral"}>{info.label}</Badge>
        <span className="text-[10px] text-slate-500 line-clamp-1 dark:text-slate-400 sm:text-xs">
          {meta.category === "pollen" ? "花粉" : "空気質"}
        </span>
      </div>
    </motion.div>
  );
}
