import assert from "node:assert/strict";
import test from "node:test";
import { jobHeaderGaps, jobHeaderSummary } from "./job-header.ts";

test("empty electric header lists last name, job number, and battery type", () => {
  const gaps = jobHeaderGaps({
    lastName: "",
    hcpJobNumber: "",
    powertrain: "electric",
    batteryType: "",
  });
  assert.deepEqual(gaps, ["lastName", "hcpJobNumber", "batteryType"]);
  assert.match(jobHeaderSummary(gaps) ?? "", /last name/);
  assert.match(jobHeaderSummary(gaps) ?? "", /Housecall Pro/);
  assert.match(jobHeaderSummary(gaps) ?? "", /battery type/);
});

test("gas cart does not require battery type", () => {
  const gaps = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "gasoline",
    batteryType: "",
  });
  assert.deepEqual(gaps, []);
  assert.equal(jobHeaderSummary(gaps), null);
});

test("empty gas header lists last name and job number only", () => {
  const gaps = jobHeaderGaps({
    lastName: "",
    hcpJobNumber: "",
    powertrain: "gasoline",
    batteryType: "",
  });
  assert.deepEqual(gaps, ["lastName", "hcpJobNumber"]);
  assert.doesNotMatch(jobHeaderSummary(gaps) ?? "", /battery type/);
});

test("filled electric header has no gaps", () => {
  const gaps = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "electric",
    batteryType: "lead-acid",
  });
  assert.deepEqual(gaps, []);
  assert.equal(jobHeaderSummary(gaps), null);
});
