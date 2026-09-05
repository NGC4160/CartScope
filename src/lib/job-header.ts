import type { BatteryType, Powertrain } from "@/data/types";

export type JobHeaderGap = "lastName" | "hcpJobNumber" | "batteryType";

export const JOB_HEADER_MESSAGES: Record<JobHeaderGap, string> = {
  lastName: "Customer last name is required.",
  hcpJobNumber: "Housecall Pro job number is required.",
  batteryType: "Battery type is required for an electric cart. Pick lead-acid or lithium.",
};

export function jobHeaderGaps(input: {
  lastName: string;
  hcpJobNumber: string;
  powertrain?: Powertrain;
  batteryType?: BatteryType | "";
}): JobHeaderGap[] {
  const gaps: JobHeaderGap[] = [];
  if (!input.lastName.trim()) gaps.push("lastName");
  if (!input.hcpJobNumber.trim()) gaps.push("hcpJobNumber");
  if (input.powertrain === "electric") {
    if (input.batteryType !== "lead-acid" && input.batteryType !== "lithium") {
      gaps.push("batteryType");
    }
  }
  return gaps;
}

export function jobHeaderSummary(gaps: JobHeaderGap[]): string | null {
  if (gaps.length === 0) return null;
  const names = gaps.map((g) => {
    if (g === "lastName") return "customer last name";
    if (g === "hcpJobNumber") return "Housecall Pro job number";
    return "battery type";
  });
  if (names.length === 1) return `Cannot start yet. Enter the ${names[0]}.`;
  if (names.length === 2) return `Cannot start yet. Enter the ${names[0]} and the ${names[1]}.`;
  return `Cannot start yet. Enter the ${names[0]}, the ${names[1]}, and the ${names[2]}.`;
}
