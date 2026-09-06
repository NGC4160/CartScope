import type { JobRecord, ModelPack } from "../data/types.ts";
import { needsCodeGate, needsPackGate } from "./case-flow.ts";
import { manualsOnFile, type ManualCandidate, type ManualCoverage } from "./manuals.ts";

export type ManualStatusSnapshot = {
  onFile: boolean;
  summary: string;
};

export function snapshotManualStatus(
  pack: ModelPack,
  sheets: { title: string; manualRef: string }[] = [],
): ManualStatusSnapshot {
  const coverage = manualsOnFile(pack, sheets);
  return { onFile: coverage.onFile, summary: coverage.summary };
}

export function helperManualsNote(
  status: ManualStatusSnapshot,
  extra?: { candidates?: ManualCandidate[] },
): string {
  const lines = [status.summary];
  if (!status.onFile) {
    lines.push(
      "Meter-evidence-only path: save the voltages and other meter numbers you take. Do not invent a factory book. A candidate manual is a suggestion only and is not added to the shop library until someone approves it.",
    );
  }
  const waiting = (extra?.candidates ?? []).filter((c) => c.status === "proposed");
  const approved = (extra?.candidates ?? []).filter((c) => c.status === "approved");
  if (waiting.length) {
    lines.push(
      `Candidate manuals waiting for approval (not in the shop library): ${waiting.map((c) => c.title).join("; ")}.`,
    );
  }
  if (approved.length) {
    lines.push(`Approved shop-library manuals: ${approved.map((c) => c.title).join("; ")}.`);
  }
  return lines.join(" ");
}

export function partialReportGaps(job: JobRecord, pack: ModelPack): string[] {
  const gaps: string[] = [];
  if (needsPackGate(pack) && !job.packCheck) {
    gaps.push("Battery pack check was not saved.");
  }
  if (needsCodeGate(pack) && !job.codeSave) {
    gaps.push("Handheld program / log was not saved.");
  }
  if (job.log.length === 0) {
    gaps.push("No factory checks were saved.");
  }
  return gaps;
}

export function isPartialReport(job: JobRecord, pack: ModelPack): boolean {
  return partialReportGaps(job, pack).length > 0;
}

export function manualsReportLines(
  status: ManualStatusSnapshot | undefined,
  coverage: ManualCoverage | undefined,
  candidates: ManualCandidate[] = [],
): string[] {
  const snap = status ?? (coverage ? { onFile: coverage.onFile, summary: coverage.summary } : undefined);
  if (!snap) return ["Manual status was not recorded on this case."];
  const lines = [
    snap.onFile ? "Manuals on file" : "No service manual on file — meter evidence only",
    snap.summary,
  ];
  if (!snap.onFile) {
    lines.push("No candidate was auto-added. None were invented.");
  }
  if (coverage?.onFile && coverage.items.length) {
    coverage.items.slice(0, 6).forEach((item) => {
      lines.push(`${item.title}${item.ref ? ` — ${item.ref}` : ""}`);
    });
  }
  candidates.forEach((c) => {
    const label = c.status === "approved" ? "Approved" : c.status === "rejected" ? "Rejected" : "Waiting for approval";
    lines.push(`${label}: ${c.title}${c.sourceNote ? ` (${c.sourceNote})` : ""}`);
  });
  return lines;
}
