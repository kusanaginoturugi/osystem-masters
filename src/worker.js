import { Hono } from "hono";
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

app.get("/", (c) => c.text("osystem-masters"));

export default app;
