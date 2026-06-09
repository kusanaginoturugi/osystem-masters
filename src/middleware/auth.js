import { isOidcConfigured, readSessionUser } from "../lib/auth.js";

export function requireAuth() {
  return async (c, next) => {
    if (!isOidcConfigured(c.env)) {
      return c.text("OIDC is not configured", 503);
    }
    const user = await readSessionUser(c.req.raw, c.env);
    if (!user) {
      const url = new URL(c.req.url);
      const rd = `${url.pathname}${url.search}`;
      return c.redirect(`/auth/login?rd=${encodeURIComponent(rd)}`);
    }
    c.set("user", user);
    await next();
  };
}

export function requireAdmin() {
  return async (c, next) => {
    if (!isOidcConfigured(c.env)) {
      return c.text("OIDC is not configured", 503);
    }
    const user = await readSessionUser(c.req.raw, c.env);
    if (!user) {
      const url = new URL(c.req.url);
      const rd = `${url.pathname}${url.search}`;
      return c.redirect(`/auth/login?rd=${encodeURIComponent(rd)}`);
    }
    if (user.role !== "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }
    c.set("user", user);
    await next();
  };
}
