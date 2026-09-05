import { buildGas } from "@/data/builders/gas";

export const yamahaYdra = buildGas({
  id: "yamaha-ydra",
  manufacturer: "yamaha",
  manufacturerLabel: "Yamaha",
  name: "YDRA gasoline",
  fullName: "Yamaha YDRA / Drive gasoline (G29 gas)",
  years: "2007–2016 Drive / G29 gasoline (YDRA/E Service Manual LIT-19626, 2016, chapters 8–9)",
  architecture: "YDRA 4-cycle carburetor · TCI spark · starter · 12 V",
  diagramTitle: "Starting and spark picture — Yamaha YDRA",
  diagramNotes: [
    "YDRA is the gas Drive / G29. YDRE (battery) is a different electric pack. Do not use this tree on a 48 V YDRE.",
    "Chapter 9 gas troubleshooting: battery and fuse, main switch, starter click switch (solenoid), spark, carburetor.",
    "Yamaha TCI kill must be open to ground. Reverse buzzer and shift switch are not in the start path on YDRA.",
  ],
  engineName: "YDRA gasoline engine",
  engineDesc:
    "Yamaha YDRA 4-cycle gas engine as used on Drive / G29 gas. Carburetor, TCI spark, 12 V starter. Engine mechanical (valve clearance, compression) is in the engine chapter. This tree is the electrical/fuel no-start path from Chapter 9.",
  moduleName: "TCI module (spark box)",
  moduleDesc: "Yamaha TCI spark box. Kill wire from the main switch must be open to ground. A bad TCI after jumping the battery backwards is common. Confirm spark at a tester before you replace it.",
  ignitionName: "Ignition coil",
  ignitionDesc: "YDRA spark coil. Blue-white spark at a grounded tester with the kill circuit open is a pass.",
  fuelName: "Carburetor",
  fuelDesc: "YDRA carburetor and petcock/filter. Stale gas after storage is the usual cranks-no-start with spark. Confirm fuel at the bowl before you replace the TCI.",
  killName: "Main switch / kill",
  killDesc: "Yamaha main switch kill path. Seat switch if the cart has one. Kill must be open to ground for the TCI to spark.",
  manualPrefix: "YDRA/E Service Manual Chapter 9 — YDRA gasoline troubleshooting",
  oilSensor: false,
  efi: false,
});
