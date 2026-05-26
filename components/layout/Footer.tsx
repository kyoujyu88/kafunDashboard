export function Footer() {
  return (
    <footer className="safe-pb mx-auto mt-12 max-w-7xl px-4 pb-8 pt-6 text-center text-xs text-slate-500 dark:text-slate-400">
      <p>
        データ提供: <a className="underline decoration-dotted" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo Air Quality API</a>
      </p>
      <p className="mt-1">
        本サイトは情報提供のみを目的としています。健康に関する判断は医療従事者にご相談ください。
      </p>
    </footer>
  );
}
