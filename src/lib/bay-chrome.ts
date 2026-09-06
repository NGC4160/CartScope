import type { JobRecord, ModelPack } from "../data/types.ts";

export type BayPane = "checks" | "diagram" | "helper" | "report";

export const BAY_PANES: { id: BayPane; label: string }[] = [
  { id: "checks", label: "Checks" },
  { id: "diagram", label: "Diagram" },
  { id: "helper", label: "Helper" },
  { id: "report", label: "Report" },
];

/** Landscape tablet and up — diagram stays beside the check. */
export const BAY_SPLIT_MIN_PX = 900;

export const BAY_TAP_MIN_PX = 44;

export function bayDiagramLayout(widthPx: number): "split" | "overlay" {
  return widthPx >= BAY_SPLIT_MIN_PX ? "split" : "overlay";
}

export function bayFactoryCheckTotal(pack: ModelPack): number {
  return Math.max(Object.keys(pack.steps).length, 1);
}

export function bayProgressChip(job: JobRecord, pack: ModelPack): string {
  const phase = job.casePhase ?? "steps";
  if (job.reportConfirmed || job.status === "complete") return "Done";
  if (phase === "report" || job.status === "diagnosed") return "Report";
  if (phase === "pack") return "Pack";
  if (phase === "codes") return "Codes";
  const total = bayFactoryCheckTotal(pack);
  const current = Math.min(job.log.length + 1, total);
  return `Check ${current} of ${total}`;
}

export function bayStepActionLabel(verifyPhase: number, diagnosed = false): string {
  if (diagnosed) return "Open report";
  if (verifyPhase <= 0) return "Save and go on";
  if (verifyPhase === 1) return "Save second check";
  return "Save third check";
}

export function bayPackActionLabel(opts: {
  lithium: boolean;
  packPass: boolean;
  testPath: boolean;
  cellsReady: boolean;
}): string {
  if (opts.lithium || opts.packPass || !opts.cellsReady) return "Save pack and go on";
  if (opts.testPath) return "Save test-battery note and go on";
  return "Save pack and go on";
}

export function bayPackActionEnabled(opts: {
  lithium: boolean;
  packPass: boolean;
  testPath: boolean;
  cellsReady: boolean;
}): boolean {
  if (opts.lithium || opts.packPass || !opts.cellsReady) return true;
  return opts.testPath;
}

export function bayCodesActionLabel(): string {
  return "Save codes and go on";
}

export function bayReportActionLabel(confirmed: boolean): string {
  return confirmed ? "Back to checks" : "Review and confirm";
}

/** Dock / overlay switches never clear the active check or typed values. */
export function bayPaneKeepsPlace(_from: BayPane, _to: BayPane): true {
  return true;
}

/** Peeking Report from the dock must not write casePhase. */
export function bayDockWritesCasePhase(): false {
  return false;
}

export function defaultBayPane(job: JobRecord): BayPane {
  if (job.casePhase === "report" || job.reportConfirmed || job.status === "complete") {
    return "report";
  }
  return "checks";
}

export function bayHasDiagram(pack: ModelPack): boolean {
  return pack.components.length > 0 || pack.wires.length > 0;
}

export function readMeterDraft(
  draft: JobRecord["meterDraft"],
  stepId: string,
): { raw: string; selected: string | null } {
  if (draft?.stepId === stepId) return { raw: draft.raw, selected: draft.selected };
  return { raw: "", selected: null };
}
