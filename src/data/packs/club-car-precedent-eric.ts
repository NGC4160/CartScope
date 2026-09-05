import { buildClubCarIq } from "@/data/builders/club-car-iq";

export const clubCarPrecedentEric = buildClubCarIq({
  id: "club-car-precedent-eric",
  name: "Precedent ERIC",
  fullName: "Club Car Precedent ERIC Excel (48 V)",
  years: "2015–2019 Precedent electric (manual 105157201, 2015; 2017 gas/electric M&S)",
  architecture: "ERIC Excel electric · ERIC charger · gas pedal sensor · 16-pin plug",
  diagramTitle: "Power and control picture — Precedent ERIC 48 V",
  diagramNotes: [
    "2015+ Precedent electric uses ERIC charging. ERIC stands for Efficient Reliable Intelligent Charging. It replaces the older PowerDrive cart computer charge path.",
    "The Tow/Run switch is in the battery negative path. Turn it to Tow before you take battery cables off.",
    "The big click switch (solenoid) is the main power switch. It sends big power to the motor. Drive lockout with the charger plugged in is still the first check. Do not test a dead cart with the ERIC cord latched.",
    "MCOR (gas pedal sensor) and solenoid coil numbers match IQ/Excel: 180–190 Ω coil, MCOR 0.32–4.65 V / 5.67–7.43 kΩ.",
  ],
  controllerName: "Excel / ERIC speed box (controller)",
  controllerDesc:
    "This is the Excel-family electric speed box used with ERIC charging on 2015–2019 Precedent. It uses the same MCOR and solenoid path as earlier Excel. ERIC charger talk replaces the older PowerDrive cart computer talk. Heat cutback still starts above 85 °C on the heat sink.",
  computerName: "ERIC charge module",
  computerKind: "charger",
  computerDesc:
    "The ERIC charge module charges the pack. It also blocks drive when the AC cord is plugged in. A bad ERIC module can stop charging and stop the solenoid from clicking. Use an OEM ERIC charger. A generic charger will not finish the talk with the cart.",
  computerFailures: [
    "ERIC safety lock with the cord latched or after a failed charge",
    "No AC talk — charger light rejects the pack",
    "Rusty ERIC signal plug",
  ],
  throttleName: "MCOR (gas pedal sensor)",
  throttleDesc:
    "The MCOR is the gas pedal sensor on the pedal box. Same factory windows as IQ/Excel: yellow 0.32 V pedal up, 4.65 V full. Yellow to purple 1 kΩ up, 5.67–7.43 kΩ full. The limit switch must close so the big click switch can turn on.",
  manualPrefix: "2015 Precedent M&S Electric (105157201) electrical troubleshooting",
  packCells: "Six 8 V batteries in a row (48 V total)",
  lockoutNote: "ERIC drive safety lock is on whenever the charger cord is latched. Unplug and wait 30 seconds.",
  solenoidCoil: { min: 180, max: 190, label: "180–190 Ω" },
});
