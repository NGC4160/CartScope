import type {
  Attempt,
  ChoiceOption,
  DiagnosticStep,
  MeasurementSpec,
  ModelPack,
  Outcome,
  ReadingAttempt,
} from "@/data/types";

const OPEN_SENTINELS = new Set(["ol", "open", "∞", "inf", "infinite", "o.l."]);

export function parseNumeric(raw: string): number | undefined {
  const t = raw.trim().toLowerCase().replace(",", ".");
  if (!t) return undefined;
  if (OPEN_SENTINELS.has(t)) return Number.POSITIVE_INFINITY;
  const n = Number.parseFloat(t.replace(/[^\d.e+-]/g, ""));
  return Number.isFinite(n) || n === Number.POSITIVE_INFINITY ? n : undefined;
}

export function isNumericKind(kind: MeasurementSpec["kind"]): boolean {
  return kind === "voltage" || kind === "resistance";
}

export function evaluateNumeric(spec: MeasurementSpec, value: number): { inRange: boolean; unusual: boolean } {
  const min = spec.expectedMin ?? Number.NEGATIVE_INFINITY;
  const max = spec.expectedMax ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(value)) {
    const failOpen = spec.openIsFail !== false;
    return { inRange: !failOpen, unusual: true };
  }
  const inRange = value >= min && value <= max;
  return { inRange, unusual: !inRange };
}

export function evaluateChoice(spec: MeasurementSpec, optionId: string): ChoiceOption | undefined {
  return spec.options?.find((o) => o.id === optionId);
}

export function outcomeFor(
  step: DiagnosticStep,
  result: "pass" | "fail" | "branch",
  branchId?: string,
): Outcome {
  if (result === "branch" && branchId && step.branches?.[branchId]) {
    return step.branches[branchId];
  }
  return result === "pass" ? step.pass : step.fail;
}

export function describeOutcome(pack: ModelPack, outcome: Outcome): string {
  if (outcome.kind === "step") {
    const s = pack.steps[outcome.id];
    return s ? `Next: ${s.title}` : "Go on";
  }
  const d = pack.diagnoses[outcome.id];
  return d ? `We found: ${d.title}` : "We found it";
}

export function nextAttempt(count: number): Attempt {
  if (count <= 0) return 1;
  if (count === 1) return 2;
  return 3;
}

export function buildAttempt(
  spec: MeasurementSpec,
  raw: string,
  attempt: Attempt,
  optionId?: string,
): ReadingAttempt {
  const at = new Date().toISOString();
  if (spec.kind === "voltage" || spec.kind === "resistance") {
    const numeric = parseNumeric(raw);
    if (numeric === undefined) {
      return { attempt, raw, inRange: false, unusual: true, at };
    }
    const ev = evaluateNumeric(spec, numeric);
    return { attempt, raw, numeric, inRange: ev.inRange, unusual: ev.unusual, at };
  }
  if (spec.kind === "continuity" || spec.kind === "observation") {
    const opt = optionId ? evaluateChoice(spec, optionId) : undefined;
    const inRange = opt?.result === "pass";
    // A tapped fail/branch option is a real finding, not a bad meter number.
    return {
      attempt,
      raw: opt?.label ?? raw,
      optionId,
      inRange,
      unusual: Boolean(opt?.unusual),
      at,
    };
  }
  return { attempt, raw, optionId, inRange: true, unusual: false, at };
}

export function resultFromAttempt(
  spec: MeasurementSpec,
  attempt: ReadingAttempt,
): { result: "pass" | "fail" | "branch"; branchId?: string } {
  if (spec.kind === "voltage" || spec.kind === "resistance") {
    return { result: attempt.inRange ? "pass" : "fail" };
  }
  const opt = attempt.optionId ? evaluateChoice(spec, attempt.optionId) : undefined;
  if (!opt) return { result: "fail" };
  if (opt.result === "branch") return { result: "branch", branchId: opt.branchId ?? opt.id };
  return { result: opt.result };
}

export function packById(packs: ModelPack[], id: string): ModelPack | undefined {
  return packs.find((p) => p.id === id);
}

export function formatReading(raw: string, unit?: string): string {
  if (!unit) return raw;
  if (/[a-zΩ]/i.test(raw)) return raw;
  return `${raw} ${unit}`;
}

export function rangeLabel(spec: MeasurementSpec): string {
  if (spec.expectedLabel) return spec.expectedLabel;
  if (spec.expectedMin !== undefined && spec.expectedMax !== undefined) {
    return `${spec.expectedMin}–${spec.expectedMax}${spec.unit ? ` ${spec.unit}` : ""}`;
  }
  return "See the step";
}

/**
 * Extra "measure it again" checks are for meter numbers outside the book range.
 * Choice results (spark, continuity, yes/no) save as pass or fail on the first tap.
 */
export function needsUnusualVerify(
  spec: MeasurementSpec,
  attempt: Pick<ReadingAttempt, "unusual">,
  attemptCount: number,
): boolean {
  if (!isNumericKind(spec.kind)) return false;
  return Boolean(attempt.unusual) && attemptCount < 3;
}

export function selectedResultLabel(
  spec: MeasurementSpec,
  latest?: Pick<ReadingAttempt, "raw" | "optionId">,
): string {
  if (!latest) return "what you entered";
  const fromOption = latest.optionId
    ? spec.options?.find((o) => o.id === latest.optionId)?.label
    : undefined;
  const raw = fromOption ?? latest.raw;
  return isNumericKind(spec.kind) ? formatReading(raw, spec.unit) : raw;
}

/** Tech-facing copy when a result conflicts with what this check looks for. */
export function unusualVerifyBanner(
  spec: MeasurementSpec,
  latest: Pick<ReadingAttempt, "raw" | "optionId"> | undefined,
  verifyPhase: number,
): { title: string; body: string } {
  const expected = rangeLabel(spec);
  const got = selectedResultLabel(spec, latest);

  if (!isNumericKind(spec.kind)) {
    return {
      title:
        verifyPhase === 1
          ? `That result does not match this check (look for ${expected}).`
          : "Check what you saw one more time.",
      body:
        verifyPhase === 1
          ? `This check looks for ${expected}. You chose “${got}.” That conflicts with a pass. If “${got}” is what you actually saw, it is a fail finding — keep it. Only pick the pass result if you really saw ${expected}.`
          : `Look for ${expected} again. We save all three answers on the report before we go on.`,
    };
  }

  return {
    title:
      verifyPhase === 1
        ? `That number is not in the factory book range (${expected}).`
        : "Check it one more time.",
    body:
      verifyPhase === 1
        ? `This check looks for ${expected}. You entered ${got}. Measure the same place again.`
        : "Type a third number. We save all three on the report before we go on.",
  };
}
