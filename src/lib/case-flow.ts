import type { CasePhase, DiagnosticStep, JobRecord, ModelPack } from "@/data/types";

export function needsPackGate(pack: ModelPack): boolean {
  return pack.powertrain === "electric";
}

export function needsCodeGate(pack: ModelPack): boolean {
  if (pack.powertrain !== "electric") return false;
  const blob = `${pack.id} ${pack.fullName} ${pack.architecture} ${Object.keys(pack.steps).join(" ")} ${pack.symptoms.map((s) => `${s.id} ${s.label}`).join(" ")}`;
  return /fault|code|iqdm|handset|programmer|1206|sevcon|curtis|tct|iq\b|eric|excel|ac drive|mcu|dcs|pds/i.test(blob);
}

export function initialPhase(pack: ModelPack): CasePhase {
  if (needsPackGate(pack)) return "pack";
  return "steps";
}

export function phaseAfterPack(pack: ModelPack): CasePhase {
  if (needsCodeGate(pack)) return "codes";
  return "steps";
}

export function isMotorIsolationStep(step: DiagnosticStep): boolean {
  const t = `${step.title} ${step.instruction} ${step.caution ?? ""}`.toLowerCase();
  return (
    /\bmegger\b/.test(t) ||
    /milli-?ohm/.test(t) ||
    /isolate[- ]motor/.test(t) ||
    /cables off the speed box/.test(t) ||
    /unplug u,\s*v,\s*w/.test(t) ||
    /phase ohms/.test(t)
  );
}

export function caseTitle(job: JobRecord): string {
  const name = job.lastName?.trim();
  const num = job.hcpJobNumber?.trim();
  if (name && num) return `${name} · ${num}`;
  if (name) return name;
  if (num) return num;
  return job.id;
}

export function statusLabel(job: JobRecord): string {
  if (job.status === "complete" || job.reportConfirmed) return "Complete";
  if (job.casePhase === "report" || job.status === "diagnosed") return "Ready to review";
  return "Still working";
}
