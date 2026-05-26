import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "KafunAir — 花粉飛散 & 空気質ダッシュボード",
  description:
    "全国47都道府県の花粉(ハンノキ・シラカバ・イネ科ほか)とPM2.5などの空気質をリアルタイムで一望できる、動的でかっこいいダッシュボード。",
  applicationName: "KafunAir",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "KafunAir" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
