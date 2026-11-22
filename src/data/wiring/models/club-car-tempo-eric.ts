import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "tempo-battery",
    title: "Tempo electric — battery wire map",
    manualRef: "2021 Tempo M&S §12 Battery wire map",
    src: "/wiring/tempo-battery.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "tempo-e-main",
    title: "Tempo electric — 2-seat main wire bundle",
    manualRef: "2021 Tempo M&S §32 Electric: two passenger main wire bundle",
    src: "/wiring/tempo-e-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "tempo-e-4p",
    title: "Tempo electric — 4-seat main wire bundle",
    manualRef: "2021 Tempo M&S §32 Electric: four passenger main wire bundle",
    src: "/wiring/tempo-e-4p.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "tempo-e-dash",
    title: "Tempo electric — dash wire bundle",
    manualRef: "2021 Tempo M&S §32 Electric: dash wire bundle",
    src: "/wiring/tempo-e-dash.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "tempo-e-lights",
    title: "Tempo electric — light wire bundle",
    manualRef: "2021 Tempo M&S §32 Electric: lighting harness",
    src: "/wiring/tempo-e-lights.jpg",
    kind: "accessory",
    landscape: true,
  },
  {
    id: "prec19-e-main",
    title: "2019 Precedent electric — main wire bundle",
    manualRef: "Club Car Precedent M&S, §26 Electric: Main Harness",
    src: "/wiring/prec19-e-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "tempo21-batt-fig12-2",
    title: "Figure 12-2 Battery Wiring Diagram",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Figure 12-2 Battery Wiring Diagram, page 12-3 — Electric Vehicle Troubleshooting and Electrical System",
    src: "/wiring/tempo21-batt-fig12-2.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "tempo21-e-2p",
    title: "Electric: Two Passenger Main Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Electric: Two Passenger Main Harness",
    src: "/wiring/tempo21-e-2p.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "tempo21-e-4p",
    title: "Electric: Four Passenger Main Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Electric: Four Passenger Main Harness",
    src: "/wiring/tempo21-e-4p.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "tempo21-e-lighting",
    title: "Electric: Lighting Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Electric: Lighting Harness",
    src: "/wiring/tempo21-e-lighting.jpg",
    kind: "accessory",
    landscape: true,
  },
];
