import { buildGas } from "@/data/builders/gas";

export const ezgoTxtGas = buildGas({
  id: "ezgo-txt-gas",
  manufacturer: "ezgo",
  manufacturerLabel: "EZ-GO",
  name: "TXT / Freedom / Shuttle gasoline",
  fullName: "EZ-GO TXT Fleet / Freedom / Shuttle 2+2 gasoline (9 hp)",
  years: "Starting model year 2007 TXT gasoline (manual 605586, Jan 2007) — Fleet Golf Car (9 hp, CE, CARB), Freedom (9 hp, CE, CARB, SE, LE, HP), Shuttle 2+2 (9 hp, CE, CARB)",
  architecture: "4-cycle 9 hp carburetor · starter-generator · 12 V · belt drive",
  diagramTitle: "Starting and spark picture — TXT / Freedom / Shuttle gasoline",
  diagramNotes: [
    "2007+ TXT-family gas: Fleet, Freedom (SE/LE/HP), Shuttle 2+2, all 9 hp 4-cycle. Electrical wiring is Section L of manual 605586.",
    "Will-not-start order: battery and cables, fuse, key, big click switch click, crank, spark, fuel (carb / Section H), then engine (Section G).",
    "A solenoid is a click switch that sends big power to the starter. Electric TXT (DCS / PDS / TCT) is a different pack. Marathon 4-cycle 1991–96 is a different pack.",
  ],
  engineName: "TXT 9 hp 4-cycle",
  engineDesc:
    "EZ-GO TXT / Freedom / Shuttle 2+2 9 hp 4-cycle gas. Carburetor. Starter-generator. CVT belt drive (Section J). Governor changes above factory 12–15 mph cancel the warranty. Service the carburetor and engine per Sections H and G after spark and fuel are confirmed.",
  moduleName: "Ignition module / TCI (spark box)",
  moduleDesc: "Solid-state spark box. Kill wire must be open to ground. Bad modules follow jumping the battery backwards and water in the cowl.",
  ignitionName: "Ignition coil",
  ignitionDesc: "TXT gas coil. Confirm spark at a grounded tester with the kill circuit open before you replace the module.",
  fuelName: "Carburetor",
  fuelDesc: "TXT carburetor (Section H). Stale gas, clogged filter, and a stuck float are the usual cranks-no-start with spark. Pulse/mechanical fuel pump on many years. Confirm fuel at the bowl.",
  killName: "Kill / seat / Neutral start / F&R",
  killDesc: "Seat switch and Neutral-start / F&R interlock. TXT gas will not crank in gear on many years. Kill must be open to ground for spark.",
  manualPrefix: "EZ-GO TXT gasoline M&S 605586 (2007) — Electrical wiring Section L",
  oilSensor: false,
  efi: false,
});
