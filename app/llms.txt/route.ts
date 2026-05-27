import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/siteUrl";

export const revalidate = 86400;

export async function GET() {
  const base = siteUrl();

  const body = `# KafunAir

> 日本全国47都道府県の花粉飛散量(6種)・大気質(PM2.5/PM10/オゾン他)・放射線量(SAFECAST)を統合配信するダッシュボード。データソース: Open-Meteo Air Quality API、SAFECAST API。

## このサイトについて

- リアルタイムの現在値と5日間の時間別予報を提供
- 47都道府県すべてを単一エンドポイントから取得可能
- すべて読み取り専用・認証不要・CORS有効・JSONレスポンス

## エンドポイント (REST)

- [全国スナップショット](${base}/api/nationwide): 47県の最新値配列
- [県マスタ](${base}/api/regions): 47県の code/name/lat/lng/region 一覧
- [単一県スナップショット](${base}/api/region/13): \`/api/region/{code}\` 整形済み(現在値 + 強度ラベル + 24h予報ピーク)
- [単一県予報](${base}/api/region/13/forecast): \`/api/region/{code}/forecast?metric=pm2_5&hours=48\` hourly時系列
- [放射線](${base}/api/radiation?code=13): SAFECAST の µSv/h 中央値
- [OpenAPI 3.1 スキーマ](${base}/api/openapi.json): 全エンドポイントの machine-readable 定義

## RSS

- [全国サマリ](${base}/feed.xml): 各item = 日次の全国概況
- [県別フィード](${base}/feed/13.xml): \`/feed/{code}.xml\` 形式、各item = 1日の指標サマリ

## AI 連携 (MCP)

- [MCPエンドポイント](${base}/api/mcp): Streamable HTTP transport
- 公開ツール: list_regions / search_region / get_current_air_quality / get_forecast / get_nationwide / get_radiation / list_metrics
- Claude Desktop / Cursor 等の MCP 対応クライアントから直接ツール呼び出し可能

## 指標一覧 (\`MetricKey\`)

- **花粉(grains/m³)**: alder_pollen (ハンノキ), birch_pollen (シラカバ), grass_pollen (イネ科), mugwort_pollen (ヨモギ), olive_pollen (オリーブ), ragweed_pollen (ブタクサ)
- **大気質(µg/m³ ほか)**: pm2_5, pm10, dust (黄砂), uv_index, ozone, nitrogen_dioxide, sulphur_dioxide, carbon_monoxide, european_aqi

## 強度レベル

各指標は4段階で評価: \`low\` (少ない/良い) → \`moderate\` (やや多い/普通) → \`high\` (多い/悪い) → \`very_high\` (非常に多い/非常に悪い)。しきい値は \`/api/openapi.json\` のスキーマと、ソース上は \`data/metrics.config.ts\` を参照。

## 制限事項

- スギ・ヒノキ花粉は Open-Meteo 未対応のため非配信(別データソースで将来対応予定)
- 放射線は SAFECAST(市民観測ベース)。公式値ではない参考データである旨に留意
- レート制限: Open-Meteo 10,000 req/day/IP、SAFECAST はゆるやかな制限あり。サーバ側で30分〜1日キャッシュを噛ませている
- タイムゾーン: すべて Asia/Tokyo

## データソース帰属

- Open-Meteo Air Quality API (CC BY 4.0): https://open-meteo.com/
- SAFECAST (CC0): https://safecast.org/
- 都道府県境界 GeoJSON: dataofjapan/land (MIT)
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
