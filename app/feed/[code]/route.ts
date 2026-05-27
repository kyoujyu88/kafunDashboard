import { NextResponse, type NextRequest } from "next/server";
import { fetchPointAirQuality } from "@/lib/openMeteo";
import { buildDailyDigests } from "@/lib/apiShape";
import { buildRegionFeedItems, buildRssXml } from "@/lib/rss";
import { PREFECTURES, getPrefecture } from "@/lib/regions";
import { siteUrl } from "@/lib/siteUrl";

export const revalidate = 1800;

export async function generateStaticParams() {
  // Pre-generate both forms (/feed/13 and /feed/13.xml).
  return PREFECTURES.flatMap((p) => [{ code: p.code }, { code: `${p.code}.xml` }]);
}

export async function GET(_req: NextRequest, ctx: { params: { code: string } }) {
  const code = ctx.params.code.replace(/\.xml$/, "");
  const region = getPrefecture(code);
  if (!region) {
    return NextResponse.json({ error: "Prefecture not found" }, { status: 404 });
  }

  const base = siteUrl();

  try {
    const response = await fetchPointAirQuality(region.lat, region.lng, { forecastDays: 5 });
    const digests = buildDailyDigests(response);
    const items = buildRegionFeedItems(region, digests, base);

    const xml = buildRssXml({
      title: `KafunAir ${region.name} - 花粉&空気質 予報フィード`,
      link: `${base}/feed/${region.code}`,
      description: `${region.name} (${region.capital}) の5日間花粉飛散&空気質予報(Open-Meteo 提供)`,
      items,
      ttlMinutes: 30,
    });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
