import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "excel-main",
    title: "Excel System — main wire map",
    manualRef: "2008 Precedent IQ/Excel M&S, Figure 12-1 Excel wiring",
    src: "/wiring/excel-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "excel-accessories",
    title: "Excel System — lights and extras",
    manualRef: "2008 Precedent IQ/Excel M&S, Excel wire maps 12",
    src: "/wiring/excel-accessories.jpg",
    kind: "accessory",
    landscape: true,
  },
  {
    id: "excel-sonic",
    title: "Excel System — weld spots and one-way parts",
    manualRef: "2008 Precedent IQ/Excel M&S, Excel wire maps 12",
    src: "/wiring/excel-sonic.jpg",
    kind: "pinout",
    landscape: false,
  },
// 2014 Precedent M&S 105062901 — Excel / PowerDrive (Section 13)
  {
    id: "prec14-excel-13-1",
    title: "Figure 13-1 Precedent Electric Vehicle Instrument Panel Wiring Diagram",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 13-1 Precedent Electric Vehicle Instrument Panel Wiring Diagram, page 13-3 — Excel System Troubleshooting: with PowerDrive Charger",
    src: "/wiring/prec14-excel-fig13-1-instrument.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "prec14-excel-13-2",
    title: "Figure 13-2 / Figure 13-3 Precedent Electric Vehicle Accessory Wiring Diagram",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 13-2 / Figure 13-3 Precedent Electric Vehicle Accessory Wiring Diagram, pages 13-4 / 13-5 — Excel System Troubleshooting: with PowerDrive Charger",
    src: "/wiring/prec14-excel-fig13-2-accessory.jpg",
    kind: "accessory",
    landscape: true,
  },
  {
    id: "prec14-excel-13-4",
    title: "Figure 13-4 / Figure 13-5 Wiring Diagram – Excel System with MCOR3",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Figure 13-4 / Figure 13-5 Wiring Diagram – Excel System with MCOR3, pages 13-6 / 13-7 — Excel System Troubleshooting: with PowerDrive Charger",
    src: "/wiring/prec14-excel-fig13-4-mcor3.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "prec14-excel-tg1-p1",
    title: "Troubleshooting Guide 1, page 13-9",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Troubleshooting Guide 1, page 13-9 — Excel System Troubleshooting: with PowerDrive Charger",
    src: "/wiring/prec14-excel-tg1-p1.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec14-excel-tg1-p2",
    title: "Troubleshooting Guide 1, page 13-10",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Troubleshooting Guide 1, page 13-10 — Excel System Troubleshooting: with PowerDrive Charger",
    src: "/wiring/prec14-excel-tg1-p2.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec14-excel-tg2-p1",
    title: "Troubleshooting Guide 2, page 13-11",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Troubleshooting Guide 2, page 13-11 — Excel System Troubleshooting: with PowerDrive Charger",
    src: "/wiring/prec14-excel-tg2-p1.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec14-excel-tg2-p2",
    title: "Troubleshooting Guide 2, page 13-12",
    manualRef:
      "2014 Precedent Golf Car Maintenance and Service Manual 105062901, Troubleshooting Guide 2, page 13-12 — Excel System Troubleshooting: with PowerDrive Charger",
    src: "/wiring/prec14-excel-tg2-p2.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "prec08-excel-fig12-1",
    title: "Figure 12-1 Wiring Diagram – Excel System",
    manualRef:
      "2008 Electric Precedent Maintenance and Service Manual, Figure 12-1 Wiring Diagram – Excel System, page 12-2 — Excel System Troubleshooting",
    src: "/wiring/prec08-excel-fig12-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec08-excel-fig12-2",
    title: "Figure 12-2 Wiring Diagram – Excel System (Continued)",
    manualRef:
      "2008 Electric Precedent Maintenance and Service Manual, Figure 12-2 Wiring Diagram – Excel System (Continued), page 12-3 — Excel System Troubleshooting",
    src: "/wiring/prec08-excel-fig12-2.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec09-excel-tps-fig13-4",
    title: "Figure 13-4 Wiring Diagram – Excel System with TPS",
    manualRef:
      "2009-2011 Electric Precedent Maintenance and Service Manual, Figure 13-4 Wiring Diagram – Excel System with TPS, page 13-6 — Excel System Troubleshooting – TPS",
    src: "/wiring/prec09-excel-tps-fig13-4.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec09-excel-tps-fig13-5",
    title: "Figure 13-5 Wiring Diagram – Excel System with TPS (Continued)",
    manualRef:
      "2009-2011 Electric Precedent Maintenance and Service Manual, Figure 13-5 Wiring Diagram – Excel System with TPS (Continued), page 13-7 — Excel System Troubleshooting – TPS",
    src: "/wiring/prec09-excel-tps-fig13-5.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec09-excel-mcor-fig14-4",
    title: "Figure 14-4 Wiring Diagram – Excel System with MCOR",
    manualRef:
      "2009-2011 Electric Precedent Maintenance and Service Manual, Figure 14-4 Wiring Diagram – Excel System with MCOR, page 14-6 — Excel System Troubleshooting – MCOR",
    src: "/wiring/prec09-excel-mcor-fig14-4.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "prec09-excel-mcor-fig14-5",
    title: "Figure 14-5 Wiring Diagram – Excel System with MCOR (Continued)",
    manualRef:
      "2009-2011 Electric Precedent Maintenance and Service Manual, Figure 14-5 Wiring Diagram – Excel System with MCOR (Continued), page 14-7 — Excel System Troubleshooting – MCOR",
    src: "/wiring/prec09-excel-mcor-fig14-5.jpg",
    kind: "full",
    landscape: false,
  },
];
