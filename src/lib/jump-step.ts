import type { JobRecord } from "@/data/types";

/** Jump the factory path. Keep who checked it, meter draft, and pack numbers. */
export function applyJumpToStep(job: JobRecord, stepId: string, reason: string, at: string): JobRecord {
  return {
    ...job,
    currentStepId: stepId,
    // Pack / codes / report are other bay phases. A factory-check jump must
    // leave them or the Pack gate stays on screen while currentStepId changes.
    casePhase: "steps",
    pending: undefined,
    technician: job.technician,
    meterDraft: job.meterDraft,
    packDraft: job.packDraft,
    packCheck: job.packCheck,
    pathRedirects: [
      ...(job.pathRedirects ?? []),
      {
        at,
        fromStepId: job.currentStepId,
        toStepId: stepId,
        reason,
      },
    ],
    updatedAt: at,
  };
}
