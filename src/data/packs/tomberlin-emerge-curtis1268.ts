import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const tomberlinEmergeCurtis1268 = buildEzgoDc({
  id: "tomberlin-emerge-curtis1268",
  manufacturer: "tomberlin",
  manufacturerLabel: "Tomberlin",
  name: "EMerge Curtis 1268",
  fullName: "Tomberlin EMerge Curtis 1268 (48 V)",
  years: "2009–2014 EMerge Curtis 1268 (2009–2014 Wiring Curtis 1268; 2010–2011 Electrical MERGE 9-7 / 9-8)",
  yearMin: 2009,
  yearMax: 2014,
  architecture: "48 V electric · Curtis 1268 sepex · Tow/Run · speed sensor",
  diagramTitle: "Power and control picture — Tomberlin EMerge Curtis 1268",
  diagramNotes: [
    "This pack is the mid-year EMerge Curtis 1268 sheet. Early GE403 (2007–2009) and later Sevcon Gen4 (2015+) are different packs.",
    "The 2009–2014 Curtis 1268 plate is the vehicle schematic. The 2010–2011 Electrical extract adds Control circuit (MERGE 9-7) and Lighting circuit (MERGE 9-8).",
    "2010–2011 troubleshooting points at the wiring diagram on page 9-7. Use the plates — do not assume TXT 16-pin numbers.",
  ],
  voltage: 48,
  controllerName: "Curtis 1268",
  controllerDesc:
    "Curtis 1268 sepex controller as drawn on the 2009–2014 EMerge wiring plate and the 2010–2011 Control circuit (MERGE 9-7). Confirm the cart in front of you before you open the pack.",
  throttleName: "Accelerator (Curtis 1268)",
  throttleDesc: "Accelerator on the 1268 plate. Compare the plate. Do not use TXT ITS windows as factory numbers for EMerge.",
  itsClick: { min: 0.2, max: 1.5, label: "first-motion — confirm on the 1268 plate" },
  itsFull: { min: 3.0, max: 5.0, label: "full pedal — confirm on the 1268 plate" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω typical Curtis coil (confirm on the cart)" },
  packRested: { min: 48, max: 54.5, label: "pack at rest — six 8 V (48 V)" },
  packLoad: { min: 42, max: 54.5, label: "pack under load — match the cart" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc: "Charger path as drawn on the 2009–2014 Curtis 1268 plate.",
  packCells: "Six 8 V batteries in a row (48 V total) unless the cart in front of you is different",
  manualPrefix: "Tomberlin EMerge 2009–2014 Wiring Curtis 1268 · 2010–2011 Electrical MERGE 9-7 / 9-8",
  family: "dcs",
  towName: "Tow/Run switch",
  towDesc:
    "EMerge Tow/Run is the work/drive switch. TOW before you disconnect the pack. Test in RUN.",
});
