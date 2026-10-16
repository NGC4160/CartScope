import { CART_CATALOG } from "../data/cart-catalog.ts";
import type { AssistantInput } from "./assistant.ts";

/**
 * Same keys as PACK_ALIASES in src/data/index.ts. getPack accepts these legacy
 * ids; the write check must too. A test compares this list to that source.
 */
export const PACK_ALIAS_IDS = [
  "ezgo-txt-pds",
  "yamaha-g29-drive",
  "club-car-precedent-tempo-gas",
] as const;

const KNOWN_PACKS = new Set<string>([
  ...CART_CATALOG.map((entry) => entry.id),
  ...PACK_ALIAS_IDS,
]);

const MAX_PASSWORD = 200;
const MAX_JOBS = 500;
const MAX_ID = 80;
const MAX_MODEL = 80;
const MAX_STEP = 120;
const MAX_IDENTITY = 200;
const MAX_NOTE = 20_000;
const MAX_TIME = 80;
const MAX_ANY_STRING = 100_000;
const MAX_BRAIN = 80_000;
const MAX_NESTED_LIST = 5_000;
const MAX_DEPTH = 30;

const JOB_ID = /^[A-Za-z0-9_-]+$/;
const STATUSES = new Set(["in-progress", "diagnosed", "complete"]);
const BATTERY_TYPES = new Set(["lead-acid", "lithium"]);
const CASE_PHASES = new Set(["pack", "codes", "steps", "report"]);

const IDENTITY_FIELDS: { key: string; label: string; max: number }[] = [
  { key: "technician", label: "Technician", max: MAX_IDENTITY },
  { key: "serialNumber", label: "Serial number", max: MAX_IDENTITY },
  { key: "lastName", label: "Last name", max: MAX_IDENTITY },
  { key: "hcpJobNumber", label: "Job number", max: MAX_IDENTITY },
  { key: "cartYear", label: "Cart year", max: MAX_IDENTITY },
  { key: "cartMake", label: "Cart make", max: MAX_IDENTITY },
  { key: "cartModel", label: "Cart model", max: MAX_IDENTITY },
  { key: "diagnosisId", label: "Diagnosis", max: MAX_STEP },
  { key: "createdAt", label: "Opened time", max: MAX_TIME },
  { key: "updatedAt", label: "Updated time", max: MAX_TIME },
  { key: "notes", label: "Notes", max: MAX_NOTE },
  { key: "complaintNote", label: "Complaint", max: MAX_NOTE },
  { key: "fuelNote", label: "Fuel note", max: MAX_NOTE },
  { key: "techObservation", label: "Tech observation", max: MAX_NOTE },
  { key: "retestNote", label: "Retest note", max: MAX_NOTE },
  { key: "provenCauseOverride", label: "Proven cause", max: MAX_NOTE },
];

export function isKnownPack(modelId: string): boolean {
  return KNOWN_PACKS.has(modelId);
}

export function validateShopGateBody(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Shop lock body must be an object.";
  }
  const record = body as Record<string, unknown>;
  if ("lock" in record && typeof record.lock !== "boolean") {
    return "Lock must be true or false.";
  }
  if ("password" in record && record.password !== undefined && typeof record.password !== "string") {
    return "Password must be text.";
  }
  if (typeof record.password === "string" && record.password.length > MAX_PASSWORD) {
    return "Password is too long.";
  }
  return null;
}

export function validateSharedJobsWrite(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Jobs payload was not an object.";
  }
  const record = body as Record<string, unknown>;
  if ("migrate" in record && record.migrate !== undefined && typeof record.migrate !== "boolean") {
    return "Migrate must be true or false.";
  }
  if ("updatedAt" in record && record.updatedAt !== undefined) {
    if (typeof record.updatedAt !== "number" || !Number.isFinite(record.updatedAt)) {
      return "Updated time must be a number.";
    }
  }
  if ("version" in record && record.version !== undefined) {
    if (typeof record.version !== "number" || !Number.isFinite(record.version)) {
      return "Jobs version must be a number.";
    }
  }
  if (!Array.isArray(record.jobs)) return "Jobs list must be an array.";
  if (record.jobs.length > MAX_JOBS) return "The shop list is too long.";
  for (const job of record.jobs) {
    const error = validateJob(job);
    if (error) return error;
  }
  return null;
}

function validateJob(job: unknown): string | null {
  if (!job || typeof job !== "object" || Array.isArray(job)) {
    return "A shop case must be an object.";
  }
  const record = job as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id.trim()) return "A shop case needs an id.";
  if (record.id.length > MAX_ID) return "A shop case id is too long.";
  if (!JOB_ID.test(record.id)) return "A shop case id has characters the shop list does not allow.";

  if (typeof record.modelId !== "string" || !record.modelId.trim()) {
    return "A shop case needs a cart pack.";
  }
  if (record.modelId.length > MAX_MODEL) return "A cart pack id is too long.";
  if (!isKnownPack(record.modelId)) return "That cart pack is not in the shop library.";

  if (typeof record.symptomId !== "string" || !record.symptomId.trim() || record.symptomId.length > MAX_STEP) {
    return "A shop case symptom is missing or too long.";
  }
  if (
    typeof record.currentStepId !== "string" ||
    !record.currentStepId.trim() ||
    record.currentStepId.length > MAX_STEP
  ) {
    return "A shop case step is missing or too long.";
  }
  if (typeof record.status !== "string" || !STATUSES.has(record.status)) {
    return "A shop case status must be in progress, diagnosed, or complete.";
  }

  for (const field of IDENTITY_FIELDS) {
    if (!(field.key in record) || record[field.key] === undefined) continue;
    if (typeof record[field.key] !== "string") return `${field.label} must be text.`;
    if ((record[field.key] as string).length > field.max) return `${field.label} is too long.`;
  }

  if ("batteryType" in record && record.batteryType !== undefined) {
    if (typeof record.batteryType !== "string" || !BATTERY_TYPES.has(record.batteryType)) {
      return "A shop case battery type must be lead-acid or lithium.";
    }
  }
  if ("casePhase" in record && record.casePhase !== undefined) {
    if (typeof record.casePhase !== "string" || !CASE_PHASES.has(record.casePhase)) {
      return "A shop case phase is not one the bay uses.";
    }
  }
  if ("log" in record && record.log !== undefined && !Array.isArray(record.log)) {
    return "A shop case log must be a list.";
  }
  if ("aiLog" in record && record.aiLog !== undefined && !Array.isArray(record.aiLog)) {
    return "Helper turns on a case must be a list.";
  }
  if ("brainCopy" in record && record.brainCopy !== undefined) {
    if (!record.brainCopy || typeof record.brainCopy !== "object" || Array.isArray(record.brainCopy)) {
      return "The shop file on a case must be an object.";
    }
    const markdown = (record.brainCopy as { markdown?: unknown }).markdown;
    if (markdown !== undefined && typeof markdown !== "string") {
      return "The shop file on a case must be text.";
    }
    if (typeof markdown === "string" && markdown.length > MAX_BRAIN) {
      return "The shop file on a case is too long.";
    }
  }

  return walkValue(record, 0);
}

function walkValue(value: unknown, depth: number): string | null {
  if (depth > MAX_DEPTH) return "A shop case is nested too deeply.";
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    if (value.length > MAX_ANY_STRING) return "A shop case field is too long.";
    return null;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "A shop case has a number that is not finite.";
    return null;
  }
  if (typeof value === "boolean") return null;
  if (typeof value !== "object") return "A shop case has a value the shop list cannot store.";
  if (Array.isArray(value)) {
    if (value.length > MAX_NESTED_LIST) return "A shop case list is too long.";
    for (const item of value) {
      const error = walkValue(item, depth + 1);
      if (error) return error;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "markdown" && typeof child === "string" && child.length > MAX_BRAIN) {
      return "The shop file on a case is too long.";
    }
    const error = walkValue(child, depth + 1);
    if (error) return error;
  }
  return null;
}

const MAX_QUESTION = 800;
const MAX_HISTORY = 80;
const MAX_TURN = 4_000;
const MAX_MEASUREMENTS = 200;
const MAX_MEASUREMENT_FIELD = 2_000;
const MAX_CASE_BRIEF = 20_000;

export type AssistantCheck =
  | { ok: true; value: AssistantInput }
  | { ok: false; error: string };

export function validateAssistantInput(input: unknown): AssistantCheck {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Helper request must be an object." };
  }
  const record = input as Record<string, unknown>;
  if (typeof record.question !== "string") {
    return { ok: false, error: "Tell me what you see, or type a fault code." };
  }
  const question = record.question.trim();
  if (!question) return { ok: false, error: "Tell me what you see, or type a fault code." };
  if (question.length > MAX_QUESTION) {
    return { ok: false, error: "Question is too long. Keep it under 800 characters." };
  }

  if (typeof record.modelId !== "string" || !record.modelId.trim()) {
    return { ok: false, error: "Pick a cart first." };
  }
  if (record.modelId.length > MAX_MODEL || !isKnownPack(record.modelId)) {
    return { ok: false, error: "That cart pack is not in the shop library." };
  }

  if (record.history !== undefined && !Array.isArray(record.history)) {
    return { ok: false, error: "Helper history must be a list." };
  }
  const history = Array.isArray(record.history) ? record.history : [];
  if (history.length > MAX_HISTORY) return { ok: false, error: "Helper history is too long." };
  for (const turn of history) {
    if (!turn || typeof turn !== "object" || Array.isArray(turn)) {
      return { ok: false, error: "A helper turn must be an object." };
    }
    const row = turn as Record<string, unknown>;
    if (row.role !== "user" && row.role !== "assistant") {
      return { ok: false, error: "A helper turn has an unknown role." };
    }
    if (typeof row.text !== "string") return { ok: false, error: "A helper turn must be text." };
    if (row.text.length > MAX_TURN) return { ok: false, error: "A helper turn is too long." };
  }

  if (!Array.isArray(record.measurements)) {
    return { ok: false, error: "Measurements must be a list." };
  }
  if (record.measurements.length > MAX_MEASUREMENTS) {
    return { ok: false, error: "Too many measurements." };
  }
  for (const measurement of record.measurements) {
    if (!measurement || typeof measurement !== "object" || Array.isArray(measurement)) {
      return { ok: false, error: "A measurement must be an object." };
    }
    const row = measurement as Record<string, unknown>;
    for (const key of ["step", "expected", "reading", "result"] as const) {
      if (typeof row[key] !== "string") return { ok: false, error: "A measurement field must be text." };
      if (row[key].length > MAX_MEASUREMENT_FIELD) {
        return { ok: false, error: "A measurement field is too long." };
      }
    }
  }

  if (record.caseBrief !== undefined && typeof record.caseBrief !== "string") {
    return { ok: false, error: "Case notes must be text." };
  }
  if (typeof record.caseBrief === "string" && record.caseBrief.length > MAX_CASE_BRIEF) {
    return { ok: false, error: "Case notes are too long." };
  }

  for (const key of ["symptomId", "currentStepId", "diagnosisId"] as const) {
    if (record[key] === undefined) continue;
    if (typeof record[key] !== "string") return { ok: false, error: "A factory id must be text." };
    if (record[key].length > MAX_STEP) return { ok: false, error: "A factory id is too long." };
  }
  for (const key of ["proofEnough", "mayBlameController", "mayShowParts", "manualsOnFile"] as const) {
    if (record[key] === undefined) continue;
    if (typeof record[key] !== "boolean") return { ok: false, error: "A yes/no flag was not true or false." };
  }

  const value = record as unknown as AssistantInput;
  return { ok: true, value: { ...value, question } };
}
