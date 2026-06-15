"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

const KEY = "kafun.beta.dismissed.v2";

export function BetaNotice() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs text-cyan-900 ring-1 ring-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-100 dark:ring-cyan-900/40">
      <Info size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 space-y-1 leading-relaxed">
        <p>
          表示している花粉・空気質値は <strong>CAMS Global モデル(~45km)</strong>の予報推計で、地上観測ではありません。
        </p>
        <p>
          対応花粉:ハンノキ・シラカバ・イネ科・ヨモギ・オリーブ・ブタクサ(6種)。
          <span className="font-medium">スギ・ヒノキは将来対応予定</span>です。
        </p>
      </div>
      <button
        type="button"
        aria-label="閉じる"
        onClick={() => {
          try {
            window.localStorage.setItem(KEY, "1");
          } catch {
            // ignore
          }
          setDismissed(true);
        }}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/60"
      >
        <X size={14} />
      </button>
    </div>
  );
}
