import { NextResponse, type NextRequest } from "next/server";
import { fetchPointWeather, nextWeatherUpdateTtl } from "@/lib/weather";
import { getPrefecture } from "@/lib/regions";

// 固定 TTL の ISR ではなく、レスポンスごとに上流の次回更新までを CDN へ伝える
// 動的キャッシュ戦略に切替える。R2 + DO の long-lived ISR が古い値を抱え込む
// 副作用も同時に避ける。
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const region = getPrefecture(code);
  if (!region) {
    return NextResponse.json({ error: "Prefecture not found" }, { status: 404 });
  }

  try {
    const response = await fetchPointWeather(region.lat, region.lng, { forecastDays: 5 });
    const { maxAge, swr } = nextWeatherUpdateTtl(response.current?.time, response.timezone);
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
