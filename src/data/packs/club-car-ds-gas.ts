import { buildGas } from "@/data/builders/gas";

export const clubCarDsGas = buildGas({
  id: "club-car-ds-gas",
  manufacturer: "club-car",
  manufacturerLabel: "Club Car",
  name: "DS FE350 gasoline",
  fullName: "Club Car DS gasoline (Kawasaki FE350)",
  years: "1991–1996 Club Car DS gasoline (Kawasaki FE350; 1995–96 DS gas/electric; 2000 Club Car Service Manual). FE290 DS/Villager is a separate pack.",
  yearMin: 1991,
  yearMax: 1996,
  architecture: "Kawasaki FE350 · carburetor · starter-generator · low-oil spark cut",
  diagramTitle: "Starting and spark picture — DS FE350",
  diagramNotes: [
    "Kawasaki FE350 with a carburetor, starter-generator, and 12 V. The oil-warning switch is in the spark kill path. Low oil = no spark.",
    "FE290 (286 cc, 9 hp) DS and Villager units use the FE290 pack. Check the engine tag.",
    "Electric DS is V-Glide, PowerDrive 48, PowerDrive Plus, or IQ depending on year.",
  ],
  engineName: "Kawasaki FE350",
  engineDesc:
    "Club Car DS gas engine (Kawasaki FE350). Carburetor, magneto/TCI spark, starter-generator. Compression and carb service are in the engine section of the 1995–96 / 2000 manuals.",
  moduleName: "TCI / ignitor (spark box)",
  moduleDesc: "Transistor spark box on the FE350. Fed from the kill circuit (must be open to run) and the trigger / flywheel. Bad modules are common after jumping the battery backwards.",
  ignitionName: "Ignition coil",
  ignitionDesc: "FE350 spark coil. The kill terminal must be open to ground for spark. Confirm a blue-white spark at a grounded tester before you replace the TCI.",
  fuelName: "Carburetor",
  fuelDesc: "FE350 carburetor. Stale gas and a stuck float are the usual no-start with spark. Rebuild the idle circuit before you replace the TCI for a dies-at-idle complaint.",
  killName: "Oil warning / kill / seat / Neutral lock-out",
  killDesc: "Oil-level warning switch, seat switch, kill/run, and the F&R Neutral lock-out cam. Fill oil first. Cam in SERVICE will not drive.",
  manualPrefix: "1995–96 / 2000 Club Car DS gasoline — FE350 engine electrical",
  oilSensor: true,
  efi: false,
});
