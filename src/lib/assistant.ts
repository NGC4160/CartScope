import { createServerFn } from "@tanstack/react-start";
import { getPack } from "@/data/index";
import { sheetsForPack } from "@/data/wiring";
import { parseAssistantReply } from "@/lib/assistant-parse";
import { manualsOnFile } from "@/lib/manuals";

export interface AssistantMeasurement {
  step: string;
  expected: string;
  reading: string;
  result: string;
}

export interface AssistantHistoryTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AssistantInput {
  question: string;
  modelId: string;
  symptomId?: string;
  currentStepId?: string;
  diagnosisId?: string;
  measurements: AssistantMeasurement[];
  history: AssistantHistoryTurn[];
  caseBrief?: string;
  proofEnough?: boolean;
  mayBlameController?: boolean;
  mayShowParts?: boolean;
  manualsOnFile?: boolean;
}

export type AssistantResult =
  | { ok: true; text: string; suggestedStepId?: string; suggestedStepTitle?: string }
  | { ok: false; error: string };

export type HelperStatus = { available: boolean; reason?: string };

export const HELPER_OFFLINE_NO_KEY =
  "The shop helper is offline. No AI key is set on the server. Factory checks and manuals still work. Type what you see — it stays under What the tech saw, not Who checked it.";

function helperApiKey(): string | undefined {
  const key = process.env.XAI_API_KEY?.trim();
  return key || undefined;
}

function brief(data: AssistantInput): string {
  const pack = getPack(data.modelId);
  if (!pack) return `Unknown model id: ${data.modelId}`;

  const symptom = data.symptomId ? pack.symptoms.find((s) => s.id === data.symptomId) : undefined;
  const step = data.currentStepId ? pack.steps[data.currentStepId] : undefined;
  const diagnosis = data.diagnosisId ? pack.diagnoses[data.diagnosisId] : undefined;
  const sheets = sheetsForPack(pack.id);
  const coverage = manualsOnFile(pack, sheets);
  const stepIds = Object.keys(pack.steps).slice(0, 40).join(", ");

  const components = pack.components
    .map((c) => {
      const vals = c.expectedValues.map((v) => `${v.label}: ${v.value}`).join("; ");
      return `- ${c.ref} ${c.name}: ${vals || c.description.slice(0, 80)}`;
    })
    .join("\n");

  const diagnoses = Object.values(pack.diagnoses)
    .slice(0, 18)
    .map((d) => `- ${d.title} — ${d.likelyCause}`)
    .join("\n");

  const symptoms = pack.symptoms.map((s) => `- ${s.label}: ${s.summary}`).join("\n");

  const meas =
    data.measurements.length === 0
      ? "(none logged yet)"
      : data.measurements
          .slice(-16)
          .map((m) => `- ${m.step}: expected ${m.expected}; read ${m.reading}; ${m.result}`)
          .join("\n");

  return [
    data.caseBrief ? `EVIDENCE CASE BLOCK:\n${data.caseBrief}` : "",
    `PROOF ENOUGH: ${data.proofEnough === true}`,
    `MAY BLAME CONTROLLER: ${data.mayBlameController === true}`,
    `MAY SHOW PARTS: ${data.mayShowParts === true}`,
    `SERVICE MANUAL ON FILE: ${coverage.onFile}`,
    coverage.onFile
      ? `MANUALS / PROCEDURES / WIRE PICTURES / CHECKLISTS ON FILE:\n${coverage.items
          .slice(0, 24)
          .map((i) => `- [${i.kind}] ${i.title} — ${i.ref}`)
          .join("\n")}`
      : "NO SERVICE MANUAL ON FILE for this cart. Say that clearly. Offer to source a candidate. Do not add a PDF to the shop library.",
    ``,
    `MODEL: ${pack.fullName}`,
    `YEARS: ${pack.years}`,
    `ARCHITECTURE: ${pack.architecture} · ${pack.voltage} V · ${pack.powertrain}`,
    `DIAGRAM NOTES:`,
    ...pack.diagramNotes.map((n) => `- ${n}`),
    ``,
    `FACTORY SYMPTOMS:`,
    symptoms,
    ``,
    `ACTIVE SYMPTOM: ${symptom ? `${symptom.label} — ${symptom.summary} (${symptom.manualSection})` : "(none)"}`,
    `CURRENT STEP: ${
      step
        ? `${step.title}. ${step.instruction} Expected: ${step.measurement.expectedLabel}. Manual: ${step.manualRef}`
        : "(none)"
    }`,
    diagnosis ? `REACHED DIAGNOSIS: ${diagnosis.title}. ${diagnosis.summary} Cause: ${diagnosis.likelyCause}` : "",
    ``,
    `COMPONENTS / EXPECTED VALUES:`,
    components,
    ``,
    `COMMON DIAGNOSES:`,
    diagnoses,
    ``,
    `FACTORY WIRING SHEETS IN APP:`,
    sheets.length ? sheets.map((s) => `- ${s.title} (${s.kind}) — ${s.manualRef}`).join("\n") : "(interactive schematic only)",
    ``,
    `KNOWN FACTORY STEP IDS (use one after [[STEP:id]] if an observation should change the path): ${stepIds}`,
    ``,
    `MEASUREMENTS ALREADY LOGGED ON THIS JOB:`,
    meas,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export const askBenchAssistant = createServerFn({ method: "POST" })
  .validator((input: AssistantInput) => input)
  .handler(async ({ data }): Promise<AssistantResult> => {
    const question = data.question.trim().slice(0, 800);
    if (!question) return { ok: false, error: "Tell me what you see, or type a fault code." };
    if (!data.modelId) return { ok: false, error: "Pick a cart first." };

    const apiKey = helperApiKey();
    if (!apiKey) {
      return { ok: false, error: HELPER_OFFLINE_NO_KEY };
    }

    const factory = brief(data).slice(0, 14000);
    const history = (data.history ?? []).slice(-8).map((t) => ({
      role: t.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: t.text.slice(0, 1200),
    }));

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are CartScope, a golf-cart shop helper for Neighborhood Golf Carts. " +
              "This helper sits in the primary check flow on each step, not as a side chat. " +
              "MANUALS-FIRST: Use service manuals, procedures, wire pictures, and checklists already on file first. " +
              "Only if those do not cover the question, you may name a legitimate OEM or reputable factory source. " +
              "Never treat a random forum, Facebook group, or unverified PDF as the truth. " +
              "If SERVICE MANUAL ON FILE is false, say clearly: “No service manual is on file for this cart.” " +
              "Then offer to source a candidate title. Do not add any PDF to the shop library. Approval is required. " +
              "Use the factory pack data and the evidence case block. Follow the factory check list for THIS cart and THIS complaint. " +
              "Do not invent an EZ-GO TXT-only tree for other carts. " +
              "Write in full sentences. Everyday words. Short sentences. " +
              "Say solenoid for the drive contactor. Say controller for the drive controller. Say throttle or gas pedal sensor. Say tow/run switch. " +
              "Customer slang in a complaint note may stay as they said it. Checklist and helper advice must use controller and solenoid. " +
              "Voltage: “Now check if the power is flowing. Voltage is how strong the electric power is.” " +
              "Ohms: “Ohms tell you how hard it is for power to flow. OL means the path is broken.” " +
              "EVIDENCE-FIRST RULES (never break these): " +
              "You do not replace the tech, the meter, or the road test. " +
              "If PROOF ENOUGH is false, recommended repair MUST be “Not enough proof to recommend a repair yet.” " +
              "Never list shotgun parts. Never name a replacement part unless MAY SHOW PARTS is true. " +
              "If the pack failed and no test battery is in use, do not blame the controller. Tell them to charge or fix the pack first, or continue on a known-good test battery and write the note. " +
              "If a test battery is in use, pack health is set aside with that note — still do not shotgun parts. Keep the cart batteries’ voltage, internal resistance, and age on the case. " +
              "Lithium: a cart that runs is not a finished conversion. Do not claim UL listing or a ten-year warranty. Do not use lead-acid IR meter fields on lithium. " +
              "Lead-acid IR: write each battery as the internal resistance meter shows. A large IR spread is a pack-health concern. Never recommend replacing batteries from resistance alone. " +
              "Age is month and year only. If a battery is at the dead floor and older than about eight months, record both. Do not invent age. " +
              "Gas carts have no lead-acid pack gate. " +
              "Save a program file on the handheld before clearing. Present codes and history codes live in that one program file. A log file is only for logger data on a careful move or road test. Do not invent extra file types (no PresentCodes, HistoryCodes, or TestDrive files). " +
              "If the handheld will not connect or will not save, continue wire and mechanical checks. " +
              "Write fault counters, odometer, and fault odometer when shown. If counters are high but the complaint is new, compare fault odometer to current odometer when both exist. Never recommend replacing a controller from counters alone. " +
              "Never tell anyone to megger with the controller still connected. " +
              "If the tech types a free-text observation, use it to pick the next factory check. " +
              "If a different step fits better, say why and end the answer with [[STEP:exact-step-id]] using a known factory step id. " +
              "Structure every answer as:\n" +
              "1) What to do next (one check, full sentences)\n" +
              "2) What pass and fail mean, using factory numbers from the data\n" +
              "3) Wire picture or manual page to open (from the on-file list)\n" +
              "4) Recommended repair — only if proof enough; otherwise the exact sentence “Not enough proof to recommend a repair yet.”\n" +
              "Never invent ohms, volts, or pin numbers. If the data does not cover it, say so.",
          },
          { role: "system", content: factory },
          ...history,
          { role: "user", content: question },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: "The shop helper could not sign in to the AI service. Factory checks and manuals still work.",
        };
      }
      return { ok: false, error: `The helper could not answer (${res.status}). Try again. Factory checks still work.` };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return { ok: false, error: "Empty reply. Try a shorter question." };
    const parsed = parseAssistantReply(raw);
    const pack = getPack(data.modelId);
    const suggestedStepId =
      parsed.suggestedStepId && pack?.steps[parsed.suggestedStepId] ? parsed.suggestedStepId : undefined;
    return {
      ok: true,
      text: parsed.text,
      suggestedStepId,
      suggestedStepTitle: suggestedStepId ? pack?.steps[suggestedStepId]?.title : undefined,
    };
  });

export const getHelperStatus = createServerFn({ method: "GET" }).handler(async (): Promise<HelperStatus> => {
  if (!helperApiKey()) {
    return { available: false, reason: HELPER_OFFLINE_NO_KEY };
  }
  return { available: true };
});
