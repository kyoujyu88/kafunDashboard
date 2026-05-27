import { NextResponse } from "next/server";
import { buildOpenApiSchema } from "@/lib/openapi";

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json(buildOpenApiSchema(), {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
