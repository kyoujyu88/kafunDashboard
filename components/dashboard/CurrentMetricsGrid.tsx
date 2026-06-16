"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MetricCard } from "./MetricCard";
import { extractCurrentValue } from "@/lib/openMeteo";
import { ALL_METRIC_KEYS, type MetricKey, type OpenMeteoResponse } from "@/lib/openMeteo.types";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  data: OpenMeteoResponse | undefined;
  isLoading: boolean;
  regionCode: string;
  highlightKeys: MetricKey[];
  selectedMetric?: MetricKey;
  onSelectMetric?: (metric: MetricKey) => void;
  /** When true, only show metrics in `highlightKeys`. Falls back to all when empty. */
  focusOnly?: boolean;
}

export function CurrentMetricsGrid({
  data,
  isLoading,
  regionCode,
  highlightKeys,
  selectedMetric,
  onSelectMetric,
  focusOnly = false,
}: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const highlightSet = new Set(highlightKeys);
  const allOrdered: MetricKey[] = [
    ...highlightKeys.filter((k) => ALL_METRIC_KEYS.includes(k)),
    ...ALL_METRIC_KEYS.filter((k) => !highlightSet.has(k)),
  ];
  // Focus mode collapses the grid to watched cards only; if the user has
  // nothing watched yet, we fall back to showing everything so the screen
  // is never empty.
  const ordered = focusOnly && highlightKeys.length > 0
    ? allOrdered.filter((k) => highlightSet.has(k))
    : allOrdered;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={regionCode}
        initial="hidden"
        animate="show"
        exit="hidden"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.04 } },
        }}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4"
      >
        {ordered.map((key) => (
          <MetricCard
            key={key}
            metric={key}
            value={extractCurrentValue(data, key)}
            highlighted={highlightSet.has(key)}
            selected={selectedMetric === key}
            onSelect={onSelectMetric}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
