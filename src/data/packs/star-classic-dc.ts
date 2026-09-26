import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const starClassicDc = buildEzgoDc({
  id: "star-classic-dc",
  manufacturer: "star",
  manufacturerLabel: "Star EV",
  name: "Classic DC (Curtis 1243 / 1266 / 1268)",
  fullName: "Star EV Classic DC (Curtis 1243 / 1266 / 1268)",
  years:
    "2007–2008 Star EV Classic DC (2008 Operation Manual for Electric Golf Car, section 10 Wiring Diagram — Curtis 1243 36 V / 1266 48 V / 1268 48 V)",
  yearMin: 2007,
  yearMax: 2008,
  architecture: "Star Classic DC electric · Curtis 1243 36 V / 1266 48 V / 1268 48 V · Run/Tow",
  diagramTitle: "Power and control picture — Star EV Classic DC (Curtis 1243 / 1266 / 1268)",
  diagramNotes: [
    "2008 Star booklet diagrams, reference for 2007 carts; confirm the controller model on the cart.",
    "Factory plates from the Star / JH Global Operation Manual for Electric Golf Car (2008), section 10 Wiring Diagram: 1243 Wiring Diagram (36 V, FIG.1, page 17), 1266 Wiring Diagram (48 V, FIG.2, page 18), and 1268 Wiring Diagram (48 V, FIG.3, page 19).",
    "The Cartaholics community 2007 Curtis 1243 chassis sheet stays on the Sirius / Star chassis pack. This pack is the 2008 factory booklet.",
    "The Curtis 1268-5403 install sheets are a generic remanufactured-controller install sheet (FSIP / CloudElectric, Rev 01, 05/25/18) — pre-install motor / solenoid / harness checks, generic wiring figure, and back-probe pin voltages. They are not a Star factory plate. Tomberlin EMerge 1268 carts stay on the EMerge Curtis 1268 pack.",
  ],
  voltage: 48,
  controllerName: "Curtis 1243 / 1266 / 1268",
  controllerDesc:
    "Curtis 1243 (36 V, FIG.1), 1266 (48 V, FIG.2), or 1268 (48 V, FIG.3) as printed on the 2008 Star booklet. Confirm the model stamp on the controller before you open the pack. Do not assume EZ-GO J1 pin numbers.",
  throttleName: "Accelerator (Curtis 1243 / 1266 / 1268)",
  throttleDesc:
    "Accelerator on the 2008 booklet plate that matches the controller on the cart. Compare the plate. Do not use TXT ITS windows as factory numbers for Star Classic.",
  itsClick: { min: 0.2, max: 1.5, label: "first-motion — confirm on the booklet plate" },
  itsFull: { min: 3.0, max: 5.0, label: "full pedal — confirm on the booklet plate" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω typical Curtis coil (confirm on the cart)" },
  packRested: { min: 36, max: 54.5, label: "pack at rest — 36 V on 1243 or 48 V on 1266 / 1268" },
  packLoad: { min: 32, max: 54.5, label: "pack under load — match the controller voltage on the cart" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc:
    "Charger path as drawn on the matching 2008 booklet plate (1243 FIG.1 / 1266 FIG.2 / 1268 FIG.3).",
  packCells: "36 V (1243) or 48 V (1266 / 1268) as stamped on the controller — match the cart",
  manualPrefix:
    "Star EV 2008 Operation Manual section 10 Wiring Diagram · Curtis 1268-5403 reman install sheet",
  family: "dcs",
  towName: "Run/Tow switch",
  towDesc:
    "The 2008 booklet and the reman install sheet show a Run/Tow path. Confirm the cart in front of you before you open the pack.",
});
