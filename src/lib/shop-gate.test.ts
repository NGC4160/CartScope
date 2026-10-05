import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  SHOP_GATE_COOKIE,
  SHOP_GATE_SECRET_ENV,
  authorizeShopRequest,
  bodyLeaksShopJobs,
  handleShopGateGet,
  handleShopGatePost,
  parseCookieValue,
  passwordsMatch,
  signShopSession,
  verifyShopSession,
} from "./shop-gate.ts";

const prevSecret = process.env[SHOP_GATE_SECRET_ENV];

function setSecret(value: string | undefined) {
  if (value === undefined) delete process.env[SHOP_GATE_SECRET_ENV];
  else process.env[SHOP_GATE_SECRET_ENV] = value;
}

afterEach(() => {
  setSecret(prevSecret);
});

describe("shop gate session", () => {
  test("compares passwords without accepting empty values", () => {
    assert.equal(passwordsMatch("shop-pass", "shop-pass"), true);
    assert.equal(passwordsMatch("shop-pass", "other"), false);
    assert.equal(passwordsMatch("", "shop-pass"), false);
    assert.equal(passwordsMatch("shop-pass", ""), false);
  });

  test("signed session verifies and rejects a tampered token", () => {
    setSecret("unit-test-shop-secret");
    const token = signShopSession(1_728_000_000_000);
    assert.ok(token);
    assert.equal(verifyShopSession(token, 1_728_000_000_000 + 1000), true);
    assert.equal(verifyShopSession(`${token}x`, 1_728_000_000_000 + 1000), false);
    assert.equal(verifyShopSession(token, 1_728_000_000_000 + 60 * 60 * 24 * 40 * 1000), false);
  });

  test("GET without a cookie does not include job fields", () => {
    setSecret("unit-test-shop-secret");
    const result = handleShopGateGet(new Request("http://shop.test/api/shop-gate"));
    assert.equal(result.status, 401);
    assert.equal(result.body.ok, false);
    assert.equal(bodyLeaksShopJobs(result.body), false);
    assert.doesNotMatch(JSON.stringify(result.body), /lastName|hcpJobNumber|"jobs"/);
  });

  test("POST with the shop password sets a session cookie", () => {
    setSecret("unit-test-shop-secret");
    const result = handleShopGatePost(new Request("http://shop.test/api/shop-gate"), {
      password: "unit-test-shop-secret",
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.unlocked, true);
    assert.match(String(result.setCookie), new RegExp(`${SHOP_GATE_COOKIE}=`));
    const token = parseCookieValue(result.setCookie ?? "", SHOP_GATE_COOKIE);
    const authorized = authorizeShopRequest(
      new Request("http://shop.test/api/jobs", {
        headers: { cookie: `${SHOP_GATE_COOKIE}=${token}` },
      }),
    );
    assert.equal(authorized.status, 200);
    assert.equal(authorized.body.ok, true);
  });

  test("wrong password and missing secret stay closed", () => {
    setSecret("unit-test-shop-secret");
    const wrong = handleShopGatePost(new Request("http://shop.test/api/shop-gate"), {
      password: "not-the-shop-secret",
    });
    assert.equal(wrong.status, 401);
    assert.match(String(wrong.body.error), /Wrong shop password/);
    setSecret(undefined);
    const missing = handleShopGateGet(new Request("http://shop.test/api/shop-gate"));
    assert.equal(missing.status, 503);
    assert.match(String(missing.body.error), /SHOP_GATE_SECRET/);
  });
});
