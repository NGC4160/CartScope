import type { DiagnosticStep, ModelPack } from "@/data/types";

export interface ManualOnFile {
  title: string;
  kind: "procedure" | "wiring" | "checklist";
  ref: string;
}

export interface ManualCoverage {
  onFile: boolean;
  items: ManualOnFile[];
  summary: string;
}

export interface ManualCandidate {
  id: string;
  packId: string;
  title: string;
  sourceNote: string;
  sourceUrl?: string;
  status: "proposed" | "approved" | "rejected";
  at: string;
}

export function manualsOnFile(
  pack: ModelPack,
  sheets: { title: string; manualRef: string }[] = [],
): ManualCoverage {
  const items: ManualOnFile[] = [];
  const notes = pack.diagramNotes.filter(Boolean);
  if (pack.diagramTitle || notes.length) {
    items.push({
      title: pack.diagramTitle || pack.fullName,
      kind: "procedure",
      ref: notes[0] || pack.years,
    });
  }
  for (const sheet of sheets) {
    items.push({
      title: sheet.title,
      kind: "wiring",
      ref: sheet.manualRef,
    });
  }
  const firstSteps = Object.values(pack.steps).slice(0, 4);
  for (const step of firstSteps) {
    if (step.manualRef) {
      items.push({
        title: step.title,
        kind: "checklist",
        ref: step.manualRef,
      });
    }
  }
  const unique = items.filter(
    (item, i, all) => all.findIndex((x) => x.title === item.title && x.ref === item.ref) === i,
  );
  const onFile = unique.length > 0 && Object.keys(pack.steps).length > 0;
  return {
    onFile,
    items: unique,
    summary: onFile
      ? `Service procedures and wire pictures are on file for ${pack.fullName}. Use those first.`
      : `No service manual is on file for ${pack.fullName}. Do not treat a random forum post as the book. You can ask to source a candidate. It will not be added to the shop library until someone approves it.`,
  };
}

const SHORT_KEEP = new Set(["fnr", "oil", "key", "its", "mcor"]);

const STRONG = new Set([
  "solenoid",
  "clicker",
  "contactor",
  "direction",
  "forward",
  "reverse",
  "fnr",
  "rocker",
  "spark",
  "ignition",
  "starter",
  "crank",
  "cranking",
  "throttle",
  "mcor",
  "charger",
  "charge",
  "charged",
  "charging",
  "fuse",
  "encoder",
]);

const ALIASES: Record<string, string[]> = {
  solenoid: ["solenoid", "clicker", "contactor"],
  clicker: ["solenoid", "clicker"],
  contactor: ["solenoid", "contactor"],
  direction: ["direction", "forward", "reverse", "fnr", "rocker"],
  forward: ["direction", "forward", "fnr", "rocker"],
  reverse: ["direction", "reverse", "fnr", "rocker"],
  fnr: ["direction", "forward", "reverse", "fnr", "rocker"],
  rocker: ["direction", "rocker", "fnr"],
  spark: ["spark", "ignition"],
  ignition: ["spark", "ignition"],
  starter: ["starter", "crank", "cranking"],
  crank: ["starter", "crank", "cranking"],
  cranking: ["starter", "crank", "cranking"],
  throttle: ["throttle", "mcor"],
  mcor: ["throttle", "mcor"],
  charge: ["charge", "charger", "charged", "charging"],
  charged: ["charge", "charger", "charged", "charging"],
  charging: ["charge", "charger", "charged", "charging"],
  charger: ["charge", "charger", "charged", "charging"],
};

export function normalizeObservation(text: string): string {
  return text
    .toLowerCase()
    .replace(/f\s*&\s*r/g, " fnr ")
    .replace(/forward\s*\/\s*reverse/g, " fnr ")
    .replace(/direction[-\s]?switch/g, " direction fnr rocker ");
}

export function matchObservationToSteps(
  pack: ModelPack,
  observation: string,
  currentStepId?: string,
): DiagnosticStep[] {
  const q = normalizeObservation(observation);
  if (q.trim().length < 4) return [];
  const rawTokens = q.split(/[^a-z0-9]+/).filter((t) => (t.length >= 4 || SHORT_KEEP.has(t)) && !STOP.has(t));
  const tokens = new Set<string>();
  for (const t of rawTokens) {
    tokens.add(t);
    for (const alias of ALIASES[t] ?? []) tokens.add(alias);
  }
  if (tokens.size === 0) return [];
  const scored = Object.values(pack.steps)
    .filter((s) => s.id !== currentStepId)
    .map((step) => {
      const blob = normalizeObservation(
        `${step.id} ${step.title} ${step.instruction} ${step.measurement.prompt} ${step.manualRef}`,
      );
      let hits = 0;
      let strong = 0;
      for (const t of tokens) {
        if (!blob.includes(t)) continue;
        hits += 1;
        if (STRONG.has(t)) strong += 1;
      }
      return { step, hits, strong };
    })
    .filter((x) => x.strong >= 1 || x.hits >= 2)
    .sort((a, b) => b.strong - a.strong || b.hits - a.hits);
  return scored.slice(0, 3).map((x) => x.step);
}

/** Pull factory checks named in helper notes, even without [[STEP:id]]. */
export function matchStepsFromReply(
  pack: ModelPack,
  reply: string,
  currentStepId?: string,
): DiagnosticStep[] {
  const q = normalizeObservation(reply);
  if (q.trim().length < 4) return [];
  const hits: DiagnosticStep[] = [];
  for (const step of Object.values(pack.steps)) {
    if (step.id === currentStepId) continue;
    const id = step.id.toLowerCase();
    const title = normalizeObservation(step.title);
    if (q.includes(id)) {
      hits.push(step);
      continue;
    }
    if (title.length >= 8 && q.includes(title)) hits.push(step);
  }
  return hits.slice(0, 3);
}

const STOP = new Set([
  "this",
  "that",
  "with",
  "from",
  "have",
  "been",
  "when",
  "then",
  "just",
  "only",
  "does",
  "will",
  "cart",
  "still",
  "looks",
  "look",
  "like",
  "very",
  "into",
  "over",
  "under",
  "about",
]);
