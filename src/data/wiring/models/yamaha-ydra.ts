import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "ydra-carb",
    title: "YDRA — wire map, carb models",
    manualRef: "YDRA/E Service Manual, page 8-5",
    src: "/wiring/ydra-carb.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "ydra-efi",
    title: "YDRA — wire map, fuel injection models (sheet 1)",
    manualRef: "YDRA/E Service Manual, page 8-6",
    src: "/wiring/ydra-efi.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "ydra-efi-2",
    title: "YDRA — wire map, fuel injection models (sheet 2)",
    manualRef: "YDRA/E Service Manual, page 8-7",
    src: "/wiring/ydra-efi-2.jpg",
    kind: "harness",
    landscape: false,
  },
];
