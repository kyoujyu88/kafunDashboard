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
    description: "Copernicus 大気監視サービス全球モデル(~45km)の予報値。花粉・大気質。Open-Meteo経由で取得",
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
