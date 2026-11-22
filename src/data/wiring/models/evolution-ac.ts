import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Evolution — AC Drive electrical + D5 / touchscreen wiring diagrams
  {
    id: "evo-1232se-system",
    title: "1232SE SYSTEM DIAGRAM",
    manualRef:
      "Evolution Alternating-Current Drive — Electrical, 1232SE SYSTEM DIAGRAM, HOW CAN YOU TEST ELECTRONIC COMPONENTS? 54",
    src: "/wiring/evo-1232se-system-diagram.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "evo-1232se-35pin",
    title: "35pins connector for AC controller",
    manualRef:
      "Evolution Alternating-Current Drive — Electrical, 35pins connector for AC controller, HOW CAN YOU TEST ELECTRONIC COMPONENTS? 55",
    src: "/wiring/evo-1232se-35pin-connector.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "evo-touchscreen",
    title: "TOUCHSCREEN WIRING DIAGRAM",
    manualRef: "Evolution — Touchscreen Wiring Diagram, TOUCHSCREEN WIRING DIAGRAM",
    src: "/wiring/evo-touchscreen-wiring.jpg",
    kind: "harness",
    landscape: true,
  },
];
