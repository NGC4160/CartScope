import type { JobRecord, ModelPack } from "@/data/types";
import { formatReading } from "@/lib/diagnostics";
import type { Proof } from "@/lib/proof";
import { collectSecrets, findPiiLeaks, mdCell, redactText, slugPart } from "@/lib/redact";
import { formatHandheldRecord } from "@/lib/handheld";
import { formatPackCellLine } from "@/lib/pack-rules";

const BRAIN_FOLDER = "knowledge/diagnostics/cases";

export interface BrainCaseFile {
  filename: string;
  path: string;
  markdown: string;
  leaks: string[];
}

function localDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ynUnknown(text: string | undefined, pattern: RegExp): string {
  if (!text) return "unknown";
  if (pattern.test(text)) return "yes";
  return "unknown";
}

export function buildBrainCase(job: JobRecord, pack: ModelPack, proof: Proof): BrainCaseFile {
  const secrets = collectSecrets({ lastName: job.lastName, hcpJobNumber: job.hcpJobNumber });
  const R = (s: string | undefined) => redactText(s ?? "", secrets);

  const symptom = pack.symptoms.find((s) => s.id === job.symptomId);
  const date = localDate(job.updatedAt);
  const systemSlug = slugPart(pack.id.replace(/^club-car-/, "cc-").replace(/^ezgo-/, "ezgo-"), 28);
  const symptomSlug = slugPart(symptom?.label || job.symptomId || "case", 36);
  let filename = `${date}-${systemSlug}-${symptomSlug}.md`;
  if (findPiiLeaks(filename, secrets).length) {
    filename = `${date}-case.md`;
  }
  const path = `${BRAIN_FOLDER}/${filename}`;

  const techRaw = (job.technician || "").trim();
  const tech =
    techRaw && secrets.some((s) => s.toLowerCase() === techRaw.toLowerCase()) ? "" : R(techRaw);

  const botAssist = (job.aiLog ?? []).some((t) => t.role === "assistant") ? "yes" : "no";

  const voltageMotor =
    pack.powertrain === "electric"
      ? `${pack.voltage} V electric · ${pack.architecture}`
      : `gasoline · ${pack.architecture}`;

  const complaintBits = [symptom?.label, R(job.complaintNote), R(job.notes)].filter(Boolean);
  const intermittent = ynUnknown(`${job.complaintNote ?? ""} ${job.notes ?? ""}`, /intermittent|sometimes|comes and goes/i);
  const lithiumFact =
    job.batteryType === "lithium"
      ? "Lithium pack on this cart. A cart that runs is not a finished conversion."
      : /lithium/i.test(`${job.complaintNote ?? ""} ${job.notes ?? ""}`)
        ? R(`${job.complaintNote ?? ""} ${job.notes ?? ""}`.slice(0, 180))
        : "no";

  const rows: { test: string; setup: string; result: string }[] = [];

  if (job.packCheck) {
    const pc = job.packCheck;
    if (pc.chemistry === "lead-acid") {
      rows.push({
        test: "Battery pack rest, IR, and age",
        setup: `Wheels blocked. ${pc.cellCount} × ${pc.nominalV} V lead-acid. Resting volts, IR meter, month/year date code.`,
        result: `${pc.cells.map((c) => formatPackCellLine(c)).join("; ")} · ${pc.verdict}`,
      });
      if (pc.irCouldNotMeasure) {
        rows.push({
          test: "Internal resistance meter",
          setup: "Could not measure. Do not invent a reading.",
          result: R(pc.irSkipReason) || "could not measure",
        });
      }
      if (pc.loadDropPct) {
        rows.push({
          test: "Pack short load (wheels up)",
          setup: "Short load. Record percent drop from rest.",
          result: `${pc.loadDropPct} % drop`,
        });
      }
    } else {
      rows.push({
        test: "Lithium monitor / BMS",
        setup: pc.lithiumNoMonitor ? "No monitor present." : "Read the pack monitor. Do not use lead-acid shop numbers.",
        result: `monitor ${pc.lithiumMonitorV || "—"} V${pc.lithiumMinCell ? ` · lowest cell ${pc.lithiumMinCell}` : ""}${pc.lithiumFaults ? ` · faults ${R(pc.lithiumFaults)}` : ""} · ${pc.verdict}`,
      });
    }
    pc.issues.forEach((issue) => {
      rows.push({
        test: "Pack note",
        setup: "Shop pack rules",
        result: R(issue),
      });
    });
  }

  if (job.testBattery?.used) {
    rows.push({
      test: "Known-good test battery continue",
      setup: "Pack failed shop rules. Later steps used a known-good test battery.",
      result: R(job.testBattery.measuredProblem),
    });
  }

  if (job.codeSave) {
    const hh = formatHandheldRecord(job, pack, "brain");
    if (job.codeSave.couldNotConnect) {
      rows.push({
        test: "Handheld programmer",
        setup: "Could not connect / could not save.",
        result: R(job.codeSave.connectReason) || "could not connect",
      });
    } else if (hh) {
      rows.push({
        test: "Program file (present and history codes live here)",
        setup: "Save on the handheld before clear. Name is redacted for the shop copy.",
        result: `${hh.program} · present ${R(hh.present)} · history ${R(hh.history)} · cleared after save ${job.codeSave.cleared ? "yes" : "no"}`,
      });
      rows.push({
        test: "Log file",
        setup: "Logger data only. Do not invent a log name.",
        result: hh.log,
      });
      rows.push({
        test: "Fault counters / odometer / fault odometer",
        setup: "As shown on the handheld. Do not invent numbers. Do not replace a speed box from counters alone.",
        result: `counters ${R(hh.counters)} · odometer ${R(hh.odometer)} · fault odometer ${R(hh.faultOdometer)}`,
      });
    }
  }

  job.log.forEach((e) => {
    const got =
      e.result === "skip"
        ? `skipped${e.skipReason ? ` (${R(e.skipReason)})` : ""}`
        : formatReading(e.confirmedRaw, e.unit);
    rows.push({
      test: e.stepTitle,
      setup: e.expectedLabel,
      result: `${got} · ${e.result === "pass" ? "looks OK" : e.result === "fail" ? "looks wrong" : e.result === "skip" ? "skipped" : e.result}`,
    });
  });

  const tableRows =
    rows.length === 0
      ? ["| 1 |  |  |  |", "| 2 |  |  |  |"]
      : rows.map((r, i) => `| ${i + 1} | ${mdCell(r.test)} | ${mdCell(r.setup)} | ${mdCell(r.result)} |`);

  const conflicts: string[] = [];
  proof.conflicts.forEach((c) => conflicts.push(R(c)));
  if (job.testBattery?.used) {
    conflicts.push(`Later steps used a known-good test battery. Measured pack problem: ${R(job.testBattery.measuredProblem)}`);
  }
  if (conflicts.length === 0) conflicts.push("(none written)");

  const rootCause = proof.provenCause ? R(proof.provenCause) : "";
  const repair = proof.recommendedRepair ? R(proof.recommendedRepair) : "";
  const retest = job.retestNote ? R(job.retestNote) : "";
  const road = /road test/i.test(job.retestNote ?? "") ? R(job.retestNote ?? "") : "";
  const lithiumClose =
    job.batteryType === "lithium" ? "yes" : pack.powertrain === "gasoline" ? "n/a" : "n/a";

  const oem = [pack.diagramTitle, pack.years].filter(Boolean).join(" — ");

  const markdown = [
    "# Diagnostic case",
    "",
    `**Date:** ${date}`,
    `**Tech:** ${tech}`,
    `**Diagnostics bot assist:** ${botAssist}`,
    "",
    "## Vehicle",
    "",
    "| Field | Value |",
    "|-------|-------|",
    `| Year | ${mdCell(job.cartYear || "")} |`,
    `| Make | ${mdCell(job.cartMake || pack.manufacturerLabel)} |`,
    `| Model | ${mdCell(job.cartModel || pack.name)} |`,
    `| Serial | ${mdCell(job.serialNumber || "")} |`,
    `| Voltage / motor type | ${mdCell(voltageMotor)} |`,
    "",
    "## Symptoms",
    "",
    `- Complaint (what / when / conditions): ${mdCell(complaintBits.join(" — "))}`,
    `- Intermittent? (yes / no / unknown): ${intermittent}`,
    `- Recent work or lithium conversion? (facts only): ${mdCell(lithiumFact)}`,
    "",
    "## Tests performed",
    "",
    "List tests in order. Include test points and meter/scope setup. Leave unused rows blank.",
    "",
    "| # | Test | Test points / setup | Result (units) |",
    "|---|------|---------------------|----------------|",
    ...tableRows,
    "",
    "## Measurements / waveforms",
    "",
    "Describe captures or paste paths under `known-good/` or `known-faulted/`. Do not invent traces.",
    "",
    "| Capture path | Component folder | Criteria checked (voltage, timing, shape, stability, frequency, load response, signal relationships) | Known-good or known-faulted |",
    "|--------------|------------------|-----------------------------------------------------------------------------------------------------|-----------------------------|",
    "|  |  |  |  |",
    "|  |  |  |  |",
    "",
    `OEM manual / NGC Manuals board reference used: ${mdCell(oem)}`,
    "",
    "## Conflicting evidence",
    "",
    "What does **not** fit the leading theory?",
    "",
    ...conflicts.map((c) => `- ${c}`),
    "",
    "## Outcome / repair verification",
    "",
    `- Root cause (only after tests): ${rootCause}`,
    `- Repair performed: ${repair}`,
    `- Re-tests (same as above, with results): ${retest}`,
    `- Road test (when safe): ${road}`,
    `- Lithium: cart running does **not** close a conversion — inspect / test / tune still required? (yes / no / n/a): ${lithiumClose}`,
    "",
    job.batteryType === "lithium"
      ? "**Warranty language check (if lithium):** customer copy is 5-year battery + BMS full replacement only. No UL claim. No 10-year claim."
      : "**Warranty language check (if lithium):** n/a",
    "",
    "## Privacy check",
    "",
    "- [x] No customer name, phone, email, or address",
    "- [x] No HCP job number",
    "- [x] No secrets",
    "",
  ].join("\n");

  const leaks = findPiiLeaks(`${filename}\n${path}\n${markdown}`, secrets);

  return { filename, path, markdown, leaks };
}

export const BRAIN_REPO = "NGC4160/NGC-Brain";
export const BRAIN_CASES_FOLDER = BRAIN_FOLDER;
