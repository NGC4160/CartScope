import assert from "node:assert/strict";
import test from "node:test";
import { jobHeaderGaps, jobHeaderSummary } from "./job-header.ts";

test("empty electric header lists last name, job number, battery type, and who checked it", () => {
  const gaps = jobHeaderGaps({
    lastName: "",
    hcpJobNumber: "",
    powertrain: "electric",
    batteryType: "",
    technician: "",
  });
  assert.deepEqual(gaps, ["lastName", "hcpJobNumber", "batteryType", "technician"]);
  assert.match(jobHeaderSummary(gaps) ?? "", /last name/);
  assert.match(jobHeaderSummary(gaps) ?? "", /Housecall Pro/);
  assert.match(jobHeaderSummary(gaps) ?? "", /battery type/);
  assert.match(jobHeaderSummary(gaps) ?? "", /who checked it/);
});

test("gas cart does not require battery type", () => {
  const gaps = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "gasoline",
    batteryType: "",
    technician: "Alex",
  });
  assert.deepEqual(gaps, []);
  assert.equal(jobHeaderSummary(gaps), null);
});

test("empty gas header lists last name, job number, and who checked it only", () => {
  const gaps = jobHeaderGaps({
    lastName: "",
    hcpJobNumber: "",
    powertrain: "gasoline",
    batteryType: "",
    technician: "",
  });
  assert.deepEqual(gaps, ["lastName", "hcpJobNumber", "technician"]);
  assert.doesNotMatch(jobHeaderSummary(gaps) ?? "", /battery type/);
  assert.match(jobHeaderSummary(gaps) ?? "", /who checked it/);
});

test("filled electric header has no gaps", () => {
  const gaps = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "electric",
    batteryType: "lead-acid",
    technician: "Alex",
  });
  assert.deepEqual(gaps, []);
  assert.equal(jobHeaderSummary(gaps), null);
});

test("Who checked it is required even when other header fields are filled", () => {
  const gaps = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "electric",
    batteryType: "lead-acid",
    technician: "  ",
  });
  assert.deepEqual(gaps, ["technician"]);
  assert.equal(
    jobHeaderSummary(gaps),
    "Cannot start yet. Enter the name of who checked it.",
  );
});
