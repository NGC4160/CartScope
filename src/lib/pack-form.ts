import { DEFAULT_IR_UNIT, parseIrReading, parseIrUnitToken, type IrUnit } from "./ir-unit.ts";
import { evaluateLeadAcid, monthsOld, parseAgeMonthYear, parseVolts } from "./pack-rules.ts";

export type PackCellDraft = {
  volts: string;
  ir: string;
  irUnit?: IrUnit;
  age: string;
  ageSkip: boolean;
};

export type PackBlocker = {
  field: string;
  message: string;
};

export function typedVoltage(raw: string): number | undefined {
  const live = raw.replace(/\u00a0/g, " ").trim();
  if (!live) return undefined;
  return parseVolts(live);
}

export function packSaveBlockers(input: {
  lithium: boolean;
  cellCount: number;
  cells: PackCellDraft[];
  irSkip: boolean;
  irSkipReason: string;
  monitorV: string;
  noMonitor: boolean;
}): PackBlocker[] {
  const blockers: PackBlocker[] = [];
  if (input.lithium) {
    if (!input.noMonitor && !input.monitorV.trim()) {
      blockers.push({
        field: "Monitor pack voltage",
        message: "Type the monitor pack voltage, or check that no monitor is connected.",
      });
    }
    return blockers;
  }

  for (let i = 0; i < input.cellCount; i += 1) {
    const cell = input.cells[i];
    const n = i + 1;
    if (!cell || typedVoltage(cell.volts) == null) {
      blockers.push({
        field: `Battery ${n} resting volts`,
        message: `Type a resting voltage for battery ${n}. The example in the hint is not a reading.`,
      });
    }
    if (!input.irSkip && !(cell?.ir.trim())) {
      blockers.push({
        field: `Battery ${n} internal resistance`,
        message: `Type internal resistance for battery ${n} as the IR meter showed it, or check that the IR meter could not be used.`,
      });
    }
    if (cell && !cell.ageSkip && !parseAgeMonthYear(cell.age)) {
      blockers.push({
        field: `Battery ${n} age`,
        message: `Enter month/year for battery ${n} (such as 09/2024), or mark age not readable.`,
      });
    }
  }

  if (input.irSkip && input.irSkipReason.trim().length < 4) {
    blockers.push({
      field: "IR skip reason",
      message: "Write a short reason that the IR meter could not be used. Do not invent a reading.",
    });
  }

  return blockers;
}

export const PACK_FAIL_BLOCK_REASON =
  "This pack does not pass. Charge or fix it first, or continue on a test battery.";

export const PACK_TEST_BATTERY_BLOCK_REASON =
  "Write what you measured on the pack, and that later steps used a known-good test battery.";

export type PackSaveDecision =
  | { action: "save-pass" }
  | { action: "save-test-battery"; issues: string[] }
  | { action: "block"; reason: string; blockers: PackBlocker[] };

/**
 * One pack Save decision. Empty / incomplete packs always name resting volts
 * and age. A valid filled pack is save-pass. Do not silently no-op.
 */
export function decidePackSave(input: {
  lithium: boolean;
  cellCount: number;
  cells: PackCellDraft[];
  irSkip: boolean;
  irSkipReason: string;
  monitorV: string;
  noMonitor: boolean;
  loadDrop?: string;
  testNote?: string;
  nominalV: number;
}): PackSaveDecision {
  const blockers = packSaveBlockers(input);
  if (blockers.length) {
    return { action: "block", reason: packSaveBlockedReason(blockers), blockers };
  }
  if (input.lithium) return { action: "save-pass" };

  const numeric = input.cells.map((c) => typedVoltage(c.volts)).filter((n): n is number => n != null);
  const ages = input.cells.map((c) => {
    if (c.ageSkip) return null;
    const parsed = parseAgeMonthYear(c.age);
    return parsed ? monthsOld(parsed) : null;
  });
  const verdict = evaluateLeadAcid(numeric, input.nominalV, parseVolts(input.loadDrop ?? ""), ages);

  if (verdict.pass || numeric.length < input.cellCount) {
    if (!verdict.pass) {
      return { action: "block", reason: PACK_FAIL_BLOCK_REASON, blockers: [] };
    }
    return { action: "save-pass" };
  }

  const note = (input.testNote ?? "").trim();
  if (note.length < 8) {
    return { action: "block", reason: PACK_TEST_BATTERY_BLOCK_REASON, blockers: [] };
  }
  return { action: "save-test-battery", issues: verdict.issues };
}

/** Large sticky title. Empty pack must name resting volts and age. */
export function packSaveBlockedReason(blockers: PackBlocker[]): string {
  if (blockers.length === 0) return "Cannot save yet.";
  const named = blockers.slice(0, 6).map((b) => b.field);
  const extra = blockers.length > named.length ? ` and ${blockers.length - named.length} more` : "";
  const needsVolts = blockers.some((b) => /resting volts/i.test(b.field) || /resting volts/i.test(b.message));
  const needsAge = blockers.some((b) => /\bage\b/i.test(b.field) || /\bage\b/i.test(b.message));
  const needsIr = blockers.some((b) => /internal resistance|IR skip/i.test(b.field));
  const hint =
    needsVolts && needsAge
      ? " Type resting volts and age, or mark IR/age not readable."
      : needsVolts
        ? " Type resting volts, or mark IR/age not readable."
        : needsAge
          ? " Type age, or mark age not readable."
          : needsIr
            ? " Type IR, or mark that the IR meter could not be used."
            : "";
  return `Cannot save yet. Still needed: ${named.join(", ")}${extra}.${hint}`;
}

export function applyBulkAgeUnreadable(cells: PackCellDraft[], unread: boolean): PackCellDraft[] {
  return cells.map((c) => ({
    ...c,
    ageSkip: unread,
    age: unread ? "" : c.age,
  }));
}

export function emptyPackCells(count: number): PackCellDraft[] {
  return Array.from({ length: count }, () => ({
    volts: "",
    ir: "",
    irUnit: DEFAULT_IR_UNIT,
    age: "",
    ageSkip: false,
  }));
}

export function packPasteTemplate(count: number): string {
  const rows = Array.from({ length: count }, (_, i) => `Battery ${i + 1}\t\t\t`);
  return ["Battery\tvolts\tIR\tage", ...rows].join("\n");
}

function tokenizeLine(line: string): string[] {
  const tight = line
    .trim()
    .split(/[\t,;]| {2,}/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tight.length >= 2) return tight;
  return line
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function looksLikeHeader(line: string): boolean {
  return /volt|battery|age|\bir\b|internal/i.test(line) && !/\d/.test(line);
}

function looksLikeVoltage(token: string): boolean {
  if (parseIrUnitToken(token)) return false;
  if (/[a-zA-ZΩ]/.test(token)) return false;
  if (/^\d{1,2}[/-]\d{2,4}$/.test(token.trim())) return false;
  return typedVoltage(token) != null;
}

export type BulkPasteResult = {
  cells: PackCellDraft[];
  applied: number;
  extraIgnored: number;
  message: string;
};

/** Fill 6–8 (or the cart's count) battery rows from a pasted template or meter list. */
export function parseBulkPackPaste(raw: string, existing: PackCellDraft[], count: number): BulkPasteResult {
  const cells = existing.length === count ? existing.map((c) => ({ ...c })) : emptyPackCells(count);
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !looksLikeHeader(l));

  if (lines.length === 0) {
    return { cells, applied: 0, extraIgnored: 0, message: "Nothing to paste. Add one battery per line, or a list of voltages." };
  }

  let parsed: Array<Partial<PackCellDraft>> = [];

  if (lines.length === 1) {
    const tokens = tokenizeLine(lines[0]!);
    const voltageTokens = tokens.filter(looksLikeVoltage);
    if (voltageTokens.length >= 2 && voltageTokens.length === tokens.length) {
      parsed = voltageTokens.map((volts) => ({ volts }));
    } else if (tokens.length >= 3 && tokens.length % 3 === 0) {
      for (let i = 0; i < tokens.length; i += 3) {
        parsed.push({ volts: tokens[i], ...irFromToken(tokens[i + 1]!), age: tokens[i + 2] });
      }
    } else {
      parsed = [rowFromTokens(tokens)];
    }
  } else {
    parsed = lines.map((line) => rowFromTokens(tokenizeLine(line)));
  }

  const extraIgnored = Math.max(0, parsed.length - count);
  let applied = 0;
  for (let i = 0; i < count && i < parsed.length; i += 1) {
    const next = parsed[i]!;
    if (!next.volts && !next.ir && !next.age) continue;
    cells[i] = {
      volts: next.volts ?? cells[i]!.volts,
      ir: next.ir ?? cells[i]!.ir,
      irUnit: next.irUnit ?? cells[i]!.irUnit ?? DEFAULT_IR_UNIT,
      age: next.age ?? cells[i]!.age,
      ageSkip: next.ageSkip ?? cells[i]!.ageSkip,
    };
    applied += 1;
  }

  const message =
    applied === 0
      ? "Could not read battery numbers from that paste."
      : extraIgnored
        ? `Filled ${applied} of ${count} batteries. Extra rows were ignored.`
        : `Filled ${applied} of ${count} batteries.`;

  return { cells, applied, extraIgnored, message };
}

function stripBatteryLabel(tokens: string[]): string[] {
  if (/^battery$/i.test(tokens[0] ?? "") && /^\d+$/.test(tokens[1] ?? "")) {
    return tokens.slice(2);
  }
  return tokens.filter((t) => !/^battery\s*\d+$/i.test(t));
}

function rowFromTokens(tokens: string[]): Partial<PackCellDraft> {
  const useful = stripBatteryLabel(tokens);
  if (useful.length === 0) return {};
  if (useful.length === 1) return { volts: useful[0] };
  if (useful.length === 2) {
    if (parseAgeMonthYear(useful[1]!)) return { volts: useful[0], age: useful[1] };
    return { volts: useful[0], ...irFromToken(useful[1]!) };
  }
  return { volts: useful[0], ...irFromToken(useful[1]!), age: useful[2] };
}

function irFromToken(token: string): Pick<PackCellDraft, "ir" | "irUnit"> {
  const parsed = parseIrReading(token);
  return {
    ir: parsed.value || token,
    irUnit: parsed.unit ?? DEFAULT_IR_UNIT,
  };
}

export function groupPackBlockers(blockers: PackBlocker[]): { heading: string; items: PackBlocker[] }[] {
  const groups = new Map<string, PackBlocker[]>();
  for (const blocker of blockers) {
    const match = blocker.field.match(/^Battery (\d+)/);
    const heading = match ? `Battery ${match[1]}` : "Pack";
    const list = groups.get(heading) ?? [];
    list.push(blocker);
    groups.set(heading, list);
  }
  return [...groups.entries()].map(([heading, items]) => ({ heading, items }));
}
