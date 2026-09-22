import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const gemEseries2013 = buildEzgoDc({
  id: "gem-eseries-2013",
  manufacturer: "gem",
  manufacturerLabel: "GEM",
  name: "2013 e-Series",
  fullName: "GEM 2013 e-Series e2 / e4 / e6 / eS / eL / eL XD",
  years: "2013 GEM e-Series e2 / e4 / e6 / eS / eL / eL XD (Service Manual 9924112, Chapter 5 Electrical)",
  yearMin: 2013,
  yearMax: 2013,
  architecture: "72 V DC · motor controller 23-pin · PSDM · master disconnect · 6×12 V or 9×8 V (e6 / eL XD)",
  diagramTitle: "Power and control picture — GEM 2013 e-Series",
  diagramNotes: [
    "Factory plates from 2013 GEM Service Manual 9924112 Chapter 5: Electrical System block diagram, Drive and Power System Troubleshooting Diagrams A / B / C, battery layouts, PSDM connections, and the Wiring Diagrams extract (power distribution through harness pin locations).",
    "Standard pack is six 12 V batteries (e2 / e4 / eS / eL). e6 and eL XD may use nine 8 V batteries — use the e6 / eL XD continued charging, fast-charge, and main-contactor plates.",
    "Master disconnect is on the lower dash at the fuse panel. 23-pin motor controller. Digital Wrench® software pages were not added (not wiring plates).",
  ],
  voltage: 72,
  controllerName: "GEM motor controller (23-pin)",
  controllerDesc:
    "2013 GEM e-Series DC motor controller as drawn on MOTOR CONTROLLER SYSTEM and the controller harness (23-pin). Troubleshooting Diagrams A / B / C show P1–P23, F1/F2 field, A1/A2 armature. Confirm 72 V at pins 1 and 2. LCD error codes are the first path.",
  throttleName: "Accelerator pedal (10-pin)",
  throttleDesc:
    "Accelerator pedal on the controller harness (10-pin). Troubleshooting Diagram A shows ACC POT. Confirm on the cart — do not use TXT ITS windows as factory GEM numbers.",
  itsClick: { min: 0.2, max: 1.5, label: "first-motion — confirm on Troubleshooting Diagram A / the cart" },
  itsFull: { min: 3.5, max: 5.0, label: "5 V pedal supply on MOTOR CONTROLLER SYSTEM — confirm on the cart" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω typical main contactor coil (confirm on the MAIN CONTACTOR plate)" },
  packRested: { min: 70, max: 78, label: "70–78 V rested (six 12 V or nine 8 V = 72 V)" },
  packLoad: { min: 60, max: 78, label: "≥ 60 V under load" },
  computerName: "Onboard charger / DC-DC converter",
  computerKind: "charger",
  computerDesc:
    "Integrated charger and DC/DC converter as drawn on CHARGING SYSTEM and DC/DC CONVERTER - INTEGRATED CHARGER. Charger interlock disables drive when AC is connected. Fast-charge plates are the LSV accessory path.",
  packCells: "Six 12 V (e2 / e4 / eS / eL) or nine 8 V (e6 / eL XD option) — 72 V total. See the battery layout plate.",
  manualPrefix: "2013 GEM Service Manual 9924112 — Chapter 5 Electrical",
  family: "dcs",
  towName: "Master disconnect switch",
  towDesc:
    "Master disconnect is on the lower dash at the fuse-panel access. OFF before you take battery cables off. Key switch plus master disconnect must both be ON to drive.",
});
