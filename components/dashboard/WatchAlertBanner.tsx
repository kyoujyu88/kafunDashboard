"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { WatchAlertItem } from "@/hooks/useWatchAlerts";
import { formatTime } from "@/lib/format";

interface Props {
  alerts: WatchAlertItem[];
  highestLevel: "moderate" | "high" | "very_high" | null;
  hasProfile: boolean;
  regionName: string;
}

const LEVEL_BG = {
  moderate: "from-yellow-300/40 to-yellow-500/20 ring-yellow-300/60",
  high: "from-orange-400/40 to-orange-600/20 ring-orange-400/70",
  very_high: "from-red-500/40 to-red-700/20 ring-red-500/70",
};

export function WatchAlertBanner({ alerts, highestLevel, hasProfile, regionName }: Props) {
  if (!hasProfile) return null;

  const activeAlerts = alerts.filter((a) => a.level);
  const upcomingAlerts = alerts.filter((a) => !a.level && a.upcomingPeakAt);

  return (
    <AnimatePresence mode="wait">
      {activeAlerts.length > 0 ? (
        <motion.div
          key="alert"
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`overflow-hidden rounded-2xl bg-gradient-to-r p-3 shadow-sm ring-1 sm:p-4 ${LEVEL_BG[highestLevel ?? "moderate"]}`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold sm:text-base">
                {regionName}で
                {activeAlerts.map((a) => a.label).join("・")}
                が{highestLevel === "very_high" ? "非常に多い" : "多い"}状態です
              </p>
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-200 sm:text-sm">
                外出時はマスクの着用や窓を閉めるなどの対策をおすすめします。
              </p>
              {upcomingAlerts.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {upcomingAlerts.slice(0, 3).map((a) => (
                    <li key={a.metric}>
                      📈 {a.label}: {a.upcomingPeakAt ? formatTime(a.upcomingPeakAt) : ""}頃にピークの予報
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      ) : upcomingAlerts.length > 0 ? (
        <motion.div
          key="upcoming"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900/40"
        >
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 sm:text-sm">
            📈 24時間以内の予報:{" "}
            {upcomingAlerts
              .map((a) => `${a.label} (${a.upcomingPeakAt ? formatTime(a.upcomingPeakAt) : ""})`)
              .join(" / ")}
            に上昇予報があります
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="ok"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:ring-emerald-900/40"
        >
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-300" />
          <p className="text-xs text-emerald-800 dark:text-emerald-200 sm:text-sm">
            注目項目はすべて落ち着いています
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
