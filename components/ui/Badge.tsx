import { cn } from "@/lib/cn";

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "low" | "moderate" | "high" | "very_high";
}

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "bg-slate-200/70 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  very_high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
};

export function Badge({ tone = "neutral", className, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide",
        TONE[tone],
        className
      )}
      {...rest}
    />
  );
}
