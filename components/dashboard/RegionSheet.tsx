"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { LocateFixed, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  groupByRegion,
  searchPrefectures,
  type Prefecture,
  type SubRegion,
} from "@/lib/regions";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrefCode: string;
  currentSubKey?: string;
  availableSubRegions: SubRegion[];
  onSelectPrefecture: (code: string) => void;
  onSelectSubRegion: (prefCode: string, subKey: string | null) => void;
  onUseGps: (lat: number, lng: number, label?: string) => void;
  onClearGps: () => void;
  fromGps: boolean;
}

export function RegionSheet({
  open,
  onOpenChange,
  currentPrefCode,
  currentSubKey,
  availableSubRegions,
  onSelectPrefecture,
  onSelectSubRegion,
  onUseGps,
  onClearGps,
  fromGps,
}: Props) {
  const [query, setQuery] = useState("");
  const [expandedRegion, setExpandedRegion] = useState<string>("関東");

  const groups = useMemo(() => groupByRegion(), []);
  const filtered = useMemo(() => searchPrefectures(query), [query]);
  const showSearchResults = query.trim().length > 0;

  const handlePickPref = (p: Prefecture) => {
    onSelectPrefecture(p.code);
    try {
      navigator.vibrate?.(10);
    } catch {
      // ignore
    }
    // Keep the sheet open so the user can refine to a sub-region without re-opening.
    if ((SUB_COUNTS[p.code] ?? 0) === 0) onOpenChange(false);
  };

  const handlePickSub = (subKey: string | null) => {
    onSelectSubRegion(currentPrefCode, subKey);
    try {
      navigator.vibrate?.(8);
    } catch {
      // ignore
    }
    onOpenChange(false);
  };

  const handleGeolocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("お使いのブラウザは現在地の取得に対応していません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onUseGps(pos.coords.latitude, pos.coords.longitude, "現在地");
        onOpenChange(false);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "位置情報の利用が許可されていません。ブラウザ設定をご確認ください"
            : "現在地を取得できませんでした";
        alert(msg);
      },
      { timeout: 10000, enableHighAccuracy: false }
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
                className="safe-pb fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 lg:left-1/2 lg:right-auto lg:bottom-auto lg:top-20 lg:max-h-[640px] lg:w-[440px] lg:-translate-x-1/2 lg:rounded-2xl"
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
                  <LocateFixed size={16} />
                  {fromGps ? "現在地を再取得" : "現在地を使う"}
                </button>

                {fromGps && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearGps();
                      onOpenChange(false);
                    }}
                    className="mx-4 mb-2 text-xs text-slate-500 underline decoration-dotted hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    現在地モードを解除して地域選択に戻る
                  </button>
                )}

                {!showSearchResults && availableSubRegions.length > 0 && !fromGps && (
                  <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      地域内の地点を絞り込む
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePickSub(null)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95",
                          !currentSubKey
                            ? "bg-cyan-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        県全体
                      </button>
                      {availableSubRegions.map((sub) => (
                        <button
                          key={sub.key}
                          type="button"
                          onClick={() => handlePickSub(sub.key)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95",
                            currentSubKey === sub.key
                              ? "bg-cyan-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          )}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
                  {showSearchResults ? (
                    <ul>
                      {filtered.map((p) => (
                        <li key={p.code}>
                          <button
                            type="button"
                            onClick={() => handlePickPref(p)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition active:scale-[0.99]",
                              p.code === currentPrefCode
                                ? "bg-cyan-50 dark:bg-cyan-950/40"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            <span>
                              <span className="font-medium">{p.name}</span>
                              <span className="ml-2 text-xs text-slate-500">{p.capital}</span>
                              {(SUB_COUNTS[p.code] ?? 0) > 0 && (
                                <span className="ml-2 text-[10px] text-cyan-600 dark:text-cyan-400">
                                  +{SUB_COUNTS[p.code]}地点
                                </span>
                              )}
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
                                      onClick={() => handlePickPref(p)}
                                      className={cn(
                                        "flex w-full items-center justify-between rounded-xl px-5 py-2.5 text-left text-sm transition active:scale-[0.99]",
                                        p.code === currentPrefCode
                                          ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                      )}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="font-medium">{p.name}</span>
                                        {(SUB_COUNTS[p.code] ?? 0) > 0 && (
                                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                                            +{SUB_COUNTS[p.code]}地点
                                          </span>
                                        )}
                                      </span>
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

// Tiny lookup of sub-region count per prefecture for the "+N地点" badge.
// Imported lazily so the JSON parse stays out of the hot path of the prefecture list.
import subRegionsData from "@/data/subRegions.json";
const SUB_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(subRegionsData as Record<string, unknown[]>).map(([k, v]) => [k, v.length])
);
