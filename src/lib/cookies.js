export const SESSION_COOKIE_NAME = "osystem_masters_session";
export const OIDC_COOKIE_NAME = "osystem_masters_oidc";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function parseCookies(request) {
  return Object.fromEntries(
    (request.headers.get("cookie") || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        return index === -1 ? [cookie, ""] : [cookie.slice(0, index), cookie.slice(index + 1)];
      }),
  );
}

export function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax"];
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  return parts.join("; ");
}

export function base64UrlEncode(input) {
  const bytes = input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacSignature(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createSignedCookieValue(secret, data) {
  const payload = base64UrlEncode(JSON.stringify(data));
  const signature = await hmacSignature(secret, payload);
  return `${payload}.${signature}`;
}

export async function readSignedCookieValue(secret, value) {
  if (!value) {
    return null;
  }
  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }
  const expected = await hmacSignature(secret, payload);
  if (signature !== expected) {
    return null;
  }
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
  } catch (_error) {
    return null;
  }
}
