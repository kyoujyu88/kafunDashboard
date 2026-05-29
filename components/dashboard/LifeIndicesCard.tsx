"use client";

import type { IndexResult } from "@/lib/lifeIndex";
import { INTENSITY_META } from "@/data/metrics.config";
import { cn } from "@/lib/cn";

interface Props {
  indices: IndexResult[];
}

export function LifeIndicesCard({ indices }: Props) {
  if (indices.length === 0) return null;

  return (
    <section
      aria-label="生活指数"
      className="rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200/70 sm:p-4 dark:bg-slate-900/60 dark:ring-slate-700/60"
    >
      <h3 className="mb-2 text-sm font-semibold text-slate-700 sm:text-base dark:text-slate-200">
        今日の生活指数
      </h3>
      <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {indices.map((idx) => {
          const meta = INTENSITY_META[idx.level];
          return (
            <li
              key={idx.key}
              className={cn(
                "rounded-xl bg-gradient-to-br p-2.5 ring-1 ring-slate-200/60 sm:p-3 dark:ring-slate-700/40",
                meta.bgClass,
                idx.starred && `ring-2 ${meta.ringClass}`,
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "shrink-0 text-2xl font-bold tabular-nums leading-none sm:text-3xl",
                    meta.textClass,
                  )}
                >
                  {idx.symbol}
                </span>
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {idx.title}
                  </span>
                  <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100 sm:text-sm">
                    {idx.headline}
                  </span>
                </div>
                {idx.starred && (
                  <span aria-label="注目指標" className="shrink-0 text-xs">
                    ⭐
                  </span>
                )}
              </div>
              <p className="mt-1.5 line-clamp-2 text-[10px] text-slate-600 dark:text-slate-300 sm:text-[11px]">
                {idx.reason}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
