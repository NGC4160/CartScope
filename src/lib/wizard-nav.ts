import type { BatteryType, Powertrain } from "../data/types.ts";
import { jobHeaderGaps, type JobHeaderGap } from "./job-header.ts";

export type WizardStep = 1 | 2 | 3 | 4;

export function stepAfterComplaintSelected(): WizardStep {
  return 4;
}

export function openJobHeader(symptomId: string | null | undefined): WizardStep | null {
  if (!symptomId) return null;
  return 4;
}

export function canVisitWizardStep(
  target: WizardStep,
  ctx: { manufacturer: string | null; hasModel: boolean; symptomId: string | null },
): boolean {
  if (target === 1) return true;
  if (target === 2) return ctx.manufacturer != null;
  if (target === 3) return ctx.hasModel;
  return ctx.hasModel && ctx.symptomId != null;
}

export function canStartChecks(gaps: readonly JobHeaderGap[]): boolean {
  return gaps.length === 0;
}

export function benchUrl(jobId: string): string {
  return `/bench/${encodeURIComponent(jobId)}`;
}

export type StartJobRequest = {
  hasModel: boolean;
  symptomId: string | null;
  startStepId: string | null;
  lastName: string;
  hcpJobNumber: string;
  powertrain?: Powertrain;
  batteryType?: BatteryType | "";
};

export type StartJobResolution =
  | { ok: true; symptomId: string; startStepId: string; gaps: [] }
  | { ok: false; gaps: JobHeaderGap[] };

export function resolveStartJob(input: StartJobRequest): StartJobResolution {
  const gaps = jobHeaderGaps({
    lastName: input.lastName,
    hcpJobNumber: input.hcpJobNumber,
    powertrain: input.powertrain,
    batteryType: input.batteryType,
  });
  if (!input.hasModel || !input.symptomId || !input.startStepId || gaps.length > 0) {
    return { ok: false, gaps };
  }
  return {
    ok: true,
    symptomId: input.symptomId,
    startStepId: input.startStepId,
    gaps: [],
  };
}
