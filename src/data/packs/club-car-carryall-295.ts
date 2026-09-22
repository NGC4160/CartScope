import { buildGas } from "@/data/builders/gas";

export const clubCarCarryall295 = buildGas({
  id: "club-car-carryall-295",
  manufacturer: "club-car",
  manufacturerLabel: "Club Car",
  name: "Carryall 295 / XRT1550 AWD",
  fullName: "Club Car Carryall 295 / XRT1550 all-wheel drive (gasoline and diesel)",
  years: "2008–2012 All-Wheel Drive Maintenance and Service Manual — Carryall 295 / XRT1550 Electrical",
  yearMin: 2008,
  yearMax: 2012,
  architecture: "12 V AWD utility · gasoline or diesel · starter-generator · hydraulic attachment option",
  diagramTitle: "Starting and spark picture — Carryall 295 / XRT1550 AWD",
  diagramNotes: [
    "Factory plates from the 2008–2012 All-Wheel Drive Electrical extract: Figure 11-1 / 11-2 gasoline utility (front / rear), Figure 12-1 / 12-2 diesel utility (front / rear), Figure 12-3 / 12-4 homologated lights, and Figure 19-18 / 19-19 hydraulic attachment.",
    "This is the Carryall 295 / XRT1550 AWD utility chassis — not Precedent IQ / Excel / ERIC and not DS.",
    "Confirm gas vs diesel on the engine tag before you follow a plate. Hydraulic attachment wiring is only for carts with the factory lift/tilt kit.",
  ],
  engineName: "Carryall 295 / XRT1550 engine (gas or diesel as fitted)",
  engineDesc:
    "AWD utility gas or diesel as drawn on Figure 11-1 / 11-2 (gasoline) or Figure 12-1 / 12-2 (diesel). Starter-generator and 12 V battery. Confirm the engine tag on the cart.",
  moduleName: "Ignition / glow path (as fitted)",
  moduleDesc:
    "Gas carts use the spark / kill path on the gasoline utility plates. Diesel carts use the diesel utility plates. Follow the plate in front of you — do not mix gas and diesel pin colors.",
  ignitionName: "Ignition coil / glow path",
  ignitionDesc:
    "Spark or glow path as drawn on the matching utility wiring diagram. Confirm kill / oil / seat (gas) or glow / stop (diesel) on the cart before you replace a module.",
  fuelName: "Carburetor / diesel fuel path",
  fuelDesc:
    "Fuel path as drawn on the gasoline or diesel utility plates. Stale gas is the usual no-start with spark on carb carts.",
  killName: "Kill / oil / seat / stop path",
  killDesc:
    "Kill / oil / seat (gas) or engine-stop (diesel) as drawn on Figure 11-1 / 11-2 or Figure 12-1 / 12-2. Fill oil first on gas carts.",
  manualPrefix: "2008–2012 All-Wheel Drive Maintenance and Service Manual — Electrical (Carryall 295 / XRT1550)",
  oilSensor: true,
  efi: false,
});
