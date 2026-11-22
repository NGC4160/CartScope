import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "marathon-direction",
    title: "Marathon 4-cycle — direction and tiny switch (I-34)",
    manualRef: "EZ-GO Marathon 4-cycle 1991–96, Electrical System I-34",
    src: "/wiring/marathon-direction.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "marathon-solenoid",
    title: "Marathon 4-cycle — solenoid and resistor wires (I-39)",
    manualRef: "EZ-GO Marathon 4-cycle 1991–96, Electrical System I-39",
    src: "/wiring/marathon-solenoid.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "marathon-solenoid-2",
    title: "Marathon 4-cycle — solenoid wires (I-44)",
    manualRef: "EZ-GO Marathon 4-cycle 1991–96, Electrical System I-44",
    src: "/wiring/marathon-solenoid-2.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "marathon-horn-e",
    title: "Marathon — horn and extra wires, electric (N-3)",
    manualRef: "EZ-GO Marathon 4-cycle 1991–96, Section N page N-3",
    src: "/wiring/marathon-horn-e.jpg",
    kind: "accessory",
    landscape: false,
  },
  {
    id: "marathon-horn-g",
    title: "Marathon — horn and extra wires, gas (N-4)",
    manualRef: "EZ-GO Marathon 4-cycle 1991–96, Section N page N-4",
    src: "/wiring/marathon-horn-g.jpg",
    kind: "accessory",
    landscape: false,
  },
  {
    id: "marathon-fig-l1",
    title: "FIG. L-1 ELECTRICAL SYSTEM WIRING DIAGRAM",
    manualRef:
      "EZ-GO Marathon 4-cycle Operation and Service Manual 27206-G01 (1991–1996), FIG. L-1 ELECTRICAL SYSTEM WIRING DIAGRAM, page L-2 — Electrical",
    src: "/wiring/marathon-fig-l1-electrical.jpg",
    kind: "full",
    landscape: false,
  },
];
