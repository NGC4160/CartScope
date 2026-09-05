import { buildClubCarIq } from "@/data/builders/club-car-iq";

export const clubCarTempoEric = buildClubCarIq({
  id: "club-car-tempo-eric",
  name: "Tempo ERIC",
  fullName: "Club Car Tempo / Tempo Connect / Tempo 2+2 ERIC (48 V)",
  years: "2020–2021+ Tempo electric (manual 86753090024, 2021 Tempo, Tempo Connect, Tempo 2+2)",
  architecture: "ERIC Excel electric · ERIC charger · gas pedal sensor · 16-pin plug",
  diagramTitle: "Power and control picture — Tempo ERIC 48 V",
  diagramNotes: [
    "Tempo is the cart after Precedent. Electric Tempo, Tempo Connect, and Tempo 2+2 share the ERIC Excel power and control tree.",
    "The Tow/Run switch is in the battery negative path. Turn it to Tow before you take battery cables off. Never tow a Tempo electric in Run.",
    "Gas Tempo (Kohler ECH440 EFI) is a different pack. Do not use this electric tree on a gas Tempo.",
    "Factory values: click-switch coil 180–190 Ω, MCOR 0.32–4.65 V / 5.67–7.43 kΩ, pack 48–50 V ready window.",
  ],
  controllerName: "Tempo ERIC speed box (controller)",
  controllerDesc:
    "This is the Excel-family speed box on Tempo electric, Tempo Connect, and Tempo 2+2. ERIC charging and drive safety lock are built in. It uses the same MCOR / solenoid / 16-pin path as 2015–2019 Precedent ERIC. Tow/Run is still in the battery negative path. Never tow a Tempo electric in Run.",
  computerName: "ERIC charge module",
  computerKind: "charger",
  computerDesc:
    "This is the ERIC module on Tempo electric. Cord-in safety lock is the first no-power check. Connect-capable Tempo still uses this charge path. The connect system will not click a big click switch that ERIC has locked.",
  computerFailures: [
    "ERIC safety lock with the cord latched",
    "Failed charger talk / no charge",
    "Rusty ERIC plug under the seat",
  ],
  throttleName: "MCOR (gas pedal sensor)",
  throttleDesc:
    "The MCOR is the gas pedal sensor on the Tempo pedal group. Factory windows match Precedent IQ/Excel: 0.32 V up, 4.65 V full on yellow. 1 kΩ up, 5.67–7.43 kΩ full yellow to purple.",
  manualPrefix: "2021 Tempo M&S (86753090024) electric troubleshooting",
  packCells: "Six 8 V batteries in a row (48 V total)",
  lockoutNote: "Tempo ERIC stops the cart while the charger cord is locked in. Unplug it before these checks.",
  solenoidCoil: { min: 180, max: 190, label: "180–190 Ω" },
});
