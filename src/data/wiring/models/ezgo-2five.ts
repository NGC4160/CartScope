import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// EZ-GO Batch 5 — Jesse binder gap-fill (2Five / RXV / TXT 48 V / 2014 Fleet / S4 / DCS / 1989–1994)
  {
    id: "2five-fig20",
    title: "Fig. 20 Main Wiring Harness (AFTER 1 FEBRUARY 2012)",
    manualRef:
      "EZ-GO 2Five Repair and Service Manual, Electrical Components & Wiring, Fig. 20 Main Wiring Harness (AFTER 1 FEBRUARY 2012), page K-10",
    src: "/wiring/2five-fig20-main-harness.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "2five-fig21",
    title: "Fig. 21 Accessory Wiring Harness",
    manualRef:
      "EZ-GO 2Five Repair and Service Manual, Electrical Components & Wiring, Fig. 21 Accessory Wiring Harness, page K-11",
    src: "/wiring/2five-fig21-accessory-harness.jpg",
    kind: "accessory",
    landscape: false,
  },
];
