import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "ydre-ac-1",
    title: "YDRE AC — cart wire map",
    manualRef: "YDRA/E Service Manual, page 8-17",
    src: "/wiring/ydre-ac-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "ydre-ac-mcu-1",
    title: "YDRE AC — controller wires (sheet 1)",
    manualRef: "YDRA/E Service Manual, page 8-18",
    src: "/wiring/ydre-ac-mcu-1.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-ac-mcu-2",
    title: "YDRE AC — controller wires (sheet 2)",
    manualRef: "YDRA/E Service Manual, page 8-19",
    src: "/wiring/ydre-ac-mcu-2.jpg",
    kind: "pinout",
    landscape: false,
  },
];
