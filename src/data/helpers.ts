import type {
  ChoiceOption,
  Diagnosis,
  DiagnosticStep,
  MeasurementSpec,
  Outcome,
  PartRec,
} from "@/data/types";

export function yesNo(
  passLabel: string,
  failLabel: string,
  unusualFail = true,
): ChoiceOption[] {
  return [
    { id: "yes", label: passLabel, result: "pass" },
    { id: "no", label: failLabel, result: "fail", unusual: unusualFail },
  ];
}

export function closedOpen(
  closed = "Connected (good)",
  open = "Not connected (broken path)",
): ChoiceOption[] {
  return [
    { id: "closed", label: closed, result: "pass" },
    { id: "open", label: open, result: "fail", unusual: true },
  ];
}

function withVoltageIntro(instruction: string): string {
  if (/voltage|power is flowing|how strong the electric/i.test(instruction)) return instruction;
  return "Now check if the power is flowing. Voltage is how strong the electric power is. " + instruction;
}

function withOhmIntro(instruction: string): string {
  if (/ohm|how hard it is for power to flow/i.test(instruction)) return instruction;
  return "This check uses ohms (Ω). Ohms tell you how hard it is for power to flow. OL means the path is broken. " + instruction;
}

function withContIntro(instruction: string): string {
  if (/connected all the way|is the path connected/i.test(instruction)) return instruction;
  return "Now check if this path is connected all the way. " + instruction;
}

export function obs(
  id: string,
  title: string,
  instruction: string,
  manualRef: string,
  highlight: string[],
  prompt: string,
  meterSetup: string,
  expectedLabel: string,
  options: ChoiceOption[],
  pass: Outcome,
  fail: Outcome,
  extra?: { caution?: string; branches?: Record<string, Outcome> },
): DiagnosticStep {
  return {
    id,
    title,
    instruction,
    caution: extra?.caution,
    manualRef,
    highlight,
    measurement: {
      kind: "observation",
      prompt,
      meterSetup,
      expectedLabel,
      options,
    },
    pass,
    fail,
    branches: extra?.branches,
  };
}

export function volt(
  id: string,
  title: string,
  instruction: string,
  manualRef: string,
  highlight: string[],
  prompt: string,
  meterSetup: string,
  expectedLabel: string,
  min: number,
  max: number,
  placeholder: string,
  pass: Outcome,
  fail: Outcome,
  extra?: { caution?: string },
): DiagnosticStep {
  const measurement: MeasurementSpec = {
    kind: "voltage",
    prompt,
    meterSetup,
    unit: "V",
    expectedLabel,
    expectedMin: min,
    expectedMax: max,
    placeholder,
  };
  return {
    id,
    title,
    instruction: withVoltageIntro(instruction),
    caution: extra?.caution,
    manualRef,
    highlight,
    measurement,
    pass,
    fail,
  };
}

export function ohm(
  id: string,
  title: string,
  instruction: string,
  manualRef: string,
  highlight: string[],
  prompt: string,
  meterSetup: string,
  expectedLabel: string,
  min: number,
  max: number,
  placeholder: string,
  pass: Outcome,
  fail: Outcome,
  extra?: { caution?: string; openIsFail?: boolean },
): DiagnosticStep {
  return {
    id,
    title,
    instruction: withOhmIntro(instruction),
    caution: extra?.caution,
    manualRef,
    highlight,
    measurement: {
      kind: "resistance",
      prompt,
      meterSetup,
      unit: "Ω",
      expectedLabel,
      expectedMin: min,
      expectedMax: max,
      openIsFail: extra?.openIsFail !== false,
      placeholder,
    },
    pass,
    fail,
  };
}

export function cont(
  id: string,
  title: string,
  instruction: string,
  manualRef: string,
  highlight: string[],
  prompt: string,
  meterSetup: string,
  expectedLabel: string,
  pass: Outcome,
  fail: Outcome,
  extra?: { caution?: string; options?: ChoiceOption[] },
): DiagnosticStep {
  return {
    id,
    title,
    instruction: withContIntro(instruction),
    caution: extra?.caution,
    manualRef,
    highlight,
    measurement: {
      kind: "continuity",
      prompt,
      meterSetup,
      expectedLabel,
      options: extra?.options ?? closedOpen(),
    },
    pass,
    fail,
  };
}

export function dx(
  id: string,
  title: string,
  summary: string,
  likelyCause: string,
  recommendedAction: string,
  parts: PartRec[],
  severity: Diagnosis["severity"],
): Diagnosis {
  return { id, title, summary, likelyCause, recommendedAction, parts, severity };
}

export function branchOpts(
  options: { id: string; label: string; unusual?: boolean }[],
): ChoiceOption[] {
  return options.map((o) => ({
    id: o.id,
    label: o.label,
    result: "branch" as const,
    branchId: o.id,
    unusual: o.unusual,
  }));
}
