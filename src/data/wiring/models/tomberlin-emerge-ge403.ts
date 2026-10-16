import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Tomberlin EMerge — Jesse binder Batch 1 (GE403 / Curtis 1268 / Sevcon Gen4)
  {
    id: "emerge-ge403-2008",
    title: "GE4003 controller wiring — E-MERGE (2008 GE403)",
    manualRef:
      "Tomberlin EMerge 2008 — Wiring GE403 Controller, GE4003 controller / 23-pin J1 / shunt motor / battery pack",
    src: "/wiring/emerge-ge403-2008.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "emerge-0709-lighting",
    title: "Lighting circuit",
    manualRef: "Tomberlin EMerge 2007–2009 Electrical, Lighting circuit, printed page 78",
    src: "/wiring/emerge-0709-lighting-circuit.jpg",
    kind: "accessory",
    landscape: false,
  },
];
