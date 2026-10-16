import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "tempo-kohler-engine",
    title: "Tempo gasoline — Kohler ECH440 engine wire bundle",
    manualRef: "2021 Tempo M&S §32 Kohler ECH440 engine wire bundle",
    src: "/wiring/tempo-kohler-engine.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "tempo-kohler-main",
    title: "Tempo gasoline — Kohler ECH440 main wire bundle",
    manualRef: "2021 Tempo M&S §32 Kohler ECH440 main wire bundle",
    src: "/wiring/tempo-kohler-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "tempo-kohler-dash",
    title: "Tempo gasoline — Kohler ECH440 dash wire bundle",
    manualRef: "2021 Tempo M&S §32 Kohler ECH440 instrument panel",
    src: "/wiring/tempo-kohler-dash.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "tempo21-kohler-eng",
    title: "Kohler ECH440: Engine Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Kohler ECH440: Engine Harness",
    src: "/wiring/tempo21-kohler-eng.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "tempo21-kohler-main",
    title: "Kohler ECH440: Main Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Kohler ECH440: Main Harness",
    src: "/wiring/tempo21-kohler-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "tempo21-kohler-ip",
    title: "Kohler ECH440: Instrument Panel Harness",
    manualRef:
      "Tempo, Tempo Connect, and Tempo 2+2 Maintenance and Service Manual, Section 32 Wiring Diagrams — Kohler ECH440: Instrument Panel Harness",
    src: "/wiring/tempo21-kohler-ip.jpg",
    kind: "harness",
    landscape: true,
  },
];
