import type { ModelPack } from "../data/types.ts";

export const PACK_NA_TITLE = "Battery pack not applicable";
export const PACK_NA_BADGE = "Pack N/A";
export const PACK_NA_SUMMARY =
  "This is a gasoline cart. The traction battery pack is skipped. The 12 V starting battery is checked in the factory steps — not as a multi-battery pack.";
export const PACK_NA_NEXT =
  "Pack is skipped. Use Save and go on for the next factory check.";

export function packIsApplicable(pack: Pick<ModelPack, "powertrain">): boolean {
  return pack.powertrain === "electric";
}

export function packNaBadge(pack: Pick<ModelPack, "powertrain">): string | null {
  return packIsApplicable(pack) ? null : PACK_NA_BADGE;
}

export function packNaCopy(pack: Pick<ModelPack, "powertrain">): { title: string; summary: string } | null {
  if (packIsApplicable(pack)) return null;
  return { title: PACK_NA_TITLE, summary: PACK_NA_SUMMARY };
}

export function packNaReportLines(pack: Pick<ModelPack, "powertrain">): string[] | null {
  const copy = packNaCopy(pack);
  if (!copy) return null;
  return [copy.title, copy.summary];
}
