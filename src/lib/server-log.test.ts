import assert from "node:assert/strict";
import test from "node:test";
import { logServer, redactForLog, redactString } from "./server-log.ts";

const CARD = "4111-1111-1111-1111";
const TOKEN = "tok_live_abcdefghijklmnop";
const PASSWORD = "hunter2-shop-secret";

function capture(level: "info" | "error", run: () => void): string[] {
  const lines: string[] = [];
  const method = level === "info" ? "info" : "error";
  const orig = console[method];
  console[method] = ((msg?: unknown) => {
    lines.push(String(msg));
  }) as typeof console.error;
  try {
    run();
  } finally {
    console[method] = orig;
  }
  return lines;
}

test("redacts passwords, tokens, and card numbers in structured fields", () => {
  const out = redactForLog({
    password: PASSWORD,
    apiKey: TOKEN,
    authorization: `Bearer ${TOKEN}`,
    note: `paid with ${CARD}`,
    cart: "Precedent IQ",
  }) as Record<string, unknown>;

  const blob = JSON.stringify(out);
  assert.equal(blob.includes(PASSWORD), false);
  assert.equal(blob.includes(TOKEN), false);
  assert.equal(blob.includes("4111"), false);
  assert.equal(out.password, "[redacted]");
  assert.equal(out.apiKey, "[redacted]");
  assert.equal(out.authorization, "[redacted]");
  assert.equal(out.cart, "Precedent IQ");
  assert.match(String(out.note), /\[redacted\]/);
});

test("redacts secrets embedded in error text and database URLs", () => {
  let parseError: unknown;
  try {
    JSON.parse(`{"password":"${PASSWORD}"`);
  } catch (error) {
    parseError = error;
  }
  const out = redactForLog({
    error: parseError,
    detail: `connect postgres://shop:${PASSWORD}@db.example/cart`,
    cookie: "cartscope_shop=abc.123.def",
  });
  const blob = JSON.stringify(out);
  assert.equal(blob.includes(PASSWORD), false);
  assert.equal(blob.includes("abc.123.def"), false);
  assert.match(blob, /\[redacted\]/);
});

test("leaves ordinary shop text alone", () => {
  assert.equal(redactString("solenoid click, 48 V pack, Precedent"), "solenoid click, 48 V pack, Precedent");
});

test("logServer writes one redacted json line", () => {
  const lines = capture("error", () => {
    logServer("error", "shared_jobs_read_failed", {
      password: PASSWORD,
      token: TOKEN,
      note: CARD,
    });
  });
  assert.equal(lines.length, 1);
  assert.equal(lines[0]?.includes(PASSWORD), false);
  assert.equal(lines[0]?.includes(TOKEN), false);
  assert.equal(lines[0]?.includes("4111"), false);
  const parsed = JSON.parse(lines[0] ?? "{}") as { level: string; event: string };
  assert.equal(parsed.level, "error");
  assert.equal(parsed.event, "shared_jobs_read_failed");
});
