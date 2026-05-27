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
}

export function CurrentMetricsGrid({ data, isLoading, regionCode, highlightKeys }: Props) {
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
  const ordered: MetricKey[] = [
    ...highlightKeys.filter((k) => ALL_METRIC_KEYS.includes(k)),
    ...ALL_METRIC_KEYS.filter((k) => !highlightSet.has(k)),
  ];

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
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
