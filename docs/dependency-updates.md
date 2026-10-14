# 依存更新と CI の運用

## 計画

- Dependabot で npm と GitHub Actions の更新を週1回確認する。
- npm の開発用・本番用の minor・patch 更新を、それぞれ1本の PR にまとめる。
- major 更新とセキュリティ更新は個別に確認する。
- CI では `npm ci` と `npx wrangler deploy --dry-run` を実行し、デプロイ可能なバンドルが作れることを確認する。

## 2026-10-14 作業記録

- `bulkpurchase` の設定を手本に `.github/dependabot.yml` と `.github/workflows/ci.yml` を追加。
- 型検査（`tsconfig` / `check` スクリプト）とテスト（`test` スクリプト・テストファイル）は存在しないため、CI では実行しない。
- 本番デプロイは従来どおり手元の `npm run deploy`。CI からはデプロイしない。
- 事前確認: クリーン clone で `npm ci` と、Cloudflare 未認証状態での `npx wrangler deploy --dry-run` が exit 0。

## 引き継ぎ

- 型検査やテストを追加したら、`ci.yml` に該当ステップを足す。
- Dependabot の PR は CI（dry-run）の成功を確認してからマージする。
