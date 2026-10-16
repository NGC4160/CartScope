import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
// Printed on ydre-dc-1.jpg: "YDRE DC MODELS WIRING DIAGRAM" / Figure 8-19 / page 8-15
  {
    id: "ydre-dc-1",
    title: "YDRE DC MODELS WIRING DIAGRAM, Figure 8-19",
    manualRef: "YDRA/E Service Manual, YDRE DC MODELS WIRING DIAGRAM, Figure 8-19, page 8-15",
    src: "/wiring/ydre-dc-1.jpg",
    kind: "full",
    landscape: false,
  },
// Printed on ydre-dc-2.jpg: "YDRE DC MODELS WIRING DIAGRAM" / "YDRE Cruise" / Figure 8-20 / page 8-16
// Fig. 8-20 is this Cruise cart sheet (page 8-16), not the MCU sheet (page 8-20 is Fig. 8-24).
  {
    id: "ydre-dc-2",
    title: "YDRE DC MODELS WIRING DIAGRAM — YDRE Cruise, Figure 8-20",
    manualRef: "YDRA/E Service Manual, YDRE DC MODELS WIRING DIAGRAM — YDRE Cruise, Figure 8-20, page 8-16",
    src: "/wiring/ydre-dc-2.jpg",
    kind: "harness",
    landscape: false,
  },
// Printed on ydre-dc-mcu.jpg: "MAIN CONTROLLER WIRING DIAGRAM – DC MODELS" / Figure 8-24 / page 8-20
  {
    id: "ydre-dc-mcu",
    title: "MAIN CONTROLLER WIRING DIAGRAM – DC MODELS, Figure 8-24",
    manualRef: "YDRA/E Service Manual, MAIN CONTROLLER WIRING DIAGRAM – DC MODELS, Figure 8-24, page 8-20",
    src: "/wiring/ydre-dc-mcu.jpg",
    kind: "control",
    landscape: false,
  },
// Factory Chapter 9 plates — Yamaha YDRA/YDRE service manual (Drive 2:2), factory scans only.
// public/wiring/ydre-dc-ch9-*.png. Kind/landscape match TXT PDS tree/fault sheets.
  {
    id: "ydre-dc-ch9-flowchart-z2",
    title: "YDRE DC MODELS ELECTRICAL TROUBLESHOOTING FLOWCHART (Z-2 Diagnostic Tester)",
    manualRef: "Figure 9-18, page 9-25",
    src: "/wiring/ydre-dc-ch9-fig9-18-electrical-flowchart-z2.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-traction-motor",
    title: "TRACTION MOTOR — Troubleshooting – YDRE (Battery Models)",
    manualRef: "Chapter 9, page 9-18 (YDRE section)",
    src: "/wiring/ydre-dc-ch9-9-18-traction-motor.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-mcu-reset-harness-dc",
    title: "RESETTING MOTOR CONTROL UNIT / MCU MAIN HARNESS CONNECTOR – DC MODELS",
    manualRef: "Figure 9-16, page 9-19",
    src: "/wiring/ydre-dc-ch9-9-19-mcu-reset-harness-dc.png",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-buzzer-rated-speed",
    title: "REVERSE WARNING BUZZER DOES NOT WORK / CAR WILL NOT RUN AT RATED SPEED",
    manualRef: "Chapter 9, page 9-21",
    src: "/wiring/ydre-dc-ch9-9-21-buzzer-rated-speed-trees.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-solenoid-no-click",
    title: "CAR WILL NOT OPERATE IN EITHER DIRECTION – SOLENOID DOES NOT OPERATE",
    manualRef: "Chapter 9, page 9-22",
    src: "/wiring/ydre-dc-ch9-9-22-solenoid-does-not-operate.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-solenoid-clicks",
    title: "CAR WILL NOT OPERATE IN EITHER DIRECTION – SOLENOID DOES OPERATE",
    manualRef: "Chapter 9, page 9-23",
    src: "/wiring/ydre-dc-ch9-9-23-solenoid-does-operate.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-no-regen-rollaway",
    title: "NO REGENERATIVE BRAKING OR ROLLAWAY PROTECTION",
    manualRef: "Chapter 9, page 9-24",
    src: "/wiring/ydre-dc-ch9-9-24-no-regen-rollaway.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-z2-failure-chart-a",
    title: "Z-2 TESTER FAILURE CHART – DC MODELS (sheet A)",
    manualRef: "Figure 9-24 + chart, page 9-28",
    src: "/wiring/ydre-dc-ch9-9-28-z2-tester-failure-chart-a.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-z2-failure-chart-b",
    title: "Z-2 TESTER FAILURE CHART – DC MODELS (sheet B)",
    manualRef: "Chapter 9, page 9-29",
    src: "/wiring/ydre-dc-ch9-9-29-z2-tester-failure-chart-b.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-genius-faults-9-38",
    title: "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps, page 9-38",
    manualRef:
      "YDRA/E Service Manual, TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps, page 9-38",
    src: "/wiring/ydre-dc-ch9-9-38-genius-faults.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-genius-faults-9-39",
    title: "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-39",
    manualRef:
      "YDRA/E Service Manual, TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-39",
    src: "/wiring/ydre-dc-ch9-9-39-genius-faults.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-genius-faults-9-40",
    title: "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-40",
    manualRef:
      "YDRA/E Service Manual, TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-40",
    src: "/wiring/ydre-dc-ch9-9-40-genius-faults.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-genius-faults-9-41",
    title: "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-41",
    manualRef:
      "YDRA/E Service Manual, TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-41",
    src: "/wiring/ydre-dc-ch9-9-41-genius-faults.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-genius-faults-9-42",
    title: "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-42",
    manualRef:
      "YDRA/E Service Manual, TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-42",
    src: "/wiring/ydre-dc-ch9-9-42-genius-faults.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-genius-faults-9-43",
    title: "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-43",
    manualRef:
      "YDRA/E Service Manual, TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-43",
    src: "/wiring/ydre-dc-ch9-9-43-genius-faults.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "ydre-dc-ch9-genius-faults-9-44",
    title: "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-44",
    manualRef:
      "YDRA/E Service Manual, TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.), page 9-44",
    src: "/wiring/ydre-dc-ch9-9-44-genius-faults.png",
    kind: "control",
    landscape: false,
  },
];
