import type { JobRecord, ModelPack } from "@/data/types";

export type HandheldKind = "Program" | "Log";

function fileDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fileToken(raw: string | undefined, fallback = "Unknown"): string {
  const t = (raw ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z0-9-]/g, "");
  return t || fallback;
}

function compactPhrase(raw: string): string {
  const cleaned = raw
    .replace(/\bcart\b/gi, " ")
    .replace(/\bengine\b/gi, " ")
    .replace(/\bwill not\b/gi, "No")
    .replace(/\bdoes not\b/gi, "No")
    .replace(/\bwon't\b/gi, "No")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim();
  if (!cleaned) return "Case";
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function makeToken(job: JobRecord, pack: ModelPack): string {
  const label = job.cartMake || pack.manufacturerLabel;
  if (/ez-?go/i.test(label) || pack.manufacturer === "ezgo") return "EZGO";
  if (/club/i.test(label) || pack.manufacturer === "club-car") return "ClubCar";
  if (/yamaha/i.test(label) || pack.manufacturer === "yamaha") return "Yamaha";
  return fileToken(label, "Cart");
}

function modelToken(job: JobRecord, pack: ModelPack): string {
  const name = job.cartModel || pack.name;
  const first = name.split(/[\s/]+/).find((p) => /[A-Za-z]{2,}/.test(p));
  return fileToken(first, "Model");
}

export function fileExtension(name: string): string {
  const m = name.trim().match(/(\.[A-Za-z0-9]{1,8})$/);
  return m ? m[1] : "";
}

export function suggestedHandheldName(job: JobRecord, kind: HandheldKind): string {
  const date = fileDate(job.createdAt);
  const last = fileToken(job.lastName, "Unknown");
  const num = fileToken(job.hcpJobNumber, "Unknown");
  return `${date}_${last}_${num}_${kind}`;
}

export function brainHandheldName(job: JobRecord, pack: ModelPack, kind: HandheldKind, originalName?: string): string {
  const date = fileDate(job.createdAt);
  const symptom = pack.symptoms.find((s) => s.id === job.symptomId);
  const base = `${date}_${makeToken(job, pack)}_${modelToken(job, pack)}_${compactPhrase(symptom?.label || job.symptomId || "Case")}_${kind}`;
  return base + fileExtension(originalName ?? "");
}

export function handheldKindFromName(name: string): HandheldKind | null {
  if (/_Program(?:\.|$)/i.test(name) || /(?:^|[^A-Za-z])Program(?:\.|$)/i.test(name)) return "Program";
  if (/_Log(?:\.|$)/i.test(name) || /(?:^|[^A-Za-z])Log(?:\.|$)/i.test(name)) return "Log";
  return null;
}

export function handheldFileForBrain(job: JobRecord, pack: ModelPack, kind: HandheldKind, originalName?: string): string {
  return brainHandheldName(job, pack, kind, originalName);
}

export function formatHandheldRecord(
  job: JobRecord,
  pack: ModelPack,
  mode: "device" | "brain",
): { program: string; log: string; present: string; history: string; counters: string; odometer: string; faultOdometer: string } | null {
  const cs = job.codeSave;
  if (!cs) return null;
  const program =
    cs.couldNotConnect
      ? "could not connect / could not save"
      : mode === "brain"
        ? brainHandheldName(job, pack, "Program", cs.programFileName)
        : cs.programFileName || suggestedHandheldName(job, "Program");
  const log =
    cs.couldNotConnect || cs.loggerNotUsed || !cs.logFileName
      ? "logger not used"
      : mode === "brain"
        ? brainHandheldName(job, pack, "Log", cs.logFileName)
        : cs.logFileName;
  const counters = cs.noControllerReadings
    ? "not shown"
    : (cs.faultCounters ?? [])
        .filter((r) => r.fault.trim() || r.count.trim())
        .map((r) => `${r.fault.trim()} × ${r.count.trim()}`)
        .concat(cs.faultCounterNotes ? [cs.faultCounterNotes] : [])
        .join("; ") || "not shown";
  const odometer = cs.noControllerReadings ? "not shown" : cs.odometer?.trim() || "not shown";
  const faultOdometer = cs.noControllerReadings ? "not shown" : cs.faultOdometer?.trim() || "not shown";
  return {
    program,
    log,
    present: cs.couldNotConnect ? (cs.connectReason || "could not connect") : cs.present || "—",
    history: cs.couldNotConnect ? "—" : cs.history || "—",
    counters,
    odometer,
    faultOdometer,
  };
}
