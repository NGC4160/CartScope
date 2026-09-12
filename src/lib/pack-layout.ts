import type { ModelPack, PackCheckRecord, PackLayoutSource } from "@/data/types";

export interface PackLayout {
  count: number;
  nominalV: number;
  label: string;
}

export const FACTORY_BOOK_LAYOUT_LABEL = "Factory book layout";
export const FIELD_MODIFIED_PACK_LABEL = "Field-modified pack";
export const AS_FOUND_LABEL = "as-found";

/** Cart-specific pack layout. Do not assume TXT 6×8 V on every cart. */
export function packLayout(pack: ModelPack): PackLayout {
  const blob = `${pack.id} ${pack.fullName} ${pack.architecture} ${pack.diagramNotes.join(" ")}`;
  if (/four 12|4×12|4 x 12|4x12/i.test(blob) || pack.id === "ezgo-rxv-ac") {
    return { count: 4, nominalV: 12, label: "Four 12 V batteries (48 V pack)" };
  }
  if (/six 6|6×6|6 x 6|6x6/i.test(blob) || pack.voltage === 36) {
    return { count: 6, nominalV: 6, label: "Six 6 V batteries (36 V pack)" };
  }
  if (/six 8|6×8|6 x 8|6x8/i.test(blob) || pack.voltage === 48) {
    return { count: 6, nominalV: 8, label: "Six 8 V batteries (48 V pack)" };
  }
  const nominalV = pack.voltage >= 36 ? 8 : 12;
  const count = Math.max(1, Math.round(pack.voltage / nominalV));
  return {
    count,
    nominalV,
    label: `${count} × ${nominalV} V batteries (${pack.voltage} V pack)`,
  };
}

export function scaledLeadAcidLimits(nominalV: number) {
  const scale = nominalV / 8;
  return {
    restMin: round2(8.29 * scale),
    chargeTarget: round2(8.49 * scale),
    deadFloor: round2(8.07 * scale),
    spreadMax: 0.3,
    loadDropMaxPct: 5,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCountByVolts(count: number, nominalV: number): string {
  return `${count} × ${nominalV} V`;
}

/** Total pack volts = count × cell. Do not invent another total. */
export function asFoundPackVolts(count: number, cellVolts: number): number {
  return count * cellVolts;
}

export function parseAsFoundCount(raw: string): number | undefined {
  const t = raw.trim();
  if (!t || !/^\d+$/.test(t)) return undefined;
  const n = Number.parseInt(t, 10);
  if (!Number.isInteger(n) || n < 1 || n > 16) return undefined;
  return n;
}

export function parseAsFoundCellVolts(raw: string): number | undefined {
  const n = Number.parseFloat(raw.trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 48) return undefined;
  return n;
}

export function asFoundLayout(count: number, cellVolts: number): PackLayout {
  const packV = asFoundPackVolts(count, cellVolts);
  return {
    count,
    nominalV: cellVolts,
    label: `${count} × ${cellVolts} V batteries (${packV} V pack)`,
  };
}

/** Lead-acid working layout. Field-modified uses as-found only when both numbers parse. */
export function resolveLeadAcidLayout(
  pack: ModelPack,
  source: PackLayoutSource | undefined,
  asFoundCount?: number,
  asFoundCellV?: number,
): PackLayout {
  if (source === "field-modified" && asFoundCount != null && asFoundCellV != null) {
    return asFoundLayout(asFoundCount, asFoundCellV);
  }
  return packLayout(pack);
}

export function layoutSourceFrom(
  draftSource?: PackLayoutSource,
  recordSource?: PackLayoutSource,
): PackLayoutSource {
  return draftSource ?? recordSource ?? "factory-book";
}

export type PackLayoutStampInput = Pick<
  PackCheckRecord,
  | "cellCount"
  | "nominalV"
  | "layoutSource"
  | "factoryCellCount"
  | "factoryNominalV"
  | "asFoundCellCount"
  | "asFoundNominalV"
>;

/** Plain Factory book / Field-modified / as-found lines for record, report, and case copy. */
export function packLayoutStampLines(record: PackLayoutStampInput): string[] {
  const factoryCount = record.factoryCellCount ?? record.cellCount;
  const factoryV = record.factoryNominalV ?? record.nominalV;
  const lines = [`${FACTORY_BOOK_LAYOUT_LABEL}: ${formatCountByVolts(factoryCount, factoryV)}`];
  if (record.layoutSource === "field-modified") {
    const count = record.asFoundCellCount ?? record.cellCount;
    const cellV = record.asFoundNominalV ?? record.nominalV;
    const packV = asFoundPackVolts(count, cellV);
    lines.push(`Field-modified as-found: ${formatCountByVolts(count, cellV)} (${packV} V pack)`);
  }
  return lines;
}

export function leadAcidMeasureHint(layout: PackLayout, source: PackLayoutSource): string {
  if (source === "field-modified") {
    return `Measure each of the ${layout.count} as-found ${layout.nominalV} V batteries.`;
  }
  return `Measure each of the ${layout.count} batteries at rest.`;
}
