import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "txt-tct-esc",
    title: "TXT TCT — controller wires",
    manualRef: "48 V TXT Service Manual, Section E page E-6",
    src: "/wiring/txt-tct-esc.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "s4-electrical-1",
    title: "Express S4 — electric system (sheet 1)",
    manualRef: "Express S4 High Output manual, Electrical System",
    src: "/wiring/s4-electrical-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "s4-electrical-2",
    title: "Express S4 — electric system (sheet 2)",
    manualRef: "Express S4 High Output manual, Electrical System",
    src: "/wiring/s4-electrical-2.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "s4-electrical-3",
    title: "Express S4 — electric system (sheet 3)",
    manualRef: "Express S4 High Output manual, Electrical System",
    src: "/wiring/s4-electrical-3.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "s4-electrical-4",
    title: "Express S4 — electric system (sheet 4)",
    manualRef: "Express S4 High Output manual, Electrical System",
    src: "/wiring/s4-electrical-4.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "s4-fig7",
    title: "Fig. 7 48 Volt Fault Codes",
    manualRef: "Express S4 High Output Service Manual 635085, Electronic Speed Control, Fig. 7 48 Volt Fault Codes, page 90",
    src: "/wiring/s4-fig7-48v-fault-codes.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "s4-fig8",
    title: "Fig. 8 J-1 Pin Connector Diagnostics",
    manualRef:
      "Express S4 High Output Service Manual 635085, Electronic Speed Control, Fig. 8 J-1 Pin Connector Diagnostics, page 91",
    src: "/wiring/s4-fig8-j1-pins.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "s4-fig9",
    title: "Fig. 9 J-1 Pin Connector Diagnostics (Continued)",
    manualRef:
      "Express S4 High Output Service Manual 635085, Electronic Speed Control, Fig. 9 J-1 Pin Connector Diagnostics (Continued), page 92",
    src: "/wiring/s4-fig9-j1-pins-cont.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "s4-fig10",
    title: "Fig. 10 J-2 Pin Connector Diagnostics",
    manualRef:
      "Express S4 High Output Service Manual 635085, Electronic Speed Control, Fig. 10 J-2 Pin Connector Diagnostics, page 93",
    src: "/wiring/s4-fig10-j2-pins.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "s4-fig11",
    title: "Fig. 11 Secondary Wiring Diagnostics",
    manualRef:
      "Express S4 High Output Service Manual 635085, Electronic Speed Control, Fig. 11 Secondary Wiring Diagnostics, page 94",
    src: "/wiring/s4-fig11-secondary-wiring.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "s4-fig15",
    title: "Fig. 15 Controller Wiring",
    manualRef: "Express S4 High Output Service Manual 635085, Electronic Speed Control, Fig. 15 Controller Wiring, page 99",
    src: "/wiring/s4-fig15-controller-wiring.jpg",
    kind: "full",
    landscape: false,
  },
];
