import { buildGas } from "@/data/builders/gas";

export const clubCarDsFe290 = buildGas({
  id: "club-car-ds-fe290",
  manufacturer: "club-car",
  manufacturerLabel: "Club Car",
  name: "DS / Villager FE290",
  fullName: "Club Car DS / Villager / Transporter FE290 gasoline",
  years: "1995–2011 FE290 (1995–96 DS 286 cc 9 hp; 2000 supplement 102067508; 2008–2011 transportation supplement 103373108)",
  architecture: "Kawasaki FE290 286 cc 9 hp · carburetor · starter-generator · low-oil spark cut",
  diagramTitle: "Starting and spark picture — FE290",
  diagramNotes: [
    "FE290 is 286 cc / 9 hp. It is not the later FE350. Check the engine tag before you order a carburetor or ignitor.",
    "12 V, 460 CCA battery, 35 A charging. The oil-warning light and oil-kill are in the spark path. Low oil = no spark.",
    "Neutral lock-out cam on the F&R (SERVICE vs OPERATE). A cam left in SERVICE will not crank in gear.",
    "Electric DS / Villager is a different pack.",
  ],
  engineName: "Kawasaki FE290 (286 cc, 9 hp)",
  engineDesc:
    "Club Car FE290: 4-cycle OHV, 286 cc, 9.0 hp, pressure oiling, side-draft carb with float bowl, fixed jets, fuel filter, impulse pump. The governor is inside the transaxle (12–15 mph). Compression and carb service are in the gas engine section of the 1995–96 / 2000 / 2009–2011 FE290 supplements.",
  moduleName: "TCI / ignitor (FE290 spark box)",
  moduleDesc:
    "This is a transistor spark box with an electronic RPM limiter. The kill from the oil-warning circuit and key must be open to ground. Jumping the battery backwards often kills this module.",
  ignitionName: "FE290 ignition coil",
  ignitionDesc: "Coil on the FE290. The kill terminal must be open to ground. A blue-white spark at a grounded tester is a pass.",
  fuelName: "FE290 carburetor",
  fuelDesc: "Side-draft carb, float bowl, fixed jets, filter, impulse pump. Stale gas and a stuck float are the usual cranks-no-start with spark. 7 gal unleaded tank.",
  killName: "Oil warning / kill / seat / Neutral lock-out",
  killDesc:
    "Oil-level warning switch, seat, and the F&R Neutral lock-out cam. Low oil kills spark. Cam in SERVICE = engine will run in Neutral only and will not drive.",
  manualPrefix: "1995–96 / 2000 DS and 2009–2011 FE290 supplement — gasoline electrical",
  oilSensor: true,
  efi: false,
});
