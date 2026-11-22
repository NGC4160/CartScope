import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "tempo-ex40-main",
    title: "Subaru EX40 — main wire bundle",
    manualRef: "2021 Tempo M&S §32 Subaru EX-40 main wire bundle",
    src: "/wiring/tempo-ex40-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "tempo-ex40-dash",
    title: "Subaru EX40 — dash wire bundle",
    manualRef: "2021 Tempo M&S §32 Subaru EX-40 dash harness",
    src: "/wiring/tempo-ex40-dash.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "tempo-ex40-engine",
    title: "Subaru EX40 — engine wire bundle",
    manualRef: "2021 Tempo M&S §32 Subaru EX-40 engine wire bundle",
    src: "/wiring/tempo-ex40-engine.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "ex40-main",
    title: "Subaru EX40 — electric wire map",
    manualRef: "2017 Precedent M&S, Figures 18-1 / 18-2 EX40",
    src: "/wiring/ex40-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "ex40-alt",
    title: "Subaru EX40 — wire map (alt sheet)",
    manualRef: "2017 Precedent M&S, Figure 18-3",
    src: "/wiring/ex40-alt.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec19-g-main",
    title: "2019 Precedent gasoline — main wire bundle",
    manualRef: "Club Car Precedent M&S, §26 Gasoline: Main Harness",
    src: "/wiring/prec19-g-main.jpg",
    kind: "full",
    landscape: true,
  },
// 2014 Precedent M&S 105062901 — gasoline (Section 19)
  {
    id: "prec14-gas-19-1",
    title: "Figure 19-1 / Figure 19-2 Wiring Diagram – Precedent Gasoline Vehicle with TPS",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 19-1 / Figure 19-2 Wiring Diagram – Precedent Gasoline Vehicle with TPS, pages 19-7 / 19-8",
    src: "/wiring/prec14-gas-fig19-1-tps.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "prec14-gas-19-3",
    title: "Figure 19-3 / Figure 19-4 Precedent Gasoline Vehicle Accessory Wiring Diagram (Optional)",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 19-3 / Figure 19-4 Precedent Gasoline Vehicle Accessory Wiring Diagram (Optional), pages 19-9 / 19-10",
    src: "/wiring/prec14-gas-fig19-3-accessory.jpg",
    kind: "accessory",
    landscape: true,
  },
  {
    id: "prec14-gas-19-5",
    title: "Figure 19-5 Precedent Gasoline Vehicle Instrument Panel Wiring Diagram",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 19-5 Precedent Gasoline Vehicle Instrument Panel Wiring Diagram, page 19-11",
    src: "/wiring/prec14-gas-fig19-5-instrument.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec17-gas-fig18-1",
    title: "Figure 18-1 Wiring Diagram for Precedent EFI Gasoline Vehicle",
    manualRef:
      "2017 Precedent Golf Car Maintenance and Service Manual, Figure 18-1 Wiring Diagram for Precedent EFI Gasoline Vehicle, page 18-8 — Troubleshooting and Electrical System – Subaru EX40",
    src: "/wiring/prec17-gas-fig18-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec17-gas-fig18-2",
    title: "Figure 18-2 Wiring Diagram for Precedent EFI Gasoline Vehicle – Continued",
    manualRef:
      "2017 Precedent Golf Car Maintenance and Service Manual, Figure 18-2 Wiring Diagram for Precedent EFI Gasoline Vehicle – Continued, page 18-9 — Troubleshooting and Electrical System – Subaru EX40",
    src: "/wiring/prec17-gas-fig18-2.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec17-gas-fig18-3",
    title: "Figure 18-3 Wiring Diagram – Instrument Panel",
    manualRef:
      "2017 Precedent Golf Car Maintenance and Service Manual, Figure 18-3 Wiring Diagram – Instrument Panel, page 18-10 — Troubleshooting and Electrical System – Subaru EX40",
    src: "/wiring/prec17-gas-fig18-3.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec17-gas-fig18-4",
    title: "Figure 18-4 Wiring Diagram – EFI and Engine",
    manualRef:
      "2017 Precedent Golf Car Maintenance and Service Manual, Figure 18-4 Wiring Diagram – EFI and Engine, page 18-11 — Troubleshooting and Electrical System – Subaru EX40",
    src: "/wiring/prec17-gas-fig18-4.jpg",
    kind: "control",
    landscape: false,
  },
// Jesse-binder Batch 7 — Precedent 2015 / Carryall 295 AWD / RXV gasoline gap-fill
  {
    id: "prec15-gas-fig13-1",
    title: "Figure 13-1 Wiring Diagram – Precedent Gasoline Vehicle with TPS",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 13-1 Wiring Diagram – Precedent Gasoline Vehicle with TPS, page 13-7 — Troubleshooting and Electrical System – Kaw. FE350",
    src: "/wiring/prec15-gas-fig13-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec15-gas-fig13-2",
    title: "Figure 13-2 Wiring Diagram – Precedent Gasoline Vehicle with TPS",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 13-2 Wiring Diagram – Precedent Gasoline Vehicle with TPS, page 13-8 — Troubleshooting and Electrical System – Kaw. FE350",
    src: "/wiring/prec15-gas-fig13-2.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec15-gas-fig13-3",
    title: "Figure 13-3 Precedent Gasoline Vehicle Accessory Wiring Diagram (Optional)",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 13-3 Precedent Gasoline Vehicle Accessory Wiring Diagram (Optional), page 13-9 — Troubleshooting and Electrical System – Kaw. FE350",
    src: "/wiring/prec15-gas-fig13-3.jpg",
    kind: "accessory",
    landscape: false,
  },
  {
    id: "prec15-gas-fig13-4",
    title: "Figure 13-4 Precedent Gasoline Vehicle Accessory Wiring Diagram (Optional)",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 13-4 Precedent Gasoline Vehicle Accessory Wiring Diagram (Optional), page 13-10 — Troubleshooting and Electrical System – Kaw. FE350",
    src: "/wiring/prec15-gas-fig13-4.jpg",
    kind: "accessory",
    landscape: false,
  },
  {
    id: "prec15-gas-fig13-5",
    title: "Figure 13-5 Precedent Gasoline Vehicle Instrument Panel Wiring Diagram",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 13-5 Precedent Gasoline Vehicle Instrument Panel Wiring Diagram, page 13-11 — Troubleshooting and Electrical System – Kaw. FE350",
    src: "/wiring/prec15-gas-fig13-5.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec15-gas-fig27-1",
    title: "Figure 27-1 Wiring Diagram for Precedent EFI Gasoline Vehicle",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 27-1 Wiring Diagram for Precedent EFI Gasoline Vehicle, page 27-8 — Troubleshooting and Electrical System – Subaru EX40",
    src: "/wiring/prec15-gas-fig27-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec15-gas-fig27-2",
    title: "Figure 27-2 Wiring Diagram for Precedent EFI Gasoline Vehicle – Continued",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 27-2 Wiring Diagram for Precedent EFI Gasoline Vehicle – Continued, page 27-9 — Troubleshooting and Electrical System – Subaru EX40",
    src: "/wiring/prec15-gas-fig27-2.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec15-gas-fig27-3",
    title: "Figure 27-3 Wiring Diagram – Instrument Panel",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 27-3 Wiring Diagram – Instrument Panel, page 27-10 — Troubleshooting and Electrical System – Subaru EX40",
    src: "/wiring/prec15-gas-fig27-3.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec15-gas-fig27-4",
    title: "Figure 27-4 Wiring Diagram – EFI and Engine",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 27-4 Wiring Diagram – EFI and Engine, page 27-11 — Troubleshooting and Electrical System – Subaru EX40",
    src: "/wiring/prec15-gas-fig27-4.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec19-gas-eng",
    title: "Gasoline: Engine Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Gasoline: Engine Harness",
    src: "/wiring/prec19-gas-eng.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "prec19-gas-main",
    title: "Gasoline: Main Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Gasoline: Main Harness",
    src: "/wiring/prec19-gas-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "prec19-gas-ip",
    title: "Gasoline: Instrument Panel Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Gasoline: Instrument Panel Harness",
    src: "/wiring/prec19-gas-ip.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "prec19-gas-iplight",
    title: "Gasoline: Instrument Panel Light Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Gasoline: Instrument Panel Light Harness",
    src: "/wiring/prec19-gas-iplight.jpg",
    kind: "accessory",
    landscape: true,
  },
  {
    id: "tempo21-ex40-main",
    title: "Subaru EX-40: Main Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Subaru EX-40: Main Harness",
    src: "/wiring/tempo21-ex40-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "tempo21-ex40-dash",
    title: "Subaru EX-40: Instrument Panel Dash Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Subaru EX-40: Instrument Panel Dash Harness",
    src: "/wiring/tempo21-ex40-dash.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "tempo21-ex40-eng",
    title: "Subaru EX-40: Engine Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Subaru EX-40: Engine Harness",
    src: "/wiring/tempo21-ex40-eng.jpg",
    kind: "harness",
    landscape: true,
  },
];
