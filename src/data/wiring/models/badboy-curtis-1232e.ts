import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Bad Boy — Curtis 1232E/SE genuine wiring / connector pages
  {
    id: "bb-curtis-fig3",
    title: "Figure 3: Basic Wiring Diagram",
    manualRef:
      "Curtis 1232E/34E/36E/38E & 1232SE/34SE/36SE/38SE Manual, os 31 – May 2017, Figure 3 Basic Wiring Diagram, page 12 — Installation and Wiring",
    src: "/wiring/bb-curtis-fig3-basic-wiring.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "bb-curtis-35pin",
    title: "LOW POWER 35-PIN CONNECTIONS",
    manualRef:
      "Curtis 1232E/SE Manual, os 31 – May 2017, LOW POWER 35-PIN CONNECTIONS, page 9 — AMPSEAL 776164-1",
    src: "/wiring/bb-curtis-35pin-ampseal.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "bb-curtis-table2-p1",
    title: "Table 2 Low Power Connections",
    manualRef: "Curtis 1232E/SE Manual, os 31 – May 2017, Table 2 Low Power Connections, page 10",
    src: "/wiring/bb-curtis-table2-low-power-p1.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "bb-curtis-table2-p2",
    title: "Table 2 Low Power Connections, cont'd",
    manualRef: "Curtis 1232E/SE Manual, os 31 – May 2017, Table 2 Low Power Connections, cont'd, page 11",
    src: "/wiring/bb-curtis-table2-low-power-p2.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "bb-curtis-fig4",
    title: "Figure 4: Wiring for Type 1 Throttles",
    manualRef: "Curtis 1232E/SE Manual, os 31 – May 2017, Figure 4 Wiring for Type 1 Throttles, page 20",
    src: "/wiring/bb-curtis-fig4-type1-throttle.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "bb-curtis-fig5",
    title: "Figure 5: Wiring for Type 2 Throttles",
    manualRef: "Curtis 1232E/SE Manual, os 31 – May 2017, Figure 5 Wiring for Type 2 Throttles, page 22",
    src: "/wiring/bb-curtis-fig5-type2-throttle.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "bb-curtis-fig6",
    title: "Figure 6: Wiring for Type 3 Throttles",
    manualRef: "Curtis 1232E/SE Manual, os 31 – May 2017, Figure 6 Wiring for Type 3 Throttles, page 23",
    src: "/wiring/bb-curtis-fig6-type3-throttle.jpg",
    kind: "harness",
    landscape: false,
  },
];
