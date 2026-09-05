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

export function matchObservationToSteps(
  pack: ModelPack,
  observation: string,
  currentStepId?: string,
): DiagnosticStep[] {
  const q = observation.toLowerCase();
  if (q.trim().length < 4) return [];
  const tokens = q
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !STOP.has(t));
  if (tokens.length === 0) return [];
  const scored = Object.values(pack.steps)
    .filter((s) => s.id !== currentStepId)
    .map((step) => {
      const blob = `${step.title} ${step.instruction} ${step.measurement.prompt} ${step.manualRef}`.toLowerCase();
      const hits = tokens.reduce((n, t) => n + (blob.includes(t) ? 1 : 0), 0);
      return { step, hits };
    })
    .filter((x) => x.hits >= 2)
    .sort((a, b) => b.hits - a.hits);
  return scored.slice(0, 3).map((x) => x.step);
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
