import assert from "node:assert/strict";
import test from "node:test";
import { collectSecrets, findPiiLeaks, redactText, slugPart } from "./redact.ts";

test("redacts last name, job number, phone, email, address", () => {
  const secrets = collectSecrets({ lastName: "Ramirez", hcpJobNumber: "HCP-4411" });
  const raw =
    "Call Ramirez at 985-555-0199 or ramirez@ngc.test — 12 Oak Street. Job HCP-4411.";
  const out = redactText(raw, secrets);
  assert.equal(/Ramirez/i.test(out), false);
  assert.equal(/HCP-4411/i.test(out), false);
  assert.equal(/4411/.test(out), false);
  assert.equal(/985-555-0199/.test(out), false);
  assert.equal(/ramirez@ngc\.test/i.test(out), false);
  assert.equal(/12 Oak Street/i.test(out), false);
  assert.match(out, /\[redacted/);
});

test("email is fully stripped even when the local part is the last name", () => {
  const secrets = collectSecrets({ lastName: "Chen", hcpJobNumber: "HCP-7782" });
  const out = redactText("Email chen@ngc.test or 985-555-0144 at 40 Pine Road.", secrets);
  assert.equal(/Chen/i.test(out), false);
  assert.equal(/@ngc\.test/i.test(out), false);
  assert.equal(/HCP-7782/i.test(out), false);
  assert.match(out, /\[redacted-email\]/);
  assert.match(out, /\[redacted-phone\]/);
  assert.match(out, /\[redacted-address\]/);
});

test("filename slug never includes customer fields", () => {
  const slug = `2026-09-05-${slugPart("ezgo-txt-tct")}-${slugPart("Will not run")}.md`;
  assert.equal(slug, "2026-09-05-ezgo-txt-tct-will-not-run.md");
  assert.deepEqual(findPiiLeaks(slug, ["Ramirez", "HCP-4411"]), []);
});

test("privacy checklist does not trip HCP leak", () => {
  const md = ["- [x] No customer name, phone, email, or address", "- [x] No HCP job number", "- [x] No secrets"].join(
    "\n",
  );
  assert.deepEqual(findPiiLeaks(md), []);
});
