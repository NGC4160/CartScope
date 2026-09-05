import { buildClubCarPd48 } from "@/data/builders/club-car-pd48";

export const clubCarDsElectric = buildClubCarPd48({
  id: "club-car-ds-electric",
  name: "DS PowerDrive 48",
  fullName: "Club Car DS PowerDrive System 48",
  years: "1995–2000 DS PowerDrive System 48 (1995–96 Section 20; 2000 supplement 102067505). Multi-step pot until serial A9529-445799; continuously variable after.",
  architecture: "PowerDrive System 48 electric · cart computer · gas pedal sensor · 190–250 Ω big click switch",
  diagramTitle: "Power and control picture — DS PowerDrive System 48",
  diagramNotes: [
    "This is PowerDrive System 48, not V-Glide and not IQ. There is no Tow/Run switch. There is no 16-pin MCOR plug.",
    "The big click switch (solenoid) is the main power switch. It sends big power to the motor. The coil is 190–250 Ω (Test Procedure 5). It has a one-way diode and a 250 Ω pre-charge resistor across the large posts.",
    "The speed box (controller) is the solid-state unit that pulses power to the motor. Multi-step pot (before serial A9529-445799): 300 / 690 / 990 / 1740 / 2740 / 4940 Ω. Full speed 4600–7000 Ω. Sweep pot: about 0–300 Ω rest → about 5500 Ω full, never over 7000 Ω.",
    "Half-speed reverse resistor: 3900 Ω ±10 % (multi-step) or 5100 Ω ±10 % (sweep). Warning light on below 48 V with no load, or under 25 % charge.",
    "Drain the speed box before you unplug it: key ON, F&R Reverse, hold the pedal until the reverse buzzer stops.",
  ],
  family: "pd48",
  controllerName: "PowerDrive System 48 speed box (controller)",
  controllerDesc:
    "This is a series electric solid-state speed box. Terminal 1 (A on early units) is the 18-gauge red click-switch input. Terminals 2/3 (B/C) are the pot. B+ / B− / M− / A2 carry big power. TP 10: capacitor voltage about 48 V B+ to M− at rest. It must rise to full pack at full pedal. Clean the terminal face — leak current can look like a failed unit. Double-wrench the bus bars so you do not crack the seals.",
  motorName: "48 V series motor (3.1 hp)",
  motorDesc:
    "Direct-drive 48 V series electric motor, 3.1 hp. F&R flips the field: TP 6 Forward M− to S1 and A2 to S2; Reverse M− to S2 and A2 to S1. Take the 6-gauge white off A2 before speed-box output tests.",
  throttleName: "Multi-step or sweep pot (gas pedal sensor)",
  throttleDesc:
    "Two versions. Multi-step wiper (early): six ohm steps 300–4940 Ω. Sweep three-wire (serial A9529-445799+): about 0–300 Ω rest to about 5500 Ω full. Either must land in 4600–7000 Ω at full pedal or the cart will not reach speed. The pedal limit switch must be open at rest. If the big click switch clicks as soon as the key is on, the limit switch failed closed.",
  manualPrefix: "1995–96 DS M&S Section 20 — PowerDrive System 48",
});
