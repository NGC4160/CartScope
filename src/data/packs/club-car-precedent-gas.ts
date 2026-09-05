import { buildGas } from "@/data/builders/gas";

export const clubCarPrecedentGas = buildGas({
  id: "club-car-precedent-gas",
  manufacturer: "club-car",
  manufacturerLabel: "Club Car",
  name: "Precedent gasoline",
  fullName: "Club Car Precedent gasoline (FE350 · Subaru EX40)",
  years: "2004–2019 Precedent gas — Kawasaki FE350 then Subaru EX40 (2015 M&S 105157201; 2017 gas/electric M&S)",
  architecture: "FE350 carb · Subaru EX40 carb · starter-generator · low-oil spark cut",
  diagramTitle: "Starting and spark picture — Precedent gasoline",
  diagramNotes: [
    "Read the engine tag on the valve cover: Kawasaki FE350 (early Precedent) or Subaru EX40 (later Precedent). Tempo Kohler ECH440 EFI is a different pack.",
    "Low-oil spark cut still applies on carb Precedent. Low oil = no spark.",
    "Electric Precedent (IQ / Excel / ERIC) is a different pack.",
  ],
  engineName: "FE350 / Subaru EX40",
  engineDesc:
    "Precedent gas: Kawasaki FE350 then Subaru EX40. Both use a carburetor and a starter-generator. Check the engine tag. Compression and carb service are in the gas sections of the 2015 / 2017 Precedent manuals.",
  moduleName: "TCI / ignitor (spark box)",
  moduleDesc:
    "Carb Precedent uses a TCI/ignitor spark box. Jumping the battery backwards takes the module out. Confirm spark before you replace it.",
  ignitionName: "Ignition coil",
  ignitionDesc: "Coil on the FE350/EX40. Kill must be open to ground. A blue-white spark at a grounded tester is a pass.",
  fuelName: "Carburetor",
  fuelDesc: "FE350 and EX40: carburetor, filter, and fuel cap vent. Stale gas is the most common no-start with spark.",
  killName: "Oil warning / kill / seat",
  killDesc: "Oil-level switch, seat switch, and kill/run. Low oil = no spark.",
  manualPrefix: "2015/2017 Precedent M&S — gasoline electrical (FE350 / EX40)",
  oilSensor: true,
  efi: false,
});
