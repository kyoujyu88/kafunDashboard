"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { AIR_OPTIONS, POLLEN_OPTIONS } from "@/data/watchlist.config";
import type { WatchProfile } from "@/hooks/useWatchProfile";
import type { AirQualityKey, PollenKey } from "@/lib/openMeteo.types";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (profile: Partial<WatchProfile>) => void;
}

export function OnboardingDialog({ open, onOpenChange, onSave }: Props) {
  const [step, setStep] = useState(0);
  const [pollens, setPollens] = useState<PollenKey[]>([]);
  const [air, setAir] = useState<AirQualityKey[]>(["pm2_5"]);

  const toggle = <T extends string>(arr: T[], k: T, setter: (next: T[]) => void) => {
    setter(arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);
  };

  const finish = () => {
    onSave({ pollens, airQuality: air, onboarded: true });
    onOpenChange(false);
  };

  const skip = () => {
    onSave({ onboarded: true });
    onOpenChange(false);
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
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="safe-pb fixed inset-x-3 bottom-3 z-50 flex max-h-[88dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-cyan-500" size={18} />
                    <Dialog.Title className="text-base font-semibold">KafunAir へようこそ</Dialog.Title>
                  </div>
                  <button
                    aria-label="あとで設定"
                    onClick={skip}
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mx-4 mb-3 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    animate={{ width: `${((step + 1) / 3) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
                  {step === 0 && (
                    <div>
                      <p className="text-sm font-medium">気になる花粉はありますか?</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        該当指標を強調表示&アラートでお知らせします(あとで変更可)
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {POLLEN_OPTIONS.map((opt) => {
                          const checked = pollens.includes(opt.key);
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => toggle(pollens, opt.key, setPollens)}
                              className={cn(
                                "rounded-xl border p-3 text-left transition active:scale-[0.98]",
                                checked
                                  ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30"
                                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                              )}
                            >
                              <p className="text-sm font-medium">{opt.label}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {opt.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <p className="text-sm font-medium">空気質で気になる指標は?</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        わからない場合はPM2.5だけでもOK
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {AIR_OPTIONS.map((opt) => {
                          const checked = air.includes(opt.key);
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => toggle(air, opt.key, setAir)}
                              className={cn(
                                "rounded-xl border p-3 text-left transition active:scale-[0.98]",
                                checked
                                  ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30"
                                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                              )}
                            >
                              <p className="text-sm font-medium">{opt.label}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {opt.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="py-2 text-center">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-white shadow-lg">
                        <Sparkles size={28} />
                      </div>
                      <p className="mt-4 text-base font-semibold">準備完了!</p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        花粉 {pollens.length}件 / 空気質 {air.length}件 を注目項目に登録します。
                      </p>
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        ヘッダーの歯車アイコンからいつでも変更できます。
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 px-4 py-3 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => (step > 0 ? setStep(step - 1) : skip())}
                    className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={14} />
                    {step === 0 ? "あとで" : "戻る"}
                  </button>
                  {step < 2 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      className="inline-flex h-10 items-center gap-1 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600"
                    >
                      次へ
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finish}
                      className="inline-flex h-10 items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 text-sm font-semibold text-white shadow-sm"
                    >
                      始める
                    </button>
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
