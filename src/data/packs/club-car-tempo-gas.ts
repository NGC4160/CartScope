import { buildGas } from "@/data/builders/gas";

export const clubCarTempoGas = buildGas({
  id: "club-car-tempo-gas",
  manufacturer: "club-car",
  manufacturerLabel: "Club Car",
  name: "Tempo gasoline EFI",
  fullName: "Club Car Tempo / Tempo Connect / Tempo 2+2 gasoline (Kohler ECH440 EFI)",
  years: "2020–2021+ Tempo gas (manual 86753090024, 2021 Tempo, Tempo Connect, Tempo 2+2)",
  architecture: "Kohler ECH440 fuel injection · engine computer · electric pump · 12 V start",
  diagramTitle: "Starting and spark picture — Tempo Kohler ECH440 EFI",
  diagramNotes: [
    "Tempo gas is Kohler ECH440 EFI. It is not an FE350/EX40 carb Precedent. Do not use the carb tree for fuel.",
    "Key ON: the pump must prime 1–3 s. Then spark, injector pulse, compression.",
    "Electric Tempo (ERIC) is a different pack.",
  ],
  engineName: "Kohler ECH440 EFI",
  engineDesc:
    "Tempo / Tempo Connect / Tempo 2+2 gas engine. Fuel injection, with an engine computer that runs the injector and pump. Compression and EFI service are in the 2021 Tempo gas section. Check the engine tag. A carb Precedent EX40 in a Tempo body is the Precedent gas pack, not this one.",
  moduleName: "ECH440 ECU (engine computer)",
  moduleDesc:
    "Kohler engine computer. Key-on pump prime, injector pulse, and kill. Jumping the battery backwards takes the ECU out. Confirm pump prime and spark before you replace it.",
  ignitionName: "ECH440 ignition coil",
  ignitionDesc: "Coil on the ECH440. Kill must be open. A blue-white spark at a grounded tester is a pass.",
  fuelName: "EFI pump / injector",
  fuelDesc:
    "The electric pump must run 1–3 s on key-on. Then rail pressure and injector pulse. Stale gas still no-starts an EFI Tempo that sparks. Check the pump fuse and ECU power first if the pump is silent.",
  killName: "Seat / kill / ECU enable",
  killDesc: "Seat switch and engine-computer enable. Confirm 12 V at the ECU with key ON before you blame a silent pump.",
  manualPrefix: "2021 Tempo M&S (86753090024) — gasoline EFI electrical",
  oilSensor: false,
  efi: true,
});
