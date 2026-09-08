import { Rss, Code2, Bot, FileText } from "lucide-react";
import { DATA_SOURCES, SORAMAME } from "@/data/dataSources";

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
      <p className="leading-relaxed">
        データ提供:
        <a
          className="mx-1 underline decoration-dotted"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo
        </a>
        (花粉・空気質:{" "}
        <a
          className="underline decoration-dotted"
          href={DATA_SOURCES.cams_global.url}
          target="_blank"
          rel="noreferrer"
          title={DATA_SOURCES.cams_global.description}
        >
          CAMS Global
        </a>
        、気象:{" "}
        <a
          className="underline decoration-dotted"
          href={DATA_SOURCES.ecmwf.url}
          target="_blank"
          rel="noreferrer"
          title={DATA_SOURCES.ecmwf.description}
        >
          ECMWF
        </a>
        ){" "}/{" "}
        <a
          className="underline decoration-dotted"
          href={DATA_SOURCES.safecast.url}
          target="_blank"
          rel="noreferrer"
          title={DATA_SOURCES.safecast.description}
        >
          SAFECAST
        </a>{" "}
        (放射線)
      </p>
      <p className="mt-1 leading-relaxed">
        花粉値は <strong>grains/m³</strong>(CAMSモデルの予報単位)。
        日本の実測単位「個/cm²/日」とは異なります。
      </p>
      <p className="mt-1 leading-relaxed">
        PM2.5・大気質は <strong>約40km格子のモデル推計値</strong>で、常時監視局の実測ではありません。
        国内の実測値(1時間値・速報)は{" "}
        <a
          className="underline decoration-dotted"
          href={SORAMAME.url}
          target="_blank"
          rel="noreferrer"
          title={SORAMAME.description}
        >
          {SORAMAME.name}
        </a>{" "}
        で確認できます。
      </p>
      <p className="mt-2">
        本サイトは情報提供のみを目的としています。健康に関する判断は医療従事者にご相談ください。
      </p>
    </footer>
  );
}
