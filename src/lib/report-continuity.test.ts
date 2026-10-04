import assert from "node:assert/strict";
import test from "node:test";
import type { JobRecord, ModelPack } from "../data/types.ts";
import {
  canConfirmComplete,
  completeBlockers,
  helperManualsNote,
  manualsReportLines,
  partialReportGaps,
  snapshotManualStatus,
} from "./report-continuity.ts";

const onFilePack = {
  id: "club-car-precedent-eric",
  fullName: "Club Car Precedent ERIC Excel (48 V)",
  years: "2015–2019",
  diagramTitle: "Power and control picture — Precedent ERIC 48 V",
  diagramNotes: ["2015+ Precedent electric uses ERIC charging."],
  symptoms: [],
  steps: {
    setup: {
      id: "setup",
      title: "Set the cart up first",
      instruction: "Tow/run in run.",
      manualRef: "2017 Precedent M&S",
      highlight: [],
      measurement: { kind: "observation", prompt: "ready", meterSetup: "", expectedLabel: "set" },
      pass: { kind: "step", id: "setup" },
      fail: { kind: "step", id: "setup" },
    },
  },
  diagnoses: {},
  components: [],
  wires: [],
  testPoints: [],
  powertrain: "electric",
  architecture: "ERIC Excel",
} as unknown as ModelPack;

const missingPack = {
  ...onFilePack,
  id: "missing-book-cart",
  fullName: "Cart with no book",
  diagramTitle: "",
  diagramNotes: [],
  steps: {},
  architecture: "unknown",
} as unknown as ModelPack;

function job(partial: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "job_1",
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
    technician: "Hayden",
    serialNumber: "",
    notes: "",
    modelId: "club-car-precedent-eric",
    symptomId: "no-operation",
    currentStepId: "setup",
    status: "in-progress",
    log: [],
    ...partial,
  };
}

test("ERIC Excel manuals-first text is snapshotted onto the case", () => {
  const status = snapshotManualStatus(onFilePack);
  assert.equal(status.onFile, true);
  assert.match(status.summary, /on file/i);
  const note = helperManualsNote(status);
  assert.match(note, /on file/i);
  const lines = manualsReportLines(status, undefined);
  assert.ok(lines.some((l) => /Manuals on file/i.test(l)));
  assert.ok(lines.some((l) => /on file/i.test(l)));
});

test("missing-manual carts stay meter-evidence-only and never auto-add a book", () => {
  const status = snapshotManualStatus(missingPack);
  assert.equal(status.onFile, false);
  const note = helperManualsNote(status, {
    candidates: [
      {
        id: "man_1",
        packId: missingPack.id,
        title: "OEM candidate",
        sourceNote: "OEM site",
        status: "proposed",
        at: "2026-09-06T00:00:00.000Z",
      },
    ],
  });
  assert.match(note, /No service manual is on file/);
  assert.match(note, /Meter-evidence-only/);
  assert.match(note, /waiting for approval/i);
  const lines = manualsReportLines(status, undefined, []);
  assert.ok(lines.some((l) => /auto-added/i.test(l)));
});

test("a report with no pack, handheld, or factory checks is labeled partial", () => {
  const gaps = partialReportGaps(job(), onFilePack);
  assert.ok(gaps.some((g) => /Battery pack/i.test(g)));
  assert.ok(gaps.some((g) => /Handheld/i.test(g)));
  assert.ok(gaps.some((g) => /No factory checks/i.test(g)));
});

test("gas reports do not treat a skipped pack as a missing pack check", () => {
  const gasPack = { ...onFilePack, id: "yamaha-ydra", powertrain: "gasoline" as const, architecture: "YDRA gas" };
  const gaps = partialReportGaps(job({ modelId: "yamaha-ydra" }), gasPack);
  assert.equal(gaps.some((g) => /Battery pack/i.test(g)), false);
});

test("confirm is blocked when an electric pack check was skipped", () => {
  const blockers = completeBlockers(job({ log: [] }), onFilePack);
  assert.ok(blockers.some((line) => /Battery pack/i.test(line)));
  assert.equal(canConfirmComplete(job({ log: [] }), onFilePack), false);
});

test("confirm is blocked when required factory checks were skipped", () => {
  const withPack = job({
    packCheck: {
      at: "2026-10-04T00:00:00.000Z",
      chemistry: "lead-acid",
      cellCount: 6,
      nominalV: 8,
      layoutSource: "factory-book",
      cells: [],
      verdict: "pass",
      issues: [],
    },
    log: [
      {
        id: "log_1",
        stepId: "setup",
        stepTitle: "Set the cart up first",
        at: "2026-10-04T00:01:00.000Z",
        kind: "observation",
        expectedLabel: "set",
        unit: "",
        attempts: [],
        confirmedRaw: "Skipped: no time",
        result: "skip",
        next: { kind: "step", id: "setup" },
        skipReason: "no time",
      },
    ],
    skipReasons: { setup: "no time" },
  });
  const blockers = completeBlockers(withPack, onFilePack);
  assert.ok(blockers.some((line) => /factory checks were skipped/i.test(line)));
  assert.equal(canConfirmComplete(withPack, onFilePack), false);
});

test("gas confirm is blocked for skipped factory checks but not for a missing pack", () => {
  const gasPack = { ...onFilePack, id: "yamaha-ydra", powertrain: "gasoline" as const, architecture: "YDRA gas" };
  const skipped = job({
    modelId: "yamaha-ydra",
    skipReasons: { setup: "jumped to report" },
  });
  assert.ok(completeBlockers(skipped, gasPack).some((line) => /factory checks were skipped/i.test(line)));
  assert.equal(
    completeBlockers(job({ modelId: "yamaha-ydra", log: [] }), gasPack).some((line) => /Battery pack/i.test(line)),
    false,
  );
});

test("a failed pack can complete without leftover factory checks", () => {
  const failed = job({
    packCheck: {
      at: "2026-10-04T00:00:00.000Z",
      chemistry: "lead-acid",
      cellCount: 6,
      nominalV: 8,
      layoutSource: "factory-book",
      cells: [],
      verdict: "fail",
      issues: ["too low"],
    },
    skipReasons: { setup: "pack failed first" },
  });
  assert.deepEqual(completeBlockers(failed, onFilePack), []);
  assert.equal(canConfirmComplete(failed, onFilePack), true);
});
