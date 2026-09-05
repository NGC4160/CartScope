import { dx, obs, ohm, volt, yesNo } from "@/data/helpers";
import { acPowerLayout } from "@/data/layouts";
import type { Diagnosis, DiagnosticStep, ModelPack, SymptomDef } from "@/data/types";

export interface AcDriveSpec {
  id: string;
  manufacturer: "ezgo" | "yamaha";
  manufacturerLabel: string;
  name: string;
  fullName: string;
  years: string;
  architecture: string;
  diagramTitle: string;
  diagramNotes: string[];
  controllerName: string;
  controllerDesc: string;
  motorName: string;
  brakeName: string;
  brakeOhms: { min: number; max: number; label: string };
  phaseOhms: { min: number; max: number; label: string };
  throttleUp: { min: number; max: number; label: string };
  throttleFull: { min: number; max: number; label: string };
  packRested: { min: number; max: number; label: string };
  packCells: string;
  packMinV: number;
  manualPrefix: string;
  errorNotes: string;
}

export function buildAcDrive(spec: AcDriveSpec): ModelPack {
  const M = spec.manualPrefix;
  const { components, wires, testPoints } = acPowerLayout({
    battery: {
      name: "Battery pack",
      description: `${spec.packCells}. The pack is the whole set of batteries. An AC drive will not fill up or let go of the park brake below logic minimum (${spec.packMinV} V).`,
      commonFailures: ["Pack too low — brake will not let go", "Green crust on the main lugs", "One 12 V battery down (four-battery packs)"],
      expectedValues: [
        { label: "Pack at rest", value: spec.packRested.label },
        { label: "Lowest to diagnose", value: `≥ ${spec.packMinV} V` },
      ],
    },
    tow: {
      name: "Run / Tow switch",
      description: "Run/Tow is the work/drive switch on the battery well. RUN = ready to drive. TOW = off for work. Set TOW before jumpers or trailer loading. Towing an AC cart in RUN can wreck the controller.",
      commonFailures: ["Left in TOW", "Broken rocker"],
      expectedValues: [{ label: "RUN", value: "Logic power present" }],
    },
    solenoid: {
      name: "Main solenoid",
      description:
        "The solenoid is the main power switch. It sends pack power so the controller can fill up. A click is required. The cart still will not move if the electric park brake is not released. RXV 12576 DC Bus Timeout: pack ≥ 42 V, then check power across the metal pads inside.",
      commonFailures: ["No click — coil or enable", "Click but no brake release", "Metal pads drop-out (DC bus timeout)"],
      expectedValues: [
        { label: "Coil (small magnet wires)", value: "Connected all the way; pack V when on" },
        { label: "Metal pads, enabled", value: "Pack power on L2" },
        { label: "Drop across metal pads (12576/12833)", value: "If 3–24 V, suspect the solenoid" },
      ],
    },
    controller: {
      name: spec.controllerName,
      description: spec.controllerDesc,
      commonFailures: ["Limp after speed-sensor or brake fault", "Failed after being towed in RUN", "Stored error code (see error-code symptom)"],
      expectedValues: [
        { label: "Logic power, RUN", value: "Pack voltage" },
        { label: "Throttle 5 V ref", value: "4.8–5.2 V" },
      ],
    },
    motor: {
      name: spec.motorName,
      description: `Three-phase AC drive motor with a speed sensor (encoder) on the tail. Phase-to-phase ${spec.phaseOhms.label} and nearly equal. A failed encoder puts the cart in limp or no-move.`,
      commonFailures: ["Open phase", "Failed motor speed sensor / encoder", "Water in the encoder cap"],
      expectedValues: [
        { label: "U–V, V–W, W–U", value: spec.phaseOhms.label },
        { label: "Any phase to case", value: "Open" },
      ],
    },
    key: {
      name: "Key switch",
      description: "Dash key. An AC drive will not let go of the park brake with the key off. Key-cycle is the first step on most error codes.",
      commonFailures: ["Worn contacts (metal pads)"],
      expectedValues: [{ label: "ON", value: "Pack / logic voltage" }],
    },
    fr: {
      name: "FNR rocker (direction switch)",
      description: "Forward / Neutral / Reverse rocker. Neutral is a hard stop — no brake release, no roll. RXV 25104 Direction Error is this switch / harness.",
      commonFailures: ["Neutral switch stuck", "One-direction microswitch"],
      expectedValues: [{ label: "F or R selected", value: "Direction input present" }],
    },
    throttle: {
      name: "Inductive throttle (gas pedal sensor)",
      description: `The gas pedal sensor (ITS) tells the cart how hard you press the pedal. Controller 5 V reference in. Signal ${spec.throttleUp.label} at rest, ${spec.throttleFull.label} full. RXV: the number must be ≤ 0.85 V when the pedal switch closes.`,
      commonFailures: ["Signal stuck low", "5 V ref missing", "Gas pedal sensor > 0.85 V at switch close"],
      expectedValues: [
        { label: "5 V reference", value: "4.8–5.2 V" },
        { label: "Pedal rest", value: spec.throttleUp.label },
        { label: "Full pedal", value: spec.throttleFull.label },
      ],
    },
    brake: {
      name: spec.brakeName,
      description: `Spring-applied, electrically released rear park brake. If the controller does not turn on the brake coil, the cart will not move even with a clicking solenoid. Factory coil ${spec.brakeOhms.label}.`,
      commonFailures: ["Open brake coil", "Controller not telling it to let go", "Stuck mechanically", "Brake sensor error"],
      expectedValues: [
        { label: "Coil ohms", value: spec.brakeOhms.label },
        { label: "Release voltage, in gear + pedal", value: "Pack power" },
      ],
    },
    fuse: {
      name: "Control fuse",
      description: "Logic / key fuse. Open after a brake-coil short is common.",
      commonFailures: ["Opens after a brake-coil short"],
      expectedValues: [{ label: "Is the fuse connected all the way?", value: "Connected (good)" }],
    },
    receptacle: {
      name: "Charger / plug",
      description: "Onboard charger DC path. The safety lock that stops the cart must drop when the cord is out. A stuck cord is a no-move.",
      commonFailures: ["Stuck safety lock", "No DC output"],
      expectedValues: [{ label: "Pack while charging", value: "Going up ≥ 50 V" }],
    },
  });

  const steps: Record<string, DiagnosticStep> = {
    "rno-setup": obs(
      "rno-setup",
      "Set the cart up to test",
      "Now do this. Put Run/Tow in RUN (ready to drive). Turn the key ON. Put FNR (the direction switch) in Forward, not Neutral. Unplug the charger. Write down any controller error / warning on the display or LED before you clear it.",
      `Factory book: ${M} — Vehicle will not operate`,
      ["s1", "s2", "s3", "a1", "j1"],
      "RUN, key ON, Forward, charger out?",
      "Look at the switches. Write down the error code if shown.",
      "All set",
      yesNo("All set — keep going", "A switch is wrong / charger still plugged in", false),
      { kind: "step", id: "rno-pack" },
      { kind: "diagnosis", id: "rdx-setup" },
      { caution: "Never tow an AC cart with Run/Tow in RUN." },
    ),
    "rno-pack": volt(
      "rno-pack",
      "Pack voltage (four-battery 48 V)",
      `Key OFF. Voltage is how strong the electric power is. Read pack voltage at the main posts. ${spec.packCells}. Factory lowest to diagnose / let the brake go is ${spec.packMinV} V (RXV 12576 / 12833 DC bus tests use 42 V minimum, 63 V maximum).`,
      `Factory book: ${M} — Battery pack`,
      ["bt1"],
      "Pack voltage",
      "DC volts, pack B+ to B−.",
      spec.packRested.label,
      spec.packRested.min,
      spec.packRested.max,
      "50.2",
      { kind: "step", id: "rno-click" },
      { kind: "diagnosis", id: "rdx-pack" },
    ),
    "rno-click": obs(
      "rno-click",
      "Listen for the solenoid",
      "The solenoid is the main power switch. Now do this. Key ON, direction switch (FNR) Forward, light pedal. Listen for the click. A click without movement points at the park brake, not the solenoid.",
      `Factory book: ${M} — Solenoid / enable`,
      ["k1"],
      "Did the solenoid click?",
      "Listen at K1.",
      "Click",
      [
        { id: "click", label: "The solenoid clicked", result: "pass" },
        { id: "noclick", label: "No click", result: "fail" },
      ],
      { kind: "step", id: "rno-brake" },
      { kind: "step", id: "rno-logic" },
    ),
    "rno-logic": volt(
      "rno-logic",
      "Controller logic power",
      "RUN, key ON. Read logic feed at the controller signal plug (Run/Tow output).",
      `Factory book: ${M} — Run/Tow and logic power`,
      ["s1", "a1", "w-s1-a"],
      "Logic feed at the controller, RUN + key ON",
      "DC volts at the RUN input of the signal plug.",
      "Pack voltage",
      spec.packMinV - 1,
      spec.packRested.max,
      "49.6",
      { kind: "step", id: "rno-throttle" },
      { kind: "diagnosis", id: "rdx-tow" },
    ),
    "rno-throttle": volt(
      "rno-throttle",
      "Gas pedal sensor at full pedal",
      `The gas pedal sensor (ITS) tells the cart how hard you press the pedal. First check 5 V reference (4.8–5.2 V). Then read the sensor at full pedal. Factory rest ${spec.throttleUp.label}; full ${spec.throttleFull.label}. RXV: the number must be ≤ 0.85 V when the pedal switch closes.`,
      `Factory book: ${M} — Throttle input`,
      ["s4", "a1", "w-its", "w-5v"],
      "Gas pedal sensor, full pedal",
      "DC volts, signal wire to B−, pedal down.",
      spec.throttleFull.label,
      spec.throttleFull.min,
      spec.throttleFull.max,
      "4.2",
      { kind: "step", id: "rno-coil" },
      { kind: "diagnosis", id: "rdx-throttle" },
    ),
    "rno-coil": volt(
      "rno-coil",
      "Solenoid coil power",
      "The coil is the small magnet wires that pull the solenoid in. Now check if the power is flowing. Voltage is how strong the electric power is. Pedal down, direction switch Forward. Measure across the coil.",
      `Factory book: ${M} — Solenoid coil`,
      ["k1", "s3"],
      "Coil voltage, enabled",
      "DC volts, small posts.",
      "Pack voltage",
      spec.packMinV - 2,
      spec.packRested.max,
      "49.0",
      { kind: "diagnosis", id: "rdx-solenoid" },
      { kind: "diagnosis", id: "rdx-fnr" },
    ),
    "rno-brake": volt(
      "rno-brake",
      "Park-brake release voltage",
      "The park brake is the electric park brake. The solenoid clicked but the cart did not move. Now check if the power is flowing. Voltage is how strong the electric power is. Read power at the park-brake coil while in gear with a light pedal. No power = controller not telling it to let go. Power present = stuck brake or motor speed sensor. Then read coil ohms.",
      `Factory book: ${M} — Parking brake will not release`,
      ["br1", "w-brk", "a1"],
      "Brake-release coil voltage (in gear, light pedal)",
      "DC volts at BR1 coil. Wheels blocked.",
      "Pack voltage while enabled",
      spec.packMinV - 2,
      spec.packRested.max,
      "48.7",
      { kind: "step", id: "rno-brake-r" },
      { kind: "diagnosis", id: "rdx-brake-cmd" },
      { caution: "Block the wheels. The spring brake is on whenever this coil is dark." },
    ),
    "rno-brake-r": ohm(
      "rno-brake-r",
      "Park-brake coil ohms",
      `Ohms (Ω) tell you how hard it is for power to flow. OL means the path is open (broken). Factory coil ${spec.brakeOhms.label} (RXV Section O, error 25107 startup test). Out of range = replace the brake assembly.`,
      `Factory book: ${M} — Brake coil resistance`,
      ["br1"],
      "Park-brake coil ohms",
      "Ohms across BR1 coil, connector off.",
      spec.brakeOhms.label,
      spec.brakeOhms.min,
      spec.brakeOhms.max,
      "27",
      { kind: "step", id: "rno-phase" },
      { kind: "diagnosis", id: "rdx-brake-coil" },
    ),
    "rno-phase": ohm(
      "rno-phase",
      "Motor phase ohms (U-V / V-W / W-U)",
      `TOW, main B− off. Unplug U, V, W from the controller. Read U–V, V–W, W–U. Factory ${spec.phaseOhms.label} and all three nearly equal. Out of range = replace motor (RXV 8976 / 9024 ACTION 1). In range and still dead = controller (ACTION 2).`,
      `Factory book: ${M} — Motor tests / errors 8976 and 9024`,
      ["m1", "w-u", "w-v", "w-w"],
      "U–V phase ohms",
      "Ohms between phase U and V at the motor, cables off the controller.",
      spec.phaseOhms.label,
      spec.phaseOhms.min,
      spec.phaseOhms.max,
      "0.55",
      { kind: "step", id: "rno-enc" },
      { kind: "diagnosis", id: "rdx-motor" },
      { caution: "Take off the main negative. Never probe U/V/W as pack voltage while the controller is running." },
    ),
    "rno-enc": obs(
      "rno-enc",
      "Motor speed sensor / encoder",
      "The encoder is the motor speed sensor. Look at the encoder cap on the motor tail for water or a loose plug. 5 V at the encoder supply and a toggling signal while turning the shaft (TOW).",
      `Factory book: ${M} — Speed sensor`,
      ["m1", "w-enc", "a1"],
      "Encoder supply and connector",
      "Look, plus 5 V at encoder supply if a meter is used.",
      "Dry, seated, 5 V present",
      yesNo("Encoder dry, plugged, 5 V present", "Water, unplugged, or no 5 V"),
      { kind: "diagnosis", id: "rdx-controller" },
      { kind: "diagnosis", id: "rdx-encoder" },
    ),
    "rerr": obs(
      "rerr",
      "AC error / warning code",
      spec.errorNotes,
      `Factory book: ${M} — Error messages`,
      ["a1", "m1", "br1", "k1", "bt1"],
      "Which code is displayed (or last stored)?",
      "Display / ERROR LOG. Write it down before key-cycling.",
      "Code named",
      [
        { id: "none", label: "No code — use will-not-operate tree", result: "branch", branchId: "none" },
        { id: "8976", label: "8976 AC Over Current", result: "branch", branchId: "8976" },
        { id: "9024", label: "9024 AC Short Circuit", result: "branch", branchId: "9024" },
        { id: "12576", label: "12576 DC Bus Timeout", result: "branch", branchId: "12576" },
        { id: "12817", label: "12817 / 12818 DC Bus High", result: "branch", branchId: "12817" },
        { id: "12833", label: "12833 DC Bus Low", result: "branch", branchId: "12833" },
        { id: "16912", label: "16912 Motor Temp High", result: "branch", branchId: "16912" },
        { id: "17168", label: "17168 Heat Sink Temp High", result: "branch", branchId: "17168" },
        { id: "20755", label: "20755 5 V Supply Low/High", result: "branch", branchId: "20755" },
        { id: "25107", label: "25107 Park Brake / startup", result: "branch", branchId: "25107" },
        { id: "25104", label: "25104 Direction Error", result: "branch", branchId: "25104" },
        { id: "other", label: "Other code / warning", result: "branch", branchId: "other" },
      ],
      { kind: "step", id: "rno-setup" },
      { kind: "step", id: "rno-setup" },
      {
        branches: {
          none: { kind: "step", id: "rno-setup" },
          "8976": { kind: "step", id: "rno-phase" },
          "9024": { kind: "step", id: "rno-phase" },
          "12576": { kind: "step", id: "rno-pack" },
          "12817": { kind: "step", id: "rno-pack" },
          "12833": { kind: "step", id: "rno-pack" },
          "16912": { kind: "diagnosis", id: "rdx-motor-temp" },
          "17168": { kind: "diagnosis", id: "rdx-hs-temp" },
          "20755": { kind: "diagnosis", id: "rdx-5v" },
          "25107": { kind: "step", id: "rno-brake-r" },
          "25104": { kind: "diagnosis", id: "rdx-fnr" },
          other: { kind: "step", id: "rno-setup" },
        },
      },
    ),
    "rlimp-reset": obs(
      "rlimp-reset",
      "Limp-mode trigger",
      "Reduced-speed / limp is a stored controller fault. Do not reset first — name the trigger (brake switch, encoder / motor speed sensor, throttle 5 V, overtemp). After the cause is fixed: key-cycle, then if needed disconnect main B− for 30 seconds.",
      `Factory book: ${M} — Reduced speed / limp`,
      ["a1", "s4", "m1", "br1"],
      "Has the triggering fault been repaired?",
      "Status LED / last-known test. Do not pack-disconnect to ‘clear’ a live fault.",
      "Cause repaired",
      yesNo("Cause found and repaired — reset next", "Trigger not found — keep testing"),
      { kind: "diagnosis", id: "rdx-limp-reset" },
      { kind: "step", id: "rno-throttle" },
    ),
    "rchg": volt(
      "rchg",
      "Pack voltage while charging",
      "Unplug first if the cart will not move (a safety lock that stops the cart). Then plug in the onboard charger. After two minutes, read pack power. Voltage is how strong the electric power is.",
      `Factory book: ${M} — Charger does not charge`,
      ["j1", "bt1"],
      "Pack voltage, charger ON",
      "DC volts on pack posts.",
      "≥ 50 V and rising",
      50,
      70,
      "57.0",
      { kind: "diagnosis", id: "rdx-charge-ok" },
      { kind: "diagnosis", id: "rdx-charger" },
    ),
    "rint": obs(
      "rint",
      "Wiggle test — signal plug and encoder",
      "The encoder is the motor speed sensor. If AC cuts in and out: wiggle the controller signal plug, encoder cap, and brake connector with a light pedal, wheels blocked.",
      `Factory book: ${M} — Intermittent operation`,
      ["a1", "m1", "br1"],
      "Did a wiggle drop drive or put the brake back on?",
      "One plug at a time.",
      "No dropout",
      [
        { id: "stable", label: "No dropout", result: "pass" },
        { id: "drop", label: "Found a dropout", result: "fail" },
      ],
      { kind: "diagnosis", id: "rdx-intermittent" },
      { kind: "diagnosis", id: "rdx-harness" },
      { caution: "Block the wheels. Stay clear of the AC motor." },
    ),
  };

  const diagnoses: Record<string, Diagnosis> = {
    "rdx-setup": dx("rdx-setup", "The cart is not set up to run", "The cart will not run in Neutral, TOW, key OFF, or with the charger still plugged in.", "Direction switch in Neutral, Run/Tow in TOW, or charger safety lock.", "Set RUN, key ON, Forward, unplug charger.", [], "info"),
    "rdx-pack": dx("rdx-pack", "Battery pack is too low", `Pack is below ${spec.packMinV} V (RXV four 12 V batteries, 42 V minimum / 63 V maximum on DC-bus tests).`, "Dead pack or one failed 12 V battery.", "Charge, then load-test each 12 V. Replace as a set if more than one is down.", [{ name: spec.packCells }], "replace"),
    "rdx-tow": dx("rdx-tow", "Run/Tow or logic power is open", "The controller is not powered.", "Run/Tow switch or logic fuse.", "Replace Run/Tow if it does not pass power in RUN.", [{ name: "Run/Tow switch" }, { name: "Control fuse" }], "replace"),
    "rdx-throttle": dx("rdx-throttle", "Gas pedal sensor is not in range", "The gas pedal sensor (ITS) never reaches the window, 5 V is missing, or the number is > 0.85 V when the pedal switch closes.", "Failed pedal sensor or controller 5 V supply.", "Check 5 V at the pedal. If 5 V is good, replace the gas pedal sensor. If 5 V is missing, look at the controller supply (20755).", [{ name: "Gas pedal sensor (ITS)" }], "replace"),
    "rdx-fnr": dx("rdx-fnr", "Direction switch (FNR)", "The controller is not seeing a direction request (25104 Direction Error), so it will not turn on the solenoid or let the brake go.", "Direction switch or harness.", "Replace the direction switch (FNR). Make sure Neutral really opens.", [{ name: "Direction switch (FNR)" }], "replace"),
    "rdx-solenoid": dx("rdx-solenoid", "Solenoid failed", "Coil power is there but the unit does not click, or the metal pads drop 3–24 V (12576 / 12818 ACTION 3).", "Open/short coil, stuck plunger, or burned metal pads inside.", "Replace the solenoid. Then re-test brake release.", [{ name: "48 V solenoid" }], "replace"),
    "rdx-brake-cmd": dx("rdx-brake-cmd", "Park brake not told to let go", "The solenoid clicked; brake-release power is missing. The cart cannot move with the spring brake on.", "Controller brake output, stored brake fault, or open BR1 feed.", "Read BR1 coil ohms next. If the coil is good, fix the controller brake output. Do not defeat the brake by hand to make it roll.", [{ name: "Electric park-brake assembly" }], "replace"),
    "rdx-brake-coil": dx("rdx-brake-coil", "Park-brake coil not in the factory book range", `Coil is not ${spec.brakeOhms.label} (RXV 25107).`, "Open or shorted brake coil.", "Replace the electric park-brake assembly. Check for 27 ± 3 Ω on the new unit.", [{ name: "Electric park-brake assembly" }], "replace"),
    "rdx-motor": dx("rdx-motor", "AC motor phase fault", `Phase ohms are open, unequal, or outside ${spec.phaseOhms.label} (8976 / 9024 ACTION 1).`, "Open winding or water-damaged motor.", "Replace the AC motor. Move the encoder (motor speed sensor) only if it tested good.", [{ name: spec.motorName }], "replace"),
    "rdx-encoder": dx("rdx-encoder", "Motor speed sensor / encoder fault", "Encoder is wet, unplugged, or has no 5 V. AC drive will limp or refuse to move.", "Water in the encoder cap or a failed sensor.", "Dry and reseat. Replace the encoder if 5 V is present but there is no toggle while turning the shaft.", [{ name: "Motor speed sensor / encoder" }], "replace"),
    "rdx-controller": dx("rdx-controller", "AC controller fault", "Pack, solenoid, brake release, motor phases, and speed-sensor supply all passed — or 8976/9024 ACTION 2 after a good motor.", "Failed controller (often after being towed in RUN).", "Replace the controller. After install, clear limp with a key-cycle, then a short roll test.", [{ name: spec.controllerName }], "replace"),
    "rdx-limp-reset": dx("rdx-limp-reset", "Clear limp after the cause is fixed", "The triggering fault has been repaired. Reset is now allowed.", "Stored fault still held.", "Key OFF 10 seconds, key ON. If limp remains, disconnect main B− for 30 seconds and reconnect. Do a full-speed roll test.", [], "info"),
    "rdx-charger": dx("rdx-charger", "Onboard charger fault", "The pack does not rise while charging.", "Failed charger or AC supply.", "Check wall AC, then replace the onboard charger.", [{ name: "Onboard charger" }], "replace"),
    "rdx-charge-ok": dx("rdx-charge-ok", "Charge voltage is in range", "The charger is putting power out. Morning-low packs are battery condition.", "Batteries, not the charger.", "Load-test the pack.", [], "info"),
    "rdx-harness": dx("rdx-harness", "Loose connector", "A wiggle made the fault come back.", "Signal plug, encoder, or brake connector.", "Fix the connection that dropped out.", [], "service"),
    "rdx-intermittent": dx("rdx-intermittent", "Cuts in and out — controller inside", "Wiggling the outside plugs did not make it drop.", "Heat limp or a cracked solder joint in the controller.", "Heat-cycle road test, then replace the controller if it drops out.", [{ name: spec.controllerName }], "service"),
    "rdx-motor-temp": dx("rdx-motor-temp", "16912 Motor Temp High", "Motor ≥ 150 °C (302 °F). Thermocouple 1300 Ω = 150 °C; spec is 400–1300 Ω.", "Overload, grade, or failed thermocouple.", "Check outside motor temp < 120 °C. If thermocouple is outside 400–1300 Ω, replace the motor. Otherwise cool and reduce payload.", [{ name: spec.motorName, notes: "If thermocouple is out of 400–1300 Ω" }], "service"),
    "rdx-hs-temp": dx("rdx-hs-temp", "17168 Heat Sink Temp High", "Controller ≥ 120 °C. Outside heatsink should be < 80 °C (176 °F).", "Overload or blocked heatsink.", "Let it cool. Reduce payload/grade. If it overheats with no load, replace the controller.", [{ name: spec.controllerName }], "service"),
    "rdx-5v": dx("rdx-5v", "20755 5 V supply low or high", "Often a short in the 5 V wire harness, or controller inside 5 V. 20753 15 V supply low is often a shorted reverse alarm (100–500 Ω) or relay (1–50 Ω).", "Shorted 5 V harness, reverse alarm, or controller.", "Unplug the 23-pin. If 5 V comes back, repair the harness/gas pedal sensor. Reverse alarm 100–500 Ω; if not, replace the alarm. Otherwise replace the controller.", [{ name: "Gas pedal sensor / 5 V harness" }, { name: "Reverse alarm" }, { name: spec.controllerName }], "replace"),
  };

  const symptoms: SymptomDef[] = [
    { id: "no-operation", label: "Cart will not run", summary: "No roll. The solenoid may or may not click. Pack ≥ min V, then brake, then U/V/W.", manualSection: `${M} — Vehicle will not operate`, startStepId: "rno-setup" },
    { id: "error-code", label: "Error / warning code", summary: "Display or ERROR LOG code (8976, 9024, 12576, 12817, 25107, …).", manualSection: `${M} — Error messages`, startStepId: "rerr" },
    { id: "park-brake", label: "Park brake will not let go", summary: "The solenoid clicks; cart is locked. Coil " + spec.brakeOhms.label + ".", manualSection: `${M} — Parking brake will not release`, startStepId: "rno-brake" },
    { id: "limp", label: "Reduced speed / limp mode", summary: "Moves slowly with a stored controller fault.", manualSection: `${M} — Reduced speed`, startStepId: "rlimp-reset" },
    { id: "not-charging", label: "Charger does not charge / safety lock stuck", summary: "No charge power, or cart will not move with the cord out.", manualSection: `${M} — Charger`, startStepId: "rchg" },
    { id: "intermittent", label: "Cuts in and out", summary: "Drops out or puts the brake back on.", manualSection: `${M} — Intermittent`, startStepId: "rint" },
  ];

  return {
    id: spec.id,
    manufacturer: spec.manufacturer,
    manufacturerLabel: spec.manufacturerLabel,
    name: spec.name,
    fullName: spec.fullName,
    voltage: 48,
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
