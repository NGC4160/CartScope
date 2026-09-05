import type { JobRecord, ModelPack } from "@/data/types";
import { packRecordPass } from "@/lib/pack-rules";

export interface Proof {
  packStatus: "unknown" | "pass" | "fail" | "test-battery" | "lithium" | "gas";
  enoughProof: boolean;
  provenCause: string | null;
  recommendedRepair: string | null;
  conflicts: string[];
  nextHint: string;
  mayBlameController: boolean;
  mayShowParts: boolean;
}

const CONTROLLER_HINT =
  /speed box|speedbox|controller|inverter|mcu|1206|iq speed|power box/i;

export function evaluateProof(job: JobRecord, pack: ModelPack): Proof {
  const conflicts: string[] = [];
  let packStatus: Proof["packStatus"] = "unknown";

  if (pack.powertrain === "gasoline") {
    packStatus = "gas";
  } else if (job.batteryType === "lithium") {
    packStatus = "lithium";
  } else if (job.testBattery?.used) {
    packStatus = "test-battery";
  } else if (job.packCheck) {
    packStatus = packRecordPass(job.packCheck) ? "pass" : "fail";
  }

  const diagnosis = job.diagnosisId ? pack.diagnoses[job.diagnosisId] : undefined;
  const blamesController = Boolean(
    diagnosis && CONTROLLER_HINT.test(`${diagnosis.title} ${diagnosis.likelyCause} ${diagnosis.recommendedAction}`),
  );

  const mayBlameController =
    packStatus === "pass" ||
    packStatus === "test-battery" ||
    packStatus === "lithium" ||
    packStatus === "gas";

  if (packStatus === "fail" && blamesController) {
    conflicts.push(
      "The pack failed the shop battery rules. Do not blame the controller until the pack is charged or fixed, or you continue on a known-good test battery and write that note.",
    );
  }

  if (job.testBattery?.used && !job.testBattery.measuredProblem.trim()) {
    conflicts.push("A test battery is in use, but the measured pack problem was not written down.");
  }

  let provenCause: string | null = null;
  let recommendedRepair: string | null = null;

  if (packStatus === "fail" && !job.testBattery?.used) {
    provenCause = "The battery pack is too low or uneven to trust.";
    recommendedRepair = "Charge or fix the pack first. Do not replace other big parts yet.";
  } else if (diagnosis && (!blamesController || mayBlameController)) {
    const measured = job.log.filter((e) => e.result !== "skip").length >= 1 || Boolean(job.packCheck);
    if (measured) {
      provenCause = diagnosis.title;
      recommendedRepair = diagnosis.recommendedAction;
    }
  }

  if (job.provenCauseOverride?.trim()) {
    provenCause = job.provenCauseOverride.trim();
  }

  const enoughProof = Boolean(provenCause) && conflicts.length === 0;
  const mayShowParts = enoughProof && Boolean(diagnosis?.parts.length) && (!blamesController || mayBlameController);

  const nextHint = nextHintFor(job, pack, packStatus, enoughProof);

  return {
    packStatus,
    enoughProof,
    provenCause: enoughProof ? provenCause : null,
    recommendedRepair: enoughProof ? recommendedRepair : null,
    conflicts,
    nextHint,
    mayBlameController,
    mayShowParts,
  };
}

function nextHintFor(
  job: JobRecord,
  pack: ModelPack,
  packStatus: Proof["packStatus"],
  enoughProof: boolean,
): string {
  if (job.casePhase === "report" || job.status === "diagnosed") {
    if (enoughProof) {
      return "Review the report. Confirm it only after the numbers match what you saw.";
    }
    return "Not enough proof to recommend a repair yet. Review the report and keep testing, or write what is still missing.";
  }
  if (job.casePhase === "pack") {
    if (pack.powertrain !== "electric") {
      return "This is a gas cart. Skip the pack screen and follow the factory checks.";
    }
    if (job.batteryType === "lithium") {
      return "Read the battery monitor or battery-management numbers. Do not use the lead-acid shop rules on a lithium pack.";
    }
    return "Block the wheels. Measure each battery at rest. Then measure internal resistance with the IR meter. Write month and year from each date code. Do not invent a reading or an age.";
  }
  if (job.casePhase === "codes") {
    return "Connect the handheld. Save a program file before you clear. Present codes and history codes live in that program file. If you did not use the logger, check that box. Write fault counters and odometer if the screen shows them. Do not replace a controller from counters alone.";
  }
  const step = pack.steps[job.currentStepId];
  if (step) {
    const first = step.instruction.split(/(?<=\.)\s/)[0] ?? step.title;
    return `Now do this. ${first}`;
  }
  if (packStatus === "fail") {
    return "These batteries are too low or uneven to trust. You can charge or fix them first, or continue on a known-good test battery.";
  }
  return "Follow the next factory check. Save every number.";
}

export function caseBrief(job: JobRecord, pack: ModelPack, proof: Proof): string {
  const cells = job.packCheck
    ? job.packCheck.cells
        .map((c) => {
          const ir = c.irCouldNot ? "IR-skip" : c.ir ? `IR=${c.ir}` : "IR=?";
          const age = c.ageNotReadable ? "age-unread" : c.ageMonthYear ? `age=${c.ageMonthYear}` : "age=?";
          return `B${c.index + 1}=${c.volts}V ${ir} ${age}`;
        })
        .join(", ")
    : "(pack not saved)";
  return [
    `CASE: ${job.lastName ?? "?"} / ${job.hcpJobNumber ?? "?"}`,
    `CART: ${job.cartYear ?? ""} ${pack.fullName}`,
    `SERIAL: ${job.serialNumber || "(none)"}`,
    `BATTERY TYPE: ${job.batteryType ?? (pack.powertrain === "gasoline" ? "gas" : "unknown")}`,
    `COMPLAINT: ${pack.symptoms.find((s) => s.id === job.symptomId)?.label ?? job.symptomId}`,
    `NOTES: ${job.complaintNote || job.notes || "(none)"}`,
    `PHASE: ${job.casePhase ?? "steps"}`,
    `PACK: ${proof.packStatus} · ${cells}`,
    job.testBattery?.used ? `TEST BATTERY IN USE: ${job.testBattery.measuredProblem}` : "TEST BATTERY: no",
    job.codeSave
      ? `HANDHELD program=${job.codeSave.programFileName || "—"} log=${job.codeSave.loggerNotUsed || !job.codeSave.logFileName ? "logger not used" : job.codeSave.logFileName} present=${job.codeSave.present || "—"} history=${job.codeSave.history || "—"} couldNotConnect=${job.codeSave.couldNotConnect} cleared=${job.codeSave.cleared} odometer=${job.codeSave.noControllerReadings ? "not shown" : job.codeSave.odometer || "—"} faultOdo=${job.codeSave.noControllerReadings ? "not shown" : job.codeSave.faultOdometer || "—"} counters=${job.codeSave.noControllerReadings ? "not shown" : (job.codeSave.faultCounterNotes || "—")}`
      : "CODES: not saved",
    `PROOF: enough=${proof.enoughProof} cause=${proof.provenCause ?? "Not proven yet"}`,
    `MAY BLAME CONTROLLER: ${proof.mayBlameController}`,
    proof.conflicts.length ? `CONFLICTS: ${proof.conflicts.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
