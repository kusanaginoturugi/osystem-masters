# osystem-masters

聖明王院 業務システム群（[osystem](https://github.com/kusanaginoturugi/osystem)）の共通マスタデータを管理する Cloudflare Workers + D1 アプリ。

伝道会・護摩供・商品の正本を保持し、各消費アプリ（dailytally2、bulkpurchase、liberation、dedications 等）は管理画面の「マスタ同期」ボタンで自分の D1 にコピーする pull 型同期で利用する。

## スタック

- Cloudflare Workers
- D1
- Hono

## 設計方針

- 各マスタテーブルは `id INTEGER PRIMARY KEY AUTOINCREMENT` + `code TEXT UNIQUE` の構成。
  - `id`: 内部キー・同期キー・消費側 FK の参照先。**不変**。
  - `code`: 表示・検索用のユーザー編集可能なコード（変更してもアプリ側の FK は壊れない）。
- 論理削除のみサポート（`active = 0`）。物理削除は禁止。
- 認証は authentik OIDC、編集権限は admin グループのみ（実装予定）。

## ローカル開発

```sh
npm install
npm run dev
```

## D1 操作

```sh
# local DB に migration 適用
npm run db:migrate:local

# remote DB に migration 適用
npm run db:migrate:remote
```

## 関連ドキュメント

- マスタ全体の所在と源流: [`osystem/DATA.md`](https://github.com/kusanaginoturugi/osystem/blob/main/DATA.md)
