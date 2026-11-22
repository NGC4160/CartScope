import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Bad Boy Recoil iS 72 V — Jesse binder Batch 2
  {
    id: "bb-recoil-battery",
    title: "Battery Layout",
    manualRef:
      "Recoil iS 72 V Electrical Service Guide (9/11/2012), Battery Layout — six 12 V in series, B+ / B− 72 V, page 46",
    src: "/wiring/bb-recoil-battery-layout.jpg",
    kind: "power",
    landscape: false,
  },
  {
    id: "bb-recoil-electrical",
    title: "Electrical Information – Recoil",
    manualRef:
      "Recoil iS 72 V Electrical Service Guide (9/11/2012), Electrical Information – Recoil, FRONT-SLAVE / REAR-MASTER 35-pin, page 81",
    src: "/wiring/bb-recoil-electrical-info.jpg",
    kind: "pinout",
    landscape: false,
  },
];
