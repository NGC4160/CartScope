import assert from "node:assert/strict";
import test from "node:test";
import type { JobRecord, ModelPack } from "../data/types.ts";
import { plainCaseSummary } from "./case-summary.ts";
import type { Proof } from "./proof.ts";

const gasPack = {
  id: "yamaha-ydra",
  manufacturerLabel: "Yamaha",
  name: "YDRA gasoline",
  fullName: "Yamaha YDRA / Drive gasoline (G29 gas)",
  powertrain: "gasoline",
  years: "2007–2016",
  diagramTitle: "YDRA gas",
  diagramNotes: ["Gas cart."],
  symptoms: [{ id: "no-start", label: "Cranks, will not start", summary: "", manualSection: "", startStepId: "g-spark" }],
  steps: { "g-spark": { id: "g-spark", title: "Spark", instruction: "", manualRef: "", highlight: [], measurement: { kind: "observation", prompt: "", meterSetup: "", expectedLabel: "" }, pass: { kind: "step", id: "g-spark" }, fail: { kind: "step", id: "g-spark" } } },
  diagnoses: {},
  components: [],
  wires: [],
  testPoints: [],
} as unknown as ModelPack;

const proof: Proof = {
  packStatus: "gas",
  enoughProof: false,
  provenCause: null,
  recommendedRepair: null,
  conflicts: [],
  nextHint: "",
  mayBlameController: true,
  mayShowParts: false,
};

function gasJob(partial: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "job_gas",
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
    technician: "Hayden",
    serialNumber: "",
    notes: "",
    modelId: "yamaha-ydra",
    symptomId: "no-start",
    currentStepId: "g-spark",
    status: "in-progress",
    log: [],
    lastName: "Brooks",
    hcpJobNumber: "880302",
    ...partial,
  };
}

test("gas Housecall copy names pack N/A and shows no battery fields", () => {
  const text = plainCaseSummary(gasJob(), gasPack, proof);
  assert.match(text, /Battery pack not applicable/);
  assert.match(text, /gasoline/i);
  assert.doesNotMatch(text, /Battery 1:/);
  assert.doesNotMatch(text, /resting volts/);
});

test("typed tech observation stays on the report copy after helper notes", () => {
  const text = plainCaseSummary(
    gasJob({
      techObservation: "Solenoid clicks, no spark at the plug.",
      includeAiInReport: true,
      aiLog: [
        { at: "2026-09-06T00:00:00.000Z", role: "user", text: "Solenoid clicks, no spark at the plug." },
        { at: "2026-09-06T00:00:01.000Z", role: "assistant", text: "Go to spark at the plug." },
      ],
    }),
    gasPack,
    proof,
  );
  assert.match(text, /What the tech saw/);
  assert.match(text, /Solenoid clicks, no spark at the plug/);
  assert.match(text, /Helper notes/);
});
