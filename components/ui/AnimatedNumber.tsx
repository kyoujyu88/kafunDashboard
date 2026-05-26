"use client";

import { animate, useMotionValue, useTransform, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

interface Props {
  value: number | null;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({ value, decimals = 1, className }: Props) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => {
    if (value === null) return "—";
    const factor = 10 ** decimals;
    return (Math.round(v * factor) / factor).toLocaleString("ja-JP", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  });

  useEffect(() => {
    if (value === null) {
      mv.set(0);
      return;
    }
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [value, mv, reduce]);

  if (value === null) return <span className={className}>—</span>;
  return <motion.span className={className}>{rounded}</motion.span>;
}
