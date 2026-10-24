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

## 2026-10-24 脆弱性点検

[共通手順](https://github.com/kusanaginoturugi/www/blob/main/docs/security-runbook.md) の npm / Workers の節を実施。Hugo・Pages・テーマの節はこの repo に該当しない。

### 依存

- wrangler 4.149.0 → 4.152.0。hono 4.13.13 は最新のまま。
- `npm audit`: 更新前 3 件 (high 1 / moderate 2)、更新後 0 件。`npm audit --omit=dev` は前後とも 0 件。
- 指摘は wrangler → miniflare → undici 7.29.1 (GHSA-4qv8-2p9j-2685、GHSA-f72v-6w45-q472、GHSA-xjj6-f33q-929c)。開発用ツールだけの依存で、Worker のバンドルには入らない。miniflare が undici を固定しているため、`overrides` で同じ 7.x の 7.30.1 に上げた。`wrangler deploy --dry-run` と `wrangler dev` の起動を確認済み。
- override を外す条件: wrangler が依存する miniflare の `dependencies.undici` が 7.30.1 以上になったとき (`npm view miniflare@<版> dependencies.undici`)。

### コード

- open redirect を修正: `/auth/login?rd=` の値を検証せずにログイン後のリダイレクト先にしていた (`rd=https://evil`、`//evil`、`/\evil` が通った)。同一オリジンのパスだけ許可し、それ以外は `/` にする。callback 側でも同じ判定をかける。
- セッション cookie の署名比較を定数時間の比較にした。
- 確認のみ (変更なし):
  - `/api/*` はログインなしで読める。消費アプリがサーバー側から pull 型同期で取る設計 (README) なので意図どおり。返すのはマスタデータだけ。
  - id_token は署名検証せずに decode しているが、token endpoint から TLS + client_secret + PKCE で直接受け取っているので許容。
  - 管理画面の POST は `SameSite=Lax` のセッション cookie で、別サイトからの送信には cookie が付かない。
  - CSV エクスポートで `= + - @` 始まりの値を数式として無害化していない。書き込みも閲覧も管理者だけで、エクスポートは再インポート用の往復形式なので、片側だけ `'` を付けると値が壊れる。必要になったらエクスポートとインポートの両方で対称に処理する。
  - シークレットのパターン検索 (`git grep`) は 0 件。`.dev.vars.example` は空欄。

### セキュリティヘッダー

`hono/secure-headers` を全ルートに適用。画面に inline script はなく、inline `<style>` があるので `style-src` だけ `'unsafe-inline'`。

- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`
- `X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`、`Strict-Transport-Security: max-age=31536000` (`includeSubDomains` なし)
- Hono の既定で `X-Content-Type-Options`、`Cross-Origin-Opener-Policy`、`Cross-Origin-Resource-Policy: same-origin` なども付く。`/api/*` はサーバー間で取得されるので CORP の影響はない。

### GitHub

- `ci.yml`: `permissions: contents: read`、週次実行、Actions を commit SHA で固定、`persist-credentials: false`、`npm audit --omit=dev --audit-level=high` を追加。
- `codeql.yml` (actions / javascript-typescript、security-extended) と `dependency-review.yml` (high 以上で失敗) を追加。
- Dependabot の設定は既存のまま。Dependabot alerts (vulnerability-alerts) を有効化。security updates (自動修正 PR) と main の保護設定は変更していない。
