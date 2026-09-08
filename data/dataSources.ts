export interface DataSource {
  id: string;
  name: string;
  url: string;
  description: string;
  license?: string;
}

export const DATA_SOURCES = {
  cams_global: {
    id: "cams_global",
    name: "CAMS Global",
    url: "https://atmosphere.copernicus.eu/",
    description:
      "Copernicus 大気監視サービス全球モデル(約40km格子)の予報推計値。花粉・大気質。Open-Meteo経由で取得。地上観測ではないため国内の実測値とは差が出ます",
    license: "CC BY 4.0",
  },
  ecmwf: {
    id: "ecmwf",
    name: "ECMWF",
    url: "https://www.ecmwf.int/",
    description: "ヨーロッパ中期予報センターの気象モデル。気温・湿度・風・降水。Open-Meteo経由で取得",
  },
  safecast: {
    id: "safecast",
    name: "SAFECAST",
    url: "https://safecast.org/",
    description: "市民参加型の環境放射線測定ネットワーク",
    license: "CC0",
  },
} satisfies Record<string, DataSource>;

export type DataSourceId = keyof typeof DATA_SOURCES;

/**
 * 国内の PM2.5 / 大気汚染の「実測値」を確認できる公的サイト。
 * このダッシュボードは CAMS のモデル推計を表示しており、常時監視局の実測とは
 * 値が食い違うため、比較先として UI から案内する。
 */
export const SORAMAME = {
  name: "そらまめくん(環境省)",
  url: "https://soramame.env.go.jp/",
  description: "環境省 大気汚染物質広域監視システム。常時監視局の1時間値(速報値)",
} as const;
