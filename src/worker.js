import { Hono } from "hono";
import authRoutes from "./routes/auth.js";
import { isOidcConfigured, readSessionUser } from "./lib/auth.js";
import { requireAdmin } from "./middleware/auth.js";

const app = new Hono();

app.route("/auth", authRoutes);

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/me", async (c) => {
  if (!isOidcConfigured(c.env)) {
    return c.json({ loginId: "", name: "", email: "", groups: [], role: "" });
  }
  const user = await readSessionUser(c.req.raw, c.env);
  return c.json(user || { loginId: "", name: "", email: "", groups: [], role: "" });
});

app.use("/admin/*", requireAdmin());
app.get("/admin", (c) => {
  const user = c.get("user");
  return c.json({ ok: true, user });
});

app.get("/", (c) => c.text("osystem-masters"));

export default app;
