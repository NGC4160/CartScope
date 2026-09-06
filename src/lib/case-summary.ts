import type { JobRecord, ModelPack } from "../data/types.ts";
import { sheetsForPack } from "../data/wiring.ts";
import { formatHandheldRecord } from "./handheld.ts";
import { manualsOnFile } from "./manuals.ts";
import { packNaReportLines } from "./pack-na.ts";
import { formatPackCellLine } from "./pack-rules.ts";
import type { Proof } from "./proof.ts";
import { manualsReportLines, partialReportGaps } from "./report-continuity.ts";

export function plainCaseSummary(job: JobRecord, pack: ModelPack, proof: Proof): string {
  const symptom = pack.symptoms.find((s) => s.id === job.symptomId);
  const lines: string[] = [
    "CartScope case",
    `Customer last name: ${job.lastName || "—"}`,
    `Housecall Pro job number: ${job.hcpJobNumber || "—"}`,
    `Cart: ${job.cartYear || ""} ${job.cartMake || pack.manufacturerLabel} ${job.cartModel || pack.name}`.trim(),
    `Full name: ${pack.fullName}`,
    `Serial: ${job.serialNumber || "—"}`,
    pack.powertrain === "electric"
      ? `Battery type: ${job.batteryType ?? "—"}`
      : `Fuel note: ${job.fuelNote || "—"}`,
    `Complaint: ${symptom?.label ?? job.symptomId}`,
    job.complaintNote ? `Complaint note: ${job.complaintNote}` : "",
    "",
  ];

  const partial = partialReportGaps(job, pack);
  if (partial.length) {
    lines.push("Partial report — factory or handheld checks were skipped");
    partial.forEach((g) => lines.push(`- ${g}`));
    lines.push("");
  }

  const coverage = manualsOnFile(pack, sheetsForPack(pack.id));
  lines.push("Manuals first");
  manualsReportLines(job.manualStatus, coverage).forEach((g) => lines.push(g));
  lines.push("");

  const packNa = packNaReportLines(pack);
  if (packNa) {
    lines.push("Battery pack");
    packNa.forEach((l) => lines.push(l));
    lines.push("");
  } else if (job.packCheck) {
    lines.push("Battery pack");
    lines.push(`Layout: ${job.packCheck.cellCount} × ${job.packCheck.nominalV} V (${job.packCheck.chemistry})`);
    if (job.packCheck.chemistry === "lead-acid") {
      job.packCheck.cells.forEach((c) => lines.push(formatPackCellLine(c)));
      if (job.packCheck.irCouldNotMeasure) {
        lines.push(`IR meter: could not measure${job.packCheck.irSkipReason ? ` (${job.packCheck.irSkipReason})` : ""}`);
      }
      if (job.packCheck.loadDropPct) lines.push(`Load drop: ${job.packCheck.loadDropPct} %`);
    } else {
      lines.push(`Monitor pack: ${job.packCheck.lithiumMonitorV || "—"} V`);
      if (job.packCheck.lithiumMinCell) lines.push(`Lowest cell: ${job.packCheck.lithiumMinCell}`);
      if (job.packCheck.lithiumFaults) lines.push(`Monitor faults: ${job.packCheck.lithiumFaults}`);
    }
    lines.push(`Pack result: ${job.packCheck.verdict}`);
    job.packCheck.issues.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }
  if (job.testBattery?.used) {
    lines.push(`Test battery used. Measured problem: ${job.testBattery.measuredProblem}`);
    lines.push("Later steps used a known-good test battery.");
    lines.push("");
  }
  if (job.codeSave) {
    const hh = formatHandheldRecord(job, pack, "device");
    lines.push("Handheld files and codes");
    if (job.codeSave.couldNotConnect) {
      lines.push(`Could not connect / could not save${job.codeSave.connectReason ? `: ${job.codeSave.connectReason}` : "."}`);
    } else if (hh) {
      lines.push(`Program file: ${hh.program}`);
      lines.push(`Log file: ${hh.log}`);
      lines.push(`Present codes: ${hh.present}`);
      lines.push(`History codes: ${hh.history}`);
    }
    if (hh) {
      lines.push(`Fault counters: ${hh.counters}`);
      lines.push(`Odometer: ${hh.odometer}`);
      lines.push(`Fault odometer: ${hh.faultOdometer}`);
    }
    if (job.codeSave.photoNote) lines.push(`Photo note: ${job.codeSave.photoNote}`);
    lines.push(`Cleared after save: ${job.codeSave.cleared ? "yes" : "no"}`);
    lines.push("");
  }

  if (job.pathRedirects?.length) {
    lines.push("Path changes from what the tech saw");
    job.pathRedirects.forEach((r) => {
      lines.push(`- ${r.fromStepId} → ${r.toStepId}: ${r.reason}`);
    });
    lines.push("");
  }
  lines.push("Checks");
  if (job.log.length === 0) lines.push("(no factory checks saved yet)");
  job.log.forEach((e, i) => {
    const result =
      e.result === "pass" ? "looks OK" : e.result === "fail" ? "looks wrong" : e.result === "skip" ? "skipped" : e.result;
    lines.push(`${i + 1}. ${e.stepTitle} — look for ${e.expectedLabel}; got ${e.confirmedRaw}; ${result}`);
    if (e.skipReason) lines.push(`   Skip reason: ${e.skipReason}`);
  });
  lines.push("");
  lines.push(`Proven cause: ${proof.provenCause ?? "Not proven yet"}`);
  lines.push(
    `Recommended repair: ${proof.recommendedRepair ?? "Not enough proof to recommend a repair yet."}`,
  );
  if (job.retestNote) lines.push(`Re-test after repair: ${job.retestNote}`);
  if (job.techObservation?.trim()) {
    lines.push("");
    lines.push("What the tech saw");
    lines.push(job.techObservation.trim());
  }
  if (job.includeAiInReport !== false && job.aiLog?.length) {
    lines.push("");
    lines.push("Helper notes");
    job.aiLog.forEach((t) => {
      lines.push(`${t.role === "user" ? "Who checked it" : "Helper"}: ${t.text}`);
    });
  }
  if (proof.conflicts.length) {
    lines.push("");
    lines.push("Notes that do not fit:");
    proof.conflicts.forEach((c) => lines.push(`- ${c}`));
  }
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}
