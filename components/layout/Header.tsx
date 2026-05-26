"use client";

import { Wind, Settings2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  regionName: string;
  onOpenSettings: () => void;
  onOpenRegion: () => void;
  lastUpdated: string | null;
}

export function Header({ regionName, onOpenSettings, onOpenRegion, lastUpdated }: Props) {
  return (
    <header className="safe-pt sticky top-0 z-30 glass-strong border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-white shadow-md">
            <Wind size={18} />
          </span>
          <span className="hidden text-base sm:inline">KafunAir</span>
        </div>

        <button
          type="button"
          onClick={onOpenRegion}
          className="ml-1 flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/70 px-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition active:scale-[0.98] dark:bg-slate-800/70 dark:text-slate-200 dark:ring-slate-700/80 sm:flex-initial sm:px-4"
          aria-label={`地域: ${regionName}。タップで変更`}
        >
          <span className="truncate max-w-[160px] sm:max-w-none">{regionName}</span>
          <span className="text-xs text-slate-400">▾</span>
        </button>

        {lastUpdated && (
          <span className="hidden text-xs text-slate-500 dark:text-slate-400 md:inline">
            最終更新 {lastUpdated}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="アレルギー設定を開く"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200/60 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-700/60"
          >
            <Settings2 size={18} />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
