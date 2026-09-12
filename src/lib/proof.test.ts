import assert from "node:assert/strict";
import test from "node:test";
import type { JobRecord, ModelPack } from "../data/types.ts";
import { evaluateProof } from "./proof.ts";

/** Real YDRE controller diagnosis copy from `yamaha-dc` (node tests cannot import `@/` packs). */
const yamahaYdreDc = {
  id: "yamaha-ydre-dc",
  manufacturerLabel: "Yamaha",
  name: "YDRE DC Drive",
  fullName: "Yamaha YDRE / Drive G29 DC (48 V)",
  powertrain: "electric",
  architecture: "YDRE DC · Moric controller",
  years: "2007–2016",
  diagramTitle: "Power and control picture — Yamaha YDRE DC 48 V",
  diagramNotes: [],
  symptoms: [{ id: "no-operation", label: "Will not run either way", summary: "", manualSection: "", startStepId: "yno-split" }],
  steps: {},
  diagnoses: {
    "ydx-controller": {
      id: "ydx-controller",
      title: "Controller",
      summary: "",
      likelyCause: "Failed Moric / YDRE DC controller (MCU).",
      recommendedAction: "Replace the controller (JW2-H6510 series or the current replacement part).",
      parts: [{ name: "Yamaha YDRE DC controller (MCU)" }],
      severity: "replace",
    },
  },
  components: [],
  wires: [],
  testPoints: [],
} as unknown as ModelPack;

function job(partial: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "job_proof",
    createdAt: "2026-09-12T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
    technician: "Hayden",
    serialNumber: "",
    notes: "",
    modelId: "yamaha-ydre-dc",
    symptomId: "no-operation",
    currentStepId: "yno-split",
    status: "in-progress",
    log: [],
    lastName: "Alvarez",
    hcpJobNumber: "880411",
    ...partial,
  };
}

test("no diagnosis and no pack proof does not recommend parts", () => {
  const proof = evaluateProof(job(), yamahaYdreDc);
  assert.equal(proof.enoughProof, false);
  assert.equal(proof.provenCause, null);
  assert.equal(proof.recommendedRepair, null);
  assert.equal(proof.mayShowParts, false);
});

test("a controller diagnosis without saved meters does not unlock parts", () => {
  const proof = evaluateProof(job({ diagnosisId: "ydx-controller", status: "diagnosed" }), yamahaYdreDc);
  assert.equal(proof.enoughProof, false);
  assert.equal(proof.mayShowParts, false);
  assert.equal(proof.recommendedRepair, null);
  assert.equal(proof.provenCause, null);
});

test("a failed pack blocks controller parts even if a controller diagnosis is set", () => {
  const proof = evaluateProof(
    job({
      batteryType: "lead-acid",
      diagnosisId: "ydx-controller",
      packCheck: {
        at: "2026-09-12T00:00:00.000Z",
        chemistry: "lead-acid",
        cellCount: 6,
        nominalV: 8,
        cells: [{ index: 0, volts: "6.10" }],
        verdict: "fail",
        issues: ["Pack too low"],
      },
    }),
    yamahaYdreDc,
  );
  assert.equal(proof.packStatus, "fail");
  assert.equal(proof.mayBlameController, false);
  assert.equal(proof.mayShowParts, false);
  assert.match(proof.conflicts.join(" "), /Do not blame the controller/);
  assert.equal(proof.recommendedRepair, null);
});
