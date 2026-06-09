import { Hono } from "hono";

const app = new Hono();

async function readMeta(db, tableName) {
  const row = await db.prepare("SELECT updated_at FROM master_meta WHERE table_name = ?").bind(tableName).first();
  return row?.updated_at || null;
}

function applyActiveFilter(c, sql) {
  if (c.req.query("active") === "1") {
    return `${sql} WHERE active = 1`;
  }
  return sql;
}

app.get("/health", (c) => c.json({ ok: true }));

app.get("/fellowships", async (c) => {
  const sql = applyActiveFilter(
    c,
    "SELECT id, code, old_code, name, short_name, color_code, active, sort_order, updated_at FROM fellowships",
  );
  const { results } = await c.env.DB.prepare(`${sql} ORDER BY sort_order ASC, id ASC`).all();
  return c.json({ data: results, updated_at: await readMeta(c.env.DB, "fellowships") });
});

app.get("/ceremonies", async (c) => {
  const sql = applyActiveFilter(
    c,
    "SELECT id, code, name, active, sort_order, updated_at FROM ceremonies",
  );
  const { results } = await c.env.DB.prepare(`${sql} ORDER BY sort_order ASC, id ASC`).all();
  return c.json({ data: results, updated_at: await readMeta(c.env.DB, "ceremonies") });
});

app.get("/items", async (c) => {
  const sql = applyActiveFilter(
    c,
    "SELECT id, code, name, value, refund, unit, category, active, sort_order, updated_at FROM items",
  );
  const { results } = await c.env.DB.prepare(`${sql} ORDER BY sort_order ASC, id ASC`).all();
  return c.json({ data: results, updated_at: await readMeta(c.env.DB, "items") });
});

app.get("/master_meta", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT table_name, updated_at FROM master_meta ORDER BY table_name").all();
  return c.json({ data: results });
});

export default app;
