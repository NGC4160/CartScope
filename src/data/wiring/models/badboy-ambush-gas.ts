import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Bad Boy Ambush — Jesse binder Batch 2
  {
    id: "bb-ambush-fig2",
    title: "Fig. 2 Gas Powertrain And 4WD Electrical Schematic",
    manualRef:
      "Bad Boy Ambush Repair and Service Manual — Electrical, Fig. 2 Gas Powertrain And 4WD Electrical Schematic, page J-2",
    src: "/wiring/bb-ambush-fig2-gas-4wd.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "bb-ambush-fig5",
    title: "Fig. 5 Main Harness Wiring Diagram",
    manualRef: "Bad Boy Ambush Repair and Service Manual — Electrical, Fig. 5 Main Harness Wiring Diagram, page J-7",
    src: "/wiring/bb-ambush-fig5-main-harness.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "bb-ambush-fig6",
    title: "Fig. 6 Accessory Wiring Diagram",
    manualRef: "Bad Boy Ambush Repair and Service Manual — Electrical, Fig. 6 Accessory Wiring Diagram, page J-8",
    src: "/wiring/bb-ambush-fig6-accessory.jpg",
    kind: "accessory",
    landscape: false,
  },
];
