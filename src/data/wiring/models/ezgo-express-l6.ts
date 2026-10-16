import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Express L6 / S6 — SM 625621 Section F ESC + Section L electrical. Shared by both picker packs.
  {
    id: "l6s6-fig8-fig9",
    title: "Fig. 8 48 volt Fault Codes / Fig. 9 Controller Connectors and Connections",
    manualRef:
      "Express L6/S6 Electric Service Manual 625621, Fig. 8 48 volt Fault Codes / Fig. 9 Controller Connectors and Connections, page F-8 — Electronic Speed Control",
    src: "/wiring/express-l6s6-fig8-fault-codes-fig9-connectors.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "l6s6-fig10",
    title: "Fig. 10 48 Volt Wiring Diagram",
    manualRef:
      "Express L6/S6 Electric Service Manual 625621, Fig. 10 48 Volt Wiring Diagram, page F-9 — Electronic Speed Control",
    src: "/wiring/express-l6s6-fig10-48v-wiring.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "l6s6-fig11",
    title: "Fig. 11 J-1 Pin Connector Diagnostics",
    manualRef:
      "Express L6/S6 Electric Service Manual 625621, Fig. 11 J-1 Pin Connector Diagnostics, page F-10 — Electronic Speed Control",
    src: "/wiring/express-l6s6-fig11-j1-diagnostics.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "l6s6-fig12",
    title: "Fig. 12 J-1 Pin Connector Diagnostics (Continued)",
    manualRef:
      "Express L6/S6 Electric Service Manual 625621, Fig. 12 J-1 Pin Connector Diagnostics (Continued), page F-11 — Electronic Speed Control",
    src: "/wiring/express-l6s6-fig12-j1-diagnostics-cont.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "l6s6-fig13",
    title: "Fig. 13 J-2 Pin Connector Diagnostics",
    manualRef:
      "Express L6/S6 Electric Service Manual 625621, Fig. 13 J-2 Pin Connector Diagnostics, page F-12 — Electronic Speed Control",
    src: "/wiring/express-l6s6-fig13-j2-diagnostics.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "l6s6-fig14",
    title: "Fig. 14 Secondary Wiring Diagnostics",
    manualRef:
      "Express L6/S6 Electric Service Manual 625621, Fig. 14 Secondary Wiring Diagnostics, page F-13 — Electronic Speed Control",
    src: "/wiring/express-l6s6-fig14-secondary-wiring.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "l6s6-l-fig2",
    title: "Fig. 2 Wiring Diagram",
    manualRef: "Express L6/S6 Electric Service Manual 625621, Fig. 2 Wiring Diagram, page L-2 — Electrical System",
    src: "/wiring/express-l6s6-l-fig2-wiring.jpg",
    kind: "accessory",
    landscape: false,
  },
  {
    id: "l6s6-l-fig5",
    title: "Fig. 5 Ignition Switch & Fuse Block",
    manualRef:
      "Express L6/S6 Electric Service Manual 625621, Fig. 5 Ignition Switch & Fuse Block, page L-5 — Electrical System",
    src: "/wiring/express-l6s6-l-fig5-ignition-fuse.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "l6s6-l-fig6-7",
    title: "Fig. 6 Horn / Fig. 7 Turn Signal & Hour Meter",
    manualRef:
      "Express L6/S6 Electric Service Manual 625621, Fig. 6 Horn / Fig. 7 Turn Signal & Hour Meter, page L-6 — Electrical System",
    src: "/wiring/express-l6s6-l-fig6-horn-fig7-turn-hour.jpg",
    kind: "accessory",
    landscape: false,
  },
];
