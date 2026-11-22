import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Star EV — community chassis WD + factory Sirius body electrical
  {
    id: "star-curtis1243-2007",
    title: "VII Schematic diagram of the electrical system — 2007 Curtis 1243 (Cartaholics community)",
    manualRef:
      "Star-chassis-wiring-diagram-2007-Curtis1243 (Cartaholics community), VII Schematic diagram of the electrical system — Curtis 1243-43301. Community scan, not a factory Star SM plate.",
    src: "/wiring/star-chassis-curtis1243-2007-cartaholics.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "sirius-combo-314",
    title: "Testing the Combination Switch, page 314",
    manualRef: "Sirius Service Manual V 1.06 (5-27-25), Testing the Combination Switch, page 314 — Body Electrical",
    src: "/wiring/sirius-combination-switch-p314.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "sirius-combo-315",
    title: "Testing the Combination Switch, page 315",
    manualRef: "Sirius Service Manual V 1.06 (5-27-25), Testing the Combination Switch, page 315 — Body Electrical",
    src: "/wiring/sirius-combination-switch-p315.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "sirius-headlight-316",
    title: "Sirius Headlight Wiring Diagram, page 316",
    manualRef: "Sirius Service Manual V 1.06 (5-27-25), Sirius Headlight Wiring Diagram, page 316 — Body Electrical",
    src: "/wiring/sirius-headlight-wiring-p316.jpg",
    kind: "accessory",
    landscape: false,
  },
  {
    id: "sirius-turn-317",
    title: "Sirius Turn Signal Wiring Diagram, page 317",
    manualRef: "Sirius Service Manual V 1.06 (5-27-25), Sirius Turn Signal Wiring Diagram, page 317 — Body Electrical",
    src: "/wiring/sirius-turn-signal-wiring-p317.jpg",
    kind: "accessory",
    landscape: false,
  },
  {
    id: "sirius-cruise-324",
    title: "2024 Star Sirius Add-on Cruise Control Wiring Harness, page 324",
    manualRef:
      "Sirius Service Manual V 1.06 (5-27-25), 2024 Star Sirius Add-on Cruise Control Wiring Harness, page 324 — Body Electrical",
    src: "/wiring/sirius-cruise-harness-p324.jpg",
    kind: "harness",
    landscape: false,
  },
];
