import assert from "node:assert/strict";
import test from "node:test";
import type { JobRecord, ModelPack } from "../data/types.ts";
import {
  BAY_SPLIT_MIN_PX,
  BAY_TAP_MIN_PX,
  bayCodesActionLabel,
  bayDiagramLayout,
  bayDockWritesCasePhase,
  bayHasDiagram,
  bayPackActionEnabled,
  bayPackActionLabel,
  bayPaneKeepsPlace,
  bayProgressChip,
  bayReportActionLabel,
  bayStepActionLabel,
  defaultBayPane,
  readMeterDraft,
} from "./bay-chrome.ts";

function job(patch: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "job_1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    technician: "Ryan",
    serialNumber: "",
    notes: "",
    modelId: "club-car-ds-iq",
    symptomId: "no-operation",
    currentStepId: "pack-voltage",
    status: "in-progress",
    log: [],
    lastName: "White",
    hcpJobNumber: "HCP-1",
    casePhase: "steps",
    ...patch,
  };
}

function pack(stepCount = 8): ModelPack {
  const steps = Object.fromEntries(
    Array.from({ length: stepCount }, (_, i) => [
      `s${i + 1}`,
      {
        id: `s${i + 1}`,
        title: `Step ${i + 1}`,
        instruction: "Measure",
        manualRef: "book",
        highlight: [],
        measurement: {
          kind: "voltage" as const,
          prompt: "V",
          meterSetup: "DC V",
          expectedLabel: "48 V",
        },
        pass: { kind: "step" as const, id: `s${i + 2}` },
        fail: { kind: "diagnosis" as const, id: "d1" },
      },
    ]),
  );
  return {
    id: "club-car-ds-iq",
    manufacturer: "club-car",
    manufacturerLabel: "Club Car",
    name: "DS IQ",
    fullName: "Club Car DS IQ",
    voltage: 48,
    powertrain: "electric",
    architecture: "IQ",
    years: "2000+",
    diagramTitle: "DS IQ",
    diagramNotes: [],
    components: [{ id: "bat", ref: "B", name: "Pack", kind: "battery", description: "", commonFailures: [], expectedValues: [], x: 0, y: 0, w: 10, h: 10, terminals: [] }],
    wires: [],
    testPoints: [],
    symptoms: [],
    steps,
    diagnoses: {},
  };
}

test("progress chip names pack, codes, and factory check index", () => {
  const p = pack(8);
  assert.equal(bayProgressChip(job({ casePhase: "pack" }), p), "Pack");
  assert.equal(bayProgressChip(job({ casePhase: "codes" }), p), "Codes");
  assert.equal(bayProgressChip(job({ casePhase: "steps", log: [] }), p), "Check 1 of 8");
  assert.equal(
    bayProgressChip(
      job({
        casePhase: "steps",
        log: [
          {
            id: "l1",
            stepId: "s1",
            stepTitle: "One",
            at: "2026-01-01T00:00:00.000Z",
            kind: "voltage",
            expectedLabel: "48 V",
            attempts: [],
            confirmedRaw: "48",
            result: "pass",
            next: { kind: "step", id: "s2" },
          },
          {
            id: "l2",
            stepId: "s2",
            stepTitle: "Two",
            at: "2026-01-01T00:00:00.000Z",
            kind: "voltage",
            expectedLabel: "48 V",
            attempts: [],
            confirmedRaw: "48",
            result: "pass",
            next: { kind: "step", id: "s3" },
          },
        ],
      }),
      p,
    ),
    "Check 3 of 8",
  );
  assert.equal(bayProgressChip(job({ casePhase: "report", status: "diagnosed" }), p), "Report");
  assert.equal(bayProgressChip(job({ reportConfirmed: true, status: "complete" }), p), "Done");
});

test("primary action labels stay short shop verbs", () => {
  assert.equal(bayStepActionLabel(0), "Save and go on");
  assert.equal(bayStepActionLabel(1), "Save second check");
  assert.equal(bayStepActionLabel(2), "Save third check");
  assert.equal(bayStepActionLabel(0, true), "Open report");
  assert.equal(bayCodesActionLabel(), "Save codes and go on");
  assert.equal(bayReportActionLabel(false), "Review and confirm");
  assert.equal(bayReportActionLabel(true), "Back to checks");
  assert.equal(
    bayPackActionLabel({ lithium: false, packPass: true, testPath: false, cellsReady: true }),
    "Save pack and go on",
  );
  assert.equal(
    bayPackActionLabel({ lithium: false, packPass: false, testPath: true, cellsReady: true }),
    "Save test-battery note and go on",
  );
});

test("failed pack save stays disabled until a test-battery path is chosen", () => {
  assert.equal(
    bayPackActionEnabled({ lithium: false, packPass: false, testPath: false, cellsReady: true }),
    false,
  );
  assert.equal(
    bayPackActionEnabled({ lithium: false, packPass: false, testPath: true, cellsReady: true }),
    true,
  );
  assert.equal(
    bayPackActionEnabled({ lithium: true, packPass: false, testPath: false, cellsReady: false }),
    true,
  );
});

test("wide tablets split; phones use a centered overlay", () => {
  assert.equal(bayDiagramLayout(389), "overlay");
  assert.equal(bayDiagramLayout(768), "overlay");
  assert.equal(bayDiagramLayout(BAY_SPLIT_MIN_PX), "split");
  assert.equal(bayDiagramLayout(1024), "split");
});

test("dock switching never writes case phase and always keeps place", () => {
  assert.equal(bayDockWritesCasePhase(), false);
  assert.equal(bayPaneKeepsPlace("checks", "diagram"), true);
  assert.equal(bayPaneKeepsPlace("diagram", "helper"), true);
  assert.equal(bayPaneKeepsPlace("helper", "report"), true);
  assert.equal(bayPaneKeepsPlace("report", "checks"), true);
});

test("report pane is the default only after the case is ready to review", () => {
  assert.equal(defaultBayPane(job({ casePhase: "steps" })), "checks");
  assert.equal(defaultBayPane(job({ casePhase: "pack" })), "checks");
  assert.equal(defaultBayPane(job({ casePhase: "report" })), "report");
  assert.equal(defaultBayPane(job({ status: "complete", reportConfirmed: true })), "report");
});

test("every model pack with parts or wires has a diagram pane", () => {
  assert.equal(bayHasDiagram(pack()), true);
  assert.equal(bayHasDiagram({ ...pack(), components: [], wires: [] }), false);
  assert.ok(BAY_TAP_MIN_PX >= 44);
});

test("meter draft is restored only for the same check", () => {
  assert.deepEqual(readMeterDraft(undefined, "s1"), { raw: "", selected: null });
  assert.deepEqual(readMeterDraft({ stepId: "s1", raw: "48.2", selected: null }, "s1"), {
    raw: "48.2",
    selected: null,
  });
  assert.deepEqual(readMeterDraft({ stepId: "s1", raw: "48.2", selected: "yes" }, "s2"), {
    raw: "",
    selected: null,
  });
});
