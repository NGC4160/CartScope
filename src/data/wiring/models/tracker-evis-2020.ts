import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Tracker EViS 72 V 2020 — Jesse binder Batch 4 (10002660-C Electrical)
  {
    id: "evis-2020-fig1",
    title: "Fig. 1 Main Harness Routing",
    manualRef:
      "Tracker EViS 72-Volt Repair and Service Manual 10002660-C, Electrical, Fig. 1 Main Harness Routing, page 43",
    src: "/wiring/evis-2020-fig1-main-harness-routing.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "evis-2020-fig2",
    title: "Fig. 2 Main Harness Wiring Diagram",
    manualRef:
      "Tracker EViS 72-Volt Repair and Service Manual 10002660-C, Electrical, Fig. 2 Main Harness Wiring Diagram, page 44",
    src: "/wiring/evis-2020-fig2-main-harness.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "evis-2020-fig3",
    title: "Fig. 3 Electrical Schematic",
    manualRef:
      "Tracker EViS 72-Volt Repair and Service Manual 10002660-C, Electrical, Fig. 3 Electrical Schematic, page 45",
    src: "/wiring/evis-2020-fig3-electrical-schematic.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "evis-2020-fig4",
    title: "Fig. 4 Electrical Schematic (continued)",
    manualRef:
      "Tracker EViS 72-Volt Repair and Service Manual 10002660-C, Electrical, Fig. 4 Electrical Schematic (continued), page 46",
    src: "/wiring/evis-2020-fig4-electrical-schematic.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "evis-2020-fig19",
    title: "Fig. 19 Winch Contactor Connections",
    manualRef:
      "Tracker EViS 72-Volt Repair and Service Manual 10002660-C, Electrical, Fig. 19 Winch Contactor Connections, page 55",
    src: "/wiring/evis-2020-fig19-winch-contactor.jpg",
    kind: "accessory",
    landscape: false,
  },
  {
    id: "evis-2020-fig9",
    title: "Fig. 9 Front - Slave and Rear - Master",
    manualRef:
      "Tracker EViS 72-Volt Repair and Service Manual 10002660-C, Fault Testing, Fig. 9 Front - Slave and Rear - Master, page 117",
    src: "/wiring/evis-2020-fig9-front-rear-pins.jpg",
    kind: "pinout",
    landscape: false,
  },
];
