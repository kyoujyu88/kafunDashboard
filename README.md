# KafunAir — 花粉飛散 & 空気質ダッシュボード

全国47都道府県の **花粉(ハンノキ/シラカバ/イネ科/ヨモギ/オリーブ/ブタクサ)** と **空気質(PM2.5/PM10/オゾン ほか)** を1画面でひと目で確認できる、モバイルファースト&動的なダッシュボード。

## 機能ハイライト

- 47都道府県の選択と地域別の現在値・5日間予報
- 全国マップで指標別の強度を可視化(クリックで地域切替)
- 最後に開いた地域を localStorage に永続化
- **アレルギーパーソナライズ**:
  - 気になる花粉や物質をチェック → 該当指標カードを強調 & 並び替え
  - しきい値を超えるとアラートバナー + ブラウザ通知(任意)
  - 初回はオンボーディングウィザード(スキップ可)
- iPhone SE 〜 デスクトップで動作するレスポンシブ設計
- ダークモード(OS設定追従) / `prefers-reduced-motion` 尊重

## 技術スタック

- Next.js 15 (App Router) + React 19 + TypeScript
- TailwindCSS 3 + next-themes
- ECharts 5 + echarts-for-react
- Framer Motion / SWR / Radix UI / cmdk / lucide-react

データソース: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)(APIキー不要・無料・CORS対応)

## 開発

```bash
npm install
npm run dev    # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

## ディレクトリ

```
app/            — Next.js App Router (page, layout, api/nationwide)
components/     — UI コンポーネント
  dashboard/    — ダッシュボード本体
  settings/     — アレルギー設定・オンボーディング
  layout/       — ヘッダー・フッター・テーマトグル
  ui/           — 汎用UI
  charts/       — ECharts ラッパ
hooks/          — React フック
lib/            — API クライアント・ユーティリティ
data/           — 静的データ(都道府県、指標定義、アレルギー項目)
```

## 注意事項

- 花粉・大気質の値は CAMS Global(約40km格子)の**モデル予報推計値**で、地上常時監視局の実測ではありません。PM2.5 は環境省[そらまめくん](https://soramame.env.go.jp/)やそれを参照する国内サービス(ウェザーニュース等)の実測値と食い違います。
- PM2.5 の強度しきい値は日本基準準拠(`moderate=15` 年平均環境基準 / `high=35` 日平均環境基準 / `very_high=70` 注意喚起の暫定指針値)。表示は1時間値のため厳密な適用ではありません。
- 花粉はOpen-Meteoが提供する6種に対応。**スギ・ヒノキは未対応**(将来拡張予定)。
- アレルギープロファイルは端末のlocalStorageにのみ保存され、サーバには送信されません。
- 本サイトは情報提供のみを目的としています。健康に関する判断は医療従事者にご相談ください。
