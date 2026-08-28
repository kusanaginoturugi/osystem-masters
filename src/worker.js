import { Hono } from "hono";
import { html } from "hono/html";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";
import adminRoutes from "./routes/admin.jsx";
import { isOidcConfigured, readSessionUser } from "./lib/auth.js";
import { requireAdmin } from "./middleware/auth.js";

const app = new Hono();

app.route("/auth", authRoutes);
app.route("/api", apiRoutes);

app.get("/api/me", async (c) => {
  if (!isOidcConfigured(c.env)) {
    return c.json({ loginId: "", name: "", email: "", groups: [], role: "" });
  }
  const user = await readSessionUser(c.req.raw, c.env);
  return c.json(user || { loginId: "", name: "", email: "", groups: [], role: "" });
});

app.use("/admin/*", requireAdmin());
app.use("/admin", requireAdmin());
app.route("/admin", adminRoutes);

app.get("/", async (c) => {
  const configured = isOidcConfigured(c.env);
  const user = configured ? await readSessionUser(c.req.raw, c.env) : null;
  const admin = user?.role === "admin";

  const action = !configured
    ? html`<p class="notice">認証設定が完了していません。</p>`
    : admin
      ? html`<p>ログイン中: ${user.name || user.loginId}</p><a class="button" href="/admin">管理画面を開く</a>`
      : user
        ? html`<p class="notice">ログイン中ですが、管理画面を利用する権限がありません。</p><a href="/auth/logout">ログアウト</a>`
        : html`<p>伝道会・護摩供・商品のマスタを管理します。</p><a class="button" href="/auth/login?rd=%2Fadmin">ログインして管理画面を開く</a>`;

  return c.html(html`<!doctype html>
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>osystem-masters</title>
        <style>
          body { font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; margin: 1.5rem; color: #495567; }
          main { max-width: 36rem; padding: 1.25rem 1.5rem; border: 1px solid #d7dfef; border-radius: 6px; background: #f7f9fd; }
          h1 { margin: 0 0 1rem; font-size: 1.3rem; }
          p { line-height: 1.6; }
          .button { display: inline-block; padding: 0.45rem 0.8rem; border-radius: 4px; background: #907fc0; color: white; text-decoration: none; }
          .notice { color: #7d88a0; }
        </style>
      </head>
      <body><main><h1>osystem-masters</h1>${action}</main></body>
    </html>`);
});

export default app;
