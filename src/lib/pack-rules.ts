import type { PackCheckRecord } from "@/data/types";
import { scaledLeadAcidLimits } from "./pack-layout.ts";

export function parseVolts(raw: string): number | undefined {
  const n = Number.parseFloat(raw.trim().replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

/** Parse IR as the meter shows it. Keeps the number only for spread checks. */
export function parseIrNumber(raw: string): number | undefined {
  const m = raw.trim().replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = Number.parseFloat(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

/** Month and year only. Accepts 09/2024, 2024-09, September 2024. */
export function parseAgeMonthYear(raw: string): { month: number; year: number } | null {
  const t = raw.trim();
  if (!t) return null;
  const slash = t.match(/^(\d{1,2})\s*[/\-.]\s*(\d{2}|\d{4})$/);
  if (slash) {
    const month = Number(slash[1]);
    let year = Number(slash[2]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && year >= 1990 && year <= 2100) return { month, year };
  }
  const iso = t.match(/^(\d{4})\s*[/\-.]\s*(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    if (month >= 1 && month <= 12 && year >= 1990 && year <= 2100) return { month, year };
  }
  const named = t.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    const year = Number(named[2]);
    if (month && year >= 1990 && year <= 2100) return { month, year };
  }
  return null;
}

export function monthsOld(age: { month: number; year: number }, now = new Date()): number {
  return (now.getFullYear() - age.year) * 12 + (now.getMonth() + 1 - age.month);
}

export function formatAgeMonthYear(age: { month: number; year: number }): string {
  return `${String(age.month).padStart(2, "0")}/${age.year}`;
}

export function evaluateLeadAcid(
  cells: number[],
  nominalV: number,
  loadDropPct?: number,
  agesMonths?: Array<number | null>,
): { pass: boolean; issues: string[] } {
  const lim = scaledLeadAcidLimits(nominalV);
  const issues: string[] = [];
  if (cells.length === 0) {
    return { pass: false, issues: ["Type each battery resting voltage."] };
  }
  const low = cells.filter((v) => v < lim.restMin);
  if (low.length > 0) {
    issues.push(
      `A ${nominalV} V battery is under ${lim.restMin} V at rest. Charge toward about ${lim.chargeTarget} V before load tests.`,
    );
  }
  const min = Math.min(...cells);
  const max = Math.max(...cells);
  if (max - min > lim.spreadMax + 1e-9) {
    issues.push(
      `Batteries are more than about ${lim.spreadMax.toFixed(2)} V apart. That is a pack problem path.`,
    );
  }
  const deadIdx = cells.map((v, i) => (v <= lim.deadFloor ? i : -1)).filter((i) => i >= 0);
  if (deadIdx.length > 0) {
    issues.push(
      `A battery is at or below the dead floor of about ${lim.deadFloor} V. Record it. Talk about replacement only after this measured number (and age if you enter it).`,
    );
    const oldDead = deadIdx.some((i) => agesMonths?.[i] != null && agesMonths[i]! > 8);
    if (oldDead) {
      issues.push(
        "A battery at the dead floor also has a date code older than about eight months. Record both. Do not invent age. Do not replace other parts from age alone.",
      );
    }
  }
  if (loadDropPct != null && loadDropPct > lim.loadDropMaxPct) {
    issues.push(
      `The pack dropped more than about ${lim.loadDropMaxPct} percent on the short load. That fails the shop load rule.`,
    );
  }
  return { pass: issues.length === 0, issues };
}

/** Flag only. Does not fail the pack and does not recommend parts. */
export function irSpreadNote(readings: string[]): string | null {
  const nums = readings.map(parseIrNumber).filter((n): n is number => n != null && n > 0);
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (max >= min * 2) {
    return `Internal resistance is uneven across the pack (about ${min} to ${max} as the IR meter showed). That is a pack-health concern. Do not replace batteries from resistance alone. Keep the rest of the checks.`;
  }
  return null;
}

export function packRecordPass(record?: PackCheckRecord): boolean {
  if (!record) return false;
  return record.verdict === "pass";
}

export function formatPackCellLine(c: {
  index: number;
  volts: string;
  ir?: string;
  irCouldNot?: boolean;
  ageMonthYear?: string;
  ageNotReadable?: boolean;
}): string {
  const ir = c.irCouldNot ? "IR not measured" : c.ir?.trim() ? `IR ${c.ir.trim()}` : "IR —";
  const age = c.ageNotReadable ? "age not readable" : c.ageMonthYear?.trim() ? `age ${c.ageMonthYear.trim()}` : "age —";
  return `Battery ${c.index + 1}: ${c.volts || "—"} V · ${ir} · ${age}`;
}