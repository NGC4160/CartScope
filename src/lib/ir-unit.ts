/** Shop IR scale. Lead-acid golf-cart pack IR is almost always milliohms. */
export type IrUnit = "mohm" | "megohm";

export const DEFAULT_IR_UNIT: IrUnit = "mohm";

export const IR_UNIT_HELP =
  "Pick milliohms (mΩ) or megaohms (MΩ). Lead-acid golf cart pack IR is almost always milliohms. Switching the unit labels the same number — it does not convert it.";

const UNIT_TOKEN = /(?:milli-?ohms?|mega-?ohms?|mohms?|Mohms?|mΩ|MΩ)/i;

export function isIrUnit(value: unknown): value is IrUnit {
  return value === "mohm" || value === "megohm";
}

export function resolveIrUnit(value: unknown): IrUnit {
  return isIrUnit(value) ? value : DEFAULT_IR_UNIT;
}

export function irUnitSymbol(unit: IrUnit): string {
  return unit === "megohm" ? "MΩ" : "mΩ";
}

export function irUnitName(unit: IrUnit): string {
  return unit === "megohm" ? "megaohms" : "milliohms";
}

export function parseIrUnitToken(raw: string): IrUnit | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/mega-?ohms?/i.test(t) || t.includes("MΩ") || /\bMohms?\b/.test(t) || /\bMOhms?\b/.test(t)) {
    return "megohm";
  }
  if (/milli-?ohms?/i.test(t) || t.includes("mΩ") || /\bmohms?\b/i.test(t)) {
    return "mohm";
  }
  return undefined;
}

/** Split a typed/pasted IR token into the number the tech typed and an optional unit. */
export function parseIrReading(raw: string): { value: string; unit?: IrUnit } {
  const live = raw.replace(/\u00a0/g, " ").trim();
  if (!live) return { value: "" };
  const unit = parseIrUnitToken(live);
  const value = live.replace(UNIT_TOKEN, "").replace(/\s+/g, " ").trim();
  return { value, unit };
}

export function irToMilliohms(raw: string, unit: IrUnit = DEFAULT_IR_UNIT): number | undefined {
  const { value } = parseIrReading(raw);
  const n = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(n)) return undefined;
  // 1 MΩ = 1e6 Ω = 1e9 mΩ
  return unit === "megohm" ? n * 1_000_000_000 : n;
}

export function formatIrReading(
  raw: string | undefined,
  unit?: IrUnit,
  couldNot?: boolean,
): string {
  if (couldNot) return "IR not measured";
  const typed = (raw ?? "").trim();
  if (!typed) return "IR —";
  const parsed = parseIrReading(typed);
  const resolved = parsed.unit ?? resolveIrUnit(unit);
  const number = parsed.value || typed;
  return `IR ${number} ${irUnitSymbol(resolved)}`;
}
