import { buildGas } from "@/data/builders/gas";

export const badboyAmbushGas = buildGas({
  id: "badboy-ambush-gas",
  manufacturer: "badboy",
  manufacturerLabel: "Bad Boy",
  name: "Ambush gas / 4WD",
  fullName: "Bad Boy Ambush — gas powertrain and 4WD electrical",
  years: "Bad Boy Ambush Repair and Service Manual — Electrical Section J (gas powertrain / 4WD)",
  architecture: "12 V gas · starter-generator · 4WD electrical · main harness",
  diagramTitle: "Starting and spark picture — Ambush gas / 4WD",
  diagramNotes: [
    "Plates from the Bad Boy Ambush Electrical section: Fig. 2 Gas Powertrain And 4WD Electrical Schematic, Fig. 5 Main Harness Wiring Diagram, and Fig. 6 Accessory Wiring Diagram.",
    "This is the gas / 4WD path. The 48 V Curtis 1224 electric powertrain and pin connectors are on the Ambush electric pack.",
    "Do not use the generic Curtis 1232E/SE plates for Ambush gas — that pack is the later AC controller manual.",
  ],
  engineName: "Ambush gas engine (as fitted)",
  engineDesc:
    "Ambush gas powertrain as drawn on Fig. 2. Starter-generator, 12 V battery, voltage regulator, and 4WD electrical. Confirm the engine tag on the cart.",
  moduleName: "Voltage regulator / ignition path",
  moduleDesc:
    "Voltage regulator and ignition path as drawn on Fig. 2 Gas Powertrain And 4WD Electrical Schematic. Follow the plate — do not assume Club Car FE350 numbers.",
  ignitionName: "Ignition / spark path",
  ignitionDesc:
    "Spark path as drawn on the Ambush gas schematic. Confirm kill / oil / seat path on the cart before you replace the coil.",
  fuelName: "Carburetor / fuel gauge path",
  fuelDesc:
    "Fuel gauge and throttle-enable wires land on the main harness (Fig. 5). Stale gas and a stuck float are the usual no-start with spark.",
  killName: "Kill / oil / seat path",
  killDesc:
    "Kill / oil / seat path as drawn on the Ambush main harness. Fill oil first. Confirm the plate before you open the pack.",
  manualPrefix: "Bad Boy Ambush Repair and Service Manual — Electrical Section J",
  oilSensor: true,
  efi: false,
});
