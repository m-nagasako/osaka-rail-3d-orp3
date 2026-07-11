# OSAKA RAIL 3D (M3)

大阪の鉄道網をブラウザで立体模型として再現するWebアプリ。ORP3はOsaka Metro全9路線、北大阪急行南北線、JR西日本9路線、私鉄5事業者13路線の計32路線・218駅を収録。
レイヤ操作(全体・事業者・路線単位) / 地下・地上・高架フィルタ / URL共有 / 運転間隔ベースの列車運行 / 駅別乗降人員の可視化・比較 / 駅名ラベル / 駅ホバー情報表示 / ランドマーク装飾に対応。

公開URL: https://osaka-rail-3d-orp3.netlify.app/

## 必要環境
Node.js 20.19以上(22/24で動作確認済み)。npmが使えること。

## コマンド
```
npm install          # 初回のみ
npm test             # 自動テスト39件(L1/L2)
npm run build-data   # scripts/patches等 → public/data を再生成(検証込み)
npm run dev          # 開発サーバ → ブラウザで確認
npm run build        # dist/ 生成 → Netlifyへドラッグ&ドロップで公開可
```
`public/data` は生成済みを同梱しているので、いきなり `npm run dev` でも動く。

## データを直したいとき(scripts/patches/)
- ridership.json …… 乗降人員(出典と調査日をコメントに残すこと)
- elevations.json …… 駅の深さ/高さ(路線×駅)。出典なしは概算のまま
- line-meta.json …… ラインカラー・駅間走行速度・停車秒・運転間隔
- new-stations.json …… 開業差分(夢洲など)
- landmarks.json …… 装飾用ランドマーク(名称・概略座標・高さ)

編集後に `npm run build-data` → エラー0を確認 → `npm test`。

## 正式データへの差し替え(公開前推奨)
同梱の駅座標は npm `japan-train-data`(MIT, 2017年系譜)+夢洲/北大阪急行延伸駅の手動パッチ。
公開時は国土数値情報N02系統への差し替えを推奨(T-006で対応予定)。

## ドキュメント(docs/)
- `docs/external-design_v1.2.md` 外部設計書(Sprint2)
- `docs/internal-design_v1.4.md` 内部設計書(M3-b増補)
- `docs/quality-management.md` 品質管理書(L3実機チェックリスト入り)
- `docs/incident-report_D001-003.md` 障害報告書
- `docs/qa-log.md` QAログ
- `docs/HANDOVER_2026-07-07.md` 引継ぎメモ
- `docs/PUBLIC_DEPLOY.md` 公開手順
- `docs/sprint1-report_2026-07-09.md` Sprint1完了報告
- `docs/pm-report_sprint2_2026-07-10.md` Sprint2 PM向け報告
- `docs/pm-report_sprint3_2026-07-10.md` Sprint3 PM向け報告
- `docs/pm-report_sprint4_2026-07-11.md` Sprint4 PM向け報告
- `docs/pm-report_sprint5_2026-07-11.md` Sprint5 PM向け報告
- `docs/課題管理表.md` 課題管理表
- `docs/プロジェクト標準運用フロー_v1.0.md` 標準運用フロー

## 既知の制限
運行は近似・線形は駅間補間・深さ/高さは概算(縦14倍誇張)・JR乗降人員は乗車人員×2換算・私鉄乗降人員は未投入注記・直通運転なし・ランドマークは概略座標。詳細は画面右下「データと注意事項」と品質管理書6章。
