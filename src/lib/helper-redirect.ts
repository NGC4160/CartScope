import type { DiagnosticStep, ModelPack } from "../data/types.ts";
import { matchObservationToSteps, matchStepsFromReply } from "./manuals.ts";

export const HELPER_AI_TIMEOUT_MS = 8000;

export function uniqueSteps(steps: DiagnosticStep[]): DiagnosticStep[] {
  const seen = new Set<string>();
  return steps.filter((step) => {
    if (seen.has(step.id)) return false;
    seen.add(step.id);
    return true;
  });
}

export function localHelperJumps(pack: ModelPack, observation: string, currentStepId?: string): DiagnosticStep[] {
  return uniqueSteps(matchObservationToSteps(pack, observation, currentStepId));
}

export function mergeHelperJumps(opts: {
  pack: ModelPack;
  observation: string;
  currentStepId?: string;
  suggestedStepId?: string;
  replyText?: string;
}): DiagnosticStep[] {
  const local = localHelperJumps(opts.pack, opts.observation, opts.currentStepId);
  const fromReply = opts.replyText ? matchStepsFromReply(opts.pack, opts.replyText, opts.currentStepId) : [];
  const fromId =
    opts.suggestedStepId && opts.pack.steps[opts.suggestedStepId] && opts.suggestedStepId !== opts.currentStepId
      ? [opts.pack.steps[opts.suggestedStepId]!]
      : [];
  return uniqueSteps([...fromId, ...fromReply, ...local]).slice(0, 4);
}

/** Other factory checks when keywords / AI do not name one. */
export function fallbackHelperJumps(pack: ModelPack, currentStepId?: string): DiagnosticStep[] {
  const fromSymptoms = (pack.symptoms ?? [])
    .map((s) => pack.steps[s.startStepId])
    .filter((step): step is DiagnosticStep => Boolean(step) && step.id !== currentStepId);
  if (fromSymptoms.length > 0) return uniqueSteps(fromSymptoms).slice(0, 4);
  return uniqueSteps(Object.values(pack.steps).filter((step) => step.id !== currentStepId)).slice(0, 4);
}

/** Local + AI hits, or other factory checks so Use this never ends with zero buttons. */
export function resolveHelperJumps(opts: {
  pack: ModelPack;
  observation: string;
  currentStepId?: string;
  suggestedStepId?: string;
  replyText?: string;
}): DiagnosticStep[] {
  const matched = mergeHelperJumps(opts);
  if (matched.length > 0) return matched;
  return fallbackHelperJumps(opts.pack, opts.currentStepId);
}

export async function settleHelperAsk<T>(
  work: Promise<T>,
  ms = HELPER_AI_TIMEOUT_MS,
): Promise<{ ok: true; value: T } | { ok: false; timedOut: boolean; error: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("HELPER_TIMEOUT")), ms);
      }),
    ]);
    return { ok: true, value };
  } catch (err) {
    const timedOut = err instanceof Error && err.message === "HELPER_TIMEOUT";
    return {
      ok: false,
      timedOut,
      error: timedOut
        ? "Helper is taking too long. Factory checks below still work."
        : "Could not reach the helper. Factory checks and manuals still work.",
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
