import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const tomberlinEmergeGe403 = buildEzgoDc({
  id: "tomberlin-emerge-ge403",
  manufacturer: "tomberlin",
  manufacturerLabel: "Tomberlin",
  name: "EMerge GE403",
  fullName: "Tomberlin EMerge GE403 (48 V)",
  years: "2007–2009 EMerge GE403 / GE4003 (2007–2009 Electrical extract; 2008 Wiring GE403 Controller)",
  yearMin: 2007,
  yearMax: 2009,
  architecture: "48 V electric · GE4003 sepex · 23-pin J1 · Tow/Run · speed sensor",
  diagramTitle: "Power and control picture — Tomberlin EMerge GE403",
  diagramNotes: [
    "This pack is the early EMerge GE403 / GE4003 sheet. 2009–2014 carts with Curtis 1268 are a different pack.",
    "The 2008 GE403 plate is the vehicle schematic (controller, shunt motor, battery pack, fuse, reverse horn). The 2007–2009 Electrical extract adds the Lighting circuit plate.",
    "Troubleshooting in the 2007–2009 extract points at the wiring diagram on page 9-7. Use the plates — do not assume EZ-GO 16-pin numbers.",
  ],
  voltage: 48,
  controllerName: "GE4003 / GE403 controller",
  controllerDesc:
    "Tomberlin GE4003 sepex controller as drawn on the 2008 GE403 wiring plate (23-pin J1). Speed sensor, F1/F2 field, A1/A2 armature. Confirm the cart in front of you before you open the pack.",
  throttleName: "Accelerator (GE403)",
  throttleDesc: "Accelerator on the GE403 plate. Compare the plate. Do not use TXT ITS windows as factory numbers for EMerge.",
  itsClick: { min: 0.2, max: 1.5, label: "first-motion — confirm on the GE403 plate" },
  itsFull: { min: 3.0, max: 5.0, label: "full pedal — confirm on the GE403 plate" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω typical coil (confirm on the cart)" },
  packRested: { min: 48, max: 54.5, label: "pack at rest — six 8 V (48 V)" },
  packLoad: { min: 42, max: 54.5, label: "pack under load — match the cart" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc: "Charger path as drawn on the GE403 plate (receptacle / diode / fuse).",
  packCells: "Six 8 V batteries in a row (48 V total) unless the cart in front of you is different",
  manualPrefix: "Tomberlin EMerge 2007–2009 Electrical · 2008 Wiring GE403 Controller",
  family: "dcs",
  towName: "Tow/Run switch",
  towDesc:
    "EMerge Tow/Run is the work/drive switch. TOW before you disconnect the pack. The GE403 plate shows NEUTRAL / FORWARD / REVERSE on the direction switch.",
});
