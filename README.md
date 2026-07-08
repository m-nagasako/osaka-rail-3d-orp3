# OSAKA RAIL 3D (M1)

大阪の鉄道網をブラウザで立体模型として再現するWebアプリ。ORP3はOsaka Metro全9路線・109駅を収録。
レイヤ操作 / 運転間隔ベースの列車運行 / 駅別乗降人員(2025年11月11日調査)の可視化・比較 / 駅ホバー情報表示に対応。

公開URL: https://osaka-rail-3d-orp3.netlify.app/

## 必要環境
Node.js 22系(開発環境と同一)。npmが使えること。

## コマンド
```
npm install          # 初回のみ
npm test             # 自動テスト19件(L1/L2)
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

編集後に `npm run build-data` → エラー0を確認 → `npm test`。

## 正式データへの差し替え(公開前推奨)
同梱の駅座標は npm `japan-train-data`(MIT, 2017年系譜)+夢洲手動パッチ。
公開時は国土数値情報N02系統への差し替えを推奨(scripts/build-data.js のA系統として**M2で対応予定**)。

## ドキュメント(docs/)
- `docs/external-design_v1.1.md` 外部設計書
- `docs/internal-design_v1.1.md` 内部設計書
- `docs/quality-management.md` 品質管理書(L3実機チェックリスト入り)
- `docs/incident-report_D001-003.md` 障害報告書
- `docs/qa-log.md` QAログ
- `docs/HANDOVER_2026-07-07.md` 引継ぎメモ
- `docs/PUBLIC_DEPLOY.md` 公開手順

## 既知の制限
運行は近似・線形は駅間補間・深さは概算(縦14倍誇張)・直通運転なし。詳細は画面右下「データと注意事項」と品質管理書6章。
