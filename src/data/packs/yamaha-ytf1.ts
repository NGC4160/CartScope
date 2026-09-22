import { buildGas } from "@/data/builders/gas";

export const yamahaYtf1 = buildGas({
  id: "yamaha-ytf1",
  manufacturer: "yamaha",
  manufacturerLabel: "Yamaha",
  name: "YTF1 gasoline",
  fullName: "Yamaha YTF1 gasoline (JW6 11-1 STANDARD)",
  years: "YTF1 WIRING DIAGRAM — JW6 11-1 STANDARD (factory YTF1 wiring plate)",
  architecture: "YTF1 4-cycle · TCI spark · starter generator · 12 V",
  diagramTitle: "Starting and spark picture — Yamaha YTF1",
  diagramNotes: [
    "Printed title on the plate: YTF1 WIRING DIAGRAM (JW6 11-1 STANDARD). This is not the YDRA / YDRE chapter 8 sheets already on file.",
    "The plate shows starter generator, main fuse (20 A), main relay, TCI, voltage regulator, oil level gauge, lights, and engine-stop relay.",
    "The large YDRA/YDRE Electrical chapter was not in this batch. Do not invent extra YTF1 years or plates.",
  ],
  engineName: "YTF1 gasoline engine",
  engineDesc:
    "Yamaha YTF1 gas engine as drawn on YTF1 WIRING DIAGRAM (JW6 11-1 STANDARD). Starter generator, TCI spark, 12 V. This tree is the electrical/fuel no-start path — compare the plate.",
  moduleName: "TCI module (spark box)",
  moduleDesc: "Yamaha TCI as labeled on the YTF1 plate. Kill / engine-stop relay path must be open to ground for spark. Confirm spark at a tester before you replace it.",
  ignitionName: "Ignition coil / TCI",
  ignitionDesc: "YTF1 TCI spark path on the plate. Blue-white spark at a grounded tester with the kill circuit open is a pass.",
  fuelName: "Carburetor",
  fuelDesc: "YTF1 fuel path is not drawn as a separate EFI sheet. Stale gas after storage is the usual cranks-no-start with spark.",
  killName: "Main switch / engine-stop relay",
  killDesc: "YTF1 main switch and ENG. STOP RELAY as drawn on the plate. Kill must be open to ground for the TCI to spark.",
  manualPrefix: "Yamaha YTF1 WIRING DIAGRAM — JW6 11-1 STANDARD",
  oilSensor: true,
  efi: false,
});
