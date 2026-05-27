"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Switch from "@radix-ui/react-switch";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Star, BellRing, RotateCcw } from "lucide-react";
import {
  AIR_OPTIONS,
  ALERT_LEVEL_OPTIONS,
  PENDING_POLLEN_OPTIONS,
  POLLEN_OPTIONS,
} from "@/data/watchlist.config";
import type { WatchProfile } from "@/hooks/useWatchProfile";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: WatchProfile;
  onTogglePollen: (key: import("@/lib/openMeteo.types").PollenKey) => void;
  onToggleAir: (key: import("@/lib/openMeteo.types").AirQualityKey) => void;
  onUpdate: (patch: Partial<WatchProfile>) => void;
  onReset: () => void;
  onRequestNotification: () => Promise<NotificationPermission>;
}

export function WatchSettings({
  open,
  onOpenChange,
  profile,
  onTogglePollen,
  onToggleAir,
  onUpdate,
  onReset,
  onRequestNotification,
}: Props) {
  const totalSelected = profile.pollens.length + profile.airQuality.length;

  const handleNotificationToggle = async (next: boolean) => {
    if (next) {
      const perm = await onRequestNotification();
      onUpdate({ enableBrowserNotification: perm === "granted" });
    } else {
      onUpdate({ enableBrowserNotification: false });
    }
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
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 lg:left-1/2 lg:top-1/2 lg:bottom-auto lg:max-h-[88vh] lg:w-[600px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl"
              >
                <div className="grid place-items-center pt-2">
                  <span className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-600 lg:hidden" />
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Star className="text-cyan-500" size={18} />
                    <Dialog.Title className="text-base font-semibold">注目項目の設定</Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      aria-label="閉じる"
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    気になる花粉や大気質にチェックを入れると、該当指標を強調表示し、しきい値を超えた時にお知らせします。
                    <br />
                    設定は端末のローカル(localStorage)にのみ保存され、サーバには送信されません。
                    現在 <span className="font-semibold">{totalSelected}</span> 件選択中。
                  </p>

                  <section>
                    <h3 className="mb-2 text-sm font-semibold">花粉</h3>
                    <ul className="space-y-1.5">
                      {POLLEN_OPTIONS.map((opt) => {
                        const checked = profile.pollens.includes(opt.key);
                        return (
                          <li key={opt.key}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition",
                                checked
                                  ? "border-cyan-200 bg-cyan-50 dark:border-cyan-800/60 dark:bg-cyan-950/30"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                            >
                              <Checkbox.Root
                                checked={checked}
                                onCheckedChange={() => onTogglePollen(opt.key)}
                                className="grid h-5 w-5 place-items-center rounded border border-slate-300 bg-white data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 dark:border-slate-600 dark:bg-slate-800"
                              >
                                <Checkbox.Indicator>
                                  <Check size={14} className="text-white" />
                                </Checkbox.Indicator>
                              </Checkbox.Root>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{opt.label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{opt.description}</p>
                              </div>
                              {checked && <Star size={14} className="text-cyan-500" fill="currentColor" />}
                            </label>
                          </li>
                        );
                      })}
                      {PENDING_POLLEN_OPTIONS.map((opt) => (
                        <li key={opt.key}>
                          <div className="flex items-center gap-3 rounded-xl px-3 py-2 opacity-50">
                            <span className="grid h-5 w-5 place-items-center rounded border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                              <span className="h-2 w-2 rounded-sm bg-slate-300 dark:bg-slate-600" />
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{opt.label}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{opt.description}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-2 text-sm font-semibold">空気質</h3>
                    <ul className="space-y-1.5">
                      {AIR_OPTIONS.map((opt) => {
                        const checked = profile.airQuality.includes(opt.key);
                        return (
                          <li key={opt.key}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition",
                                checked
                                  ? "border-cyan-200 bg-cyan-50 dark:border-cyan-800/60 dark:bg-cyan-950/30"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                            >
                              <Checkbox.Root
                                checked={checked}
                                onCheckedChange={() => onToggleAir(opt.key)}
                                className="grid h-5 w-5 place-items-center rounded border border-slate-300 bg-white data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 dark:border-slate-600 dark:bg-slate-800"
                              >
                                <Checkbox.Indicator>
                                  <Check size={14} className="text-white" />
                                </Checkbox.Indicator>
                              </Checkbox.Root>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{opt.label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{opt.description}</p>
                              </div>
                              {checked && <Star size={14} className="text-cyan-500" fill="currentColor" />}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-2 text-sm font-semibold">アラートしきい値</h3>
                    <RadioGroup.Root
                      value={profile.alertLevel}
                      onValueChange={(v) =>
                        onUpdate({ alertLevel: v as WatchProfile["alertLevel"] })
                      }
                      className="space-y-1.5"
                    >
                      {ALERT_LEVEL_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition",
                            profile.alertLevel === opt.value
                              ? "bg-cyan-50 dark:bg-cyan-950/30"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <RadioGroup.Item
                            value={opt.value}
                            className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 bg-white data-[state=checked]:border-cyan-500 dark:border-slate-600 dark:bg-slate-800"
                          >
                            <RadioGroup.Indicator className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                          </RadioGroup.Item>
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </RadioGroup.Root>
                  </section>

                  <section>
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/50">
                      <div className="flex items-start gap-2">
                        <BellRing size={18} className="mt-0.5 text-cyan-500" />
                        <div>
                          <p className="text-sm font-medium">ブラウザ通知</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            しきい値を超えた時にブラウザ通知でお知らせ(タブを開いている時)
                          </p>
                        </div>
                      </div>
                      <Switch.Root
                        checked={profile.enableBrowserNotification}
                        onCheckedChange={handleNotificationToggle}
                        className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition data-[state=checked]:bg-cyan-500 dark:bg-slate-600"
                      >
                        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
                      </Switch.Root>
                    </div>
                  </section>

                  <button
                    type="button"
                    onClick={onReset}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <RotateCcw size={14} />
                    注目項目をリセット
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
