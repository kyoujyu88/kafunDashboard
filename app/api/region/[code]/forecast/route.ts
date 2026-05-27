import { NextResponse, type NextRequest } from "next/server";
import { fetchPointAirQuality, extractHourlySeries } from "@/lib/openMeteo";
import { ALL_METRIC_KEYS, type MetricKey } from "@/lib/openMeteo.types";
import { METRICS } from "@/data/metrics.config";
import { getPrefecture } from "@/lib/regions";

export const revalidate = 1800;

export async function GET(req: NextRequest, ctx: { params: { code: string } }) {
  const region = getPrefecture(ctx.params.code);
  if (!region) {
    return NextResponse.json({ error: "Prefecture not found" }, { status: 404 });
  }

  const metricParam = req.nextUrl.searchParams.get("metric") as MetricKey | null;
  const hoursParam = req.nextUrl.searchParams.get("hours");
  const hours = hoursParam ? Math.min(120, Math.max(1, parseInt(hoursParam, 10) || 24)) : 120;
  const metrics: MetricKey[] =
    metricParam && ALL_METRIC_KEYS.includes(metricParam) ? [metricParam] : ALL_METRIC_KEYS;

  try {
    const days = Math.min(5, Math.max(1, Math.ceil(hours / 24)));
    const response = await fetchPointAirQuality(region.lat, region.lng, { forecastDays: days });

    const result: Record<string, { unit: string; time: string[]; values: (number | null)[] }> = {};
    for (const key of metrics) {
      const { time, values } = extractHourlySeries(response, key);
      result[key] = {
        unit: METRICS[key].unit,
        time: time.slice(0, hours),
        values: values.slice(0, hours),
      };
    }

    return NextResponse.json(
      { region, metrics: result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
