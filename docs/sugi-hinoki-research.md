# スギ・ヒノキ花粉データ統合 調査レポート

> 調査日: 2026-06-16 / 対象: 本ダッシュボードへの**スギ(Japanese cedar)・ヒノキ(Japanese cypress)**花粉追加の実現可能性
>
> 現状、本サイトは Open-Meteo 経由で **CAMS Global** の花粉6種(ハンノキ・シラカバ・イネ科・ヨモギ・オリーブ・ブタクサ)を取得している。CAMS は欧州中心モデルのため**スギ・ヒノキを提供していない**。日本の花粉症の主役であるこの2種を別系統で追加する方針を検討した。

## 重要な前提の訂正

| 当初の想定 | 調査結果 |
|---|---|
| 環境省「はなこさん」が運用中で観測値が取れる | ❌ **2021年度末で事業廃止**。リアルタイム提供は終了し、過去データ(2002-2021)アーカイブのみ。廃止理由は民間(ウェザーニューズ)観測網の充実 |
| スギ・ヒノキの公開APIは存在しない | ✅ **Google Pollen API が2024-09-10にスギ・ヒノキを種別追加**。これが最大の発見 |

- 環境省 はなこさん廃止: https://www.env.go.jp/press/110339.html
- 過去データアーカイブ: https://www.env.go.jp/page_00209.html
- Google Pollen API リリースノート: https://developers.google.com/maps/documentation/pollen/release-notes

## データソース比較

| ソース | スギ/ヒノキ | 種別 | API | 予報 | 単位 | コスト | 商用/ライセンス | 評価 |
|---|---|---|---|---|---|---|---|---|
| **Google Pollen API** | ✅ (2024-09追加) | 予報 | REST/JSON・APIキー | 5日 | UPI 1-5 + grains/m³ | 5,000call/月無料、超過 $10/1k | 商用可・"Powered by Google"必須 | ★ 本命 |
| **ウェザーニューズ WxTech 1kmメッシュ** | ✅ | 予報 | REST・要契約 | 48時間 | 4段階ランク | 要見積(非公開) | 商用可(契約) | 高精度だが要商談 |
| WxTech ポールンロボ opendata | ✅ | 観測 | REST/CSV | – | 個/m³相当 | 無料 | **非商用のみ**・Web再公開は要申請 | 観測の補完に |
| 日本気象協会 tenkiapi.jp | ✅ (北海道はシラカバ) | 予報 | JSON・要契約 | 7日 | 飛散ランク | 非公開 | 商用可(契約) | 法人向け |
| Life Socket スギヒノキ指数API | ✅ | 予報 | REST・プラン制 | 7日 | 指数 | プラン制 | 商用可 | 代替候補 |
| 環境省 はなこさん | – | – | **廃止** | – | 個/m³ | – | – | ❌ 利用不可 |
| tenki.jp / Yahoo!天気 (スクレイピング) | ✅ | 予報 | HTMLのみ | – | 飛散ランク | 0円 | **ToS違反・不法行為リスク** | ❌ 非推奨 |
| 林野庁 スギ雄花花芽調査 | ✅ | 年1予測 | PDFのみ | 年1 | 着花量指標 | 無料 | 政府標準利用規約(CC BY互換) | シーズン前見通しに |
| 大阪府 BODIK CKAN | ✅ | 観測 | CSV | – | 捕集数 | 無料 | 政府標準利用規約 | 地域限定 |

## 単位の整合性(重要)

- **CAMS / Open-Meteo**: `grains/m³`(空気1m³あたりの花粉個数、体積濃度)。本サイトの現行単位。
- **日本の慣用**: `個/cm²/日`(ダーラム法。1cm²のスライドに24時間で沈降した個数)。tenki.jp等の「少ない/多い」区分はこちら。
- **両者は物理量が異なり厳密換算は不可能**(沈降速度・粒径・風速・湿度に依存)。経験的近似で `1個/cm²/日 ≈ 1.4個/m³(日平均)`、日本のしきい値 `50個/cm²/日 ≈ 70〜150 grains/m³(日平均)` 程度とされる。
- **Google Pollen API は UPI(Universal Pollen Index, 1-5)** を主指標とし種別の grains/m³ も返す。日本式「個/cm²/日」とは別系。

### 日本花粉学会の区分(個/cm²/日、2023年12月改訂)

| 区分 | 範囲 |
|---|---|
| 少ない | < 10 |
| やや多い | 10〜30 |
| 多い | 30〜50 |
| 非常に多い | 50〜100 |
| 極めて多い | ≥ 100(2024シーズンから運用) |

→ **本サイトの現行しきい値(grains/m³: 10/50/100)は CAMS/EAACI 系であり、日本式とは単位も区切りも異なる**。混在表示は誤解を招くため、UIで「grains/m³(モデル予報値)であり個/cm²/日とは異なる」と明示する対応を実施済み(Footer・BetaNotice)。

## ライセンス・法的論点

- **政府データ**(環境省・林野庁・気象庁・自治体): 政府標準利用規約2.0(CC BY 4.0互換)。**商用可・出典明記必須**。
- **Google Pollen API**: Maps Platform ToS。アプリ利用可、"Powered by Google" 表示と30日キャッシュ上限に注意。
- **ウェザーニューズ opendata**: 無料だが**非商用限定**、Web再公開は事前申請が必要。
- **tenki.jp / Yahoo!天気のスクレイピング**: 両社ToSで明確に禁止。判例(翼システム事件・岡崎図書館事件)を踏まえ**商用フリーライドは不法行為リスク**。採用しない。

## 推奨実装方針(MVP)

1. **MVP は Google Pollen API でスギ・ヒノキを追加**(`JAPANESE_CEDAR` / `JAPANESE_CYPRESS`)。スクレイピング不要・APIキー認証のみ・月5,000call無料枠でISR(`revalidate: 3600`)なら十分収まる。
2. **既存6種(CAMS)は維持**し、スギ・ヒノキは別系統(別 route handler)で取得して `Promise.allSettled` で並列合成。データ出所が異なるため**カードに出所バッジを表示**(本PRで導入した `AttributionLine` を流用)。
3. **単位は UPI ではなく grains/m³ に正規化**して既存カードと並べる。ただし「日本式 個/cm²/日 とは異なる概算」と注記。
4. **環境変数 `GOOGLE_POLLEN_KEY`** を追加。キー未設定時はスギ・ヒノキカードを非表示にフォールバック(ビルドは通る)。
5. 将来拡張: ウェザーニューズ opendata の観測値を「実測の参考」として併記(商用化時は要申請)。林野庁 雄花花芽調査をシーズン前の年次見通しに利用。

## 参考リンク(主要)

- Google Pollen API coverage: https://developers.google.com/maps/documentation/pollen/coverage
- Google Pollen API 課金: https://developers.google.com/maps/documentation/pollen/usage-and-billing
- WxTech life-pollen: https://wxtech.weathernews.com/products/data/services/life-pollen/
- WxTech opendata-pollen: https://wxtech.weathernews.com/products/data/services/opendata-pollen/
- tenkiapi.jp 花粉: https://tenkiapi.jp/pollen.html
- 政府標準利用規約2.0(デジタル庁): https://www.digital.go.jp/resources/data_policy
- 花粉症環境保健マニュアル2022(単位): https://www.env.go.jp/chemi/anzen/kafun/2022_full.pdf
- OSS実装例 shunsock/pollenso: https://github.com/shunsock/pollenso
- Open-Meteo Air Quality docs: https://open-meteo.com/en/docs/air-quality-api
