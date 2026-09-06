import assert from "node:assert/strict";
import test from "node:test";
import { PACK_NA_TITLE, packIsApplicable, packNaCopy, packNaReportLines } from "./pack-na.ts";

test("gas carts are pack N/A with no battery-field copy", () => {
  const gas = { powertrain: "gasoline" as const };
  assert.equal(packIsApplicable(gas), false);
  const copy = packNaCopy(gas);
  assert.ok(copy);
  assert.equal(copy?.title, PACK_NA_TITLE);
  assert.match(copy?.summary ?? "", /gasoline/i);
  assert.doesNotMatch(copy?.summary ?? "", /resting volts|internal resistance/i);
  const lines = packNaReportLines(gas);
  assert.ok(lines?.some((l) => /not applicable/i.test(l)));
});

test("electric carts still use the pack check", () => {
  const electric = { powertrain: "electric" as const };
  assert.equal(packIsApplicable(electric), true);
  assert.equal(packNaCopy(electric), null);
  assert.equal(packNaReportLines(electric), null);
});
