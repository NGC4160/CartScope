import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Star EV Classic DC — 2008 factory booklet (reference for 2007 carts)
  {
    id: "star-classic-1243-fig1",
    title: "1243 Wiring Diagram (FIG.1)",
    manualRef:
      "Star / JH Global Operation Manual for Electric Golf Car (2008), section 10 Wiring Diagram, page 17 — 1243 Wiring Diagram, 36 V, FIG.1. 2008 booklet; reference for 2007 carts.",
    src: "/wiring/star-classic-1243-fig1-p17.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "star-classic-1266-fig2",
    title: "1266 Wiring Diagram (FIG.2)",
    manualRef:
      "Star / JH Global Operation Manual for Electric Golf Car (2008), section 10 Wiring Diagram, page 18 — 1266 Wiring Diagram, 48 V, FIG.2. 2008 booklet; reference for 2007 carts.",
    src: "/wiring/star-classic-1266-fig2-p18.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "star-classic-1268-fig3",
    title: "1268 Wiring Diagram (FIG.3)",
    manualRef:
      "Star / JH Global Operation Manual for Electric Golf Car (2008), section 10 Wiring Diagram, page 19 — 1268 Wiring Diagram, 48 V, FIG.3. 2008 booklet; reference for 2007 carts.",
    src: "/wiring/star-classic-1268-fig3-p19.jpg",
    kind: "full",
    landscape: true,
  },
// Curtis 1268-5403 remanufactured-controller install sheet (not a Star factory plate)
  {
    id: "curtis-1268-5403-preinstall",
    title: "Generic Golf (1268-5403) Install Sheet — pre-install checks (sheet 1 of 6)",
    manualRef:
      "FSIP / CloudElectric Generic Golf (1268-5403) Install Sheet-370, Rev 01, 05/25/18, sheet 1 of 6 — remanufactured-controller pre-install motor, solenoid, and harness checks (not a Star factory plate)",
    src: "/wiring/curtis-1268-5403-preinstall.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "curtis-1268-5403-wiring",
    title: "Generic Golf (1268-5403) Install Sheet — wiring figure (sheet 2 of 6)",
    manualRef:
      "FSIP / CloudElectric Generic Golf (1268-5403) Install Sheet-370, Rev 01, 05/25/18, sheet 2 of 6 — remanufactured-controller generic wiring figure (not a Star factory plate)",
    src: "/wiring/curtis-1268-5403-wiring.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "curtis-1268-5403-pincheck-3",
    title: "Generic Golf (1268-5403) Install Sheet — pin checks (sheet 3 of 6)",
    manualRef:
      "FSIP / CloudElectric Generic Golf (1268-5403) Install Sheet-370, Rev 01, 05/25/18, sheet 3 of 6 — remanufactured-controller back-probe pin voltages (not a Star factory plate)",
    src: "/wiring/curtis-1268-5403-pincheck-p3.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "curtis-1268-5403-pincheck-4",
    title: "Generic Golf (1268-5403) Install Sheet — pin checks, continued (sheet 4 of 6)",
    manualRef:
      "FSIP / CloudElectric Generic Golf (1268-5403) Install Sheet-370, Rev 01, 05/25/18, sheet 4 of 6 — remanufactured-controller back-probe pin voltages, continued (not a Star factory plate)",
    src: "/wiring/curtis-1268-5403-pincheck-p4.jpg",
    kind: "pinout",
    landscape: false,
  },
];
