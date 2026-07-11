# 公開手順

対象: ORP3 `C:\Users\whity\OneDrive\Desktop\ORP3\osaka-rail-3d`

このアプリは静的Webアプリです。サーバー処理や秘密情報は不要なので、`dist/` の中身を静的ホスティングへ置けば誰でもURLで閲覧できます。

## 現在の公開先

2026-07-07時点で、Netlifyに恒久公開済みです。

```text
https://osaka-rail-3d-orp3.netlify.app/
```

Netlify管理画面:

```text
https://app.netlify.com/projects/osaka-rail-3d-orp3
```

最新本番デプロイ:

```text
2026-07-11 Sprint4(M3)反映
Deploy ID: 6a51a7fc46672bc2ecdd6a10
Unique deploy URL: https://6a51a7fc46672bc2ecdd6a10--osaka-rail-3d-orp3.netlify.app
Source commit: 0086911
```

## GitHub公開リポジトリ

2026-07-08時点で、GitHub公開リポジトリへpush済みです。

```text
https://github.com/m-nagasako/osaka-rail-3d-orp3
```

`main` ブランチにソース、生成済み公開データ、テスト、docsを含めています。`node_modules/`、`dist/`、`.netlify/`、zip成果物、環境変数、ログは公開対象から除外しています。

## 公開前の確認

```powershell
npm run build-data
npm test
npm run build
```

公開対象は次のフォルダです。

```text
C:\Users\whity\OneDrive\Desktop\ORP3\osaka-rail-3d\dist
```

`dist/index.html`、`dist/assets/`、`dist/data/` を同じ階層関係のままアップロードしてください。

## 公開先の選択肢

- Netlify / Vercel / Cloudflare Pages などの静的ホスティングに `dist/` をアップロード
- GitHub Pages などに `dist/` の中身を配置
- 一時共有だけならトンネルサービスも可能。ただしPCを起動し続ける必要があり、恒久公開には不向き

## 一時公開URL(停止済み)

2026-07-07時点で、Serveoの一時トンネルにより以下で一時公開していました。

```text
https://34c032d9ed6c166a-217-178-96-172.serveousercontent.com
```

このURLは、ローカル静的サーバ(`npm run serve-dist`)とSSHトンネルが起動している間だけ有効です。Netlify公開後は停止済みで、通常はNetlify URLを使用します。

## 注意

- `npm run dev` の `http://127.0.0.1:5174/` は自分のPCだけで見る開発用URLです。外部の人は見られません。
- 同じWi-Fi内だけで見せたい場合は `npm run dev -- --host 0.0.0.0` のような起動方法もありますが、インターネット全体への公開ではありません。
- 誰でも見られるURLにするには、外部ホスティングへのアップロードと、必要に応じてアカウントログインが必要です。
