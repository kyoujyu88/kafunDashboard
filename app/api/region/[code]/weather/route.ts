import { NextResponse, type NextRequest } from "next/server";
import { fetchPointWeather } from "@/lib/weather";
import { getPrefecture } from "@/lib/regions";

// Open-Meteo の `current` フィールドは 15 分間隔で更新される near-real-time データ。
// 長く保持しすぎると朝の気温が日中まで残るような顕著なズレを起こすため短めに。
export const revalidate = 600;

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const region = getPrefecture(code);
  if (!region) {
    return NextResponse.json({ error: "Prefecture not found" }, { status: 404 });
  }

  try {
    const response = await fetchPointWeather(region.lat, region.lng, { forecastDays: 5 });
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
