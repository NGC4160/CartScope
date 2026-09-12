import assert from "node:assert/strict";
import test from "node:test";
import {
  jobHeaderGaps,
  jobHeaderSummary,
  keepWhoCheckedIt,
  startNeededChips,
} from "./job-header.ts";

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

test("blank Year is a header gap when cartYear is passed; a four-digit year is not", () => {
  const blank = jobHeaderGaps({
    lastName: "Test",
    hcpJobNumber: "M72008",
    powertrain: "gasoline",
    batteryType: "",
    technician: "Hayden Silva",
    cartYear: "",
  });
  assert.deepEqual(blank, ["cartYear"]);
  assert.equal(jobHeaderSummary(blank), "Cannot start yet. Enter the cart year.");

  const partial = jobHeaderGaps({
    lastName: "Test",
    hcpJobNumber: "M72008",
    powertrain: "gasoline",
    batteryType: "",
    technician: "Hayden Silva",
    cartYear: "19",
  });
  assert.deepEqual(partial, ["cartYear"]);

  const filled = jobHeaderGaps({
    lastName: "Test",
    hcpJobNumber: "M72008",
    powertrain: "gasoline",
    batteryType: "",
    technician: "Hayden Silva",
    cartYear: "1996",
  });
  assert.deepEqual(filled, []);
  assert.equal(jobHeaderSummary(filled), null);
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

test("Start needed chips name Year, Who checked it, and Housecall Pro when those gaps apply", () => {
  const empty = jobHeaderGaps({
    lastName: "Test",
    hcpJobNumber: "",
    powertrain: "gasoline",
    batteryType: "",
    technician: "",
    cartYear: "",
  });
  assert.deepEqual(
    startNeededChips({ gaps: empty }).map((c) => c.label),
    ["Year", "Who checked it", "Housecall Pro job number"],
  );

  const yearOnly = jobHeaderGaps({
    lastName: "Test",
    hcpJobNumber: "M72008",
    powertrain: "gasoline",
    batteryType: "",
    technician: "Hayden Silva",
    cartYear: "",
  });
  assert.deepEqual(startNeededChips({ gaps: yearOnly }).map((c) => c.id), ["cartYear"]);

  const filled = jobHeaderGaps({
    lastName: "Test",
    hcpJobNumber: "M72008",
    powertrain: "gasoline",
    batteryType: "",
    technician: "Hayden Silva",
    cartYear: "1996",
  });
  assert.deepEqual(startNeededChips({ gaps: filled }), []);
  assert.deepEqual(
    startNeededChips({ gaps: filled, yearInvalid: true }).map((c) => c.label),
    ["Year"],
  );
});

test("keepWhoCheckedIt refuses a Helper observation in place of the tech name", () => {
  const saw = "Checked FE350 setup; no power at starter-generator terminal.";
  assert.equal(keepWhoCheckedIt("Hayden Silva", saw, saw), "Hayden Silva");
  assert.equal(keepWhoCheckedIt("Hayden Silva", undefined, saw), "Hayden Silva");
  assert.equal(keepWhoCheckedIt("Hayden Silva", saw, "", [saw]), "Hayden Silva");
  assert.equal(keepWhoCheckedIt("Hayden Silva", "  ", saw), "Hayden Silva");
  assert.equal(keepWhoCheckedIt("Hayden Silva", "Ryan", saw), "Ryan");
});
