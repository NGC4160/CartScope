import { parseAgeMonthYear, parseVolts } from "./pack-rules.ts";

export type PackCellDraft = {
  volts: string;
  ir: string;
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

export function applyBulkAgeUnreadable(cells: PackCellDraft[], unread: boolean): PackCellDraft[] {
  return cells.map((c) => ({
    ...c,
    ageSkip: unread,
    age: unread ? "" : c.age,
  }));
}
