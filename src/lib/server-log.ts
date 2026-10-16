/**
 * Structured server logs. Field names and string values that look like
 * passwords, tokens, or card numbers are replaced before anything is written.
 */

export type ServerLogLevel = "info" | "warn" | "error";

const REDACTED = "[redacted]";

const SENSITIVE_KEY =
  /password|passwd|secret|token|api[-_]?key|authorization|cookie|card[-_]?number|^pan$|^cvv$|^cvc$|credit[-_]?card/i;

const URL_USERINFO = /:\/\/[^/\s:@]+:[^@\s/]+@/g;
const BEARER = /\b(?:Bearer|Basic)\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const OPAQUE =
  /\b(?:sk|pk|rk|tok|xai|blob|vercel)[_-][A-Za-z0-9_-]{8,}\b/g;
const SECRET_ASSIGN =
  /((?:password|passwd|secret|token|api[_-]?key|authorization|cookie|card(?:[_-]?number)?|cvv|cvc)["']?\s*[:=]\s*["']?)([^\s,"'}&]+)/gi;
const CARD_RUN = /\b(?:\d[ -]?){12,18}\d\b/g;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key.replace(/[^a-z0-9]/gi, ""));
}

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function looksLikeCard(match: string): boolean {
  const digits = match.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  if (/^(?:\d{4}[ -]){3}\d{4}$/.test(match)) return true;
  if (/^\d{4}[ -]\d{6}[ -]\d{5}$/.test(match)) return true;
  return luhn(digits);
}

export function redactString(input: string): string {
  return input
    .replace(URL_USERINFO, "://[redacted]@")
    .replace(BEARER, (match) => `${match.slice(0, match.indexOf(" "))} ${REDACTED}`)
    .replace(JWT, REDACTED)
    .replace(OPAQUE, REDACTED)
    .replace(SECRET_ASSIGN, (_match, prefix: string) => `${prefix}${REDACTED}`)
    .replace(CARD_RUN, (match) => (looksLikeCard(match) ? REDACTED : match));
}

function redactValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return redactString(value.toString());
  if (typeof value === "function" || typeof value === "symbol") return undefined;
  if (depth > 6) return "[truncated]";
  if (typeof value !== "object") return undefined;

  if (value instanceof Error) {
    const out: Record<string, unknown> = {
      name: value.name,
      message: redactString(value.message),
    };
    if (value.stack) out.stack = redactString(value.stack);
    const cause = (value as { cause?: unknown }).cause;
    if (cause !== undefined) out.cause = redactValue(cause, depth + 1, seen);
    return out;
  }

  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    out[key] = isSensitiveKey(key) ? REDACTED : redactValue(inner, depth + 1, seen);
  }
  return out;
}

export function redactForLog(value: unknown): unknown {
  return redactValue(value, 0, new WeakSet());
}

export function logServer(
  level: ServerLogLevel,
  event: string,
  fields?: Record<string, unknown>,
): void {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      event: redactString(event),
      fields: redactForLog(fields ?? {}),
    });
    if (level === "info") console.info(line);
    else console.error(line);
  } catch {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        event: "server_log_failed",
      }),
    );
  }
}
