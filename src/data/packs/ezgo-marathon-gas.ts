import { buildGas } from "@/data/builders/gas";

export const ezgoMarathonGas = buildGas({
  id: "ezgo-marathon-gas",
  manufacturer: "ezgo",
  manufacturerLabel: "EZ-GO",
  name: "Marathon / GX-444 4-cycle",
  fullName: "EZ-GO Marathon 4-cycle / GX-444 / Freedom / GXT / TUFF1 / PC4GX / BC-360",
  years: "1991–1996 4-cycle gasoline (manual 27206-G01): GX-444, GX-444F Freedom, GX-444F HP, 1992–1994 GXT/1-804, TUFF1, 1992–1995 PC4GX / PC4GXI, 1992–1994 BC-360",
  architecture: "Marathon 4-cycle carburetor · starter-generator · magneto spark",
  diagramTitle: "Starting and spark picture — Marathon / GX-444 4-cycle",
  diagramNotes: [
    "1991–1996 4-cycle family. Not a TXT and not a 2-cycle Marathon. Use this tree only on the 4-cycle engine.",
    "Will-not-start: battery, ignition switch, solenoid, starter-generator, spark, carburetor — in that order.",
    "Governor changes above factory 12–15 mph cancel the warranty.",
  ],
  engineName: "Marathon / GX-444 4-cycle engine",
  engineDesc:
    "EZ-GO 4-cycle gas as used on GX-444, Freedom, Freedom HP, GXT, TUFF1, PC4GX, and BC-360 (1991–1996). Carburetor, starter-generator, magneto/TCI spark. Compression and carb service are in the 4-cycle service manual.",
  moduleName: "Ignition module (spark box)",
  moduleDesc: "4-cycle solid-state spark box. Kill from the key. Confirm spark before you replace it.",
  ignitionName: "Ignition coil",
  ignitionDesc: "4-cycle coil. A blue-white spark at a grounded tester is a pass.",
  fuelName: "Carburetor",
  fuelDesc: "4-cycle carburetor. Stale gas and a gummed idle circuit are the usual no-start with spark after the cart sits.",
  killName: "Kill / key",
  killDesc: "Key-operated kill. Seat/neutral lock as fitted. Kill wire must be open to ground for spark.",
  manualPrefix: "EZ-GO Marathon 91–96 4-cycle service manual 27206-G01 — electrical / will not start",
  oilSensor: false,
  efi: false,
});
