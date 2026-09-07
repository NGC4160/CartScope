import type { BatteryType, ModelPack } from "../data/types.ts";
import { JOB_HEADER_MESSAGES, jobHeaderGaps, type JobHeaderGap } from "./job-header.ts";
import { benchUrl, canStartChecks, resolveStartJob } from "./wizard-nav.ts";
import {
  sanitizeCartYearInput,
  yearCompatibility,
  yearStatusNote,
  type YearCompatibility,
} from "./year-compat.ts";
import type { CreateJobInput } from "../store/jobs.ts";

export type HeaderSnapshot = {
  lastName: string;
  hcpJobNumber: string;
  technician: string;
  cartYear: string;
  serialNumber: string;
  batteryType: BatteryType | "";
  complaintNote: string;
  fuelNote: string;
};

export const EMPTY_HEADER: HeaderSnapshot = {
  lastName: "",
  hcpJobNumber: "",
  technician: "",
  cartYear: "",
  serialNumber: "",
  batteryType: "",
  complaintNote: "",
  fuelNote: "",
};

const HEADER_KEYS: (keyof HeaderSnapshot)[] = [
  "lastName",
  "hcpJobNumber",
  "technician",
  "cartYear",
  "serialNumber",
  "batteryType",
  "complaintNote",
  "fuelNote",
];

export function readHeaderSnapshot(
  form: Pick<FormData, "get"> | null | undefined,
  fallback: HeaderSnapshot,
): HeaderSnapshot {
  const next: HeaderSnapshot = { ...fallback };
  if (!form) return next;
  for (const key of HEADER_KEYS) {
    if (key === "batteryType") continue;
    const raw = form.get(key);
    if (typeof raw === "string") {
      next[key] = key === "cartYear" ? sanitizeCartYearInput(raw) : raw;
    }
  }
  const battery = form.get("batteryType");
  if (battery === "" || battery === "lead-acid" || battery === "lithium") {
    next.batteryType = battery;
  }
  return next;
}

export function reverseOrOneWaySymptom(pack: ModelPack) {
  return pack.symptoms.find((s) => {
    const blob = `${s.id} ${s.label} ${s.summary}`;
    return (
      s.id === "no-reverse" ||
      s.id === "one-direction" ||
      /no reverse|one way|one direction|forward only/i.test(blob)
    );
  });
}

export type StartBlockerKind = "model" | "complaint" | "first-step" | "year" | "header";

export type StartBlocker = {
  kind: StartBlockerKind;
  message: string;
};

export type StartChecksAttempt =
  | {
      ok: true;
      symptomId: string;
      startStepId: string;
      benchPath: (jobId: string) => string;
      jobInput: CreateJobInput;
      routeLabel: string;
      yearNote: string | null;
    }
  | {
      ok: false;
      gaps: JobHeaderGap[];
      messages: string[];
      blockers: StartBlocker[];
      yearMessage: string | null;
      yearNote: string | null;
      routeLabel: string;
      header: HeaderSnapshot;
    };

export function startRouteLabel(input: {
  pack: ModelPack | null | undefined;
  symptomId: string | null;
  header: HeaderSnapshot;
}): string {
  const brand = input.pack?.manufacturerLabel ?? "(no brand)";
  const model = input.pack?.name ?? "(no model)";
  const packId = input.pack?.id ?? "(no pack)";
  const year = input.header.cartYear.trim() || "(no year)";
  const complaint = input.symptomId ?? "(no complaint)";
  return `${brand} · ${model} · ${packId} · year ${year} · ${complaint}`;
}

function symptomOf(pack: ModelPack | null | undefined, symptomId: string | null) {
  if (!pack || !symptomId) return undefined;
  return pack.symptoms.find((s) => s.id === symptomId);
}

export function complaintHasFirstStep(
  pack: ModelPack | null | undefined,
  symptomId: string | null,
): boolean {
  const symptom = symptomOf(pack, symptomId);
  return Boolean(symptom?.startStepId && pack?.steps[symptom.startStepId]);
}

export function packYearCheck(pack: ModelPack, cartYear: string): YearCompatibility {
  return yearCompatibility({
    cartYear,
    packYears: pack.years,
    packName: pack.fullName,
    packId: pack.id,
    yearMin: pack.yearMin,
    yearMax: pack.yearMax,
  });
}

export function startBlockers(input: {
  pack: ModelPack | null | undefined;
  symptomId: string | null;
  header: HeaderSnapshot;
  /** Same object the Year field shows — never a second format pass. */
  yearCheck?: YearCompatibility;
}): StartBlocker[] {
  const pack = input.pack ?? null;
  const header = input.header;
  const blockers: StartBlocker[] = [];
  const gaps = jobHeaderGaps({
    lastName: header.lastName,
    hcpJobNumber: header.hcpJobNumber,
    powertrain: pack?.powertrain,
    batteryType: header.batteryType,
    technician: header.technician,
  });
  for (const gap of gaps) {
    blockers.push({ kind: "header", message: JOB_HEADER_MESSAGES[gap] });
  }

  if (pack) {
    const year = input.yearCheck ?? packYearCheck(pack, header.cartYear);
    if (year.status === "unsupported") {
      blockers.push({ kind: "year", message: year.message });
    }
  }

  if (!pack) {
    blockers.push({ kind: "model", message: "Pick a cart before starting checks." });
  } else if (!input.symptomId || !symptomOf(pack, input.symptomId)) {
    blockers.push({
      kind: "complaint",
      message: "Pick what is wrong with the cart before starting checks.",
    });
  } else if (!complaintHasFirstStep(pack, input.symptomId)) {
    const label = symptomOf(pack, input.symptomId)?.label ?? "This complaint";
    blockers.push({
      kind: "first-step",
      message: `${label} does not have a first factory check on file. Pick another problem, or pick a different cart.`,
    });
  }

  return blockers;
}

export function startIsReady(blockers: readonly StartBlocker[]): boolean {
  return blockers.length === 0;
}

export function attemptStartChecks(input: {
  pack: ModelPack | null | undefined;
  symptomId: string | null;
  header: HeaderSnapshot;
}): StartChecksAttempt {
  const header = { ...input.header };
  const pack = input.pack ?? null;
  const gaps = jobHeaderGaps({
    lastName: header.lastName,
    hcpJobNumber: header.hcpJobNumber,
    powertrain: pack?.powertrain,
    batteryType: header.batteryType,
    technician: header.technician,
  });

  const year = pack ? packYearCheck(pack, header.cartYear) : { status: "ok" as const };
  const blockers = startBlockers({ pack, symptomId: input.symptomId, header, yearCheck: year });
  const messages = blockers.map((b) => b.message);
  const yearNote = yearStatusNote(year);
  const yearMessage = year.status === "unsupported" ? year.message : null;
  const routeLabel = startRouteLabel({ pack, symptomId: input.symptomId, header });

  const symptom = symptomOf(pack, input.symptomId);
  const hasFirstStep = complaintHasFirstStep(pack, input.symptomId);
  const resolved = resolveStartJob({
    hasModel: Boolean(pack),
    symptomId: input.symptomId,
    startStepId: symptom?.startStepId ?? null,
    gaps,
    hasFirstStep,
  });

  if (!resolved.ok || !pack || yearMessage || !symptom || !hasFirstStep || !canStartChecks(gaps)) {
    if (messages.length === 0) {
      messages.push(`Could not start checks for ${routeLabel}.`);
    }
    messages.push(`Start route: ${routeLabel}`);
    return {
      ok: false,
      gaps,
      blockers,
      messages: uniqueMessages(messages),
      yearMessage,
      yearNote,
      routeLabel,
      header,
    };
  }

  const electric = pack.powertrain === "electric";
  const jobInput: CreateJobInput = {
    modelId: pack.id,
    symptomId: resolved.symptomId,
    startStepId: resolved.startStepId,
    technician: header.technician,
    serialNumber: header.serialNumber,
    notes: header.complaintNote,
    lastName: header.lastName,
    hcpJobNumber: header.hcpJobNumber,
    cartYear: header.cartYear,
    cartMake: pack.manufacturerLabel,
    cartModel: pack.name,
    batteryType: electric ? (header.batteryType as BatteryType) : undefined,
    complaintNote: header.complaintNote,
    fuelNote: header.fuelNote,
  };

  return {
    ok: true,
    symptomId: resolved.symptomId,
    startStepId: resolved.startStepId,
    benchPath: benchUrl,
    jobInput,
    routeLabel,
    yearNote,
  };
}

function uniqueMessages(messages: string[]): string[] {
  return [...new Set(messages.filter(Boolean))];
}
