import { buildClubCarPd48 } from "@/data/builders/club-car-pd48";

export const clubCarDsPdPlus = buildClubCarPd48({
  id: "club-car-ds-pdplus",
  name: "DS PowerDrive Plus",
  fullName: "Club Car DS PowerDrive Plus (regen)",
  years: "1995–2000 DS PowerDrive Plus (1995–96 Section 21; 2000 supplement 102067506)",
  architecture: "PowerDrive Plus electric · regen / hill braking · Z-plug · cart computer",
  diagramTitle: "Power and control picture — DS PowerDrive Plus",
  diagramNotes: [
    "This cart uses a shunt 3.2 hp motor, a rocker F&R, and a Z-plug speed box. It is not a series PowerDrive 48 and not IQ.",
    "There is no Tow/Run switch. Zero Speed Detect fights roll with the key ON. Pedal-up braking (from over 12 mph) slows to about 9 mph. Pedal-down downhill holds about 15–16 mph.",
    "The big click switch (solenoid) is the main power switch. It sends big power to the motor. Regen puts power back in the pack when the cart computer (Z11 green) says the pack can take it. If not, the hill-brake solenoid opens and the energy-dump module burns the current.",
    "HPD if pot input is below 3 V when the key is turned ON. Solenoid coil is still 190–250 Ω with a diode and a 250 Ω pre-charge resistor. 3/8 A cart computer feed fuse.",
    "Z-plug: Z1 48 V, Z4 main solenoid, Z5 hill-brake solenoid, Z6 FWD white, Z7 REV blue, Z8 pot limit, Z9 yellow wiper, Z10 purple, Z11 regen, Z12 charger lockout, Z13/Z14 speed sensor.",
  ],
  family: "pdplus",
  controllerName: "PowerDrive Plus speed box (Z-plug)",
  controllerDesc:
    "This is a shunt electric regen speed box. It always sends 48 V pulses. Pulse width follows the gas pedal sensor. Direction is flipped inside the speed box (Z6 white / Z7 blue), not by an F&R rotor. Z1 red from click-switch L2 keeps leftover power stored, key ON or OFF. Z12 yellow is the charger safety lock. Z11 green switches hill-brake to regen (the cart slowing itself). Replace it as a unit. You cannot fix it in the field.",
  motorName: "48 V shunt motor (3.2 hp)",
  motorDesc:
    "Shunt electric 3.2 hp. Field current is changed on its own, apart from armature current. That is why Plus climbs better and can regen. Speed sensor on the tail (Z13 red supply, Z14 green pulse) is needed for zero-speed and pedal-up/down braking. Take A2 off before speed-box output tests.",
  throttleName: "Sweep pot (Plus gas pedal sensor)",
  throttleDesc:
    "Three-wire sweep pot. HPD turns on if input is below 3 V at key ON — foot off the pedal, then key. Yellow Z9 is the wiper. Purple Z10 is the reference. Green/white Z8 is the pedal limit. Full-pedal ohms still belong in the 4600–7000 Ω PowerDrive window.",
  manualPrefix: "1995–96 DS M&S Section 21 — PowerDrive Plus",
});
