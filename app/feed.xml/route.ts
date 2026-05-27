import { NextResponse } from "next/server";
import { fetchNationwideSnapshot } from "@/lib/openMeteo";
import { classifyIntensity, getIntensityInfo } from "@/lib/intensity";
import {
  buildNationwideItem,
  buildRssXml,
  type NationwideSummaryRow,
} from "@/lib/rss";
import { PREFECTURES } from "@/lib/regions";
import { siteUrl } from "@/lib/siteUrl";
import { ALL_METRIC_KEYS, type MetricKey } from "@/lib/openMeteo.types";

export const revalidate = 1800;

const LEVEL_RANK = { low: 0, moderate: 1, high: 2, very_high: 3 } as const;

export async function GET() {
  const base = siteUrl();

  try {
    const snapshots = await fetchNationwideSnapshot(PREFECTURES);

    const rows: NationwideSummaryRow[] = snapshots.map((s) => {
      let worstMetric: MetricKey | null = null;
      let worstRank = -1;
      let worstValue: number | null = null;

      for (const key of ALL_METRIC_KEYS) {
        const v = s.current[key];
        if (typeof v !== "number") continue;
        const level = classifyIntensity(key, v);
        const rank = level ? LEVEL_RANK[level] : -1;
        if (rank > worstRank) {
          worstRank = rank;
          worstMetric = key;
          worstValue = v;
        }
      }

      const info = worstMetric ? getIntensityInfo(worstMetric, worstValue) : null;
      return {
        code: s.code,
        name: s.name,
        worstMetric,
        worstLevel: info?.level ?? null,
        worstLabel: info?.label ?? null,
        worstValue,
      };
    });

    const item = buildNationwideItem(rows, base, new Date());

    const xml = buildRssXml({
      title: "KafunAir 全国サマリ - 花粉&空気質ダイジェスト",
      link: `${base}/feed.xml`,
      description: "全国47都道府県の花粉飛散&空気質の日次ダイジェスト(Open-Meteo 提供)",
      items: [item],
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
