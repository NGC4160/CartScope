import { buildGas } from "@/data/builders/gas";

export const ezgoRxvGas = buildGas({
  id: "ezgo-rxv-gas",
  manufacturer: "ezgo",
  manufacturerLabel: "EZ-GO",
  name: "RXV gasoline",
  fullName: "EZ-GO RXV Fleet / Freedom gasoline",
  years: "EZ-GO RXV gasoline Repair and Service Manual — Electrical Section L",
  architecture: "4-cycle carburetor · starter-generator · 12 V · RXV gasoline chassis",
  diagramTitle: "Starting and spark picture — RXV gasoline",
  diagramNotes: [
    "Factory plate from the RXV gasoline Electrical Section L extract: Fig. 10 Accessory Wiring Diagram (L-11).",
    "Fig. 1 Electrical System Wiring Diagram was not added — that printed title is already on the TXT Fleet gasoline pack.",
    "This is RXV gasoline, not RXV AC electric (Sevcon / Dana, Section O) and not TXT Fleet gasoline.",
  ],
  engineName: "RXV gasoline 4-cycle",
  engineDesc:
    "EZ-GO RXV gasoline 4-cycle as served by Electrical Section L. Carburetor, starter-generator, 12 V battery. Confirm the cart is RXV gas — not TXT Fleet and not RXV AC.",
  moduleName: "Ignition module / magneto (spark box)",
  moduleDesc:
    "Solid-state spark / magneto path in Section L. Kill wire must be open to ground. Confirm spark before you replace the module.",
  ignitionName: "Ignition coil",
  ignitionDesc: "RXV gas coil. Confirm spark at a grounded tester with the kill circuit open before you replace the module.",
  fuelName: "Carburetor",
  fuelDesc: "RXV carburetor. Stale gas, clogged filter, and a stuck float are the usual cranks-no-start with spark.",
  killName: "Kill / key / accelerator limit",
  killDesc:
    "Key and accelerator-limit kill as drawn in Section L. Kill must be open to ground for spark.",
  manualPrefix: "EZ-GO RXV gasoline Repair and Service Manual — Electrical Section L",
  oilSensor: false,
  efi: false,
});
