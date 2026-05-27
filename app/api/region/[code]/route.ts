import { NextResponse, type NextRequest } from "next/server";
import { fetchPointAirQuality } from "@/lib/openMeteo";
import { buildRegionSnapshot } from "@/lib/apiShape";
import { getPrefecture } from "@/lib/regions";

export const revalidate = 1800;

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const region = getPrefecture(code);
  if (!region) {
    return NextResponse.json({ error: "Prefecture not found" }, { status: 404 });
  }

  try {
    const response = await fetchPointAirQuality(region.lat, region.lng, { forecastDays: 5 });
    const shape = buildRegionSnapshot(region, response);

    return NextResponse.json(shape, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
