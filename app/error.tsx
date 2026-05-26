"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-xl font-bold">エラーが発生しました</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        データの取得に失敗しました。再試行してください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
      >
        再試行
      </button>
    </div>
  );
}
