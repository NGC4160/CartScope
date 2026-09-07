import type { JobHeaderGap } from "@/lib/job-header";

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

/** Keep the wizard mounted while a job is created so bench navigation is not dropped. */
export function wizardStaysOpen(input: {
  jobCount: number;
  fresh: boolean;
  holdOpen: boolean;
}): boolean {
  return input.jobCount === 0 || input.fresh || input.holdOpen;
}

export function benchUrl(jobId: string): string {
  return `/bench/${encodeURIComponent(jobId)}`;
}

/** True when the browser is already on this job's Check 1 URL. */
export function benchPathHasJob(pathname: string, jobId: string): boolean {
  if (!pathname || !jobId) return false;
  const encoded = encodeURIComponent(jobId);
  return pathname.includes(`/bench/${encoded}`) || pathname.includes(`/bench/${jobId}`);
}

export type StartJobResolution =
  | { ok: true; symptomId: string; startStepId: string }
  | { ok: false };

export function resolveStartJob(input: {
  hasModel: boolean;
  symptomId: string | null;
  startStepId: string | null;
  gaps: readonly JobHeaderGap[];
  hasFirstStep?: boolean;
}): StartJobResolution {
  if (!canStartChecks(input.gaps)) return { ok: false };
  if (!input.hasModel || !input.symptomId || !input.startStepId) return { ok: false };
  if (input.hasFirstStep === false) return { ok: false };
  return { ok: true, symptomId: input.symptomId, startStepId: input.startStepId };
}
