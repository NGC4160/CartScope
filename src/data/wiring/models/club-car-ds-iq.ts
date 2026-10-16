import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "iq-main",
    title: "Figure 11-1 / Figure 11-2 Precedent Electric Vehicle Wiring Diagram",
    manualRef:
      "2006–2007 Precedent IQ System Electric Golf Car Maintenance and Service Manual, Figure 11-1 / Figure 11-2 Precedent Electric Vehicle Wiring Diagram, pages 11-2 / 11-3",
    src: "/wiring/iq-main.jpg",
    kind: "full",
    landscape: true,
  },
// Factory Troubleshooting Guide 1 / Guide 2 — 2006–2007 Precedent IQ System
// Electric Golf Car Maintenance and Service Manual, Drive 1JWBHviLLBD9tvbyZ6LgOiigZg3GpKjGb.
// Titles and manualRef use printed guide name + page. club-car-ds-iq + club-car-precedent-iq only.
  {
    id: "iq-tg1-p1",
    title: "Troubleshooting Guide 1, page 11-8",
    manualRef:
      "2006–2007 Precedent IQ System Electric Golf Car Maintenance and Service Manual, Troubleshooting Guide 1, page 11-8",
    src: "/wiring/iq-tg1-guide1-p1.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "iq-tg1-p2",
    title: "Troubleshooting Guide 1, page 11-9",
    manualRef:
      "2006–2007 Precedent IQ System Electric Golf Car Maintenance and Service Manual, Troubleshooting Guide 1, page 11-9",
    src: "/wiring/iq-tg1-guide1-p2.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "iq-tg1-p3",
    title: "Troubleshooting Guide 1, page 11-10",
    manualRef:
      "2006–2007 Precedent IQ System Electric Golf Car Maintenance and Service Manual, Troubleshooting Guide 1, page 11-10",
    src: "/wiring/iq-tg1-guide1-p3.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "iq-tg2-p1",
    title: "Troubleshooting Guide 2, page 11-11",
    manualRef:
      "2006–2007 Precedent IQ System Electric Golf Car Maintenance and Service Manual, Troubleshooting Guide 2, page 11-11",
    src: "/wiring/iq-tg2-guide2-p1.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "iq-tg2-p2",
    title: "Troubleshooting Guide 2, page 11-12",
    manualRef:
      "2006–2007 Precedent IQ System Electric Golf Car Maintenance and Service Manual, Troubleshooting Guide 2, page 11-12",
    src: "/wiring/iq-tg2-guide2-p2.png",
    kind: "control",
    landscape: false,
  },
// Jesse-binder Batch 6 — Club Car DS 2003 / Precedent 2008–2011 / 2017 + EZ-GO gas gap-fill
  {
    id: "ds2003-fig11-1",
    title: "Figure 11-1 Onboard Computer Circuit",
    manualRef:
      "2003 IQ System Electric Vehicle Maintenance and Service Supplement, Figure 11-1 Onboard Computer Circuit, page 11-3 — Electrical System and Testing",
    src: "/wiring/ds2003-fig11-1-obc.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "ds2003-fig11-2",
    title: "Figure 11-2 Solid State Speed Control Circuit",
    manualRef:
      "2003 IQ System Electric Vehicle Maintenance and Service Supplement, Figure 11-2 Solid State Speed Control Circuit, page 11-5 — Electrical System and Testing",
    src: "/wiring/ds2003-fig11-2-speed.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "ds2003-fig11-3",
    title: "Figure 11-3 Tow/Run Switch Circuit",
    manualRef:
      "2003 IQ System Electric Vehicle Maintenance and Service Supplement, Figure 11-3 Tow/Run Switch Circuit, page 11-7 — Electrical System and Testing",
    src: "/wiring/ds2003-fig11-3-towrun.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "ds2003-fig11-4",
    title: "Figure 11-4 Power Circuit",
    manualRef:
      "2003 IQ System Electric Vehicle Maintenance and Service Supplement, Figure 11-4 Power Circuit, page 11-8 — Electrical System and Testing",
    src: "/wiring/ds2003-fig11-4-power.jpg",
    kind: "power",
    landscape: false,
  },
  {
    id: "ds2003-fig11-5",
    title: "Figure 11-5 Charge Circuit",
    manualRef:
      "2003 IQ System Electric Vehicle Maintenance and Service Supplement, Figure 11-5 Charge Circuit, page 11-9 — Electrical System and Testing",
    src: "/wiring/ds2003-fig11-5-charge.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "ds2003-fig11-6",
    title: "Figure 11-6 Wiring Diagram",
    manualRef:
      "2003 IQ System Electric Vehicle Maintenance and Service Supplement, Figure 11-6 Wiring Diagram, page 11-10 — Electrical System and Testing",
    src: "/wiring/ds2003-fig11-6-wiring.jpg",
    kind: "full",
    landscape: false,
  },
];
