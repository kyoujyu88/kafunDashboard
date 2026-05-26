"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { groupByRegion, nearestPrefecture, searchPrefectures, type Prefecture } from "@/lib/regions";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCode: string;
  onSelect: (code: string) => void;
}

export function RegionSheet({ open, onOpenChange, currentCode, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [expandedRegion, setExpandedRegion] = useState<string>("関東");

  const groups = useMemo(() => groupByRegion(), []);
  const filtered = useMemo(() => searchPrefectures(query), [query]);
  const showSearchResults = query.trim().length > 0;

  const handleSelect = (p: Prefecture) => {
    onSelect(p.code);
    try {
      navigator.vibrate?.(10);
    } catch {
      // ignore
    }
    onOpenChange(false);
  };

  const handleGeolocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = nearestPrefecture(pos.coords.latitude, pos.coords.longitude);
        handleSelect(p);
      },
      () => {
        /* ignore */
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 280 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 120 || info.velocity.y > 500) onOpenChange(false);
                }}
                className="safe-pb fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 lg:left-1/2 lg:right-auto lg:bottom-auto lg:top-20 lg:max-h-[600px] lg:w-[420px] lg:-translate-x-1/2 lg:rounded-2xl"
              >
                <div className="grid place-items-center pt-2">
                  <span className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-600 lg:hidden" />
                </div>

                <div className="flex items-center justify-between px-4 py-2">
                  <Dialog.Title className="text-base font-semibold">地域を選ぶ</Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      aria-label="閉じる"
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">
                    <Search size={16} className="text-slate-400" />
                    <input
                      autoFocus={false}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="地域名・ローマ字で検索 (tokyo, おおさか…)"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGeolocate}
                  className="mx-4 mb-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
                >
                  <MapPin size={16} />
                  現在地を使う
                </button>

                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
                  {showSearchResults ? (
                    <ul>
                      {filtered.map((p) => (
                        <li key={p.code}>
                          <button
                            type="button"
                            onClick={() => handleSelect(p)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition active:scale-[0.99]",
                              p.code === currentCode
                                ? "bg-cyan-50 dark:bg-cyan-950/40"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            <span>
                              <span className="font-medium">{p.name}</span>
                              <span className="ml-2 text-xs text-slate-500">{p.capital}</span>
                            </span>
                            <span className="text-xs text-slate-400">{p.region}</span>
                          </button>
                        </li>
                      ))}
                      {filtered.length === 0 && (
                        <p className="px-3 py-6 text-center text-sm text-slate-500">該当する地域がありません</p>
                      )}
                    </ul>
                  ) : (
                    groups.map((g) => {
                      const expanded = expandedRegion === g.region;
                      return (
                        <div key={g.region} className="mb-1">
                          <button
                            type="button"
                            onClick={() => setExpandedRegion(expanded ? "" : g.region)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <span>{g.region}</span>
                            <span className="text-xs text-slate-400">{expanded ? "−" : "+"}</span>
                          </button>
                          <AnimatePresence>
                            {expanded && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                {g.prefs.map((p) => (
                                  <li key={p.code}>
                                    <button
                                      type="button"
                                      onClick={() => handleSelect(p)}
                                      className={cn(
                                        "flex w-full items-center justify-between rounded-xl px-5 py-2.5 text-left text-sm transition active:scale-[0.99]",
                                        p.code === currentCode
                                          ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                      )}
                                    >
                                      <span className="font-medium">{p.name}</span>
                                      <span className="text-xs text-slate-500">{p.capital}</span>
                                    </button>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
