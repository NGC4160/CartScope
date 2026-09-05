import type { ModelPack } from "@/data/types";

export interface PackLayout {
  count: number;
  nominalV: number;
  label: string;
}

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
