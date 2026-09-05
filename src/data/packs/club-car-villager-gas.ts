import { buildGas } from "@/data/builders/gas";

export const clubCarVillagerGas = buildGas({
  id: "club-car-villager-gas",
  manufacturer: "club-car",
  manufacturerLabel: "Club Car",
  name: "Villager / Transporter FE350",
  fullName: "Club Car Villager 4/6/8 / Transporter 4/6 FE350 gasoline",
  years: "2008–2011 Villager 4/6/8 and Transporter 4/6 gasoline (chassis 103373105 + FE350 supplement 103373109)",
  architecture: "Kawasaki FE350 · carburetor · starter-generator · low-oil spark cut",
  diagramTitle: "Starting and spark picture — Villager / Transporter FE350",
  diagramNotes: [
    "2008–2011 transportation gas with the FE350. FE290 transportation units use the FE290 pack (supplement 103373108).",
    "Heavier Villager 8 / Transporter 6: dragging brakes and a glazed belt show up as 'no power' before the spark box.",
    "Electric Villager / Transporter is DS IQ or IQ Plus.",
  ],
  engineName: "Kawasaki FE350 (transportation)",
  engineDesc:
    "FE350 as used on 2008–2011 Villager 4/6/8 and Transporter 4/6. Carburetor, starter-generator, low-oil spark cut. Chassis steps are in manual 103373105. Engine electrical is the FE350 supplement 103373109.",
  moduleName: "TCI / ignitor (FE350 spark box)",
  moduleDesc: "Transistor spark box. Oil-warning kill must be open to run. Jumping the battery backwards takes the module out.",
  ignitionName: "FE350 ignition coil",
  ignitionDesc: "Coil on the FE350. The kill terminal must be open to ground. A blue-white spark at a grounded tester is a pass.",
  fuelName: "FE350 carburetor",
  fuelDesc: "Carburetor, filter, impulse pump. Stale gas after seasonal storage is the usual cranks-no-start with spark on a Villager that sat.",
  killName: "Oil warning / kill / seat / Neutral lock-out",
  killDesc: "Oil-level switch, seat, and Neutral lock-out cam. Fill oil first. Cam in SERVICE will not drive.",
  manualPrefix: "2008–2011 Transportation M&S + FE350 supplement 103373109 — gasoline electrical",
  oilSensor: true,
  efi: false,
});
