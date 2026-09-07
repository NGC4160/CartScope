import type { DiagnosticStep, MeasurementKind, MeasurementSpec, Outcome } from "../data/types.ts";
import {
  buildAttempt,
  isNumericKind,
  needsUnusualVerify,
  nextAttempt,
  outcomeFor,
  parseNumeric,
  resultFromAttempt,
} from "./diagnostics.ts";
import { sanitizeVoltageInput } from "./voltage-input.ts";

const OPEN_PREFIX = /^(o\.?l?\.?)$/i;
const OPEN_DONE = /^(ol|o\.l\.|open|∞|inf|infinite)$/i;

export function meterFieldLabel(kind: MeasurementKind, verifyPhase = 0): string {
  if (!isNumericKind(kind)) return "What you saw";
  if (verifyPhase === 1) return "Second number";
  if (verifyPhase >= 2) return "Third number";
  return "Your number";
}

/** Example numbers belong in a hint, never in the input placeholder. */
export function meterPlaceholderText(): string {
  return "Type the number from your meter";
}

export function meterExampleHint(placeholder?: string, unit?: string): string | null {
  const sample = placeholder?.trim();
  if (!sample || !/^-?\d/.test(sample)) return null;
  return unit ? `Example: ${sample} ${unit}` : `Example: ${sample}`;
}

export function sanitizeMeterInput(raw: string, kind: MeasurementKind): string {
  if (kind === "resistance") {
    const t = raw.trim();
    if (OPEN_DONE.test(t)) return "OL";
    if (OPEN_PREFIX.test(t)) return t.toUpperCase();
  }
  return sanitizeVoltageInput(raw);
}

export type MeterCommitFail = {
  ok: false;
  reason: "empty" | "invalid";
  message: string;
  missingFields: string[];
};

export type MeterCommitOk = {
  ok: true;
  raw: string;
  numeric?: number;
};

export type MeterCommit = MeterCommitOk | MeterCommitFail;

export function commitMeterReading(
  raw: string,
  opts: { kind: MeasurementKind; fieldLabel?: string } = { kind: "voltage" },
): MeterCommit {
  const field = opts.fieldLabel ?? meterFieldLabel(opts.kind);
  const live = raw.replace(/\u00a0/g, " ").trim();
  if (!live) {
    return {
      ok: false,
      reason: "empty",
      message: `${field} is empty. Type the number from your meter. Then we can go on.`,
      missingFields: [field],
    };
  }

  const sanitized = sanitizeMeterInput(live, opts.kind);
  if (opts.kind === "resistance" && sanitized === "OL") {
    return { ok: true, raw: "OL", numeric: Number.POSITIVE_INFINITY };
  }

  const numeric = parseNumeric(sanitized);
  if (numeric === undefined) {
    return {
      ok: false,
      reason: "invalid",
      message: `${field} needs a meter number, like 12.62. “${live}” is not a number we can save.`,
      missingFields: [field],
    };
  }

  return { ok: true, raw: sanitized, numeric };
}

export type SaveContinueFail = MeterCommitFail;

export type SaveContinueOk = {
  ok: true;
  raw: string;
  numeric?: number;
  unusual: boolean;
  verifyAgain: boolean;
  result: "pass" | "fail" | "branch";
  next: Outcome;
};

export type SaveContinueResult = SaveContinueOk | SaveContinueFail;

export function observationSaveBlock(spec: Pick<MeasurementSpec, "kind" | "options">): {
  message: string;
  missingFields: string[];
} {
  const labels = (spec.options ?? []).map((o) => o.label.trim()).filter(Boolean);
  const field = meterFieldLabel(spec.kind);
  if (labels.length >= 2) {
    return {
      message: `Save is waiting. Tap “${labels[0]}” or “${labels[1]}”. Then Save can go on.`,
      missingFields: [field],
    };
  }
  if (labels.length === 1) {
    return {
      message: `Save is waiting. Tap “${labels[0]}”. Then Save can go on.`,
      missingFields: [field],
    };
  }
  return {
    message: "Tap what you saw. Then we can go on.",
    missingFields: [field],
  };
}

export function saveAndContinueMeasurement(
  step: Pick<DiagnosticStep, "measurement" | "pass" | "fail" | "branches">,
  raw: string,
  optionId?: string,
  priorAttempts = 0,
): SaveContinueResult {
  const spec = step.measurement;
  let committed = raw.trim();
  let numeric: number | undefined;

  if (isNumericKind(spec.kind)) {
    const commit = commitMeterReading(raw, { kind: spec.kind });
    if (!commit.ok) return commit;
    committed = commit.raw;
    numeric = commit.numeric;
  } else if (!optionId) {
    const block = observationSaveBlock(spec);
    return {
      ok: false,
      reason: "empty",
      message: block.message,
      missingFields: block.missingFields,
    };
  }

  const attempt = buildAttempt(spec, committed, nextAttempt(priorAttempts), optionId);
  const verifyAgain = needsUnusualVerify(spec, attempt, priorAttempts + 1);
  const { result, branchId } = resultFromAttempt(spec, attempt);
  return {
    ok: true,
    raw: attempt.raw,
    numeric: attempt.numeric ?? numeric,
    unusual: attempt.unusual,
    verifyAgain,
    result,
    next: outcomeFor(step as DiagnosticStep, result, branchId),
  };
}

export function savedContinueNote(
  savedRaw: string,
  spec: MeasurementSpec,
  result: SaveContinueOk,
  nextTitle?: string,
): string {
  const shown = spec.unit && !/[a-zΩµ]/i.test(savedRaw) ? `${savedRaw} ${spec.unit}` : savedRaw;
  if (result.verifyAgain) {
    return `Saved ${shown}. Measure the same place again so we can confirm.`;
  }
  if (result.next.kind === "diagnosis") {
    return `Saved ${shown}. Checks finished — open the report.`;
  }
  if (nextTitle) return `Saved ${shown}. Next: ${nextTitle}.`;
  return `Saved ${shown}.`;
}
