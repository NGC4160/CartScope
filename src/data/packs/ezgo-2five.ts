import { buildAcDrive } from "@/data/builders/ac-drive";

export const ezgo2five = buildAcDrive({
  id: "ezgo-2five",
  manufacturer: "ezgo",
  manufacturerLabel: "EZ-GO",
  name: "2Five",
  fullName: "EZ-GO 2Five AC LSV (72 V)",
  years: "2010–2016 EZ-GO 2Five (Repair and Service Manual, Section K — after 1 February 2012 harness)",
  yearMin: 2010,
  yearMax: 2016,
  architecture: "72 V AC LSV · six 12 V batteries · Run/Tow · after-1-Feb-2012 main harness",
  diagramTitle: "Power and control picture — EZ-GO 2Five",
  diagramNotes: [
    "Factory plates from the 2Five Electrical Components & Wiring extract: Fig. 20 Main Wiring Harness (AFTER 1 FEBRUARY 2012) and Fig. 21 Accessory Wiring Harness.",
    "Street-legal AC LSV. Six 12 V batteries in series (72 V). Confirm the cart in front of you — this pack is the after-1-February-2012 harness, not TXT TCT or RXV Fleet 48 V.",
    "Fig. 22 accessory routing / replace procedure was not added (not a wiring plate).",
  ],
  controllerName: "2Five AC controller",
  controllerDesc:
    "2Five three-phase AC inverter as drawn on Fig. 20 Main Wiring Harness (AFTER 1 FEBRUARY 2012). Throttle sensor, brake sensor, motor/temp sensors, solenoid coil, and the large controller plug. Confirm pin colors on that plate before you probe.",
  motorName: "2Five AC drive motor",
  brakeName: "Park brake / brake sensor (2Five)",
  brakeOhms: { min: 24, max: 30, label: "park-brake / brake-sensor — confirm on Fig. 20 / the cart" },
  phaseOhms: { min: 0.4, max: 0.8, label: "U–V, V–W, W–U equal — confirm on the motor" },
  throttleUp: { min: 0.35, max: 1.0, label: "throttle sensor rest — confirm on Fig. 20 / the cart" },
  throttleFull: { min: 3.5, max: 4.8, label: "throttle sensor full pedal — confirm on Fig. 20 / the cart" },
  packRested: { min: 70, max: 78, label: "70–78 V rested (six 12 V in series)" },
  packCells: "Six 12 V batteries in series (72 V) — Fig. 20 Main Wiring Harness",
  packMinV: 60,
  manualPrefix: "EZ-GO 2Five Repair and Service Manual — Electrical Components & Wiring, Section K",
  errorNotes:
    "2Five: write the controller code before you key-cycle. Confirm the after-1-February-2012 harness on Fig. 20. Do not use TXT TCT 1206HB or RXV Fleet 48 V trees on this cart.",
});
