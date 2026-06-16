import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KafunAir — 花粉&空気質ダッシュボード",
    short_name: "KafunAir",
    description:
      "全国47都道府県の花粉飛散・PM2.5など空気質・気象を一画面で把握できるダッシュボード",
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    lang: "ja",
    categories: ["health", "weather", "lifestyle"],
    icons: [
      {
        src: "/icon1",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon2",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "東京を見る",
        short_name: "東京",
        url: "/?region=13",
      },
    ],
  };
}
