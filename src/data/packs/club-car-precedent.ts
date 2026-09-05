import { buildClubCarIq } from "@/data/builders/club-car-iq";

export const clubCarPrecedent = buildClubCarIq({
  id: "club-car-precedent-iq",
  name: "Precedent IQ",
  fullName: "Club Car Precedent IQ (48 V series)",
  years: "2004–2011 Precedent IQ (manual 102907701, 2006–2007; 2009–2011 electric Precedent M&S)",
  architecture: "IQ electric · cart computer · gas pedal sensor · 16-pin plug",
  diagramTitle: "Power and control picture — Precedent IQ 48 V",
  diagramNotes: [
    "Red lines are big power. Blue lines are control. Green lines are ground. This matches the 2006–07 Precedent IQ book, Figure 11-1.",
    "The Tow/Run switch is in the battery negative path. Turn it to Tow before you take battery cables off.",
    "The big click switch (solenoid) is the main power switch. It sends big power to the motor. Its coil should read 180–190 Ω (Test Procedure 3). Do not use a 40–200 Ω parts-store range.",
    "The MCOR is the gas pedal sensor. Yellow wire: 0.32 V with the pedal up, 4.65 V with the pedal down. Yellow to purple: 1 kΩ up, 5.67–7.43 kΩ down (Test Procedure 4 / 9A).",
  ],
  controllerName: "IQ speed box (controller)",
  controllerDesc:
    "This is the IQ electric speed box (controller). Big plus power comes through the big click switch (solenoid). Big minus power comes through Tow/Run. The M− wire pulses power to the motor. The gas pedal sensor (MCOR) and the Forward/Reverse switch tell it when to run. It bolts to the frame so it stays cool. Use the IQDM Diagnostic Menu (Troubleshooting Guide 1) if you have a handset. If you do not, use Troubleshooting Guide 2.",
  computerName: "Cart computer (OBC)",
  computerKind: "computer",
  computerDesc:
    "The Club Car cart computer (OBC) sits in the charger path. It also tells the big click switch when it may click (Test Procedure 2). A bad cart computer can stop charging (gray wire, TP 11). It can also block the big click switch even if the rest of the control circuit is good. PowerDrive chargers talk to this module.",
  computerFailures: [
    "Cart computer safety lock after the batteries run very low",
    "Bad charge part — pack never reaches 50+ V",
    "Rusty 15-pin / six-pin plug",
  ],
  throttleName: "MCOR (gas pedal sensor)",
  throttleDesc:
    "The MCOR is the gas pedal sensor on the pedal box. It has a pedal limit switch (two-pin, TP 8) and a sensor that changes ohms as you press the pedal (three-pin, TP 4). Yellow wiper is about 0.32 V with the pedal up, and 4.65 V with the pedal down. Yellow to purple is about 1 kΩ up, and 5.67–7.43 kΩ down. The IQ speed box will not click the big click switch without the limit switch. If the cart is slow and yellow is not about 4.60 V at full pedal, check MCOR ohms (TP 4 step 8).",
  manualPrefix: "2006-07 Precedent IQ M&S Section 11",
  packCells: "Six 8 V batteries in a row (48 V total)",
  lockoutNote: "If the PowerDrive charger is plugged in, a safety lock stops the click switch. The cart will not run with the cord in.",
  solenoidCoil: { min: 180, max: 190, label: "180–190 Ω (TP 3)" },
});
