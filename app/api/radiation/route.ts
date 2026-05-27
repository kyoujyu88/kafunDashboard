import { type NextRequest, NextResponse } from "next/server";
import { PREFECTURES } from "@/lib/regions";
import { fetchRadiation } from "@/lib/safecast";
import type { RadiationResult } from "@/lib/safecast";

export const dynamic = "force-dynamic";

const NODATA: RadiationResult = {
  valueMicroSvH: null,
  count: 0,
  latestAt: null,
  status: "nodata",
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const pref = PREFECTURES.find((p) => p.code === code);

  if (!pref) {
    return NextResponse.json({ error: "Prefecture not found" }, { status: 404 });
  }

  try {
    const result = await fetchRadiation(pref.lat, pref.lng);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch {
    return NextResponse.json(NODATA, { status: 200 });
  }
}
