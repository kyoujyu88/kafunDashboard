import type { AirQualityKey, PollenKey } from "@/lib/openMeteo.types";

export interface WatchOption<K extends string> {
  key: K;
  label: string;
  description: string;
}

export const POLLEN_OPTIONS: WatchOption<PollenKey>[] = [
  { key: "alder_pollen", label: "ハンノキ", description: "早春に飛散。シラカバとの交差反応に注意" },
  { key: "birch_pollen", label: "シラカバ", description: "春先に北日本で多く飛散" },
  { key: "grass_pollen", label: "イネ科", description: "春〜秋にかけて広く飛散" },
  { key: "mugwort_pollen", label: "ヨモギ", description: "秋の代表的アレルゲン" },
  { key: "olive_pollen", label: "オリーブ", description: "西日本沿岸部で初夏に飛散" },
  { key: "ragweed_pollen", label: "ブタクサ", description: "夏〜秋の主要アレルゲン" },
];

export const PENDING_POLLEN_OPTIONS = [
  { key: "japanese_cedar", label: "スギ", description: "Open-Meteo未対応・準備中" },
  { key: "japanese_cypress", label: "ヒノキ", description: "Open-Meteo未対応・準備中" },
];

export const AIR_OPTIONS: WatchOption<AirQualityKey>[] = [
  { key: "pm2_5", label: "PM2.5", description: "微小粒子。呼吸器に影響しやすい" },
  { key: "pm10", label: "PM10", description: "黄砂・粉じんを含む粒子状物質" },
  { key: "dust", label: "黄砂 (ダスト)", description: "中国・モンゴルから飛来。春にPM10上昇の原因に" },
  { key: "uv_index", label: "UV指数", description: "紫外線の強さ。外出・花粉症対策の判断に" },
  { key: "ozone", label: "オゾン (O₃)", description: "夏季に上昇しやすい光化学物質" },
  { key: "nitrogen_dioxide", label: "NO₂", description: "交通量の多い地域で高い" },
  { key: "sulphur_dioxide", label: "SO₂", description: "工業地帯由来" },
  { key: "carbon_monoxide", label: "CO", description: "車両排ガス由来" },
];

export const ALERT_LEVEL_OPTIONS = [
  { value: "moderate", label: "やや多い以上で通知" },
  { value: "high", label: "多い以上で通知(推奨)" },
  { value: "very_high", label: "非常に多い時のみ通知" },
] as const;
