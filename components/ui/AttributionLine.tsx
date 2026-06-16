import { DATA_SOURCES, type DataSourceId } from "@/data/dataSources";
import { cn } from "@/lib/cn";

interface Props {
  sources: DataSourceId[];
  /** Optional note appended after sources, e.g. "推計値". */
  note?: string;
  className?: string;
}

/**
 * Tiny inline attribution line for charts and panels. Keeps each surface honest
 * about which model produced the displayed values.
 */
export function AttributionLine({ sources, note, className }: Props) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1 text-[10px] text-slate-400 dark:text-slate-500",
        className
      )}
    >
      <span>出所:</span>
      {sources.map((id, idx) => {
        const s = DATA_SOURCES[id];
        return (
          <span key={id}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              title={s.description}
              className="underline decoration-dotted hover:text-slate-600 dark:hover:text-slate-300"
            >
              {s.name}
            </a>
            {idx < sources.length - 1 && <span aria-hidden>・</span>}
          </span>
        );
      })}
      {note && <span>・{note}</span>}
    </p>
  );
}
