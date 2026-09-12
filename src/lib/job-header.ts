import type { BatteryType, Powertrain } from "@/data/types";
import { parseCartYear } from "./year-compat.ts";

export type JobHeaderGap = "lastName" | "hcpJobNumber" | "batteryType" | "technician" | "cartYear";

export const JOB_HEADER_MESSAGES: Record<JobHeaderGap, string> = {
  lastName: "Customer last name is required.",
  hcpJobNumber: "Housecall Pro job number is required.",
  batteryType: "Battery type is required for an electric cart. Pick lead-acid or lithium.",
  technician: "Who checked it is required. Put the tech name so the shop knows who ran this case.",
  cartYear: "Year is required.",
};

export function jobHeaderGaps(input: {
  lastName: string;
  hcpJobNumber: string;
  powertrain?: Powertrain;
  batteryType?: BatteryType | "";
  technician?: string;
  /** When passed (including ""), a four-digit year is required to Start. */
  cartYear?: string;
}): JobHeaderGap[] {
  const gaps: JobHeaderGap[] = [];
  if (!input.lastName.trim()) gaps.push("lastName");
  if (!input.hcpJobNumber.trim()) gaps.push("hcpJobNumber");
  if (input.powertrain === "electric") {
    if (input.batteryType !== "lead-acid" && input.batteryType !== "lithium") {
      gaps.push("batteryType");
    }
  }
  if (!(input.technician ?? "").trim()) gaps.push("technician");
  if (input.cartYear !== undefined && parseCartYear(input.cartYear) == null) {
    gaps.push("cartYear");
  }
  return gaps;
}

function joinRequired(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and the ${names[1]}`;
  return `${names.slice(0, -1).join(", the ")}, and the ${names[names.length - 1]}`;
}

export function jobHeaderSummary(gaps: JobHeaderGap[]): string | null {
  if (gaps.length === 0) return null;
  const names = gaps.map((g) => {
    if (g === "lastName") return "customer last name";
    if (g === "hcpJobNumber") return "Housecall Pro job number";
    if (g === "batteryType") return "battery type";
    if (g === "cartYear") return "cart year";
    return "name of who checked it";
  });
  return `Cannot start yet. Enter the ${joinRequired(names)}.`;
}

/**
 * Header tech name only. A Helper / What-the-tech-saw line must never replace it.
 * `incoming === undefined` keeps the name already on the job.
 */
export function keepWhoCheckedIt(
  current: string,
  incoming: string | undefined,
  observation: string,
  helperTexts: readonly string[] = [],
): string {
  if (incoming === undefined) return current;
  const candidate = incoming.trim();
  if (!candidate) return current;
  const obs = observation.trim();
  if (obs && candidate === obs) return current;
  if (helperTexts.some((text) => text.trim() === candidate)) return current;
  return candidate;
}
