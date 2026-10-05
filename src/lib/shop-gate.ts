import { createHmac, timingSafeEqual } from "node:crypto";
import { SHOP_GATE_API_PATH } from "./shop-gate-meta.ts";

export { SHOP_GATE_API_PATH };
export const SHOP_GATE_SECRET_ENV = "SHOP_GATE_SECRET";
export const SHOP_GATE_COOKIE = "cartscope_shop";
export const SHOP_GATE_MAX_AGE_SEC = 60 * 60 * 24 * 30;
const SESSION_PREFIX = "v1";

export type ShopGateBody = {
  ok: boolean;
  unlocked?: boolean;
  configured?: boolean;
  error?: string;
};

export type ShopGateApiResult = {
  status: number;
  body: ShopGateBody;
  setCookie?: string;
};

export function shopGateSecret(): string {
  return process.env[SHOP_GATE_SECRET_ENV]?.trim() ?? "";
}

export function isShopGateConfigured(): boolean {
  return shopGateSecret().length > 0;
}

export function shopGateNotConfiguredMessage(): string {
  return "Shop lock is not set. Ryan must add SHOP_GATE_SECRET on Vercel (Production and Preview). Do not put it in the repo.";
}

function hmacHex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function equalSecret(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    const dummy = Buffer.alloc(a.length);
    timingSafeEqual(a, dummy);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function passwordsMatch(password: string, secret: string): boolean {
  if (!password || !secret) return false;
  return equalSecret(password, secret);
}

export function signShopSession(issuedAt = Date.now(), secret = shopGateSecret()): string | null {
  if (!secret) return null;
  const payload = `${SESSION_PREFIX}.${issuedAt}`;
  return `${payload}.${hmacHex(secret, payload)}`;
}

export function verifyShopSession(token: string | null | undefined, now = Date.now(), secret = shopGateSecret()): boolean {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== SESSION_PREFIX) return false;
  const issuedAt = Number(parts[1]);
  if (!Number.isFinite(issuedAt) || issuedAt > now + 60_000) return false;
  if (now - issuedAt > SHOP_GATE_MAX_AGE_SEC * 1000) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = hmacHex(secret, payload);
  return equalSecret(parts[2]!, expected);
}

export function parseCookieValue(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    const raw = part.slice(idx + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

export function shopCookieFromRequest(request: Request): string | null {
  return parseCookieValue(request.headers.get("cookie"), SHOP_GATE_COOKIE);
}

export function serializeShopCookie(token: string, secure: boolean): string {
  const parts = [
    `${SHOP_GATE_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SHOP_GATE_MAX_AGE_SEC}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearShopCookie(secure: boolean): string {
  const parts = [
    `${SHOP_GATE_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function requestIsSecure(request: Request): boolean {
  if (process.env.VERCEL === "1") return true;
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function authorizeShopRequest(request: Request): ShopGateApiResult {
  if (!isShopGateConfigured()) {
    return {
      status: 503,
      body: {
        ok: false,
        unlocked: false,
        configured: false,
        error: shopGateNotConfiguredMessage(),
      },
    };
  }
  if (!verifyShopSession(shopCookieFromRequest(request))) {
    return {
      status: 401,
      body: {
        ok: false,
        unlocked: false,
        configured: true,
        error: "Shop sign-in required.",
      },
    };
  }
  return { status: 200, body: { ok: true, unlocked: true, configured: true } };
}

export function handleShopGateGet(request: Request): ShopGateApiResult {
  return authorizeShopRequest(request);
}

export function handleShopGatePost(request: Request, body: unknown): ShopGateApiResult {
  const secure = requestIsSecure(request);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (record.lock === true) {
    return {
      status: 200,
      body: { ok: true, unlocked: false, configured: isShopGateConfigured() },
      setCookie: clearShopCookie(secure),
    };
  }

  if (!isShopGateConfigured()) {
    return {
      status: 503,
      body: {
        ok: false,
        unlocked: false,
        configured: false,
        error: shopGateNotConfiguredMessage(),
      },
    };
  }

  const password = typeof record.password === "string" ? record.password : "";
  if (!passwordsMatch(password, shopGateSecret())) {
    return {
      status: 401,
      body: {
        ok: false,
        unlocked: false,
        configured: true,
        error: "Wrong shop password.",
      },
    };
  }

  const token = signShopSession();
  if (!token) {
    return {
      status: 503,
      body: {
        ok: false,
        unlocked: false,
        configured: false,
        error: shopGateNotConfiguredMessage(),
      },
    };
  }

  return {
    status: 200,
    body: { ok: true, unlocked: true, configured: true },
    setCookie: serializeShopCookie(token, secure),
  };
}

/** True when a JSON body might contain customer last names or job numbers. */
export function bodyLeaksShopJobs(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  if (Array.isArray(record.jobs)) return true;
  const blob = JSON.stringify(body);
  return /"lastName"|"hcpJobNumber"/.test(blob);
}
