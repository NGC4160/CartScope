import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "eric-main",
    title: "ERIC Excel — main wire map",
    manualRef: "2017 Precedent M&S, Figures 12-1 / 12-2 ERIC Excel",
    src: "/wiring/eric-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "eric-instrument",
    title: "ERIC Excel — dash wires",
    manualRef: "2017 Precedent M&S, Figure 12-3",
    src: "/wiring/eric-instrument.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "eric-batteries",
    title: "ERIC Excel — battery and charge wires",
    manualRef: "2017 Precedent M&S, Figure 12-4 WD_6x8V_Batteries_ERIC",
    src: "/wiring/eric-batteries.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "eric-lights",
    title: "ERIC Excel — light wire bundle",
    manualRef: "2017 Precedent M&S, Figures 12-5 / 12-6",
    src: "/wiring/eric-lights.jpg",
    kind: "accessory",
    landscape: true,
  },
// 2014 Precedent M&S 105062901 — ERIC (Section 28)
  {
    id: "prec14-eric-28-1",
    title: "Figure 28-1 / Figure 28-2 Wiring Diagram – Excel System with ERIC Charging",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 28-1 / Figure 28-2 Wiring Diagram – Excel System with ERIC Charging, pages 28-4 / 28-5",
    src: "/wiring/prec14-eric-fig28-1-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "prec14-eric-28-3",
    title: "Figure 28-3 Instrument Panel Wiring Diagram – Precedent with ERIC Charging",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 28-3 Instrument Panel Wiring Diagram – Precedent with ERIC Charging, page 28-6",
    src: "/wiring/prec14-eric-fig28-3-instrument.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec14-eric-28-4",
    title: "Figure 28-4 Battery Wiring Diagram – Precedent with ERIC Charging",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 28-4 Battery Wiring Diagram – Precedent with ERIC Charging, page 28-7",
    src: "/wiring/prec14-eric-fig28-4-batteries.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "prec14-eric-28-5",
    title: "Figure 28-5 / Figure 28-6 Precedent Electric Vehicle Accessory Wiring Diagram",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 28-5 / Figure 28-6 Precedent Electric Vehicle Accessory Wiring Diagram, pages 28-8 / 28-9",
    src: "/wiring/prec14-eric-fig28-5-accessory.jpg",
    kind: "accessory",
    landscape: true,
  },
  {
    id: "prec14-eric-28-7",
    title: "Figure 28-7 Sonic Weld and 10k Ohm Resistor Locations (Approximate)",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 28-7 Sonic Weld and 10k Ohm Resistor Locations (Approximate), page 28-10",
    src: "/wiring/prec14-eric-fig28-7-sonic.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "prec14-eric-tg1-p1",
    title: "Troubleshooting Guide 1, page 28-12",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Troubleshooting Guide 1, page 28-12 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec14-eric-tg1-p1.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec14-eric-tg1-p2",
    title: "Troubleshooting Guide 1, page 28-13",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Troubleshooting Guide 1, page 28-13 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec14-eric-tg1-p2.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec14-eric-tg2-p1",
    title: "Troubleshooting Guide 2, page 28-15",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Troubleshooting Guide 2, page 28-15 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec14-eric-tg2-p1.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec14-eric-tg2-p2",
    title: "Troubleshooting Guide 2, page 28-16",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Troubleshooting Guide 2, page 28-16 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec14-eric-tg2-p2.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec17-eric-fig12-1",
    title: "Figure 12-1 Wiring Diagram – Excel System with ERIC Charging",
    manualRef:
      "2017 Precedent Golf Car Maintenance and Service Manual, Figure 12-1 Wiring Diagram – Excel System with ERIC Charging, page 12-4 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec17-eric-fig12-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec17-eric-fig12-2",
    title: "Figure 12-2 Wiring Diagram – Excel System with ERIC Charging (Continued)",
    manualRef:
      "2017 Precedent Golf Car Maintenance and Service Manual, Figure 12-2 Wiring Diagram – Excel System with ERIC Charging (Continued), page 12-5 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec17-eric-fig12-2.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec17-eric-fig12-3",
    title: "Figure 12-3 Instrument Panel Wiring Diagram – Precedent with ERIC Charging",
    manualRef:
      "2017 Precedent Golf Car Maintenance and Service Manual, Figure 12-3 Instrument Panel Wiring Diagram – Precedent with ERIC Charging, page 12-6 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec17-eric-fig12-3.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec17-eric-fig12-4",
    title: "Figure 12-4 Battery Wiring Diagram – Precedent with ERIC Charging",
    manualRef:
      "2017 Precedent Golf Car Maintenance and Service Manual, Figure 12-4 Battery Wiring Diagram – Precedent with ERIC Charging, page 12-7 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec17-eric-fig12-4.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "prec15-eric-fig21-1",
    title: "Figure 21-1 Wiring Diagram – Excel System with ERIC Charging",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 21-1 Wiring Diagram – Excel System with ERIC Charging, page 21-4 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec15-eric-fig21-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec15-eric-fig21-2",
    title: "Figure 21-2 Wiring Diagram – Excel System with ERIC Charging (Continued)",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 21-2 Wiring Diagram – Excel System with ERIC Charging (Continued), page 21-5 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec15-eric-fig21-2.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec15-eric-fig21-3",
    title: "Figure 21-3 Instrument Panel Wiring Diagram – Precedent with ERIC Charging",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 21-3 Instrument Panel Wiring Diagram – Precedent with ERIC Charging, page 21-6 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec15-eric-fig21-3.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec15-eric-fig21-4",
    title: "Figure 21-4 Battery Wiring Diagram – Precedent with ERIC Charging",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 21-4 Battery Wiring Diagram – Precedent with ERIC Charging, page 21-7 — Excel System Troubleshooting: with ERIC Charging",
    src: "/wiring/prec15-eric-fig21-4.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "prec15-eric-fig24-6",
    title: "Figure 24-6 Charge Circuit – External High-Frequency Charger",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 24-6 Charge Circuit – External High-Frequency Charger, page 24-8 — Battery Charger: for ERIC Charging System",
    src: "/wiring/prec15-eric-fig24-6.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "prec15-eric-fig24-7",
    title: "Figure 24-7 Charge Circuit – Onboard High-Frequency Charger",
    manualRef:
      "2015 Precedent Golf Car Maintenance and Service Manual, Figure 24-7 Charge Circuit – Onboard High-Frequency Charger, page 24-9 — Battery Charger: for ERIC Charging System",
    src: "/wiring/prec15-eric-fig24-7.jpg",
    kind: "charge",
    landscape: false,
  },
// Jesse-binder Batch 8 — Precedent 2019 / Tempo ERIC + gasoline gap-fill
  {
    id: "prec19-batt-fig12-1",
    title: "Figure 12-1 Battery Wiring Diagram",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Figure 12-1 Battery Wiring Diagram, page 12-4 — Electric Vehicle Troubleshooting and Electrical System",
    src: "/wiring/prec19-batt-fig12-1.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "prec19-eric-main",
    title: "Electric: Main Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Electric: Main Harness",
    src: "/wiring/prec19-eric-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "prec19-eric-dash",
    title: "Electric: Instrument Panel Dash Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Electric: Instrument Panel Dash Harness",
    src: "/wiring/prec19-eric-dash.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "prec19-eric-dcdc",
    title: "Electric: DC to DC Converter Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Electric: DC to DC Converter Harness",
    src: "/wiring/prec19-eric-dcdc.jpg",
    kind: "harness",
    landscape: true,
  },
  {
    id: "prec19-eric-iplight",
    title: "Electric: Instrument Panel Light Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Electric: Instrument Panel Light Harness",
    src: "/wiring/prec19-eric-iplight.jpg",
    kind: "accessory",
    landscape: true,
  },
  {
    id: "prec19-eric-light",
    title: "Electric: Light Harness",
    manualRef:
      "2019 Precedent, Villager 2 and 4 Maintenance and Service Manual, Section 26 Wiring Diagrams — Electric: Light Harness",
    src: "/wiring/prec19-eric-light.jpg",
    kind: "accessory",
    landscape: true,
  },
];
