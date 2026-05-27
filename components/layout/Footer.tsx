import { Rss, Code2, Bot, FileText } from "lucide-react";

const LINKS = [
  { href: "/feed.xml", label: "全国RSS", icon: Rss },
  { href: "/api/openapi.json", label: "OpenAPI", icon: Code2 },
  { href: "/api/mcp", label: "MCP", icon: Bot },
  { href: "/llms.txt", label: "llms.txt", icon: FileText },
];

export function Footer() {
  return (
    <footer className="safe-pb mx-auto mt-12 max-w-7xl px-4 pb-8 pt-6 text-center text-xs text-slate-500 dark:text-slate-400">
      <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <Icon size={12} />
            {label}
          </a>
        ))}
      </nav>
      <p>
        データ提供:{" "}
        <a
          className="underline decoration-dotted"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo Air Quality API
        </a>{" "}
        /{" "}
        <a
          className="underline decoration-dotted"
          href="https://safecast.org/"
          target="_blank"
          rel="noreferrer"
        >
          SAFECAST
        </a>
      </p>
      <p className="mt-1">
        本サイトは情報提供のみを目的としています。健康に関する判断は医療従事者にご相談ください。
      </p>
    </footer>
  );
}
