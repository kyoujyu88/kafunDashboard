import prefecturesData from "@/data/prefectures.json";
import subRegionsData from "@/data/subRegions.json";

export interface Prefecture {
  code: string;
  name: string;
  capital: string;
  lat: number;
  lng: number;
  region: string;
}

export interface SubRegion {
  key: string;
  name: string;
  lat: number;
  lng: number;
}

export const PREFECTURES: Prefecture[] = prefecturesData as Prefecture[];

export const PREFECTURES_BY_CODE: Record<string, Prefecture> = Object.fromEntries(
  PREFECTURES.map((p) => [p.code, p])
);

export const SUB_REGIONS_BY_PREF: Record<string, SubRegion[]> =
  subRegionsData as Record<string, SubRegion[]>;

export function getSubRegions(prefCode: string | null | undefined): SubRegion[] {
  if (!prefCode) return [];
  return SUB_REGIONS_BY_PREF[prefCode] ?? [];
}

export function findSubRegion(
  prefCode: string | null | undefined,
  subKey: string | null | undefined
): SubRegion | null {
  if (!prefCode || !subKey) return null;
  return getSubRegions(prefCode).find((s) => s.key === subKey) ?? null;
}

export const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州"];

export function groupByRegion(): { region: string; prefs: Prefecture[] }[] {
  const groups = new Map<string, Prefecture[]>();
  for (const p of PREFECTURES) {
    const arr = groups.get(p.region) ?? [];
    arr.push(p);
    groups.set(p.region, arr);
  }
  return REGION_ORDER.filter((r) => groups.has(r)).map((region) => ({
    region,
    prefs: groups.get(region) ?? [],
  }));
}

export function getPrefecture(code: string | null | undefined): Prefecture | null {
  if (!code) return null;
  return PREFECTURES_BY_CODE[code] ?? null;
}

export function searchPrefectures(query: string): Prefecture[] {
  const q = query.trim().toLowerCase();
  if (!q) return PREFECTURES;
  return PREFECTURES.filter((p) => {
    const haystack = [p.name, p.capital, p.region, romaji(p.name), romaji(p.capital)]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestPrefecture(lat: number, lng: number): Prefecture {
  let best = PREFECTURES[0];
  let bestDist = Infinity;
  for (const p of PREFECTURES) {
    const d = haversine({ lat, lng }, p);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

const ROMAJI: Record<string, string> = {
  北海道: "hokkaido",
  青森: "aomori",
  岩手: "iwate",
  宮城: "miyagi",
  秋田: "akita",
  山形: "yamagata",
  福島: "fukushima",
  茨城: "ibaraki",
  栃木: "tochigi",
  群馬: "gunma",
  埼玉: "saitama",
  千葉: "chiba",
  東京: "tokyo",
  神奈川: "kanagawa",
  新潟: "niigata",
  富山: "toyama",
  石川: "ishikawa",
  福井: "fukui",
  山梨: "yamanashi",
  長野: "nagano",
  岐阜: "gifu",
  静岡: "shizuoka",
  愛知: "aichi",
  三重: "mie",
  滋賀: "shiga",
  京都: "kyoto",
  大阪: "osaka",
  兵庫: "hyogo",
  奈良: "nara",
  和歌山: "wakayama",
  鳥取: "tottori",
  島根: "shimane",
  岡山: "okayama",
  広島: "hiroshima",
  山口: "yamaguchi",
  徳島: "tokushima",
  香川: "kagawa",
  愛媛: "ehime",
  高知: "kochi",
  福岡: "fukuoka",
  佐賀: "saga",
  長崎: "nagasaki",
  熊本: "kumamoto",
  大分: "oita",
  宮崎: "miyazaki",
  鹿児島: "kagoshima",
  沖縄: "okinawa",
  札幌: "sapporo",
  仙台: "sendai",
  横浜: "yokohama",
  名古屋: "nagoya",
  神戸: "kobe",
  さいたま: "saitama",
  新宿: "shinjuku",
  那覇: "naha",
  水戸: "mito",
  宇都宮: "utsunomiya",
  前橋: "maebashi",
  甲府: "kofu",
  金沢: "kanazawa",
  盛岡: "morioka",
  津: "tsu",
  大津: "otsu",
  松江: "matsue",
  松山: "matsuyama",
  高松: "takamatsu",
};

function romaji(name: string): string {
  const stripped = name.replace(/[都道府県市]$/g, "");
  return ROMAJI[stripped] ?? ROMAJI[name] ?? "";
}
