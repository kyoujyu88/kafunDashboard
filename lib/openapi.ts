import { ALL_METRIC_KEYS } from "@/lib/openMeteo.types";
import { siteUrl } from "@/lib/siteUrl";

export function buildOpenApiSchema() {
  const server = siteUrl();

  return {
    openapi: "3.1.0",
    info: {
      title: "KafunAir Public API",
      version: "1.0.0",
      description:
        "日本全国47都道府県の花粉飛散量・大気質・放射線量を取得できる読み取り専用の公開 API。",
      license: { name: "MIT" },
      contact: { url: server },
    },
    servers: [{ url: server }],
    paths: {
      "/api/regions": {
        get: {
          operationId: "listRegions",
          summary: "47都道府県の一覧",
          responses: {
            "200": {
              description: "Prefecture array",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Prefecture" } },
                },
              },
            },
          },
        },
      },
      "/api/nationwide": {
        get: {
          operationId: "getNationwide",
          summary: "47県の現在値スナップショット",
          responses: {
            "200": {
              description: "Snapshot array",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PrefectureSnapshot" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/region/{code}": {
        get: {
          operationId: "getRegion",
          summary: "単一県の整形済みスナップショット",
          parameters: [
            {
              name: "code",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^\\d{2}$" },
              description: "JIS X 0401 都道府県コード (01–47)",
            },
          ],
          responses: {
            "200": {
              description: "Region snapshot",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/RegionApiShape" } },
              },
            },
            "404": { description: "Prefecture not found" },
          },
        },
      },
      "/api/region/{code}/forecast": {
        get: {
          operationId: "getForecast",
          summary: "単一県の hourly 予報(最大5日 = 120時間)",
          parameters: [
            {
              name: "code",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^\\d{2}$" },
            },
            {
              name: "metric",
              in: "query",
              required: false,
              schema: { type: "string", enum: ALL_METRIC_KEYS },
              description: "指定した場合は1指標だけ返す",
            },
            {
              name: "hours",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 120, default: 120 },
            },
          ],
          responses: {
            "200": {
              description: "Hourly forecast series",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      region: { $ref: "#/components/schemas/Prefecture" },
                      metrics: {
                        type: "object",
                        additionalProperties: {
                          type: "object",
                          properties: {
                            unit: { type: "string" },
                            time: { type: "array", items: { type: "string", format: "date-time" } },
                            values: {
                              type: "array",
                              items: { type: ["number", "null"] },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "404": { description: "Prefecture not found" },
          },
        },
      },
      "/api/radiation": {
        get: {
          operationId: "getRadiation",
          summary: "SAFECAST 由来の放射線量(µSv/h、中央値)",
          parameters: [
            {
              name: "code",
              in: "query",
              required: true,
              schema: { type: "string", pattern: "^\\d{2}$" },
            },
          ],
          responses: {
            "200": {
              description: "Radiation result",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/RadiationResult" } },
              },
            },
            "404": { description: "Prefecture not found" },
          },
        },
      },
      "/feed.xml": {
        get: {
          operationId: "getNationwideFeed",
          summary: "全国サマリ RSS 2.0",
          responses: {
            "200": {
              description: "RSS XML",
              content: { "application/rss+xml": { schema: { type: "string" } } },
            },
          },
        },
      },
      "/feed/{code}.xml": {
        get: {
          operationId: "getRegionFeed",
          summary: "県別 RSS 2.0(5日間ダイジェスト)",
          parameters: [
            {
              name: "code",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^\\d{2}$" },
            },
          ],
          responses: {
            "200": {
              description: "RSS XML",
              content: { "application/rss+xml": { schema: { type: "string" } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Prefecture: {
          type: "object",
          required: ["code", "name", "capital", "lat", "lng", "region"],
          properties: {
            code: { type: "string", pattern: "^\\d{2}$" },
            name: { type: "string" },
            capital: { type: "string" },
            lat: { type: "number" },
            lng: { type: "number" },
            region: { type: "string" },
          },
        },
        IntensityLevel: { type: "string", enum: ["low", "moderate", "high", "very_high"] },
        MetricKey: { type: "string", enum: ALL_METRIC_KEYS },
        MetricSnapshot: {
          type: "object",
          required: ["value", "unit", "level", "label"],
          properties: {
            value: { type: ["number", "null"] },
            unit: { type: "string" },
            level: { oneOf: [{ $ref: "#/components/schemas/IntensityLevel" }, { type: "null" }] },
            label: { type: "string" },
          },
        },
        UpcomingPeak: {
          type: "object",
          required: ["metric", "peakAt", "peakValue", "level"],
          properties: {
            metric: { $ref: "#/components/schemas/MetricKey" },
            peakAt: { type: "string", format: "date-time" },
            peakValue: { type: "number" },
            level: { $ref: "#/components/schemas/IntensityLevel" },
          },
        },
        RegionApiShape: {
          type: "object",
          required: ["region", "fetchedAt", "current", "upcoming24h"],
          properties: {
            region: { $ref: "#/components/schemas/Prefecture" },
            fetchedAt: { type: "string", format: "date-time" },
            current: {
              type: "object",
              additionalProperties: { $ref: "#/components/schemas/MetricSnapshot" },
            },
            upcoming24h: { type: "array", items: { $ref: "#/components/schemas/UpcomingPeak" } },
          },
        },
        PrefectureSnapshot: {
          type: "object",
          required: ["code", "name", "lat", "lng", "current", "fetchedAt"],
          properties: {
            code: { type: "string" },
            name: { type: "string" },
            lat: { type: "number" },
            lng: { type: "number" },
            current: {
              type: "object",
              additionalProperties: { type: ["number", "null"] },
            },
            fetchedAt: { type: "number" },
            error: { type: "string" },
          },
        },
        RadiationResult: {
          type: "object",
          required: ["valueMicroSvH", "count", "latestAt", "status"],
          properties: {
            valueMicroSvH: { type: ["number", "null"] },
            count: { type: "integer" },
            latestAt: { type: ["string", "null"], format: "date-time" },
            status: { type: "string", enum: ["ok", "sparse", "nodata"] },
          },
        },
      },
    },
  } as const;
}
