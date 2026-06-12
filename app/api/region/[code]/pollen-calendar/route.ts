import { NextResponse, type NextRequest } from "next/server";
import { fetchAirQualityHistory, jstDateAddDays, todayJst } from "@/lib/openMeteoArchive";
import { getPrefecture } from "@/lib/regions";
import { POLLEN_KEYS, type PollenKey } from "@/lib/openMeteo.types";

export const revalidate = 604800; // 7 days

export interface PollenCalendarResponse {
  range: { startDate: string; endDate: string };
  /** Monthly averages keyed by pollen species. Index 0 = January … 11 = December. */
  monthly: Partial<Record<PollenKey, number[]>>;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const region = getPrefecture(code);
  if (!region) {
    return NextResponse.json({ error: "Prefecture not found" }, { status: 404 });
  }

  const endDate = todayJst();
  // Open-Meteo's air-quality past_days is capped at 92, and pollen values are
  // only returned via past_days mode (start_date/end_date returns null for pollen).
  // So the "calendar" covers the most recent ~3 months of seasonal data.
  const PAST_DAYS = 92;
  const startDate = jstDateAddDays(endDate, -PAST_DAYS);

  try {
    const response = await fetchAirQualityHistory(region.lat, region.lng, {
      pastDays: PAST_DAYS,
      hourly: POLLEN_KEYS,
    });

    const time = (response.hourly?.time as string[]) ?? [];
    const monthly: Partial<Record<PollenKey, number[]>> = {};

    for (const key of POLLEN_KEYS) {
      const raw = (response.hourly?.[key] as number[] | undefined) ?? [];
      const sums = new Array(12).fill(0);
      const counts = new Array(12).fill(0);
      for (let i = 0; i < time.length; i++) {
        const v = raw[i];
        if (typeof v !== "number") continue;
        const monthIdx = parseInt(time[i].slice(5, 7), 10) - 1;
        if (monthIdx < 0 || monthIdx > 11) continue;
        sums[monthIdx] += v;
        counts[monthIdx] += 1;
      }
      const averages = sums.map((s, idx) => (counts[idx] > 0 ? s / counts[idx] : 0));
      // Skip species that are essentially absent in this region
      const maxValue = Math.max(...averages);
      if (maxValue >= 1) {
        monthly[key] = averages.map((v) => Number(v.toFixed(1)));
      }
    }

    const body: PollenCalendarResponse = {
      range: { startDate, endDate },
      monthly,
    };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=1209600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
