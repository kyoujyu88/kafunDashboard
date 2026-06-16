import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "オフライン — KafunAir",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 text-2xl font-bold text-white">
          K
        </div>
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          オフラインです
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          インターネットに接続できないため、最新の花粉・空気質データを取得できません。
          オンラインに戻り次第、自動で更新されます。
        </p>
        {/* Full reload (not next/link) so the SW retries the network for fresh data. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="mt-4 inline-block rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-500"
        >
          再読み込み
        </a>
      </div>
    </main>
  );
}
