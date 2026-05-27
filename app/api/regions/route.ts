import { NextResponse } from "next/server";
import { PREFECTURES } from "@/lib/regions";

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json(PREFECTURES, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
