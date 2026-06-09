import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  base64UrlDecode,
  buildCookie,
  createSignedCookieValue,
  parseCookies,
  readSignedCookieValue,
} from "./cookies.js";

const ADMIN_GROUPS = ["admin", "osystem-masters-admin", "管理者"];

export function isOidcConfigured(env) {
  return Boolean(env.AUTHENTIK_ISSUER && env.AUTHENTIK_CLIENT_ID && env.AUTHENTIK_CLIENT_SECRET && env.SESSION_SECRET);
}

export async function getOidcConfig(env) {
  const issuer = env.AUTHENTIK_ISSUER.replace(/\/+$/, "");
  const response = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!response.ok) {
    throw new Error(`OIDC discovery returned ${response.status}`);
  }
  return response.json();
}

export function decodeJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) {
    return {};
  }
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch (_error) {
    return {};
  }
}

function extractGroups(claims) {
  const raw = Array.isArray(claims.groups)
    ? claims.groups
    : Array.isArray(claims.group)
      ? claims.group
      : Array.isArray(claims.ak_groups)
        ? claims.ak_groups
        : typeof claims.groups === "string"
          ? claims.groups.split(/[,\s|]+/)
          : typeof claims.group === "string"
            ? claims.group.split(/[,\s|]+/)
            : typeof claims.ak_groups === "string"
              ? claims.ak_groups.split(/[,\s|]+/)
              : [];
  return raw.map((group) => String(group)).filter(Boolean);
}

export function normalizeOidcUser(claims) {
  const groups = extractGroups(claims);
  const role = groups.some((group) => ADMIN_GROUPS.includes(group)) ? "admin" : "";
  return {
    loginId: claims.preferred_username || claims.nickname || claims.email || claims.sub || "",
    name: claims.name || claims.preferred_username || "",
    email: claims.email || "",
    groups,
    role,
  };
}

export async function readSession(request, env) {
  const session = await readSignedCookieValue(env.SESSION_SECRET, parseCookies(request)[SESSION_COOKIE_NAME]);
  if (!session || session.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return session;
}

export async function readSessionUser(request, env) {
  const session = await readSession(request, env);
  return session?.user || null;
}

export async function refreshSessionUser(request, env) {
  const session = await readSession(request, env);
  if (!session) {
    return null;
  }
  if (!isOidcConfigured(env) || !session.accessToken) {
    return { user: session.user || null };
  }
  try {
    const config = await getOidcConfig(env);
    if (!config.userinfo_endpoint) {
      return { user: session.user || null };
    }
    const response = await fetch(config.userinfo_endpoint, {
      headers: { authorization: `Bearer ${session.accessToken}` },
    });
    if (!response.ok) {
      return { user: session.user || null };
    }
    const user = normalizeOidcUser(await response.json());
    const updatedSession = await createSignedCookieValue(env.SESSION_SECRET, {
      ...session,
      user,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    });
    return {
      user,
      cookie: buildCookie(SESSION_COOKIE_NAME, updatedSession, { maxAge: SESSION_TTL_SECONDS }),
    };
  } catch (_error) {
    return { user: session.user || null };
  }
}
