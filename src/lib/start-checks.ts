import type { BatteryType, ModelPack } from "../data/types.ts";
import { JOB_HEADER_MESSAGES, jobHeaderGaps, type JobHeaderGap } from "./job-header.ts";
import { benchUrl, canStartChecks, resolveStartJob } from "./wizard-nav.ts";
import { yearCompatibility, yearStatusNote } from "./year-compat.ts";
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
    if (typeof raw === "string") next[key] = raw;
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

  const messages: string[] = gaps.map((g) => JOB_HEADER_MESSAGES[g]);
  const year = pack
    ? yearCompatibility({
        cartYear: header.cartYear,
        packYears: pack.years,
        packName: pack.fullName,
      })
    : { status: "ok" as const };
  const yearNote = yearStatusNote(year);
  const yearMessage = year.status === "unsupported" ? year.message : null;
  if (yearMessage) messages.push(yearMessage);
  const routeLabel = startRouteLabel({ pack, symptomId: input.symptomId, header });

  const symptom = symptomOf(pack, input.symptomId);
  const hasFirstStep = Boolean(symptom?.startStepId && pack?.steps[symptom.startStepId]);
  const resolved = resolveStartJob({
    hasModel: Boolean(pack),
    symptomId: input.symptomId,
    startStepId: symptom?.startStepId ?? null,
    gaps,
    hasFirstStep,
  });
  if (!pack) {
    messages.push("Pick a cart before starting checks.");
  } else if (!input.symptomId || !symptom) {
    messages.push("Pick what is wrong with the cart before starting checks.");
  } else if (!hasFirstStep) {
    messages.push(
      "This complaint does not have a first factory check on file. Pick another problem, or pick a different cart.",
    );
  }

  if (!resolved.ok || !pack || yearMessage || !symptom || !hasFirstStep) {
    if (messages.length === 0) {
      messages.push(`Could not start checks for ${routeLabel}.`);
    }
    messages.push(`Start route: ${routeLabel}`);
    return { ok: false, gaps, messages: uniqueMessages(messages), yearMessage, yearNote, routeLabel, header };
  }

  if (!canStartChecks(gaps)) {
    messages.push(`Start route: ${routeLabel}`);
    return { ok: false, gaps, messages: uniqueMessages(messages), yearMessage, yearNote, routeLabel, header };
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
