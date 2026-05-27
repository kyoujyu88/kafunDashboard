import { METRICS, type IntensityLevel } from "@/data/metrics.config";
import { ALL_METRIC_KEYS, type MetricKey } from "@/lib/openMeteo.types";
import type { DayDigest } from "@/lib/apiShape";
import type { Prefecture } from "@/lib/regions";

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const LEVEL_RANK: Record<IntensityLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  very_high: 3,
};

const TZ_OFFSET_MS = 9 * 60 * 60 * 1000; // JST

/** "YYYY-MM-DD" (JST) → JST midnight Date object */
function jstMidnight(date: string): Date {
  const ms = Date.parse(`${date}T00:00:00+09:00`);
  return new Date(ms);
}

/** RFC 822 ("Tue, 27 May 2026 00:00:00 +0900") */
export function rfc822(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const jst = new Date(d.getTime() + TZ_OFFSET_MS);
  const day = days[jst.getUTCDay()];
  const date = String(jst.getUTCDate()).padStart(2, "0");
  const month = months[jst.getUTCMonth()];
  const year = jst.getUTCFullYear();
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  const ss = String(jst.getUTCSeconds()).padStart(2, "0");
  return `${day}, ${date} ${month} ${year} ${hh}:${mm}:${ss} +0900`;
}

interface FeedItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  descriptionHtml: string;
}

export interface FeedChannel {
  title: string;
  link: string;
  description: string;
  language?: string;
  ttlMinutes?: number;
  items: FeedItem[];
}

export function buildRssXml(channel: FeedChannel): string {
  const items = channel.items
    .map(
      (it) => `    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${escapeXml(it.link)}</link>
      <guid isPermaLink="false">${escapeXml(it.guid)}</guid>
      <pubDate>${escapeXml(it.pubDate)}</pubDate>
      <description><![CDATA[${it.descriptionHtml}]]></description>
    </item>`
    )
    .join("\n");

  const self = `${channel.link}`;
  const lastBuild = rfc822(new Date());

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>${escapeXml(channel.language ?? "ja-jp")}</language>
    <ttl>${channel.ttlMinutes ?? 60}</ttl>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

/** Build a per-prefecture daily-digest item set (5 days) */
export function buildRegionFeedItems(
  region: Prefecture,
  digests: DayDigest[],
  siteUrl: string
): FeedItem[] {
  return digests.map((d) => {
    const dt = jstMidnight(d.date);
    const dateLabel = d.date.replace(/-/g, "/");

    // Headline = pick up to 3 metrics with highest level
    const ranked = ALL_METRIC_KEYS
      .map((k) => ({ key: k, m: d.metrics[k] }))
      .filter((x) => x.m && x.m.level !== null) as Array<{
      key: MetricKey;
      m: NonNullable<DayDigest["metrics"][MetricKey]>;
    }>;
    ranked.sort((a, b) => {
      const la = a.m.level ? LEVEL_RANK[a.m.level] : -1;
      const lb = b.m.level ? LEVEL_RANK[b.m.level] : -1;
      return lb - la;
    });
    const top = ranked.slice(0, 3).map((r) => `${METRICS[r.key].shortLabel} ${r.m.label}`);
    const title = `${region.name} ${dateLabel}${top.length ? " - " + top.join(" / ") : ""}`;

    const rows = ALL_METRIC_KEYS.map((k) => {
      const m = d.metrics[k];
      if (!m || m.max === null) return "";
      return `<tr><td>${escapeXml(METRICS[k].label)}</td><td>${m.max.toFixed(1)} ${escapeXml(m.unit)}</td><td>${escapeXml(m.label)}</td></tr>`;
    })
      .filter(Boolean)
      .join("");

    const descriptionHtml = `<p>${escapeXml(region.name)} ${dateLabel}の予報サマリ</p>
<table border="1" cellpadding="4">
<thead><tr><th>指標</th><th>最大値</th><th>レベル</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;

    return {
      title,
      link: `${siteUrl}/?region=${region.code}`,
      guid: `kafunair:feed:${region.code}:${d.date.replace(/-/g, "")}`,
      pubDate: rfc822(dt),
      descriptionHtml,
    };
  });
}

export interface NationwideSummaryRow {
  code: string;
  name: string;
  worstMetric: MetricKey | null;
  worstLevel: IntensityLevel | null;
  worstLabel: string | null;
  worstValue: number | null;
}

/** Build the single nationwide summary item (one per generation) */
export function buildNationwideItem(
  rows: NationwideSummaryRow[],
  siteUrl: string,
  pubDate: Date
): FeedItem {
  const dateLabel = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  })
    .format(pubDate)
    .replace(/\//g, "/");

  const stamp = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  })
    .format(pubDate)
    .replace(/-/g, "");

  const noteworthy = rows.filter((r) => r.worstLevel === "high" || r.worstLevel === "very_high");
  const headline = noteworthy.length
    ? `${noteworthy.length}県で注意レベル: ${noteworthy
        .slice(0, 5)
        .map((r) => r.name)
        .join("、")}${noteworthy.length > 5 ? " ほか" : ""}`
    : "全国的に落ち着いています";

  const tableRows = rows
    .map((r) => {
      const v = r.worstValue !== null ? r.worstValue.toFixed(1) : "—";
      const m = r.worstMetric ? METRICS[r.worstMetric].shortLabel : "—";
      const lvl = r.worstLabel ?? "—";
      return `<tr><td>${escapeXml(r.name)}</td><td>${escapeXml(m)}</td><td>${v}</td><td>${escapeXml(lvl)}</td></tr>`;
    })
    .join("");

  const descriptionHtml = `<p>${escapeXml(headline)}</p>
<table border="1" cellpadding="4">
<thead><tr><th>都道府県</th><th>最警戒指標</th><th>値</th><th>レベル</th></tr></thead>
<tbody>${tableRows}</tbody>
</table>`;

  return {
    title: `全国サマリ ${dateLabel} - ${headline}`,
    link: `${siteUrl}/`,
    guid: `kafunair:nationwide:${stamp}`,
    pubDate: rfc822(pubDate),
    descriptionHtml,
  };
}
