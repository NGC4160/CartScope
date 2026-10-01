import assert from "node:assert/strict";
import test from "node:test";
import { applyControllerQuestion, looksLikeControllerStamp, resolveController } from "./controller-resolve.ts";
import { resolveCart } from "./cart-resolve.ts";

function matchTag(query: string) {
  const result = resolveController({ query });
  assert.equal(result.status, "match", `${query}: ${result.status === "none" || result.status === "need-input" ? result.message : ""}`);
  if (result.status !== "match") throw new Error("expected match");
  assert.equal(result.picker, false);
  return result;
}

test("Curtis 1268 opens both Drive books with no picker", () => {
  const result = matchTag("Curtis 1268");
  assert.equal(result.modelTag, "curtis-1268");
  assert.equal(result.question, null);
  assert.equal(result.docs.length, 2);
  assert.ok(result.docs.every((d) => d.modelTags.includes("curtis-1268")));
  assert.equal(matchTag("1268").modelTag, "curtis-1268");
  assert.equal(matchTag("curtis-1268").modelTag, "curtis-1268");
});

test("1206 without a suffix asks which version", () => {
  const result = matchTag("1206");
  assert.ok(result.question);
  assert.equal(result.question?.id, "1206");
  assert.equal(result.question?.options.length, 4);
  const mx = applyControllerQuestion({ query: "1206" }, "1206", "curtis-1206mx");
  assert.equal(mx.status, "match");
  if (mx.status === "match") {
    assert.equal(mx.modelTag, "curtis-1206mx");
    assert.equal(mx.question, null);
    assert.equal(mx.docs.length, 1);
    assert.match(mx.docs[0]!.title, /1206MX/);
  }
});

test("named 1206 variants open the matching sheet with no question", () => {
  assert.equal(matchTag("1206MX").modelTag, "curtis-1206mx");
  assert.equal(matchTag("PDS 1206").modelTag, "curtis-1206mx");
  assert.equal(matchTag("1206SX").question, null);
  assert.equal(matchTag("1206HB").modelTag, "curtis-1206hb");
  assert.equal(matchTag("1206 AC").modelTag, "curtis-1206ac");
});

test("1510 vs 1515 and Sevcon ask only when the stamp is incomplete", () => {
  assert.equal(matchTag("1510A").modelTag, "curtis-1510");
  assert.equal(matchTag("Curtis 1515").modelTag, "curtis-1515");
  const sevcon = matchTag("Sevcon");
  assert.ok(sevcon.question);
  assert.equal(sevcon.question?.id, "sevcon");
  const milli = applyControllerQuestion({ query: "Sevcon" }, "sevcon", "sevcon-millipak");
  assert.equal(milli.status, "match");
  if (milli.status === "match") assert.equal(milli.modelTag, "sevcon-millipak");
  assert.equal(matchTag("millipak").modelTag, "sevcon-millipak");
});

test("Danaher, 1266, and 1232E open their Drive set", () => {
  const danaher = matchTag("Danaher");
  assert.equal(danaher.modelTag, "danaher");
  assert.equal(danaher.docs.length, 2);
  assert.equal(matchTag("1266A").modelTag, "curtis-1266");
  assert.equal(matchTag("1232E").modelTag, "curtis-1232e");
  assert.equal(matchTag("1236E").modelTag, "curtis-1232e");
});

test("Navitas and 1313 stay out of the catalog", () => {
  const navitas = resolveController({ query: "Navitas TAC2" });
  assert.equal(navitas.status, "none");
  const handheld = resolveController({ query: "Curtis 1313" });
  assert.equal(handheld.status, "none");
  assert.equal(looksLikeControllerStamp("Navitas"), false);
});

test("controller stamps do not dump onto random YMM carts", () => {
  const c1268 = resolveCart({ make: "Curtis", model: "1268" });
  assert.equal(c1268.status, "none");
  if (c1268.status === "none") {
    assert.match(c1268.message, /controller stamp/i);
    assert.equal(c1268.closestPackId, null);
  }
  const bare = resolveCart({ model: "1268" });
  assert.equal(bare.status, "none");
  if (bare.status === "none") assert.equal(bare.closestPackId, null);

  const e1232 = resolveCart({ model: "1232E" });
  assert.equal(e1232.status, "none");
});

test("YMM cart auto-open is unchanged", () => {
  const precedent = resolveCart({ year: 2011, make: "Club Car", model: "Precedent" });
  assert.equal(precedent.status, "match");
  if (precedent.status === "match") {
    assert.equal(precedent.packId, "club-car-precedent-iq");
    assert.equal(precedent.question, null);
    assert.equal(precedent.picker, false);
  }
  const txt = resolveCart({ year: 2008, make: "EZ-GO", model: "TXT" });
  assert.equal(txt.status, "match");
  if (txt.status === "match") assert.equal(txt.packId, "ezgo-txt-tct");

  const emerge = resolveCart({ year: 2010, make: "Tomberlin", model: "EMerge" });
  assert.equal(emerge.status, "match");

  const star = resolveCart({ year: 2008, make: "Star", model: "Classic" });
  assert.equal(star.status, "match");
  if (star.status === "match") assert.equal(star.packId, "star-classic-dc");
});
