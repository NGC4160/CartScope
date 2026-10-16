export type WiringKind = "full" | "power" | "control" | "charge" | "harness" | "pinout" | "accessory";

export interface WiringSheet {
  id: string;
  title: string;
  manualRef: string;
  src: string;
  kind: WiringKind;
  landscape: boolean;
}
