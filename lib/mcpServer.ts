import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchNationwideSnapshot, fetchPointAirQuality, extractHourlySeries } from "@/lib/openMeteo";
import { fetchRadiation } from "@/lib/safecast";
import { buildRegionSnapshot } from "@/lib/apiShape";
import { METRICS } from "@/data/metrics.config";
import { ALL_METRIC_KEYS } from "@/lib/openMeteo.types";
import { PREFECTURES, getPrefecture, searchPrefectures } from "@/lib/regions";

function jsonResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function notFound(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

export function buildMcpServer(): McpServer {
  const server = new McpServer(
    { name: "kafunair", version: "1.0.0" },
    {
      instructions:
        "日本47都道府県の花粉飛散量・大気質・放射線量を取得できます。code は JIS X 0401 の2桁コード(例: 東京 = 13)。",
    }
  );

  server.registerTool(
    "list_regions",
    {
      title: "都道府県一覧",
      description: "47都道府県のメタデータ(code/name/capital/lat/lng/region)を返す",
    },
    async () => jsonResult(PREFECTURES)
  );

  server.registerTool(
    "search_region",
    {
      title: "都道府県を検索",
      description: "ローマ字・かな・漢字で都道府県を部分一致検索する",
      inputSchema: { query: z.string().min(1) },
    },
    async ({ query }) => jsonResult(searchPrefectures(query))
  );

  server.registerTool(
    "list_metrics",
    {
      title: "指標メタデータ一覧",
      description: "全15指標(6花粉 + 9大気質)のラベル・単位・カテゴリ・しきい値を返す",
    },
    async () => jsonResult(METRICS)
  );

  server.registerTool(
    "get_current_air_quality",
    {
      title: "県の現在の大気質&花粉",
      description: "指定した都道府県の整形済みスナップショット(現在値 + 強度ラベル + 24h予報ピーク)",
      inputSchema: { code: z.string().regex(/^\d{2}$/) },
    },
    async ({ code }) => {
      const region = getPrefecture(code);
      if (!region) return notFound(`prefecture not found: ${code}`);
      try {
        const response = await fetchPointAirQuality(region.lat, region.lng, { forecastDays: 5 });
        return jsonResult(buildRegionSnapshot(region, response));
      } catch (e) {
        return notFound(`upstream error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  server.registerTool(
    "get_forecast",
    {
      title: "県の hourly 予報",
      description: "指定した県の hourly 時系列(最大120時間 = 5日)",
      inputSchema: {
        code: z.string().regex(/^\d{2}$/),
        metric: z.enum(ALL_METRIC_KEYS as [string, ...string[]]).optional(),
        hours: z.number().int().min(1).max(120).optional(),
      },
    },
    async ({ code, metric, hours }) => {
      const region = getPrefecture(code);
      if (!region) return notFound(`prefecture not found: ${code}`);
      try {
        const days = Math.min(5, Math.max(1, Math.ceil((hours ?? 120) / 24)));
        const response = await fetchPointAirQuality(region.lat, region.lng, { forecastDays: days });
        const metrics = metric ? [metric] : ALL_METRIC_KEYS;
        const limit = hours ?? 120;
        const out: Record<string, { unit: string; time: string[]; values: (number | null)[] }> = {};
        for (const key of metrics) {
          const { time, values } = extractHourlySeries(response, key as (typeof ALL_METRIC_KEYS)[number]);
          out[key] = {
            unit: METRICS[key as (typeof ALL_METRIC_KEYS)[number]].unit,
            time: time.slice(0, limit),
            values: values.slice(0, limit),
          };
        }
        return jsonResult({ region, metrics: out });
      } catch (e) {
        return notFound(`upstream error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  server.registerTool(
    "get_nationwide",
    {
      title: "全国47県の現在値",
      description: "47都道府県の最新スナップショット。metric を指定するとその指標値だけ抜粋",
      inputSchema: {
        metric: z.enum(ALL_METRIC_KEYS as [string, ...string[]]).optional(),
      },
    },
    async ({ metric }) => {
      try {
        const snaps = await fetchNationwideSnapshot(PREFECTURES);
        if (!metric) return jsonResult(snaps);
        const m = metric as (typeof ALL_METRIC_KEYS)[number];
        return jsonResult(
          snaps.map((s) => ({
            code: s.code,
            name: s.name,
            value: s.current[m] ?? null,
            unit: METRICS[m].unit,
            error: s.error,
          }))
        );
      } catch (e) {
        return notFound(`upstream error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  server.registerTool(
    "get_radiation",
    {
      title: "SAFECAST 由来の放射線量",
      description: "指定県周辺の µSv/h 中央値(SAFECAST 直近1年)。参考データであり公式値ではない",
      inputSchema: { code: z.string().regex(/^\d{2}$/) },
    },
    async ({ code }) => {
      const region = getPrefecture(code);
      if (!region) return notFound(`prefecture not found: ${code}`);
      try {
        const result = await fetchRadiation(region.lat, region.lng);
        return jsonResult({ region, ...result });
      } catch (e) {
        return notFound(`upstream error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  return server;
}
