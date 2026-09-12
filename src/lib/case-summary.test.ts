import assert from "node:assert/strict";
import test from "node:test";
import { getPack } from "../data/index.ts";
import type { JobRecord, LogEntry, ModelPack } from "../data/types.ts";
import {
  alsoRecordedReadings,
  checkOutcomeLabel,
  formatCheckEvidenceLines,
  plainCaseSummary,
  reportWhoCheckedIt,
} from "./case-summary.ts";
import { evaluateProof, type Proof } from "./proof.ts";

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
  assert.match(text, /Who checked it: Hayden/);
  assert.match(text, /What the tech saw/);
  assert.match(text, /Solenoid clicks, no spark at the plug/);
  assert.match(text, /Helper notes/);
  assert.match(text, /Helper: Go to spark at the plug/);
  assert.doesNotMatch(text, /Who checked it: Solenoid/);
});

test("helper observation never fills Who checked it, even when it is the only chat line", () => {
  const text = plainCaseSummary(
    gasJob({
      technician: "Ryan",
      techObservation: "Speed sensor fault",
      includeAiInReport: true,
      aiLog: [
        { at: "2026-09-06T00:00:00.000Z", role: "user", text: "Speed sensor fault" },
        { at: "2026-09-06T00:00:00.000Z", role: "user", text: "Speed sensor fault" },
        { at: "2026-09-06T00:00:01.000Z", role: "assistant", text: "Go to the speed sensor check." },
      ],
    }),
    gasPack,
    proof,
  );
  assert.match(text, /Who checked it: Ryan/);
  assert.equal([...text.matchAll(/Who checked it:/g)].length, 1);
  assert.doesNotMatch(text, /Who checked it: Speed sensor fault/);
  assert.match(text, /What the tech saw\nSpeed sensor fault/);
  assert.match(text, /Helper: Go to the speed sensor check/);
  assert.doesNotMatch(text, /Tech note: Speed sensor fault/);
});

test("FE350 helper observation never becomes Who checked it", () => {
  const saw = "Checked FE350 setup; no power at starter-generator terminal.";
  const job = gasJob({
    technician: "Hayden Silva",
    techObservation: saw,
    includeAiInReport: true,
    aiLog: [
      { at: "2026-09-06T00:00:00.000Z", role: "user", text: saw },
      { at: "2026-09-06T00:00:01.000Z", role: "assistant", text: "Go to starter-generator power." },
    ],
  });
  const text = plainCaseSummary(job, gasPack, proof);
  assert.equal(reportWhoCheckedIt(job), "Hayden Silva");
  assert.match(text, /Who checked it: Hayden Silva/);
  assert.equal([...text.matchAll(/Who checked it:/g)].length, 1);
  assert.doesNotMatch(text, /Who checked it: Checked FE350/);
  assert.match(text, /What the tech saw\nChecked FE350 setup; no power at starter-generator terminal/);
  assert.match(text, /Helper: Go to starter-generator power/);
  assert.doesNotMatch(text, /Tech note: Checked FE350/);
});

test("report Who stays empty instead of showing a polluted observation as the tech name", () => {
  const saw = "Checked FE350 setup; no power at starter-generator terminal.";
  assert.equal(
    reportWhoCheckedIt({
      technician: saw,
      techObservation: saw,
      aiLog: [{ at: "2026-09-06T00:00:00.000Z", role: "user", text: saw }],
    }),
    "—",
  );
});

function at(iso = "2026-09-12T00:00:00.000Z") {
  return iso;
}

function logEntry(partial: Partial<LogEntry> & Pick<LogEntry, "stepId" | "stepTitle" | "confirmedRaw" | "result">): LogEntry {
  return {
    id: partial.id ?? `log_${partial.stepId}`,
    kind: partial.kind ?? "observation",
    expectedLabel: partial.expectedLabel ?? "",
    unit: partial.unit,
    attempts: partial.attempts ?? [],
    confirmedNumeric: partial.confirmedNumeric,
    confirmedOptionId: partial.confirmedOptionId,
    branchId: partial.branchId,
    skipReason: partial.skipReason,
    at: partial.at ?? at(),
    next: partial.next ?? { kind: "step", id: partial.stepId },
    ...partial,
  };
}

function caseJob(pack: ModelPack, partial: Partial<JobRecord> = {}): JobRecord {
  const symptom = pack.symptoms[0]!;
  return {
    id: `job_${pack.id}`,
    createdAt: at(),
    updatedAt: at(),
    technician: "Hayden Silva",
    serialNumber: "G29-4411",
    notes: "",
    modelId: pack.id,
    symptomId: symptom.id,
    currentStepId: symptom.startStepId,
    status: "in-progress",
    log: [],
    lastName: "Alvarez",
    hcpJobNumber: "880411",
    cartYear: "2012",
    cartMake: pack.manufacturerLabel,
    cartModel: pack.name,
    complaintNote: "Dead after sitting overnight.",
    ...partial,
  };
}

function sixLeadCells() {
  return Array.from({ length: 6 }, (_, i) => ({
    index: i,
    volts: (8.42 - i * 0.02).toFixed(2),
    ir: String(4 + i),
    irUnit: "mohm" as const,
    ageMonthYear: "03/2024",
  }));
}

test("check outcome copy never dumps the raw branch token", () => {
  assert.equal(checkOutcomeLabel("pass"), "looks OK");
  assert.equal(checkOutcomeLabel("fail"), "looks wrong");
  assert.equal(checkOutcomeLabel("skip"), "skipped");
  assert.equal(checkOutcomeLabel("branch"), "chose this path");
});

test("verify re-reads stay on the Housecall check line with units", () => {
  const entry = logEntry({
    stepId: "yn-pack",
    stepTitle: "Step 6 — Battery pack voltage",
    kind: "voltage",
    expectedLabel: "48–54.5 V",
    unit: "V",
    confirmedRaw: "47.0",
    confirmedNumeric: 47,
    result: "fail",
    attempts: [
      { attempt: 1, raw: "47.1", numeric: 47.1, inRange: false, unusual: true, at: at() },
      { attempt: 2, raw: "47.2", numeric: 47.2, inRange: false, unusual: true, at: at() },
      { attempt: 3, raw: "47.0", numeric: 47, inRange: false, unusual: true, at: at() },
    ],
  });
  assert.deepEqual(alsoRecordedReadings(entry), ["47.1 V", "47.2 V"]);
  const lines = formatCheckEvidenceLines(entry, 0);
  assert.match(lines[0]!, /got 47\.0 V; looks wrong/);
  assert.match(lines[1]!, /Also recorded: 47\.1 V, 47\.2 V/);
});

test("YDRE Housecall copy is bay-complete: identity, complaint, meters, codes, Helper place, no parts guess", () => {
  const pack = getPack("yamaha-ydre-dc");
  assert.ok(pack);
  const split = pack.steps["yno-split"];
  const packVolt = pack.steps["yn-pack"];
  assert.ok(split && packVolt);
  const saw = "Solenoid is quiet. Pack sitting at 47 V.";
  const job = caseJob(pack, {
    batteryType: "lead-acid",
    symptomId: "no-operation",
    currentStepId: "yn-buzzer",
    techObservation: saw,
    includeAiInReport: true,
    aiLog: [
      { at: at(), role: "user", text: saw },
      { at: at(), role: "assistant", text: "Go to pack voltage, then the reverse buzzer." },
    ],
    packCheck: {
      at: at(),
      chemistry: "lead-acid",
      cellCount: 6,
      nominalV: 8,
      cells: sixLeadCells(),
      verdict: "fail",
      issues: ["A 8 V battery is under the shop rest window."],
      ageLabelPhotoNote: "Date codes photographed on the case.",
    },
    codeSave: {
      at: at(),
      present: "none shown",
      history: "none shown",
      photoNote: "",
      couldNotConnect: false,
      cleared: false,
      programFileName: "2026-09-12_Alvarez_880411_Program",
      logFileName: "",
      loggerNotUsed: true,
    },
    log: [
      logEntry({
        stepId: split.id,
        stepTitle: split.title,
        kind: split.measurement.kind,
        expectedLabel: split.measurement.expectedLabel,
        confirmedRaw: "Solenoid does NOT click",
        confirmedOptionId: "noclick",
        result: "branch",
        branchId: "noclick",
        next: { kind: "step", id: "yn-run" },
      }),
      logEntry({
        stepId: packVolt.id,
        stepTitle: packVolt.title,
        kind: packVolt.measurement.kind,
        expectedLabel: packVolt.measurement.expectedLabel,
        unit: packVolt.measurement.unit,
        confirmedRaw: "47.0",
        confirmedNumeric: 47,
        result: "fail",
        attempts: [
          { attempt: 1, raw: "47.1", numeric: 47.1, inRange: false, unusual: true, at: at() },
          { attempt: 2, raw: "47.0", numeric: 47, inRange: false, unusual: true, at: at() },
        ],
        next: { kind: "diagnosis", id: "ydx-pack" },
      }),
    ],
  });
  const evaluated = evaluateProof(job, pack);
  const text = plainCaseSummary(job, pack, evaluated);

  assert.match(text, /Customer last name: Alvarez/);
  assert.match(text, /Housecall Pro job number: 880411/);
  assert.match(text, /Complaint: Will not run either way/);
  assert.match(text, /Complaint note: Dead after sitting overnight/);
  assert.match(text, /Who checked it: Hayden Silva/);
  assert.equal([...text.matchAll(/Who checked it:/g)].length, 1);
  assert.doesNotMatch(text, /Who checked it: Solenoid/);

  assert.match(text, /Battery 1: 8\.42 V/);
  assert.match(text, /Date label photo: Date codes photographed on the case/);
  assert.match(text, /Present codes: none shown/);
  assert.match(text, /History codes: none shown/);
  assert.match(text, /Program file: 2026-09-12_Alvarez_880411_Program/);

  assert.match(text, /Did the solenoid click/);
  assert.match(text, /got Solenoid does NOT click; chose this path/);
  assert.doesNotMatch(text, /; branch$/m);
  assert.doesNotMatch(text, /; branch;/);
  assert.match(text, /Step 6 — Battery pack voltage/);
  assert.match(text, /got 47\.0 V; looks wrong/);
  assert.match(text, /Also recorded: 47\.1 V/);

  assert.match(text, /What the tech saw\nSolenoid is quiet\. Pack sitting at 47 V\./);
  assert.match(text, /Helper notes\nHelper: Go to pack voltage, then the reverse buzzer/);
  assert.doesNotMatch(text, /Tech note: Solenoid is quiet/);

  assert.match(text, /Recommended repair: Charge or fix the pack first/);
  assert.doesNotMatch(text, /Yamaha YDRE DC controller \(MCU\)/);
  assert.doesNotMatch(text, /replace the controller/i);
});

test("Precedent ERIC Housecall copy keeps fault codes, pack volts, and Helper off Who", () => {
  const pack = getPack("club-car-precedent-eric");
  assert.ok(pack);
  const fault = pack.steps["pfault-code"];
  const packVolt = pack.steps["pno-pack"];
  assert.ok(fault && packVolt);
  const saw = "IQDM shows THROTTLE FAULT 1. Pedal box looks dry.";
  const job = caseJob(pack, {
    batteryType: "lead-acid",
    lastName: "Nguyen",
    hcpJobNumber: "17419",
    cartYear: "2017",
    symptomId: "fault-code",
    currentStepId: "pno-mcor-v",
    complaintNote: "Cart cuts out. Handset stored a throttle fault.",
    techObservation: saw,
    includeAiInReport: true,
    aiLog: [
      { at: at(), role: "user", text: saw },
      { at: at(), role: "assistant", text: "Go to the gas pedal sensor voltage check." },
    ],
    packCheck: {
      at: at(),
      chemistry: "lead-acid",
      cellCount: 6,
      nominalV: 8,
      cells: sixLeadCells().map((c) => ({ ...c, volts: "8.50" })),
      verdict: "pass",
      issues: [],
    },
    codeSave: {
      at: at(),
      present: "THROTTLE FAULT 1",
      history: "HPD",
      photoNote: "Screen photo on the case.",
      couldNotConnect: false,
      cleared: false,
      programFileName: "2017_Nguyen_17419_Program",
      loggerNotUsed: true,
    },
    log: [
      logEntry({
        stepId: fault.id,
        stepTitle: fault.title,
        kind: fault.measurement.kind,
        expectedLabel: fault.measurement.expectedLabel,
        confirmedRaw: "THROTTLE FAULT 1",
        confirmedOptionId: "throttle",
        result: "branch",
        branchId: "throttle",
        next: { kind: "step", id: "pno-mcor-v" },
      }),
      logEntry({
        stepId: packVolt.id,
        stepTitle: packVolt.title,
        kind: packVolt.measurement.kind,
        expectedLabel: packVolt.measurement.expectedLabel,
        unit: packVolt.measurement.unit,
        confirmedRaw: "50.2",
        confirmedNumeric: 50.2,
        result: "pass",
        next: { kind: "step", id: "pno-connections" },
      }),
    ],
  });
  const text = plainCaseSummary(job, pack, evaluateProof(job, pack));
  assert.match(text, /Customer last name: Nguyen/);
  assert.match(text, /Housecall Pro job number: 17419/);
  assert.match(text, /Complaint: IQDM \/ controller fault code/);
  assert.match(text, /Complaint note: Cart cuts out\. Handset stored a throttle fault/);
  assert.match(text, /Who checked it: Hayden Silva/);
  assert.doesNotMatch(text, /Who checked it: IQDM/);
  assert.match(text, /Present codes: THROTTLE FAULT 1/);
  assert.match(text, /History codes: HPD/);
  assert.match(text, /got THROTTLE FAULT 1; chose this path/);
  assert.match(text, /got 50\.2 V; looks OK/);
  assert.match(text, /What the tech saw\nIQDM shows THROTTLE FAULT 1/);
  assert.match(text, /Helper: Go to the gas pedal sensor voltage check/);
  assert.match(text, /Recommended repair: Not enough proof to recommend a repair yet/);
  assert.doesNotMatch(text, /replace the controller/i);
});

test("FE350 Housecall copy keeps 12 V meters, complaint, and no pack / no parts guess", () => {
  const pack = getPack("club-car-ds-gas");
  assert.ok(pack);
  const setup = pack.steps["g-setup"];
  const battery = pack.steps["g-bat"];
  assert.ok(setup && battery);
  const saw = "Checked FE350 setup; no power at starter-generator terminal.";
  const job = caseJob(pack, {
    lastName: "Brooks",
    hcpJobNumber: "880302",
    cartYear: "1996",
    symptomId: "no-crank",
    currentStepId: "g-fuse",
    fuelNote: "Fresh gas",
    complaintNote: "Key START does nothing.",
    techObservation: saw,
    includeAiInReport: true,
    aiLog: [
      { at: at(), role: "user", text: saw },
      { at: at(), role: "assistant", text: "Go to starter-generator power." },
    ],
    log: [
      logEntry({
        stepId: setup.id,
        stepTitle: setup.title,
        kind: setup.measurement.kind,
        expectedLabel: setup.measurement.expectedLabel,
        confirmedRaw: "Setup is right — keep going",
        confirmedOptionId: "yes",
        result: "pass",
        next: { kind: "step", id: "g-bat" },
      }),
      logEntry({
        stepId: battery.id,
        stepTitle: battery.title,
        kind: battery.measurement.kind,
        expectedLabel: battery.measurement.expectedLabel,
        unit: battery.measurement.unit,
        confirmedRaw: "12.55",
        confirmedNumeric: 12.55,
        result: "pass",
        next: { kind: "step", id: "g-fuse" },
      }),
    ],
  });
  const text = plainCaseSummary(job, pack, evaluateProof(job, pack));
  assert.match(text, /Customer last name: Brooks/);
  assert.match(text, /Housecall Pro job number: 880302/);
  assert.match(text, /Complaint: Engine will not crank/);
  assert.match(text, /Complaint note: Key START does nothing/);
  assert.match(text, /Who checked it: Hayden Silva/);
  assert.doesNotMatch(text, /Who checked it: Checked FE350/);
  assert.match(text, /Battery pack not applicable/);
  assert.match(text, /got Setup is right — keep going; looks OK/);
  assert.match(text, /got 12\.55 V; looks OK/);
  assert.match(text, /What the tech saw\nChecked FE350 setup; no power at starter-generator terminal/);
  assert.match(text, /Helper: Go to starter-generator power/);
  assert.match(text, /Recommended repair: Not enough proof to recommend a repair yet/);
  assert.doesNotMatch(text, /replace the TCI/i);
  assert.doesNotMatch(text, /starter-generator as a part/i);
});
