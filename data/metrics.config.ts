import type { MetricKey } from "@/lib/openMeteo.types";

export type IntensityLevel = "low" | "moderate" | "high" | "very_high";

export interface MetricMeta {
  key: MetricKey;
  label: string;
  shortLabel: string;
  category: "pollen" | "air";
  unit: string;
  description: string;
  thresholds: { moderate: number; high: number; very_high: number };
}

const POLLEN_THRESHOLDS = { moderate: 10, high: 50, very_high: 100 };

export const METRICS: Record<MetricKey, MetricMeta> = {
  alder_pollen: {
    key: "alder_pollen",
    label: "ハンノキ花粉",
    shortLabel: "ハンノキ",
    category: "pollen",
    unit: "grains/m³",
    description: "早春に飛散。シラカバとの交差反応に注意",
    thresholds: POLLEN_THRESHOLDS,
  },
  birch_pollen: {
    key: "birch_pollen",
    label: "シラカバ花粉",
    shortLabel: "シラカバ",
    category: "pollen",
    unit: "grains/m³",
    description: "春先、特に北日本で多く飛散",
    thresholds: POLLEN_THRESHOLDS,
  },
  grass_pollen: {
    key: "grass_pollen",
    label: "イネ科花粉",
    shortLabel: "イネ科",
    category: "pollen",
    unit: "grains/m³",
    description: "春〜秋にかけて広く飛散",
    thresholds: POLLEN_THRESHOLDS,
  },
  mugwort_pollen: {
    key: "mugwort_pollen",
    label: "ヨモギ花粉",
    shortLabel: "ヨモギ",
    category: "pollen",
    unit: "grains/m³",
    description: "秋の代表的アレルゲン",
    thresholds: POLLEN_THRESHOLDS,
  },
  olive_pollen: {
    key: "olive_pollen",
    label: "オリーブ花粉",
    shortLabel: "オリーブ",
    category: "pollen",
    unit: "grains/m³",
    description: "西日本沿岸部で初夏に飛散",
    thresholds: POLLEN_THRESHOLDS,
  },
  ragweed_pollen: {
    key: "ragweed_pollen",
    label: "ブタクサ花粉",
    shortLabel: "ブタクサ",
    category: "pollen",
    unit: "grains/m³",
    description: "夏〜秋にかけての主要アレルゲン",
    thresholds: POLLEN_THRESHOLDS,
  },
  pm2_5: {
    key: "pm2_5",
    label: "PM2.5",
    shortLabel: "PM2.5",
    category: "air",
    unit: "µg/m³",
    description: "微小粒子状物質。呼吸器・循環器に影響",
    // 日本の基準に合わせた区分。high=35 は環境基準の日平均値、very_high=70 は
    // 注意喚起の暫定指針値(日平均)、moderate=15 は年平均の環境基準。
    // 表示しているのは1時間値なので厳密な適用ではないが、日平均を掲げる
    // 国内サイト(そらまめくん等)の色分けに近い読み方ができる。
    thresholds: { moderate: 15, high: 35, very_high: 70 },
  },
  pm10: {
    key: "pm10",
    label: "PM10",
    shortLabel: "PM10",
    category: "air",
    unit: "µg/m³",
    description: "粒子状物質。黄砂やほこりを含む",
    thresholds: { moderate: 20, high: 50, very_high: 100 },
  },
  ozone: {
    key: "ozone",
    label: "オゾン (O₃)",
    shortLabel: "O₃",
    category: "air",
    unit: "µg/m³",
    description: "夏季に上昇しやすい光化学物質",
    thresholds: { moderate: 100, high: 160, very_high: 240 },
  },
  nitrogen_dioxide: {
    key: "nitrogen_dioxide",
    label: "二酸化窒素 (NO₂)",
    shortLabel: "NO₂",
    category: "air",
    unit: "µg/m³",
    description: "交通量の多い地域で高くなりやすい",
    thresholds: { moderate: 40, high: 90, very_high: 230 },
  },
  sulphur_dioxide: {
    key: "sulphur_dioxide",
    label: "二酸化硫黄 (SO₂)",
    shortLabel: "SO₂",
    category: "air",
    unit: "µg/m³",
    description: "工業地帯で発生しやすい",
    thresholds: { moderate: 100, high: 350, very_high: 500 },
  },
  carbon_monoxide: {
    key: "carbon_monoxide",
    label: "一酸化炭素 (CO)",
    shortLabel: "CO",
    category: "air",
    unit: "µg/m³",
    description: "車両排ガス由来",
    thresholds: { moderate: 4400, high: 9400, very_high: 12400 },
  },
  european_aqi: {
    key: "european_aqi",
    label: "欧州AQI",
    shortLabel: "AQI",
    category: "air",
    unit: "",
    description: "欧州大気質指数(総合)",
    thresholds: { moderate: 40, high: 60, very_high: 80 },
  },
  dust: {
    key: "dust",
    label: "黄砂 (ダスト)",
    shortLabel: "黄砂",
    category: "air",
    unit: "µg/m³",
    description: "中国・モンゴルから飛来する砂塵。春にPM10を押し上げる原因",
    thresholds: { moderate: 50, high: 200, very_high: 500 },
  },
  uv_index: {
    key: "uv_index",
    label: "UV指数",
    shortLabel: "UV",
    category: "air",
    unit: "",
    description: "紫外線の強さ。外出・花粉症対策の判断に",
    thresholds: { moderate: 3, high: 6, very_high: 8 },
  },
};

export const INTENSITY_META: Record<
  IntensityLevel,
  { label: string; colorHex: string; bgClass: string; ringClass: string; textClass: string }
> = {
  low: {
    label: "少ない",
    colorHex: "#10b981",
    bgClass: "from-emerald-400/20 to-emerald-600/10",
    ringClass: "ring-emerald-400/50",
    textClass: "text-emerald-600 dark:text-emerald-300",
  },
  moderate: {
    label: "やや多い",
    colorHex: "#eab308",
    bgClass: "from-yellow-300/30 to-yellow-500/10",
    ringClass: "ring-yellow-400/50",
    textClass: "text-yellow-700 dark:text-yellow-300",
  },
  high: {
    label: "多い",
    colorHex: "#f97316",
    bgClass: "from-orange-400/30 to-orange-600/10",
    ringClass: "ring-orange-400/60",
    textClass: "text-orange-700 dark:text-orange-300",
  },
  very_high: {
    label: "非常に多い",
    colorHex: "#dc2626",
    bgClass: "from-red-500/30 to-red-700/10",
    ringClass: "ring-red-500/70",
    textClass: "text-red-700 dark:text-red-300",
  },
};

export const AIR_LEVEL_LABELS: Record<IntensityLevel, string> = {
  low: "良い",
  moderate: "普通",
  high: "悪い",
  very_high: "非常に悪い",
};
