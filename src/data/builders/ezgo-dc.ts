import { closedOpen, cont, dx, obs, ohm, volt, yesNo } from "@/data/helpers";
import { dcPowerLayout } from "@/data/layouts";
import type { Diagnosis, DiagnosticStep, ModelPack, SymptomDef } from "@/data/types";

export interface EzgoDcSpec {
  id: string;
  name: string;
  fullName: string;
  years: string;
  architecture: string;
  diagramTitle: string;
  diagramNotes: string[];
  voltage: 36 | 48;
  controllerName: string;
  controllerDesc: string;
  throttleName: string;
  throttleDesc: string;
  itsClick: { min: number; max: number; label: string };
  itsFull: { min: number; max: number; label: string };
  solenoidCoil: { min: number; max: number; label: string };
  packRested: { min: number; max: number; label: string };
  packLoad: { min: number; max: number; label: string };
  computerName: string;
  computerKind: "computer" | "charger";
  computerDesc: string;
  packCells: string;
  manualPrefix: string;
  family: "tct" | "pds" | "dcs";
  towName?: string;
  towDesc?: string;
}

export function buildEzgoDc(spec: EzgoDcSpec): ModelPack {
  const M = spec.manualPrefix;
  const { components, wires, testPoints } = dcPowerLayout({
    battery: {
      name: "Battery pack",
      description: `${spec.packCells}. The pack is the whole set of batteries. Check the pack first if the cart has no power. One weak battery can take power from the speed box (controller) and the motor.`,
      commonFailures: ["One weak battery that drops when you drive", "Green crust on the big cable ends", "Water too low over the plates"],
      expectedValues: [
        { label: "Pack sitting still", value: spec.packRested.label },
        { label: "Pack while you drive", value: spec.packLoad.label },
      ],
    },
    tow: {
      name: spec.towName ?? "Run / Tow switch",
      description:
        spec.towDesc ??
        "This is the Run/Tow switch (Tow = off for work. Run = ready to drive.). Run sends power to the speed box (controller) on the 16-pin red wire (KSI). Tow cuts that power. After you hook the batteries back up, leave it in Tow for 30 seconds so the speed box can fill up. Skip this and a TCT cart often will not go.",
      commonFailures: ["Left in TOW / STORAGE after charging", "Broken switch", "Red wire to the 16-pin is broken"],
      expectedValues: [{ label: "Run, 16-pin red / KSI to B−", value: "Pack voltage" }],
    },
    solenoid: {
      name: "Main big click switch (solenoid)",
      description:
        "The big click switch (solenoid) sends power to the motor. It has four posts. The two big posts feed B+ to the speed box (controller). The TCT 1206HB can show MAIN WELDED, MAIN COIL OPEN, MAIN DROPOUT 1/2, or MAIN DRIVER ON/OFF for this part. A click does not prove the metal pads inside (contacts) are passing power.",
      commonFailures: ["Rough or burned metal pads (contacts)", "Broken coil (small magnet wires)", "Clicks on and off fast from a low pack or a bad gas pedal sensor (ITS)"],
      expectedValues: [
        { label: "Coil (small magnet wires)", value: spec.solenoidCoil.label },
        { label: "L1–L2 drop, pedal down", value: "≤ 0.4 V" },
        { label: "Stuck-shut check, coil off", value: "Open between the big posts" },
      ],
    },
    controller: {
      name: spec.controllerName,
      description: spec.controllerDesc,
      commonFailures: [
        "Failed after towing in Run",
        "Dirty or rusty 16-pin plug",
        "Stored fault (HW FAILSAFE, FIELD MISSING, THROTTLE FAULT, HPD, THERMAL CUTBACK)",
      ],
      expectedValues: [
        { label: "16-pin red / KSI, Run", value: "Pack voltage" },
        { label: "ITS (gas pedal sensor)", value: spec.itsFull.label },
      ],
    },
    motor: {
      name: "Drive motor",
      description:
        spec.family === "tct"
          ? "TCT drive motor with its own field (magnet wires in the motor). FIELD MISSING on the 1206HB means the field or a field wire is broken. M− SHORTED means the speed box (controller) did not see the armature (spinning part of the motor) running. SPEED SENSOR FAULT / MOTOR STALL means the tail speed sensor is bad or the motor is stuck."
          : "DCS/PDS drive motor. Check the armature (spinning part). Check the field (magnet wires). Check for a short to the case. Use the numbers on the motor tag.",
      commonFailures: ["Worn brushes", "Broken field (FIELD MISSING)", "Armature shorted to the case", "Bad motor speed sensor"],
      expectedValues: [
        { label: "Armature (spinning part)", value: "< 1 Ω" },
        { label: "Field (magnet wires)", value: "< 1 Ω" },
        { label: "To the case", value: "Open" },
      ],
    },
    key: {
      name: "Key switch (KSI)",
      description: "The dash key is KSI (key switch input). It turns on the speed box (controller). HPD sets if you press the gas pedal before the key and the direction switch.",
      commonFailures: ["Worn key barrel", "Loose bullet plugs"],
      expectedValues: [{ label: "Output, key ON", value: "Pack voltage" }],
    },
    fr: {
      name: "F&R switch (direction switch)",
      description: "F&R is the direction switch. It also tells the speed box (controller) the cart is in gear. If it only fails one way, DCS often has burned field metal pads (contacts). TCT uses speed box field current plus this switch.",
      commonFailures: ["Only one direction — burned metal pads", "Neutral switch open — no click"],
      expectedValues: [{ label: "In gear", value: "Connected (good)" }],
    },
    throttle: {
      name: spec.throttleName,
      description: spec.throttleDesc,
      commonFailures: ["ITS / pot (gas pedal sensor) out of range (THROTTLE FAULT)", "Broken magnet / moving pin", "Pinched pedal wires"],
      expectedValues: [
        { label: "At click / first move", value: spec.itsClick.label },
        { label: "Pedal all the way down", value: spec.itsFull.label },
      ],
    },
    computer: {
      kind: spec.computerKind,
      name: spec.computerName,
      description: spec.computerDesc,
      commonFailures: ["No wall power at the cord", "No DC coming out", "Error LED blink codes"],
      expectedValues: [{ label: "Pack while charging", value: spec.voltage === 48 ? "Going up, often 56 V+ while charging" : "Going up, often 42 V+ while charging" }],
    },
    receptacle: {
      name: "Charger plug",
      description: "PowerWise / Delta-Q / Lester style DC plug. On many TXT carts, lockout is a safety lock that stops the cart while the cord is in.",
      commonFailures: ["Burned pins", "Broken lockout (safety lock that stops the cart)"],
      expectedValues: [{ label: "DC polarity", value: "Pack voltage" }],
    },
    fuse: {
      name: "Control fuse",
      description: "Small in-line fuse that feeds the key and the coil (the small magnet wires that pull the big click switch in).",
      commonFailures: ["Opens after a shorted coil"],
      expectedValues: [{ label: "Is the fuse connected all the way?", value: "Connected (good)" }],
    },
  });

  const chargeMin = spec.voltage === 48 ? 50 : 38;
  const chargeMax = spec.voltage === 48 ? 70 : 52;

  const steps: Record<string, DiagnosticStep> = {
    "tno-setup": obs(
      "tno-setup",
      "Set the cart up to test",
      "Now do this. Set the Run/Tow switch to Run (Tow = off for work. Run = ready to drive). Turn the key ON. Set the F&R direction switch to Forward. Unplug the charger. Make the main cables tight. If you just hooked the batteries back up, leave Run/Tow in Tow for 30 seconds first. That lets the 1206HB speed box (controller) fill up. Then switch to Run.",
      `Factory book: ${M} — Will not operate, preliminary`,
      ["s1", "s2", "s3", "bt1"],
      "Run, key ON, Forward, cables tight (and 30 s fill-up after a reconnect)?",
      "Look at the switches. No meter yet.",
      "All set",
      yesNo("All set — keep going", "A switch or cable is wrong", false),
      { kind: "step", id: "tno-pack" },
      { kind: "diagnosis", id: "tdx-setup" },
      { caution: "Set Run/Tow to Tow before you take off the batteries. Never tow the cart in Run." },
    ),
    "tno-pack": volt(
      "tno-pack",
      "Read pack voltage",
      `Now check if the power is flowing. Voltage is how strong the electric power is. Turn the key OFF. Put your meter on the main pack posts. ${spec.packCells}. Do not test a speed box (controller) on a dead pack.`,
      `Factory book: ${M} — Battery pack`,
      ["bt1"],
      "Pack voltage at the main posts",
      "DC volts. Pack B+ to B−.",
      spec.packRested.label,
      spec.packRested.min,
      spec.packRested.max,
      spec.voltage === 48 ? "50.1" : "38.2",
      { kind: "step", id: "tno-click" },
      { kind: "diagnosis", id: "tdx-pack" },
    ),
    "tno-click": obs(
      "tno-click",
      "Listen for the click switch",
      "The big click switch (solenoid) sends power to the motor. Now do this. Key ON. F&R direction switch in Forward. Run/Tow in Run. Press the pedal. Listen at the click switch. TCT ITS (gas pedal sensor) should be " +
        spec.itsClick.label +
        " when the click switch first closes.",
      `Factory book: ${M} — Solenoid activation`,
      ["k1", "s4"],
      "Did the big click switch click?",
      "Listen at K1.",
      "You hear a click",
      [
        { id: "click", label: "Click switch clicked", result: "pass" },
        { id: "noclick", label: "No click", result: "fail" },
      ],
      { kind: "step", id: "tno-contacts" },
      { kind: "step", id: "tno-16red" },
    ),
    "tno-16red": volt(
      "tno-16red",
      "16-pin red / KSI — speed box power",
      "Now check if the power is flowing. Voltage is how strong the electric power is. Look at this number. The red wire at the speed box (controller) plug must show pack voltage in Run. If it is dark, the Run/Tow switch or the red lead is broken. After you hook the batteries back up, wait 30 seconds in Tow on TCT before this reading counts.",
      `Factory book: ${M} — Controller 16-pin, red / KSI`,
      ["a1", "s1", "w-s1-a1"],
      "16-pin red (KSI) to B−, Run, key ON",
      "DC volts. Poke the probe on the red wire at the speed box plug.",
      "Pack voltage",
      spec.packRested.min - 1,
      spec.packRested.max,
      spec.voltage === 48 ? "48.8" : "36.6",
      { kind: "step", id: "tno-its" },
      { kind: "diagnosis", id: "tdx-tow" },
    ),
    "tno-its": volt(
      "tno-its",
      spec.family === "tct" ? "ITS at first click (1.0 V ± 0.3)" : "Gas pedal sensor at first move",
      spec.family === "tct"
        ? "The ITS is the gas pedal sensor. Now check if the power is flowing. Voltage is how strong the electric power is. Put the + probe on the ITS. Put − on B−. Look at this number. You should see 1.0 V ± 0.3 V when the big click switch (solenoid) clicks. You should see 2.7 V ± 0.5 V with the pedal all the way down. A bad number is THROTTLE FAULT. That can mean no click or a slow cart."
        : spec.throttleDesc,
      `Factory book: ${M} — ${spec.throttleName}`,
      ["s4", "w-mcor-sig", "a1"],
      spec.family === "tct" ? "ITS voltage when the click switch clicks (or first move)" : "Gas pedal sensor signal, first move",
      "DC volts. ITS / yellow signal to B−.",
      spec.itsClick.label,
      spec.itsClick.min,
      spec.itsClick.max,
      spec.family === "tct" ? "1.0" : "0.9",
      { kind: "step", id: "tno-its-full" },
      { kind: "diagnosis", id: "tdx-its" },
    ),
    "tno-its-full": volt(
      "tno-its-full",
      spec.family === "tct" ? "ITS at full pedal (2.7 V ± 0.5)" : "Gas pedal sensor at full pedal",
      spec.family === "tct"
        ? "Now check if the power is flowing. Voltage is how strong the electric power is. Press the pedal all the way down. Look at this number. ITS (gas pedal sensor) should be 2.7 V ± 0.5 V. If the click number was good but this number is low, the cart will run slow."
        : "Now check if the power is flowing. Voltage is how strong the electric power is. Press the pedal all the way down. The gas pedal sensor number must sit in the speed box (controller) window. If it does not, the cart will limit power.",
      `Factory book: ${M} — ${spec.throttleName} full pedal`,
      ["s4", "a1"],
      "Gas pedal sensor / ITS, full pedal",
      "DC volts, signal to B−, pedal down.",
      spec.itsFull.label,
      spec.itsFull.min,
      spec.itsFull.max,
      spec.family === "tct" ? "2.7" : "4.4",
      { kind: "step", id: "tno-coil" },
      { kind: "diagnosis", id: "tdx-its" },
    ),
    "tno-coil": volt(
      "tno-coil",
      "Click switch coil voltage",
      "Now check if the power is flowing. Voltage is how strong the electric power is. The coil is the small magnet wires that pull the click switch in. Key ON. F&R direction switch in Forward. Pedal down. Read voltage across the small coil posts. Look at this number. A dark coil with a good ITS (gas pedal sensor) points to the key, the direction switch, or the fuse.",
      `Factory book: ${M} — Solenoid coil`,
      ["k1", "s2", "s3"],
      "Coil voltage, pedal down",
      "DC volts across the small posts.",
      "Pack voltage",
      spec.packRested.min - 2,
      spec.packRested.max,
      spec.voltage === 48 ? "48.0" : "36.4",
      { kind: "step", id: "tno-coil-r" },
      { kind: "diagnosis", id: "tdx-key-fr" },
    ),
    "tno-coil-r": ohm(
      "tno-coil-r",
      "Click switch coil ohms",
      "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken. Key OFF. Run/Tow in Tow. Take the coil wires off. 1206HB MAIN COIL OPEN means this test failed.",
      `Factory book: ${M} — Solenoid coil resistance`,
      ["k1"],
      "Coil ohms",
      "Ohms on the small posts, wires off.",
      spec.solenoidCoil.label,
      spec.solenoidCoil.min,
      spec.solenoidCoil.max,
      "110",
      { kind: "diagnosis", id: "tdx-solenoid-mech" },
      { kind: "diagnosis", id: "tdx-solenoid-coil" },
    ),
    "tno-contacts": volt(
      "tno-contacts",
      "Click switch L2 voltage",
      "Now check if the power is flowing. Voltage is how strong the electric power is. It clicked. Hold the pedal. Look at this number. L2 (speed box B+ side) to pack B− should be pack voltage. Also check the big posts with the coil off. If that path is connected all the way, that is MAIN WELDED. Replace the big click switch (solenoid).",
      `Factory book: ${M} — Solenoid contacts / MAIN WELDED`,
      ["k1", "a1", "w-k-a"],
      "L2 to pack B−, pedal held",
      "DC volts on click switch L2.",
      "Within 0.5 V of pack",
      spec.packRested.min - 1,
      spec.packRested.max,
      spec.voltage === 48 ? "48.4" : "36.8",
      { kind: "step", id: "tno-motor" },
      { kind: "diagnosis", id: "tdx-solenoid-contacts" },
    ),
    "tno-motor": ohm(
      "tno-motor",
      "Motor armature ohms",
      "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken. The armature is the spinning part of the motor. Set Run/Tow to Tow. Take off the main B−. Read armature. Then read field (magnet wires). Then read to the case. TCT FIELD MISSING means the field path is broken. SPEED SENSOR FAULT: look at the tail speed sensor while you are here.",
      `Factory book: ${M} — Motor tests`,
      ["m1"],
      "Armature ohms",
      "Ohms at A1–A2.",
      "< 1.0 Ω",
      0.02,
      1,
      "0.25",
      { kind: "step", id: "tno-field" },
      { kind: "diagnosis", id: "tdx-motor" },
      { caution: "Take off the main negative before ohm tests." },
    ),
    "tno-field": ohm(
      "tno-field",
      "Motor field ohms",
      "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken. The field is the magnet wires in the motor. A broken field is 1206HB FIELD MISSING (click switch closed, response 2+8).",
      `Factory book: ${M} — Field winding / FIELD MISSING`,
      ["m1"],
      "Field ohms",
      "Ohms at F1–F2 / S1–S2.",
      "< 1.0 Ω",
      0.02,
      1,
      "0.4",
      { kind: "diagnosis", id: "tdx-controller" },
      { kind: "diagnosis", id: "tdx-motor" },
    ),
    "tsl-its": volt(
      "tsl-its",
      "Gas pedal sensor / ITS sweep (slow / limp)",
      "The ITS is the gas pedal sensor. Now check if the power is flowing. Voltage is how strong the electric power is. Slow TCT/PDS carts often have a gas pedal sensor that never reaches full voltage. That is scaled throttle (speed box response 8). Write down the click number and the full-pedal number.",
      `Factory book: ${M} — Operates slowly`,
      ["s4", "a1"],
      "ITS / gas pedal sensor, full pedal",
      "DC volts, signal at the 16-pin, pedal down.",
      spec.itsFull.label,
      spec.itsFull.min,
      spec.itsFull.max,
      spec.family === "tct" ? "2.6" : "4.1",
      { kind: "step", id: "tsl-pack" },
      { kind: "diagnosis", id: "tdx-its" },
    ),
    "tsl-pack": volt(
      "tsl-pack",
      "Pack under load",
      "Now check if the power is flowing. Voltage is how strong the electric power is. Block the wheels. Read pack voltage while a helper holds the pedal. Look at this number. LOW BATTERY VOLTAGE on the 1206HB means this test failed. That can be a crusty terminal or a pack that is too low.",
      `Factory book: ${M} — Pack under load / LOW BATTERY VOLTAGE`,
      ["bt1"],
      "Pack voltage under load",
      "DC volts on the pack posts.",
      spec.packLoad.label,
      spec.packLoad.min,
      spec.packLoad.max,
      spec.voltage === 48 ? "46.5" : "34.5",
      { kind: "diagnosis", id: "tdx-slow" },
      { kind: "diagnosis", id: "tdx-pack" },
      { caution: "Block the wheels." },
    ),
    "tchg-ac": volt(
      "tchg-ac",
      "Charger AC and DC",
      "Now check if the power is flowing. Voltage is how strong the electric power is. First check wall AC at the charger cord. Then read pack voltage after two minutes of charging. Look at this number.",
      `Factory book: ${M} — Batteries do not charge`,
      ["a2", "j1", "bt1"],
      "Pack voltage with charger ON",
      "DC volts on the pack, charger plugged in 2 minutes.",
      `≥ ${chargeMin} V and rising`,
      chargeMin,
      chargeMax,
      spec.voltage === 48 ? "56.8" : "43.5",
      { kind: "diagnosis", id: "tdx-charge-ok" },
      { kind: "diagnosis", id: "tdx-charger" },
    ),
    "tdir-fr": cont(
      "tdir-fr",
      "F&R one-direction test",
      "F&R is the direction switch. The big click switch (solenoid) clicks. But only one way works. On DCS/PDS, check the field metal pads (contacts) in the F&R first. On TCT, also think FIELD MISSING on one field lead. This check asks: is that path connected all the way?",
      `Factory book: ${M} — Operates in one direction only`,
      ["s3", "m1"],
      "Field path in the dead direction",
      "Ohms through the F&R field metal pads.",
      "Connected (good)",
      { kind: "diagnosis", id: "tdx-motor" },
      { kind: "diagnosis", id: "tdx-fr" },
    ),
    "tint-wiggle": obs(
      "tint-wiggle",
      "Wiggle test — 16-pin and click switch",
      "The big click switch (solenoid) sends power to the motor. If it cuts in and out, do this. Block the wheels. Use a light pedal. Wiggle the 16-pin. Wiggle the ITS (gas pedal sensor) wires. Wiggle the click switch cable ends. MAIN DROPOUT 1/2 is a click switch that opens while you drive, or while the cart is slowing itself with the motor.",
      `Factory book: ${M} — Intermittent operation`,
      ["a1", "s4", "k1"],
      "Did a wiggle drop the drive?",
      "One plug at a time.",
      "No dropout",
      [
        { id: "stable", label: "No dropout", result: "pass" },
        { id: "drop", label: "Found a dropout", result: "fail" },
      ],
      { kind: "diagnosis", id: "tdx-intermittent" },
      { kind: "diagnosis", id: "tdx-harness" },
      { caution: "Block the wheels." },
    ),
    "tfault": obs(
      "tfault",
      "1206HB / speed box fault code",
      spec.family === "tct"
        ? "The speed box (controller) is a Curtis 1206HB-5201. Factory book TXT TCT Section E lists these codes:\nHW FAILSAFE — speed box or power cables hooked up wrong. Cycle the key (KSI) to try again.\nFIELD MISSING — the field (magnet wires in the motor) or a field wire is broken.\nM− SHORTED — speed box or power cables are shorted.\nCURRENT SENSE FAULT — speed box, or too much power at the plug.\nMAIN DROPOUT 1/2 — the click switch opened while driving, or while the cart was slowing itself with the motor.\nMAIN DRIVER OFF/ON — speed box FET, or pin 12 shorted to ground.\nMOTOR STALL — motor is stuck, or the motor speed sensor is bad.\nMAIN COIL OPEN — the coil (small magnet wires that pull the click switch in) or its wiring is broken.\nSPEED SENSOR FAULT — motor speed sensor or its wiring.\nMAIN WELDED — click switch stuck shut (metal pads welded).\nHPD — key, direction switch, and gas pedal were used in the wrong order. It clears when the pedal is under 25 %.\nTHERMAL CUTBACK — hotter than 85 °C or colder than −25 °C, heavy load, or how the speed box is mounted.\nOVERVOLTAGE / LOW BATTERY VOLTAGE — the battery pack.\nTHROTTLE FAULT — gas pedal sensor (ITS) or its wiring.\nWhat the speed box does: 1 armature 0 · 2 field 0 · 3 click switch off · 4 limp 75 % · 5 slow armature limit · 8 throttle scaled to 0 · 9 walk-away."
        : "Read the speed box (controller) status LED / handset. PDS and DCS store gas-pedal, HPD, thermal, and field faults. Name the code before you replace the speed box.",
      `Factory book: ${M} — Controller faults and troubleshooting`,
      ["a1", "s4", "k1", "m1"],
      "Which stored fault is present?",
      "1311 display / status LED / handset.",
      "Fault named",
      [
        { id: "none", label: "No code — use will-not-operate tree", result: "branch", branchId: "none" },
        { id: "hw", label: "HW FAILSAFE", result: "branch", branchId: "hw" },
        { id: "field", label: "FIELD MISSING", result: "branch", branchId: "field" },
        { id: "thr", label: "THROTTLE FAULT", result: "branch", branchId: "thr" },
        { id: "hpd", label: "HPD (high pedal disable)", result: "branch", branchId: "hpd" },
        { id: "thermal", label: "THERMAL CUTBACK", result: "branch", branchId: "thermal" },
        { id: "speed", label: "SPEED SENSOR / MOTOR STALL", result: "branch", branchId: "speed" },
        { id: "welded", label: "MAIN WELDED / DROPOUT / COIL OPEN", result: "branch", branchId: "welded" },
        { id: "low", label: "LOW BATTERY / OVERVOLTAGE", result: "branch", branchId: "low" },
      ],
      { kind: "step", id: "tno-setup" },
      { kind: "step", id: "tno-setup" },
      {
        branches: {
          none: { kind: "step", id: "tno-setup" },
          hw: { kind: "diagnosis", id: "tdx-controller" },
          field: { kind: "step", id: "tno-field" },
          thr: { kind: "step", id: "tno-its" },
          hpd: { kind: "diagnosis", id: "tdx-hpd" },
          thermal: { kind: "diagnosis", id: "tdx-thermal" },
          speed: { kind: "diagnosis", id: "tdx-speed" },
          welded: { kind: "step", id: "tno-coil-r" },
          low: { kind: "diagnosis", id: "tdx-pack" },
        },
      },
    ),
  };

  const diagnoses: Record<string, Diagnosis> = {
    "tdx-setup": dx("tdx-setup", "The cart is not set up to run", "Run/Tow, key, F&R (direction switch), or cables are not set to run.", "Run/Tow left in Tow is the most common TXT ‘dead cart’. TCT also needs 30 s in Tow after you hook the batteries back up.", "Set Tow for 30 s if the pack was just hooked up. Then Run, key ON, Forward. Unplug the charger.", [], "info"),
    "tdx-pack": dx("tdx-pack", "Battery pack is too low", "The pack cannot feed the speed box (controller) or the motor (LOW BATTERY VOLTAGE on 1206HB).", "Dead or failed batteries, or crusty terminals.", "Charge, then load-test. Replace as a matched set if more than one battery is weak.", [{ name: spec.packCells }], "replace"),
    "tdx-tow": dx("tdx-tow", "Run/Tow or 16-pin red is broken", "Speed box (controller) KSI (turn-on power) is missing.", "Run/Tow switch or the red lead to the 16-pin.", "Replace the Run/Tow switch if it does not pass pack voltage in Run. Fix the red lead.", [{ name: "Run/Tow switch" }], "replace"),
    "tdx-its": dx("tdx-its", `${spec.throttleName} out of range`, `The signal is not in the factory window (${spec.itsClick.label} at click, ${spec.itsFull.label} full). THROTTLE FAULT on 1206HB.`, "Failed ITS / pot (gas pedal sensor), damaged pedal magnet, or broken yellow lead.", `Replace the ${spec.throttleName}. After you install it, check both click and full-pedal voltages before you let the cart go.`, [{ name: spec.throttleName }], "replace"),
    "tdx-key-fr": dx("tdx-key-fr", "Key or F&R path is broken", "ITS (gas pedal sensor) is in range. But the click switch coil is not seeing pack voltage.", "Key switch, F&R in-gear switch, or a blown fuse.", "Check F1. Then check key output. Then check the F&R in-gear small switch.", [{ name: "Key switch" }, { name: "F&R switch" }], "replace"),
    "tdx-solenoid-coil": dx("tdx-solenoid-coil", "Click switch coil is broken or shorted", `Coil ohms are out of ${spec.solenoidCoil.label}. MAIN COIL OPEN on 1206HB.`, "Failed coil (small magnet wires).", "Replace the 4-post big click switch (solenoid).", [{ name: `${spec.voltage} V 4-terminal solenoid` }], "replace"),
    "tdx-solenoid-mech": dx("tdx-solenoid-mech", "Click switch is stuck", "Coil ohms and coil voltage are good. The plunger (moving pin) did not move.", "Stuck plunger (moving pin).", "Replace the big click switch (solenoid).", [{ name: `${spec.voltage} V 4-terminal solenoid` }], "replace"),
    "tdx-solenoid-contacts": dx("tdx-solenoid-contacts", "Click switch metal pads are not passing power", "Click without pack voltage on L2, or the big posts are welded (MAIN WELDED).", "Rough or welded big contacts (metal pads).", "Replace the big click switch (solenoid). Look at the motor and speed box (controller) for the overload.", [{ name: `${spec.voltage} V 4-terminal solenoid` }], "replace"),
    "tdx-motor": dx("tdx-motor", "Drive motor fault", "Armature (spinning part) or field (magnet wires) is out of spec, or FIELD MISSING is stored with a broken field.", "Worn brushes, a broken winding, or a short to the case.", "Service the brushes or replace the motor.", [{ name: "TXT traction motor" }], "replace"),
    "tdx-controller": dx("tdx-controller", `${spec.controllerName} fault`, "Logic power, gas pedal sensor, click switch metal pads, and motor ohms passed — or HW FAILSAFE / CURRENT SENSE / MAIN DRIVER is stored.", "Failed power section or power cables hooked up wrong (HW FAILSAFE).", "Check power-cable direction. Push the 16-pin in again. Then replace the speed box (controller).", [{ name: spec.controllerName }], "replace"),
    "tdx-slow": dx("tdx-slow", "Low power — drag or speed box limit", "Gas pedal sensor and pack under load passed. What’s left is brake drag, soft tires, or a speed box (controller) power / heat limit.", "Mechanical drag or heat limit.", "Check brakes and tires first. Then check the speed box (controller).", [], "service"),
    "tdx-charger": dx("tdx-charger", "Charger / plug fault", "The pack does not go up while charging.", "Failed onboard charger or burned plug.", "Check AC at the cord. Look at J1. Replace the charger if DC stays low.", [{ name: "Onboard charger" }, { name: "Receptacle" }], "replace"),
    "tdx-charge-ok": dx("tdx-charge-ok", "Charge voltage is in range", "The charger is putting power out. If the pack is low next morning, test the batteries.", "Battery condition, not the charger.", "Load-test the pack.", [], "info"),
    "tdx-fr": dx("tdx-fr", "F&R switch — field metal pads", "The dead direction is the F&R field path.", "Burned F&R contacts (metal pads).", "Replace the F&R switch (direction switch).", [{ name: "F&R switch" }], "replace"),
    "tdx-harness": dx("tdx-harness", "Loose wires or cable end", "A wiggle made it drop out (MAIN DROPOUT if it is the big click switch).", "16-pin, ITS (gas pedal sensor) plug, or click switch cable end.", "Fix the connection that dropped out.", [], "service"),
    "tdx-intermittent": dx("tdx-intermittent", "Cuts in and out — speed box inside", "Wiggling the outside plugs did not make it drop.", "Heat inside, or a cracked solder joint.", "Heat-cycle road test. Then replace the speed box (controller) if it drops out.", [{ name: spec.controllerName }], "service"),
    "tdx-hpd": dx("tdx-hpd", "HPD — high pedal disable", "The speed box (controller) powered up with key, direction switch, and gas pedal already pressed. Response 8 (throttle scaled to 0) until the pedal is under 25 %.", "Wrong key/pedal order, or a gas pedal sensor stuck off idle.", "Foot off the pedal. Key OFF. Then key ON. Then F&R direction switch. Then pedal. If HPD comes back with the pedal up, replace the ITS (gas pedal sensor).", [{ name: spec.throttleName, notes: "If HPD comes back with the pedal up" }], "info"),
    "tdx-thermal": dx("tdx-thermal", "Thermal cutback (too hot or too cold)", "Temperature > 85 °C or < −25 °C. Response 5 (slow armature current limit).", "Overload, dragging brakes, or the speed box (controller) is not on a clean heat sink.", "Let it cool. Check the mount and the brakes. If it cuts back when cold, replace the speed box (controller).", [{ name: spec.controllerName, notes: "If it cuts back when cold" }], "service"),
    "tdx-speed": dx("tdx-speed", "Speed sensor / motor stall", "No speed pulses with the click switch closed (SPEED SENSOR FAULT), or high armature current with no pulses (MOTOR STALL).", "Failed tail sensor, broken wiring, or the motor is really stuck.", "Look at the speed-sensor plug. Replace the sensor if it does not pulse while you turn the shaft in Tow. Do not hold a cart on a hill with the pedal.", [{ name: "Motor speed sensor" }], "replace"),
  };

  const symptoms: SymptomDef[] = [
    { id: "no-operation", label: "Will not run", summary: "No roll, with or without a click. Pack first. Then KSI. Then ITS (gas pedal sensor). Then the big click switch. Then the motor.", manualSection: `${M} — Will not operate`, startStepId: "tno-setup" },
    { id: "runs-slowly", label: "Runs slow / limp", summary: "It moves but will not reach speed. Check the ITS (gas pedal sensor) full-pedal window. Check the pack under load.", manualSection: `${M} — Operates slowly`, startStepId: "tsl-its" },
    { id: "fault-code", label: "Speed box fault code", summary: spec.family === "tct" ? "1206HB-5201 code: HW FAILSAFE, FIELD MISSING, THROTTLE FAULT, HPD, THERMAL CUTBACK, …" : "Stored speed box (controller) fault.", manualSection: `${M} — Controller faults`, startStepId: "tfault" },
    { id: "one-direction", label: "Runs one way only", summary: "The big click switch clicks. One direction is dead.", manualSection: `${M} — One direction only`, startStepId: "tdir-fr" },
    { id: "not-charging", label: "Batteries do not charge", summary: "Charger will not run, or the pack is still low in the morning.", manualSection: `${M} — Batteries do not charge`, startStepId: "tchg-ac" },
    { id: "intermittent", label: "Cuts in and out", summary: "Cuts out over bumps or after it warms up.", manualSection: `${M} — Intermittent`, startStepId: "tint-wiggle" },
    { id: "hpd", label: "HPD / no go after key-on with pedal", summary: "Gas pedal was pressed before key and direction switch. 1206HB HPD.", manualSection: `${M} — HPD`, startStepId: "tfault" },
  ];

  return {
    id: spec.id,
    manufacturer: "ezgo",
    manufacturerLabel: "EZ-GO",
    name: spec.name,
    fullName: spec.fullName,
    voltage: spec.voltage,
    powertrain: "electric",
    architecture: spec.architecture,
    years: spec.years,
    diagramTitle: spec.diagramTitle,
    diagramNotes: spec.diagramNotes,
    components,
    wires,
    testPoints,
    symptoms,
    steps,
    diagnoses,
  };
}
