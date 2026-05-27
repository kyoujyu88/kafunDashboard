"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme === "system" ? resolvedTheme : theme) : null;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "ライトモードに切替" : "ダークモードに切替"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-200/60 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-700/60"
    >
      {mounted ? (
        isDark ? <Sun size={18} /> : <Moon size={18} />
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
