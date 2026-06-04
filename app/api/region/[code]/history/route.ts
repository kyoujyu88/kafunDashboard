import { NextResponse, type NextRequest } from "next/server";
import { fetchAirQualityHistory, jstDateAddDays, todayJst } from "@/lib/openMeteoArchive";
import { getPrefecture } from "@/lib/regions";

export const revalidate = 86400;

const MAX_DAYS = 30;

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const region = getPrefecture(code);
  if (!region) {
    return NextResponse.json({ error: "Prefecture not found" }, { status: 404 });
  }

  const daysParam = parseInt(req.nextUrl.searchParams.get("days") ?? "7", 10);
  const days = Math.min(Math.max(daysParam, 1), MAX_DAYS);
  const compare = req.nextUrl.searchParams.get("compare");

  const endDate = todayJst();
  const startDate = jstDateAddDays(endDate, -days);

  try {
    if (compare === "yoy") {
      // YoY uses explicit dates because past_days is capped at 92.
      // Pollen values may be null in this mode (CAMS archive doesn't replay pollen).
      const yoyEnd = jstDateAddDays(endDate, -365);
      const yoyStart = jstDateAddDays(startDate, -365);
      const [current, previousYear] = await Promise.all([
        fetchAirQualityHistory(region.lat, region.lng, { pastDays: days }),
        fetchAirQualityHistory(region.lat, region.lng, { startDate: yoyStart, endDate: yoyEnd }),
      ]);
      return NextResponse.json(
        { current, previousYear, range: { startDate, endDate } },
        {
          headers: {
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const current = await fetchAirQualityHistory(region.lat, region.lng, { pastDays: days });
    return NextResponse.json(
      { current, range: { startDate, endDate } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
