import { buildAcDrive } from "@/data/builders/ac-drive";

export const tomberlinEmergeSevcon = buildAcDrive({
  id: "tomberlin-emerge-sevcon",
  manufacturer: "tomberlin",
  manufacturerLabel: "Tomberlin",
  name: "EMerge Sevcon Gen4",
  fullName: "Tomberlin EMerge Sevcon Gen4 (48 V AC)",
  years: "2015–2023 EMerge Sevcon Gen4 (2015 / 2016–2019 / 2023 Wiring Sevcon and 12V; 2018 Electrical 9-7-1 SE / 9-7-2 SS/LE)",
  yearMin: 2015,
  yearMax: 2023,
  architecture: "48 V AC · Sevcon Gen4 · electric brake · 12 V accessory · Tow switch",
  diagramTitle: "Power and control picture — Tomberlin EMerge Sevcon Gen4",
  diagramNotes: [
    "This pack is the later EMerge Sevcon Gen4 AC sheet. GE403 (2007–2009) and Curtis 1268 (2009–2014) are different packs.",
    "2015 and 2016–2019 plates are the dedicated Sevcon + 12 V sheets. 2018 Electrical has SE Schematic (9-7-1) and SS/LE Schematic (9-7-2). 2023 is the later Sevcon + 12 V plate (page 75).",
    "The 2018 extract lists a 35-wire controller plug. Use the year plate that matches the cart — SE and SS/LE are not the same sheet.",
  ],
  controllerName: "Sevcon Gen4",
  controllerDesc:
    "Sevcon Gen4 AC inverter as drawn on the EMerge Sevcon + 12 V plates. Throttle Hi/Low, pedal switch, F/R select, electric brake, motor temperature, program/diagnose interface. Confirm the year plate on the cart.",
  motorName: "EMerge AC drive motor",
  brakeName: "Electric brake (as drawn on the Sevcon plate)",
  brakeOhms: { min: 20, max: 50, label: "Typically ~35 Ω on the 2018 E-brake check — confirm on the cart" },
  phaseOhms: { min: 0.2, max: 2.0, label: "phase-to-phase — confirm on the cart (equal)" },
  throttleUp: { min: 0.3, max: 1.0, label: "rest — confirm on the year plate" },
  throttleFull: { min: 3.5, max: 4.8, label: "full pedal — confirm on the year plate" },
  packRested: { min: 42, max: 54.5, label: "42–54.5 V" },
  packCells: "Six 8 V or eight 6 V (48 V) unless the cart in front of you is different",
  packMinV: 42,
  manualPrefix: "Tomberlin EMerge 2015–2023 Wiring Sevcon and 12V · 2018 Electrical 9-7",
  errorNotes:
    "EMerge Gen4: write the LED flash / handset code before you key-cycle. No-code path: pack ≥ 42 V → main contactor click → electric brake release → U/V/W → encoder. Use the year plate — SE and SS/LE are different 2018 sheets.",
});
