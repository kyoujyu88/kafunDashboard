import { NextResponse } from "next/server";
import { fetchNationwideSnapshot } from "@/lib/openMeteo";
import { PREFECTURES } from "@/lib/regions";

export const revalidate = 1800;

export async function GET() {
  try {
    const snapshots = await fetchNationwideSnapshot(PREFECTURES);
    return NextResponse.json(snapshots, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
