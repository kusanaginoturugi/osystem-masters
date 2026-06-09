/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { Hono } from "hono";

const app = new Hono();

const STYLE = `
  body { font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; margin: 1.5rem; color: #222; }
  nav { padding-bottom: 0.6rem; border-bottom: 1px solid #ddd; margin-bottom: 1rem; }
  nav a { margin-right: 1rem; text-decoration: none; color: #06c; }
  nav .user { float: right; color: #666; font-size: 0.9rem; }
  h1 { font-size: 1.3rem; margin: 0 0 1rem; }
  h2 { font-size: 1rem; margin: 1.5rem 0 0.5rem; }

  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  th, td { border: 1px solid #ddd; padding: 0.3rem 0.5rem; text-align: left; font-size: 0.9rem; vertical-align: middle; }
  th { background: #f4f4f4; font-weight: normal; }
  tr.inactive td { color: #aaa; }

  input { padding: 0.25rem 0.4rem; font: inherit; box-sizing: border-box; width: 100%; }
  input[type=checkbox] { width: auto; margin: 0; }
  button { padding: 0.25rem 0.7rem; line-height: 1.4; font: inherit; cursor: pointer; white-space: nowrap; }

  .col-id { width: 3rem; }
  .col-code { width: 7rem; }
  .col-name { width: 18rem; }
  .col-short { width: 8rem; }
  .col-num { width: 5rem; }
  .col-unit { width: 5rem; }
  .col-cat { width: 7rem; }
  .col-sort { width: 4rem; }
  .col-active { width: 4rem; }
  .col-save { width: 5rem; }
  .col-actions { width: 7rem; }

  td.center { text-align: center; }
  td.actions { white-space: nowrap; }
  td.actions form { display: inline; margin: 0; }

  .flash { padding: 0.5rem 0.8rem; background: #e8f4ff; border: 1px solid #b8d8f4; margin-bottom: 0.8rem; border-radius: 3px; }
`;

const Layout = (props) => (
  <html lang="ja">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>{props.title ? `${props.title} | osystem-masters` : "osystem-masters"}</title>
      <style>{STYLE}</style>
    </head>
    <body>
      <nav>
        <a href="/admin">Dashboard</a>
        <a href="/admin/fellowships">伝道会</a>
        <a href="/admin/ceremonies">護摩供</a>
        <a href="/admin/items">商品</a>
        <a href="/auth/logout">Logout</a>
        <span class="user">{props.user?.name || props.user?.loginId || ""}</span>
      </nav>
      <h1>{props.title}</h1>
      {props.flash ? <div class="flash">{props.flash}</div> : null}
      {props.children}
    </body>
  </html>
);

function flashFromQuery(c) {
  return c.req.query("msg") || "";
}

function redirectWithFlash(c, path, message) {
  return c.redirect(`${path}?msg=${encodeURIComponent(message)}`);
}

async function touchMeta(db, tableName) {
  await db
    .prepare("UPDATE master_meta SET updated_at = CURRENT_TIMESTAMP WHERE table_name = ?")
    .bind(tableName)
    .run();
}

// 行編集 form を table の外に並べる。tr 内の input/button に form="..." で紐付ける。
const EditForm = (props) => (
  <form id={props.id} method="post" action={props.action} hidden></form>
);

// ---------- Dashboard ----------

app.get("/", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    `SELECT table_name, updated_at FROM master_meta ORDER BY table_name`,
  ).all();
  return c.html(
    <Layout title="Dashboard" user={user} flash={flashFromQuery(c)}>
      <p>マスタの最終更新時刻 (UTC):</p>
      <table>
        <colgroup>
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>テーブル</th>
            <th>最終更新</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr>
              <td>{row.table_name}</td>
              <td>{row.updated_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>,
  );
});

// ---------- Fellowships ----------

app.get("/fellowships", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    `SELECT id, code, old_code, name, short_name, active, sort_order, updated_at
     FROM fellowships ORDER BY sort_order ASC, id ASC`,
  ).all();
  const formId = (id) => `edit-fellowship-${id}`;
  return c.html(
    <Layout title="伝道会" user={user} flash={flashFromQuery(c)}>
      {results.map((row) => (
        <EditForm id={formId(row.id)} action={`/admin/fellowships/${row.id}`} />
      ))}
      <table>
        <colgroup>
          <col class="col-id" />
          <col class="col-code" />
          <col class="col-code" />
          <col class="col-name" />
          <col class="col-short" />
          <col class="col-sort" />
          <col class="col-active" />
          <col class="col-save" />
          <col class="col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>id</th>
            <th>code</th>
            <th>old_code</th>
            <th>名称</th>
            <th>短縮名</th>
            <th>sort</th>
            <th>active</th>
            <th></th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr class={row.active ? "" : "inactive"}>
              <td>{row.id}</td>
              <td><input form={formId(row.id)} type="text" name="code" value={row.code} required /></td>
              <td><input form={formId(row.id)} type="text" name="old_code" value={row.old_code || ""} /></td>
              <td><input form={formId(row.id)} type="text" name="name" value={row.name} required /></td>
              <td><input form={formId(row.id)} type="text" name="short_name" value={row.short_name} required /></td>
              <td><input form={formId(row.id)} type="number" name="sort_order" value={row.sort_order} /></td>
              <td class="center">
                <input form={formId(row.id)} type="hidden" name="active" value="0" />
                <input form={formId(row.id)} type="checkbox" name="active" value="1" checked={row.active === 1} />
              </td>
              <td><button form={formId(row.id)} type="submit">保存</button></td>
              <td class="actions">
                {row.active === 1 ? (
                  <form method="post" action={`/admin/fellowships/${row.id}/delete`}>
                    <button type="submit">論理削除</button>
                  </form>
                ) : (
                  <form method="post" action={`/admin/fellowships/${row.id}/restore`}>
                    <button type="submit">復活</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>新規追加</h2>
      <form method="post" action="/admin/fellowships">
        <table>
          <colgroup>
            <col class="col-code" />
            <col class="col-code" />
            <col class="col-name" />
            <col class="col-short" />
            <col class="col-sort" />
            <col class="col-save" />
          </colgroup>
          <thead>
            <tr>
              <th>code</th>
              <th>old_code</th>
              <th>名称</th>
              <th>短縮名</th>
              <th>sort</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" name="code" required /></td>
              <td><input type="text" name="old_code" /></td>
              <td><input type="text" name="name" required /></td>
              <td><input type="text" name="short_name" required /></td>
              <td><input type="number" name="sort_order" value="0" /></td>
              <td><button type="submit">追加</button></td>
            </tr>
          </tbody>
        </table>
      </form>
    </Layout>,
  );
});

app.post("/fellowships", async (c) => {
  const form = await c.req.formData();
  await c.env.DB.prepare(
    `INSERT INTO fellowships (code, old_code, name, short_name, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      String(form.get("code") || "").trim(),
      (form.get("old_code") || "").toString().trim() || null,
      String(form.get("name") || "").trim(),
      String(form.get("short_name") || "").trim(),
      Number(form.get("sort_order") || 0),
    )
    .run();
  await touchMeta(c.env.DB, "fellowships");
  return redirectWithFlash(c, "/admin/fellowships", "追加しました");
});

app.post("/fellowships/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const form = await c.req.formData();
  await c.env.DB.prepare(
    `UPDATE fellowships SET code = ?, old_code = ?, name = ?, short_name = ?, sort_order = ?, active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(
      String(form.get("code") || "").trim(),
      (form.get("old_code") || "").toString().trim() || null,
      String(form.get("name") || "").trim(),
      String(form.get("short_name") || "").trim(),
      Number(form.get("sort_order") || 0),
      form.getAll("active").includes("1") ? 1 : 0,
      id,
    )
    .run();
  await touchMeta(c.env.DB, "fellowships");
  return redirectWithFlash(c, "/admin/fellowships", `#${id} を更新しました`);
});

app.post("/fellowships/:id/delete", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare(`UPDATE fellowships SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  await touchMeta(c.env.DB, "fellowships");
  return redirectWithFlash(c, "/admin/fellowships", `#${id} を論理削除しました`);
});

app.post("/fellowships/:id/restore", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare(`UPDATE fellowships SET active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  await touchMeta(c.env.DB, "fellowships");
  return redirectWithFlash(c, "/admin/fellowships", `#${id} を復活しました`);
});

// ---------- Ceremonies ----------

app.get("/ceremonies", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    `SELECT id, code, name, active, sort_order, updated_at
     FROM ceremonies ORDER BY sort_order ASC, id ASC`,
  ).all();
  const formId = (id) => `edit-ceremony-${id}`;
  return c.html(
    <Layout title="護摩供" user={user} flash={flashFromQuery(c)}>
      {results.map((row) => (
        <EditForm id={formId(row.id)} action={`/admin/ceremonies/${row.id}`} />
      ))}
      <table>
        <colgroup>
          <col class="col-id" />
          <col class="col-code" />
          <col class="col-name" />
          <col class="col-sort" />
          <col class="col-active" />
          <col class="col-save" />
          <col class="col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>id</th>
            <th>code</th>
            <th>名称</th>
            <th>sort</th>
            <th>active</th>
            <th></th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr class={row.active ? "" : "inactive"}>
              <td>{row.id}</td>
              <td><input form={formId(row.id)} type="text" name="code" value={row.code} required /></td>
              <td><input form={formId(row.id)} type="text" name="name" value={row.name} required /></td>
              <td><input form={formId(row.id)} type="number" name="sort_order" value={row.sort_order} /></td>
              <td class="center">
                <input form={formId(row.id)} type="hidden" name="active" value="0" />
                <input form={formId(row.id)} type="checkbox" name="active" value="1" checked={row.active === 1} />
              </td>
              <td><button form={formId(row.id)} type="submit">保存</button></td>
              <td class="actions">
                {row.active === 1 ? (
                  <form method="post" action={`/admin/ceremonies/${row.id}/delete`}>
                    <button type="submit">論理削除</button>
                  </form>
                ) : (
                  <form method="post" action={`/admin/ceremonies/${row.id}/restore`}>
                    <button type="submit">復活</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>新規追加</h2>
      <form method="post" action="/admin/ceremonies">
        <table>
          <colgroup>
            <col class="col-code" />
            <col class="col-name" />
            <col class="col-sort" />
            <col class="col-save" />
          </colgroup>
          <thead>
            <tr>
              <th>code</th>
              <th>名称</th>
              <th>sort</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" name="code" required /></td>
              <td><input type="text" name="name" required /></td>
              <td><input type="number" name="sort_order" value="0" /></td>
              <td><button type="submit">追加</button></td>
            </tr>
          </tbody>
        </table>
      </form>
    </Layout>,
  );
});

app.post("/ceremonies", async (c) => {
  const form = await c.req.formData();
  await c.env.DB.prepare(
    `INSERT INTO ceremonies (code, name, sort_order) VALUES (?, ?, ?)`,
  )
    .bind(
      String(form.get("code") || "").trim(),
      String(form.get("name") || "").trim(),
      Number(form.get("sort_order") || 0),
    )
    .run();
  await touchMeta(c.env.DB, "ceremonies");
  return redirectWithFlash(c, "/admin/ceremonies", "追加しました");
});

app.post("/ceremonies/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const form = await c.req.formData();
  await c.env.DB.prepare(
    `UPDATE ceremonies SET code = ?, name = ?, sort_order = ?, active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(
      String(form.get("code") || "").trim(),
      String(form.get("name") || "").trim(),
      Number(form.get("sort_order") || 0),
      form.getAll("active").includes("1") ? 1 : 0,
      id,
    )
    .run();
  await touchMeta(c.env.DB, "ceremonies");
  return redirectWithFlash(c, "/admin/ceremonies", `#${id} を更新しました`);
});

app.post("/ceremonies/:id/delete", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare(`UPDATE ceremonies SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  await touchMeta(c.env.DB, "ceremonies");
  return redirectWithFlash(c, "/admin/ceremonies", `#${id} を論理削除しました`);
});

app.post("/ceremonies/:id/restore", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare(`UPDATE ceremonies SET active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  await touchMeta(c.env.DB, "ceremonies");
  return redirectWithFlash(c, "/admin/ceremonies", `#${id} を復活しました`);
});

// ---------- Items ----------

app.get("/items", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    `SELECT id, code, name, value, refund, unit, category, active, sort_order, updated_at
     FROM items ORDER BY sort_order ASC, id ASC`,
  ).all();
  const formId = (id) => `edit-item-${id}`;
  return c.html(
    <Layout title="商品" user={user} flash={flashFromQuery(c)}>
      {results.length === 0 ? (
        <p>商品はまだ登録されていません。下のフォームから追加してください。</p>
      ) : (
        <>
          {results.map((row) => (
            <EditForm id={formId(row.id)} action={`/admin/items/${row.id}`} />
          ))}
          <table>
            <colgroup>
              <col class="col-id" />
              <col class="col-code" />
              <col class="col-name" />
              <col class="col-num" />
              <col class="col-num" />
              <col class="col-unit" />
              <col class="col-cat" />
              <col class="col-sort" />
              <col class="col-active" />
              <col class="col-save" />
              <col class="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>id</th>
                <th>code</th>
                <th>名称</th>
                <th>value</th>
                <th>refund</th>
                <th>unit</th>
                <th>category</th>
                <th>sort</th>
                <th>active</th>
                <th></th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr class={row.active ? "" : "inactive"}>
                  <td>{row.id}</td>
                  <td><input form={formId(row.id)} type="text" name="code" value={row.code} required /></td>
                  <td><input form={formId(row.id)} type="text" name="name" value={row.name} required /></td>
                  <td><input form={formId(row.id)} type="number" name="value" value={row.value} /></td>
                  <td><input form={formId(row.id)} type="number" name="refund" value={row.refund} /></td>
                  <td><input form={formId(row.id)} type="text" name="unit" value={row.unit || ""} /></td>
                  <td><input form={formId(row.id)} type="text" name="category" value={row.category || ""} /></td>
                  <td><input form={formId(row.id)} type="number" name="sort_order" value={row.sort_order} /></td>
                  <td class="center">
                    <input form={formId(row.id)} type="hidden" name="active" value="0" />
                    <input form={formId(row.id)} type="checkbox" name="active" value="1" checked={row.active === 1} />
                  </td>
                  <td><button form={formId(row.id)} type="submit">保存</button></td>
                  <td class="actions">
                    {row.active === 1 ? (
                      <form method="post" action={`/admin/items/${row.id}/delete`}>
                        <button type="submit">論理削除</button>
                      </form>
                    ) : (
                      <form method="post" action={`/admin/items/${row.id}/restore`}>
                        <button type="submit">復活</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>新規追加</h2>
      <form method="post" action="/admin/items">
        <table>
          <colgroup>
            <col class="col-code" />
            <col class="col-name" />
            <col class="col-num" />
            <col class="col-num" />
            <col class="col-unit" />
            <col class="col-cat" />
            <col class="col-sort" />
            <col class="col-save" />
          </colgroup>
          <thead>
            <tr>
              <th>code</th>
              <th>名称</th>
              <th>value</th>
              <th>refund</th>
              <th>unit</th>
              <th>category</th>
              <th>sort</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" name="code" required /></td>
              <td><input type="text" name="name" required /></td>
              <td><input type="number" name="value" value="0" /></td>
              <td><input type="number" name="refund" value="0" /></td>
              <td><input type="text" name="unit" /></td>
              <td><input type="text" name="category" /></td>
              <td><input type="number" name="sort_order" value="0" /></td>
              <td><button type="submit">追加</button></td>
            </tr>
          </tbody>
        </table>
      </form>
    </Layout>,
  );
});

app.post("/items", async (c) => {
  const form = await c.req.formData();
  await c.env.DB.prepare(
    `INSERT INTO items (code, name, value, refund, unit, category, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      String(form.get("code") || "").trim(),
      String(form.get("name") || "").trim(),
      Number(form.get("value") || 0),
      Number(form.get("refund") || 0),
      (form.get("unit") || "").toString().trim() || null,
      (form.get("category") || "").toString().trim() || null,
      Number(form.get("sort_order") || 0),
    )
    .run();
  await touchMeta(c.env.DB, "items");
  return redirectWithFlash(c, "/admin/items", "追加しました");
});

app.post("/items/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const form = await c.req.formData();
  await c.env.DB.prepare(
    `UPDATE items SET code = ?, name = ?, value = ?, refund = ?, unit = ?, category = ?, sort_order = ?, active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(
      String(form.get("code") || "").trim(),
      String(form.get("name") || "").trim(),
      Number(form.get("value") || 0),
      Number(form.get("refund") || 0),
      (form.get("unit") || "").toString().trim() || null,
      (form.get("category") || "").toString().trim() || null,
      Number(form.get("sort_order") || 0),
      form.getAll("active").includes("1") ? 1 : 0,
      id,
    )
    .run();
  await touchMeta(c.env.DB, "items");
  return redirectWithFlash(c, "/admin/items", `#${id} を更新しました`);
});

app.post("/items/:id/delete", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare(`UPDATE items SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  await touchMeta(c.env.DB, "items");
  return redirectWithFlash(c, "/admin/items", `#${id} を論理削除しました`);
});

app.post("/items/:id/restore", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare(`UPDATE items SET active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  await touchMeta(c.env.DB, "items");
  return redirectWithFlash(c, "/admin/items", `#${id} を復活しました`);
});

export default app;
