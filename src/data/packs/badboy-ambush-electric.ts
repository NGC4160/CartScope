import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const badboyAmbushElectric = buildEzgoDc({
  id: "badboy-ambush-electric",
  manufacturer: "badboy",
  manufacturerLabel: "Bad Boy",
  name: "Ambush electric",
  fullName: "Bad Boy Ambush — 48 V electric powertrain (Curtis 1224)",
  years: "Bad Boy Ambush Repair and Service Manual — Electrical Section J / Troubleshooting Section T",
  architecture: "48 V DC electric · Curtis 1224 speed controller · powertrain controller · main harness",
  diagramTitle: "Power and control picture — Ambush electric (Curtis 1224)",
  diagramNotes: [
    "Plates from the Bad Boy Ambush Electrical / Troubleshooting sections: Fig. 10 Electric Powertrain Electrical Schematic, Fig. 22 Speed Controller Pin Connector, Fig. 23 Powertrain Controller Pin Connector, plus the shared Fig. 5 Main Harness and Fig. 6 Accessory plates.",
    "Curtis 1224 is the Ambush speed controller. This is not the later Curtis 1232E/SE AC manual (that pack is Bad Boy Curtis 1232E/SE).",
    "Gas / 4WD schematics are on the Ambush gas pack. Key mode is gas, electric, or 4WD — pick the pack that matches the mode you are diagnosing.",
  ],
  voltage: 48,
  controllerName: "Curtis 1224 (Ambush speed controller)",
  controllerDesc:
    "Curtis 1224 speed controller as drawn on Fig. 10 and Fig. 22. Pin voltages on Fig. 22: 48 V with key on, 48 V in forward / reverse, 0–5 V throttle, 48–0 V solenoid activation ground. Confirm the stamp on the controller.",
  throttleName: "Accelerator / rotary position sensor",
  throttleDesc:
    "Throttle and pedal-switch path as drawn on Fig. 10 and Fig. 22. Fig. 22 shows 0–5 V with throttle activation. Confirm on the cart — do not use TXT ITS windows as factory Ambush numbers.",
  itsClick: { min: 0.2, max: 1.5, label: "first-motion — confirm on Fig. 22 / the cart" },
  itsFull: { min: 3.5, max: 5.0, label: "0–5 V throttle window on Fig. 22 — confirm on the cart" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω typical Curtis coil (confirm on Fig. 19 / the cart)" },
  packRested: { min: 42, max: 54.5, label: "42–54.5 V rested (48 V Ambush)" },
  packLoad: { min: 38, max: 54.5, label: "≥ 38 V under load" },
  computerName: "Powertrain controller",
  computerKind: "computer",
  computerDesc:
    "Ambush powertrain controller as drawn on Fig. 23. Pin voltages include KSI 48 V, FWD / REV, throttle, speed sensor 0–5 V, and LED / pot pins. Use the handheld Monitor menu when the plate and the cart disagree.",
  packCells: "48 V pack as fitted — match the cart (Ambush Electrical Section J)",
  manualPrefix: "Bad Boy Ambush Repair and Service Manual — Electrical Section J / T",
  family: "dcs",
  towName: "Key / mode switch",
  towDesc:
    "Ambush key has gas / electric / 4WD modes. Electric-mode diagnosis uses Fig. 10 and the pin plates. Confirm mode before you open the pack.",
});
