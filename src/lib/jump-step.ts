import type { JobRecord } from "@/data/types";

/** Jump the factory path. Keep who checked it, meter draft, and pack numbers. */
export function applyJumpToStep(job: JobRecord, stepId: string, reason: string, at: string): JobRecord {
  return {
    ...job,
    currentStepId: stepId,
    casePhase: job.casePhase === "report" ? "steps" : job.casePhase,
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
