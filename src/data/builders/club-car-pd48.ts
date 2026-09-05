import { cont, dx, obs, ohm, volt, yesNo } from "@/data/helpers";
import { dcPowerLayout } from "@/data/layouts";
import type { Diagnosis, DiagnosticStep, ModelPack, SymptomDef } from "@/data/types";

export interface Pd48Spec {
  id: string;
  name: string;
  fullName: string;
  years: string;
  architecture: string;
  diagramTitle: string;
  diagramNotes: string[];
  family: "pd48" | "pdplus";
  controllerName: string;
  controllerDesc: string;
  motorName: string;
  motorDesc: string;
  throttleName: string;
  throttleDesc: string;
  manualPrefix: string;
}

/**
 * Club Car PowerDrive System 48 (1995–96 Section 20) and PowerDrive Plus (Section 21).
 * Factory solenoid coil is 190–250 Ω (TP 5) with a flyback diode and a 250 Ω pre-charge resistor
 * across the large posts. Not IQ 16-pin / MCOR.
 */
export function buildClubCarPd48(spec: Pd48Spec): ModelPack {
  const M = spec.manualPrefix;
  const plus = spec.family === "pdplus";

  const { components, wires, testPoints } = dcPowerLayout({
    battery: {
      name: "48 V PowerDrive pack",
      description:
        "This pack is six 8 V Trojan PowerDrive batteries. Book test 1: at least 48 V sitting still. The warning light turns on below 48 V with no load. It also turns on below 25 % charge. Unplug at battery 1 minus first. Then drain leftover power in the speed box (controller). Turn the key ON. Set the direction switch (F&R) to Reverse. Hold the pedal until the reverse buzzer stops. Then you can unplug the speed box.",
      commonFailures: ["Pack below 48 V with no load (warning light on)", "Rusty cables between batteries", "One 8 V battery drops when you drive"],
      expectedValues: [
        { label: "Sitting-still pack (book test 1)", value: "≥ 48 V" },
        { label: "Warning light", value: "On if below 48 V with no load, or below 25 % charge" },
      ],
    },
    tow: {
      name: plus ? "Direction switch rocker (F&R enable)" : "Direction switch anti-spark limit (F&R)",
      description: plus
        ? "PowerDrive Plus uses a rocker direction switch (F&R), not a lever. Neutral means neither side is down. Neutral opens the control path. Zero Speed Detect fights roll with the key ON, even in Neutral. That is normal. Do not mix this up with later IQ carts. There is no Tow/Run switch (Tow = off for work. Run = ready to drive.) in the B− path on Plus."
        : "PowerDrive System 48 has no Tow/Run switch (Tow = off for work. Run = ready to drive.). The direction switch (F&R) has an anti-spark limit. It opens the big click switch (solenoid) before the metal pads inside (contacts) split. Book test 3: COM–NO is closed in gear. It is open in Neutral.",
      commonFailures: plus
        ? ["Rocker stuck in Neutral", "Failed Forward or Reverse side"]
        : ["Cam not pressing the lever", "Failed COM–NO"],
      expectedValues: plus
        ? [{ label: "Forward or Reverse selected", value: "Control path turned on" }]
        : [
            { label: "Neutral", value: "Open COM–NO" },
            { label: "In gear", value: "Closed COM–NO" },
          ],
    },
    solenoid: {
      name: plus ? "Main big click switch (solenoid) — Plus" : "Main big click switch (solenoid)",
      description:
        "Book test 5: take the diode and yellow wire off the small posts. Then read 190–250 Ω across the coil (small magnet wires that pull the click switch in). The one-way diode must pass power one way only. The red insulated diode end goes on the red-wire small post. A 250 Ω resistor sits across the big posts. It keeps leftover power in the speed box (controller). Check this resistor whenever a big click switch (solenoid) fails. " +
        (plus
          ? "Plus also has a brake click switch (Z5 brown). It also has an energy-dump module. The speed box drops the main click switch after 2 seconds of no use. Some early cars wait 20 seconds."
          : "Early 1995 multi-step cars have the 250 Ω resistor. They also have a 3.9 kΩ half-speed reverse resistor."),
      commonFailures: ["Coil not 190–250 Ω", "Shorted or open one-way diode", "Open 250 Ω pre-charge resistor", "Welded big posts"],
      expectedValues: [
        { label: "Turn-on coil (book test 5)", value: "190–250 Ω" },
        { label: "One-way diode", value: "One-way only; red terminal on red-wire post" },
        { label: "Pre-charge resistor", value: "≈ 250 Ω across big posts" },
      ],
    },
    controller: {
      name: spec.controllerName,
      description: spec.controllerDesc,
      commonFailures: plus
        ? ["Failed after being pushed with the key ON", "Rusty Z-plug", "Energy-dump module open"]
        : ["Failed after skipping the drain step", "Rusty terminal face (leak power)", "No M− sweep with a good gas pedal sensor"],
      expectedValues: plus
        ? [
            { label: "Z1 red from main big click switch (solenoid) L2", value: "48 V leftover power stored, key ON or OFF" },
            { label: "Z9 yellow gas pedal sensor wiper", value: "Changes with the pedal. HPD if below 3 V at key ON" },
            { label: "B+ to M− full pedal (book test 10)", value: "Full pack" },
          ]
        : [
            { label: "Terminal 1 / A input (book test 10.3)", value: "Full pack with big click switch (solenoid) closed" },
            { label: "B+ to M−, pedal down (book test 10.4)", value: "Rises to full pack" },
            { label: "Leftover power B+ to M−, pedal up", value: "~48 V" },
          ],
    },
    motor: {
      name: spec.motorName,
      description: spec.motorDesc,
      commonFailures: plus
        ? ["Open field (shunt means magnet wires)", "Failed speed sensor (Z13/Z14)", "Worn brushes"]
        : ["Open armature (spinning part)", "Worn brushes", "Loose A1/S1/S2/A2"],
      expectedValues: plus
        ? [
            { label: "Shunt field F1–F2", value: "Connected all the way, not shorted to case" },
            { label: "Armature A1–A2", value: "Connected all the way" },
          ]
        : [
            { label: "Direction switch Forward (book test 6): M− to S1, A2 to S2", value: "Connected all the way" },
            { label: "Direction switch Reverse (book test 6): M− to S2, A2 to S1", value: "Connected all the way" },
          ],
    },
    key: {
      name: "Key switch",
      description:
        "This is an ON–OFF key. Book test 2 is shared with Section 20. Drain leftover power this way. Turn the key ON. Set Reverse. Hold the pedal until the reverse buzzer dies. That dumps leftover power in the speed box (controller).",
      commonFailures: ["Open ON metal pads (contacts)"],
      expectedValues: [
        { label: "Key OFF", value: "Control path open" },
        { label: "Key ON", value: "Connected all the way through the control path" },
      ],
    },
    fr: {
      name: plus ? "Direction switch rocker (F&R)" : "Direction switch (F&R)",
      description: plus
        ? "Rocker picks Forward, Neutral, or Reverse. Z6 white is forward to the speed box (controller). Z7 blue is reverse. Neutral is neither side down. The cart will not run if you press the gas pedal in Neutral. Plus changes motor direction inside the speed box. It does not swap field cables through a rotor."
        : "Lever picks Forward, Neutral, or Reverse. It has three limit switches. One is anti-spark. One is the reverse buzzer. One is half-speed reverse. Book test 6: is the field path connected all the way. The half-speed reverse resistor is 3900 Ω ±10 % (multi-step gas pedal sensor). Or it is 5100 Ω ±10 % (smooth gas pedal sensor, serial A9529-445799+).",
      commonFailures: plus
        ? ["Rocker Neutral gap too wide", "Open white Z6 or blue Z7"]
        : ["Burned direction switch metal pads (contacts)", "Half-speed reverse limit stuck closed (full speed in reverse)"],
      expectedValues: plus
        ? [
            { label: "Forward (Z6 white)", value: "Pack V to speed box" },
            { label: "Reverse (Z7 blue)", value: "Pack V to speed box" },
          ]
        : [
            { label: "Half-speed reverse resistor", value: "3900 Ω ±10 % (multi-step) or 5100 Ω ±10 % (smooth gas pedal sensor)" },
          ],
    },
    throttle: {
      name: spec.throttleName,
      description: spec.throttleDesc,
      commonFailures: plus
        ? ["HPD: gas pedal sensor below 3 V at key ON", "Open yellow Z9 / purple Z10", "Limit switch (green/white Z8) open"]
        : ["Open step on the multi-step gas pedal sensor", "Smooth gas pedal sensor above 7000 Ω", "Gas pedal limit stuck closed (big click switch (solenoid) clicks on key-on)"],
      expectedValues: plus
        ? [
            { label: "HPD threshold (Z10)", value: "> 3 V at key ON (pedal up)" },
            { label: "Wiper (Z9 yellow)", value: "Sweeps with pedal" },
          ]
        : [
            { label: "Multi-step gas pedal sensor (book test 8)", value: "300 / 690 / 990 / 1740 / 2740 / 4940 Ω" },
            { label: "Full-speed window", value: "4600–7000 Ω" },
            { label: "Smooth gas pedal sensor (serial A9529-445799+)", value: "~0–300 Ω rest → ~5500 Ω full; never > 7000 Ω" },
          ],
    },
    computer: {
      name: "Cart computer (OBC)",
      kind: "computer",
      description: plus
        ? "The cart computer (OBC) tracks energy used and returned by motor braking. It runs the PowerDrive charger. It sets lockout (a safety lock that stops the cart) on the big click switch (solenoid) via Z12 (yellow) when the DC cord is in. Z11 green tells the speed box (controller) to switch from brake click to motor braking. That happens when the pack can take current. A 3/8 A fuse sits in the 18-gauge red from click switch L2. To reboot: unplug batteries. Drain leftover power in the speed box. Then reconnect. The warning light path is brown from the cart computer."
        : "The cart computer (OBC) runs the PowerDrive charger. It also runs big click switch (solenoid) lockout (a safety lock that stops the cart, book test 11). It also runs the dash warning light. To reboot: unplug batteries (Figure 20-1). Drain leftover power in the speed box (controller). Then reconnect. The sense-lead fuse is in the gray from the plug. Early unsealed holders take on water. Replace those with 1018963-02. Jumper the click switch yellow-wire small post to battery 6 minus. If the cart then runs, the cart computer safety lock has failed.",
      commonFailures: [
        "Cart computer safety lock after a wet plug",
        "Blown sense-lead fuse",
        plus ? "3/8 A cart computer feed fuse open" : "Cart computer locked up after a pack unplug",
      ],
      expectedValues: [
        { label: "Charger unplugged", value: "Big click switch (solenoid) safety lock off" },
        { label: "Warning light", value: "Off with pack ≥ 48 V no-load and above 25 % charge" },
      ],
    },
    receptacle: {
      name: "PowerDrive charger plug",
      description:
        "Gray sense lead goes to the cart computer (OBC). Water in the metal pads (contacts) can set lockout (a safety lock that stops the cart). That lock can sit on the big click switch (solenoid). That is book test 11. Seal the gray sense lead with butyl (NAPA 4196). A hot plug means replace the plug and/or the socket.",
      commonFailures: ["Water in metal pads (contacts)", "Unsealed sense lead", "No plug drag"],
      expectedValues: [{ label: "Sense lead", value: "Dry, sealed, fuse closed" }],
    },
    fuse: {
      name: plus ? "3/8 A cart computer + sense fuse" : "Sense-lead fuse / charger fuse link",
      description: plus
        ? "A 3/8 A fuse sits in the 18-gauge red from big click switch (solenoid) L2 to the cart computer (OBC). There is also a gray sense-lead fuse. Either open fuse kills charging. It can also hold the safety lock that stops the cart."
        : "Gray sense-lead fuse (waterproof holder 1018963-02 is better). Also the onboard charger fuse link. A blown fuse link means no charge.",
      commonFailures: ["Open after a wet pack", "Unsealed early holder"],
      expectedValues: [{ label: "Connected all the way", value: "Closed" }],
    },
    extraFuse: plus
      ? {
          name: "Energy-dump / brake click path",
          description:
            "This path is the energy-dump module plus the brake click switch. When the pack cannot take motor-braking charge, the brake click switch opens. Motor current then dumps in the energy-dump module. If pedal-up or pedal-down braking is dead, look at this path. Also look at the motor speed sensor (Z13 red / Z14 green).",
          commonFailures: ["Open energy-dump module", "Brake click switch stuck", "Speed sensor silent"],
          expectedValues: [{ label: "Pedal-up braking", value: "Slows to ~9 mph from > 12 mph" }],
        }
      : undefined,
    motorFieldLabel: plus ? { a2: "A2", f1: "F1", f2: "F2" } : { a2: "A2", f1: "S1", f2: "S2" },
  });

  const steps: Record<string, DiagnosticStep> = {
    "dno-setup": obs(
      "dno-setup",
      "Set the switches",
      "Now set the switches. Turn the key ON. Set the direction switch (F&R) to Forward. Plus: press the rocker F down. Unplug the charger. Put the seat down. Make sure pack cables are tight. " +
        (plus
          ? "PowerDrive Plus has no Tow/Run switch (Tow = off for work. Run = ready to drive.). Zero Speed Detect will fight a push with the key ON. That is normal. It is not a dragging brake."
          : "PowerDrive System 48 has no Tow/Run switch (Tow = off for work. Run = ready to drive.). Before you unplug the speed box (controller), do this. Unplug batteries (Figure 20-1). Then drain leftover power. Turn the key ON. Set the direction switch (F&R) to Reverse. Hold the pedal until the reverse buzzer stops."),
      `Factory book: ${M}, preliminary / controller discharge`,
      ["s2", "s3", "bt1", "j1"],
      "Are key ON, Forward, charger out, and pack cables confirmed?",
      "Look at the switches.",
      "Switches set",
      yesNo("Switches are set — go on", "A switch, charger, or cable is wrong", false),
      { kind: "step", id: "dno-pack" },
      { kind: "diagnosis", id: "ddx-setup" },
      {
        caution:
          "Unplug batteries at battery 1 minus. Then drain leftover power in the speed box (controller). Turn the key ON. Set Reverse. Hold the pedal until the reverse buzzer dies. Then you can unplug speed box terminals.",
      },
    ),
    "dno-pack": volt(
      "dno-pack",
      "Check battery pack power (book test 1)",
      "Now check if the power is flowing. Voltage is how strong the electric power is. Put red on battery 1 plus. Put black on battery 6 minus. Book ready window is ≥ 48 V. The dash warning light is on below 48 V with no load. It is also on below 25 % charge. Charge the batteries first if the light is on. Then start these checks again.",
      `Factory book: ${M}, Test Procedure 1 — Batteries`,
      ["bt1"],
      "Pack voltage, battery 1 + to battery 6 −",
      "DC volts on the main posts.",
      "≥ 48 V sitting still",
      48,
      54.5,
      "50.2",
      { kind: "step", id: "dno-connections" },
      { kind: "diagnosis", id: "ddx-pack" },
    ),
    "dno-connections": obs(
      "dno-connections",
      "Battery connections",
      "Check battery connections first after a low pack. Green rust under a lug can drop PowerDrive power. That can happen even if the sitting-still number looks fine. Make sure no battery is reversed (Figure 20-1 / 21-2).",
      `Factory book: ${M}, Troubleshooting Guide — Battery connections`,
      ["bt1", "k1"],
      "Are all pack and main-cable connections clean and tight?",
      "Look, then tug each lug.",
      "Clean and tight",
      yesNo("Connections clean and tight", "Found a loose or rusty connection"),
      { kind: "step", id: "dno-lockout" },
      { kind: "diagnosis", id: "ddx-cables" },
    ),
    "dno-lockout": obs(
      "dno-lockout",
      "Cart computer big click switch (solenoid) safety lock (book test 11)",
      "The charger cord in means lockout (a safety lock that stops the cart). Water in the plug can set this lock even with the cord out. Look at the plug. Dry it. Reseal the gray sense lead with butyl. Check the sense-lead fuse. If you still think the lock is on, reboot the cart computer (OBC). Unplug batteries. Drain leftover power in the speed box (controller). Then reconnect. Last step: jumper the big click switch (solenoid) small post (yellow wire) to battery 6 minus. If the cart then runs, the cart computer safety lock has failed.",
      `Factory book: ${M}, Test Procedure 11 — On-board Computer Lockout Circuit`,
      ["j1", "a2", "f1", "k1"],
      "Is the charger out, the plug dry, and the sense-lead fuse closed?",
      "Look at J1. Check if the gray fuse is connected all the way. Reboot the cart computer (OBC) if it was just reconnected.",
      "No safety lock",
      yesNo("Safety lock off — go on", "Cord in, wet plug, open fuse, or cart computer still locking"),
      { kind: "step", id: "dno-click" },
      { kind: "diagnosis", id: "ddx-obc" },
    ),
    "dno-click": obs(
      "dno-click",
      "Big click switch (solenoid) click",
      "Turn the key ON. Set the direction switch (F&R) to Forward. Press the gas pedal. Listen at the big click switch (solenoid). It sends power to the motor. No click means a control path problem. Check the key. Check the direction switch limit or rocker. Check the gas pedal limit. Check the coil (small magnet wires that pull the click switch in). Look for 190–250 Ω. Check the diode. A click with no roll means something else. Check the metal pads inside (contacts). Check the direction switch field path. Check the gas pedal sensor. Or check the speed box (controller). See book test 6 / 8–10.",
      `Factory book: ${M}, Troubleshooting Guide — solenoid`,
      ["k1", "s4"],
      "Did the big click switch (solenoid) click when you pressed the pedal?",
      "Listen. Feel the case. If it looks wrong, check it two more times.",
      "You heard a click",
      [
        { id: "click", label: "Big click switch (solenoid) clicked", result: "pass" },
        { id: "noclick", label: "No click", result: "fail" },
      ],
      { kind: "step", id: "dno-contacts" },
      { kind: "step", id: "dno-key" },
    ),
    "dno-key": cont(
      "dno-key",
      "Key switch (book test 2)",
      "Now check if this path is connected all the way. This is the same as Section 20 book test 2. Key OFF means the control path is open. Key ON means the wire is connected all the way through the key. A loose dash 18-gauge is as common as a dead barrel.",
      `Factory book: ${M}, Test Procedure 2 — Key Switch`,
      ["s2"],
      "Key ON: control path closed through the key?",
      "Check connected all the way. Volts at the key ON output to pack B− should be pack voltage.",
      "Closed with key ON",
      { kind: "step", id: "dno-frlim" },
      { kind: "diagnosis", id: "ddx-key" },
    ),
    "dno-frlim": cont(
      "dno-frlim",
      plus ? "Direction switch rocker enable" : "Direction switch anti-spark limit (book test 3)",
      plus
        ? "Now check if this path is connected all the way. The rocker must be F or R. Neutral (neither side down) will not close the big click switch (solenoid). Check Z6 white (forward) or Z7 blue (reverse) at the Z-plug."
        : "Now check if this path is connected all the way. COM–NO of the anti-spark limit is closed in gear. It is open in Neutral. The cam must press the lever after the direction switch (F&R) rotor has seated.",
      plus ? `Factory book: ${M}, F&R rocker / Z6 / Z7` : `Factory book: ${M}, Test Procedure 3 — F&R Anti-Arcing Limit Switch`,
      ["s1", "s3"],
      plus ? "Is F or R selected, and is the matching Z6/Z7 path closed?" : "COM–NO closed with the direction switch in gear?",
      plus ? "Rocker F or R. Connected on the selected side." : "Connected all the way COM–NO, direction switch in Forward.",
      "Closed in gear",
      { kind: "step", id: "dno-pedal" },
      { kind: "diagnosis", id: "ddx-frlim" },
    ),
    "dno-pedal": cont(
      "dno-pedal",
      "Gas pedal limit switch (book test 4)",
      "Now check if this path is connected all the way. Pedal up means open (no click). Pedal down means closed. Book symptom 8: the big click switch (solenoid) clicks when the key is turned ON. That means this switch is stuck closed. Or the pedal is out of adjustment. " +
        (plus ? "Plus: green/white Z8 from the gas pedal sensor limit to the speed box (controller) must go on with the pedal down." : ""),
      `Factory book: ${M}, Test Procedure 4 — Accelerator / potentiometer limit switch`,
      ["s4", "k1"],
      "Pedal down: limit switch closed? Pedal up: open?",
      "Check connected all the way at the limit. Make sure it does not close with the pedal up.",
      "Closed with pedal down only",
      { kind: "step", id: "dno-coil" },
      { kind: "diagnosis", id: "ddx-pedal" },
    ),
    "dno-coil": ohm(
      "dno-coil",
      "Big click switch (solenoid) coil 190–250 Ω (book test 5)",
      "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken. Take the diode terminal and the yellow wire off the small posts. Read 190–250 Ω across the coil (small magnet wires that pull the click switch in). Then check the diode. It must pass power one way only. The red insulated terminal goes on the red-wire small post. A shorted diode kills limit switches. Whenever a big click switch (solenoid) fails, also measure the 250 Ω resistor across the big posts.",
      `Factory book: ${M}, Test Procedure 5 — Solenoid Activating Coil / diode / 250 Ω resistor`,
      ["k1"],
      "Coil ohms (diode and yellow wire off)",
      "Ohms on the small posts. Diode off.",
      "190–250 Ω",
      190,
      250,
      "220",
      { kind: "diagnosis", id: "ddx-ctrl-wire" },
      { kind: "diagnosis", id: "ddx-coil" },
    ),
    "dno-contacts": cont(
      "dno-contacts",
      "Big click switch (solenoid) metal pads (book test 7 / 10)",
      "Now check if this path is connected all the way. Power off: the big posts must be open. Take yellow and red off the big posts. Also take off the 250 Ω resistor. Power on: raise the rear. Take off motor A2 if the book says. Press the pedal down. You should see full pack across the small posts. The big posts should be closed. Pitted metal pads inside (contacts) click but drop voltage. The coil (small magnet wires that pull the click switch in) must be off for the open check.",
      `Factory book: ${M}, Test Procedure 7 (power off) / 10 (controller input)`,
      ["k1"],
      "Big posts closed with the pedal down, and open with the coil off?",
      "Check connected all the way. Coil off must be open. Coil on must be closed. Rear wheels raised.",
      "Open coil-off / closed pedal-down",
      { kind: "step", id: "dno-pot" },
      { kind: "diagnosis", id: "ddx-contacts" },
      { caution: "Raise the rear. Take off the A2 motor lead if the book step needs it so the wheels cannot drive." },
    ),
    "dno-pot": ohm(
      "dno-pot",
      plus ? "Smooth gas pedal sensor / HPD (Z9 / Z10)" : "Gas pedal sensor (book test 8 / 9)",
      plus
        ? "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken. Plus HPD turns on if the gas pedal sensor input is below 3 V when the key is turned ON. Foot off the pedal, then key. The wiper (Z9 yellow) must sweep. Stationary (Z10 purple) is the reference. Full-pedal ohms still belong in the 4600–7000 Ω PowerDrive window."
        : "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken. Multi-step (pre A9529-445799): unplug black/white from speed box (controller) terminals 2 and 3. Unplug the half-speed reverse resistor. Then six steps: 300 / 690 / 990 / 1740 / 2740 / 4940 Ω. Full speed must be 4600–7000 Ω. Smooth gas pedal sensor (A9529-445799+): ~0–300 Ω rest to ~5500 Ω full. It must never go over ~7000 Ω. A smooth 0→5000 Ω sweep that stays under 7000 Ω is a good speed-switch assembly.",
      plus ? `Factory book: ${M}, Z-plug Z9/Z10 / HPD < 3 V at key ON` : `Factory book: ${M}, Test Procedure 8 (multi-step) / 9 (CV pot)`,
      ["s4", "a1"],
      plus ? "Full-pedal gas pedal sensor ohms (4600–7000 Ω window)" : "Full-pedal gas pedal sensor ohms",
      plus
        ? "Ohms yellow–purple, 16 kΩ range, pedal down. Batteries unplugged, leftover power in the speed box drained."
        : "Ohms at the gas pedal sensor leads. Unplug the half-speed reverse resistor on multi-step cars. Pedal all the way down.",
      "4600–7000 Ω at full pedal",
      4600,
      7000,
      "5500",
      { kind: "step", id: "dno-ctrl" },
      { kind: "diagnosis", id: "ddx-pot" },
    ),
    "dno-ctrl": volt(
      "dno-ctrl",
      "Speed box output (book test 10)",
      "Now check if the power is flowing. Voltage is how strong the electric power is. Raise the rear. Take off 6-gauge white from motor A2. Put meter red on speed box (controller) B+. Put black on M−. You should see ~48 V leftover power at rest. Turn the key ON. Set the direction switch (F&R) to Forward. Press the pedal all the way. The reading must rise to full pack. If it does not, the speed box may be bad. That is true if the gas pedal sensor is good. The pedal adjustment must be good too. Also make sure terminal 1 / A (18-gauge red) sees full pack with the big click switch (solenoid) closed.",
      `Factory book: ${M}, Test Procedure 10 — Solid State Speed Controller`,
      ["a1", "k1", "m1"],
      "B+ to M− at full pedal (A2 lead taken off)",
      "DC volts. Rear wheels raised. A2 white taken off.",
      "Full pack at full pedal",
      46,
      54.5,
      "48.4",
      { kind: "diagnosis", id: "ddx-motor" },
      { kind: "diagnosis", id: "ddx-controller" },
      { caution: "Take off motor A2. Raise the rear. Drain leftover power in the speed box (controller) before you reconnect A2." },
    ),
    "dsl-pot": ohm(
      "dsl-pot",
      "Runs slowly — gas pedal sensor / half-speed reverse",
      "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken. Book symptom 3 starts with the gas pedal sensor. It may be out of adjustment or bad. Then check the half-speed reverse limit. If it is stuck closed, the full-speed resistor stays in path in Forward. Then check the pack, motor, overload, brakes, and tires. Make sure full-pedal is 4600–7000 Ω. Make sure the half-speed reverse resistor is not in path in Forward (3900 Ω multi-step / 5100 Ω smooth).",
      `Factory book: ${M}, Troubleshooting Guide symptom 3; TP 8 / 9 / 12 / 13`,
      ["s4", "s3", "a1"],
      "Full-pedal gas pedal sensor in the 4600–7000 Ω window?",
      "Ohms, pedal down, half-speed reverse resistor unplugged from the limit for the sweep.",
      "4600–7000 Ω",
      4600,
      7000,
      "4940",
      { kind: "step", id: "dno-pack" },
      { kind: "diagnosis", id: "ddx-pot" },
    ),
    "drev-fast": ohm(
      "drev-fast",
      "Full speed in reverse — half-speed resistor",
      "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken. Book symptom 4: the cart runs full speed in reverse. The half-speed reverse limit is direction switch (F&R) limit #3. It may have failed or been miswired. Or the 3900 Ω (multi-step) / 5100 Ω (smooth) resistor is open. Book test 13: 3900 Ω ±10 % or 5100 Ω ±10 %.",
      `Factory book: ${M}, Test Procedure 12 / 13 — Half-speed reverse`,
      ["s3"],
      "Half-speed reverse resistor",
      "Ohms on the dedicated black lead, unplugged from the limit switch.",
      plus ? "Plus uses speed box (controller) reverse mapping. Check Z7 before this resistor." : "3510–4290 Ω (3.9 k) or 4590–5610 Ω (5.1 k)",
      plus ? 1 : 3510,
      plus ? 10000 : 5610,
      plus ? "5100" : "3900",
      { kind: "diagnosis", id: "ddx-halfspeed" },
      { kind: "diagnosis", id: "ddx-halfspeed" },
    ),
    "dchg": obs(
      "dchg",
      "Not fully charged",
      "Book symptom 6. Check plug drag first. Then the onboard fuse link. Then incoming AC. Then charger output. Then the charger relay and fuse. Then the cart computer (OBC). Warning-light chart (Figure 20-4) covers these. A 16-hour time-out. No AC. DC cord pulled mid-charge. A wet sense-lead fuse.",
      `Factory book: ${M}, Troubleshooting Guide symptom 6; PowerDrive charger Section 23B`,
      ["j1", "f1", "a2"],
      "Plug drag present, fuse link closed, AC at the charger?",
      "Feel plug drag. Check if the fuse is connected all the way. Make sure AC is there.",
      "Drag, fuse, AC all good",
      yesNo("Charge path good — leftover is cart computer / charger", "No drag, open fuse, or no AC"),
      { kind: "diagnosis", id: "ddx-charger" },
      { kind: "diagnosis", id: "ddx-receptacle" },
    ),
    "dwarn": obs(
      "dwarn",
      "Battery warning light on",
      "Figure 20-4 / Plus 21-15. The light turns on with no load below 48 V. It also turns on below 25 % charge in use. It turns on if AC cuts with the DC cord in. It turns on after a 16-hour charger time-out. It glows 10 seconds after a pack reconnect. Charge and load-test the pack first. Then check the cart computer (OBC). Check the sense-lead fuse. Check for a wet plug (book test 11).",
      `Factory book: ${M}, Battery warning light circuit`,
      ["bt1", "a2", "s2"],
      "Is the pack ≥ 48 V no-load and the charger DC cord out?",
      "DC volts on the pack. Look at J1.",
      "Pack ≥ 48 V, cord out",
      yesNo("Pack and cord OK — leftover is cart computer / sense fuse", "Pack low or cord in"),
      { kind: "diagnosis", id: "ddx-obc" },
      { kind: "diagnosis", id: "ddx-pack" },
    ),
    "dbrake": obs(
      "dbrake",
      plus ? "Zero-speed / pedal-up / pedal-down braking" : "One direction only — direction switch (book test 6)",
      plus
        ? "Plus: Zero Speed Detect fights roll with the key ON. Pedal-up (from > 12 mph) should motor-brake to ~9 mph. Pedal-down downhill holds ~15–16 mph. If the pack is full, energy goes to the energy-dump module (dynamic). If the pack can take charge, the cart computer (OBC) Z11 switches to motor braking. If braking is dead, check the speed sensor Z13/Z14. Then the brake click switch and energy-dump module. Then the speed box (controller)."
        : "Now check if this path is connected all the way. Book symptom 5: first the direction switch (F&R) anti-spark. Then the direction switch rotor connected all the way (book test 6). Forward is M− to S1 and A2 to S2. Reverse is M− to S2 and A2 to S1.",
      plus ? `Factory book: ${M}, Zero Speed Detect / pedal-up / pedal-down motor braking` : `Factory book: ${M}, Test Procedure 6 — Forward/Reverse Switch`,
      plus ? ["m1", "a1", "f2"] : ["s3", "m1", "a1"],
      plus ? "Does motor braking turn on (zero-speed, pedal-up, or pedal-down as equipped)?" : "Does book test 6 show a connected path in the dead direction?",
      plus ? "Safe downhill or a push with key ON on flat ground (park brake off)." : "Ohms on the field path. Direction switch in the dead direction.",
      plus ? "Motor braking present" : "Connected all the way in both directions",
      yesNo(plus ? "Braking works — leftover is feel/adjustment" : "Field path good both ways", plus ? "No motor braking" : "Open in one direction"),
      plus ? { kind: "diagnosis", id: "ddx-setup" } : { kind: "diagnosis", id: "ddx-controller" },
      plus ? { kind: "diagnosis", id: "ddx-braking" } : { kind: "diagnosis", id: "ddx-fr" },
    ),
  };

  const diagnoses: Record<string, Diagnosis> = {
    "ddx-setup": dx("ddx-setup", "Switches are not set", "The key, direction switch (F&R), charger, or a pack cable was wrong.", "A switch was in the wrong place.", "Set the switches. Then start the checks again.", [], "info"),
    "ddx-pack": dx("ddx-pack", "Pack below 48 V", "Book test 1 is under 48 V. Or the warning light is on for low charge or no-load voltage.", "Low or failed 8 V batteries.", "Charge the pack. Then load-test each 8 V battery. Do not blame the speed box (controller) on a 46 V pack.", [{ name: "PowerDrive 8 V batteries (×6)" }], "service"),
    "ddx-cables": dx("ddx-cables", "Pack connection", "A lug is loose or rusty.", "A cable between batteries, or a main cable.", "Clean it. Then tighten it.", [], "service"),
    "ddx-obc": dx("ddx-obc", "Cart computer safety lock / warning-light path", "Book test 11 found a problem. The plug may be wet. The sense-lead fuse may be open. The cart computer (OBC) may be locked up. Or the safety lock that stops the cart has failed. The cart runs with the yellow small-post jumpered to B−.", "Cart computer, sense fuse, or water in J1.", "Dry J1. Seal it with butyl. Replace fuse holder 1018963-02 if it is unsealed. Reboot the cart computer (OBC). Replace the cart computer if the jumper proves the safety lock failed.", [{ name: "Cart computer (OBC)" }, { name: "Sense-lead fuse holder 1018963-02" }], "replace"),
    "ddx-key": dx("ddx-key", "Key switch", "Book test 2 failed.", "Open ON metal pads (contacts).", "Replace the key switch.", [{ name: "Key switch" }], "replace"),
    "ddx-frlim": dx("ddx-frlim", plus ? "Direction switch rocker" : "Direction switch anti-spark limit", plus ? "Rocker Neutral or open Z6/Z7." : "Cam or COM–NO failed.", plus ? "Rocker not selecting Forward or Reverse, or open Z6/Z7." : "Anti-spark cam or switch.", plus ? "Replace the rocker. Check Z6 white / Z7 blue at the Z-plug." : "Adjust the cam. Replace the limit switch.", [{ name: plus ? "Direction switch rocker (F&R)" : "Direction switch anti-spark limit switch" }], "replace"),
    "ddx-pedal": dx("ddx-pedal", "Gas pedal limit switch", "Book test 4 failed. Or the big click switch (solenoid) clicks when you turn the key ON (book symptom 8).", "The limit is stuck closed or open. Or the pedal is out of adjustment.", "Adjust the pedal (Section 6). Replace the limit if it does not change from open to closed.", [{ name: "Gas pedal limit switch" }], "replace"),
    "ddx-coil": dx("ddx-coil", "Big click switch (solenoid) coil / diode / 250 Ω resistor", "The coil (small magnet wires that pull the click switch in) is not 190–250 Ω. Or the one-way diode is shorted or open. Or the 250 Ω pre-charge resistor is out.", "Wrong big click switch (solenoid). IQ 180–190 Ω is not this part. Or a failed diode. Or an open 250 Ω resistor.", "Replace the PowerDrive big click switch. Fit a new click-switch diode (red terminal on the red-wire post). Make sure ≈ 250 Ω across the big posts.", [{ name: "PowerDrive big click switch (190–250 Ω)" }, { name: "Click-switch diode" }, { name: "250 Ω pre-charge resistor" }], "replace"),
    "ddx-ctrl-wire": dx("ddx-ctrl-wire", "Control-path wiring", "The coil, key, direction switch (F&R), and pedal limit passed. There is still no click.", "An open 18-gauge wire.", "Check ohms on the control harness.", [], "service"),
    "ddx-contacts": dx("ddx-contacts", "Big click switch (solenoid) big-post metal pads", "It clicked, but the big posts stay open. Or they are welded with the coil (small magnet wires) off.", "Pitted or welded metal pads inside (contacts).", "Replace the big click switch (solenoid). Recheck the 250 Ω resistor.", [{ name: "PowerDrive big click switch" }], "replace"),
    "ddx-pot": dx(
      "ddx-pot",
      plus ? "Gas pedal sensor / HPD" : "Multi-step or smooth gas pedal sensor",
      plus ? "HPD (below 3 V at key ON) or the wiper is out of the 4600–7000 Ω full-speed window." : "Steps are missing. Or full pedal is not 4600–7000 Ω. Smooth must not go over ~7000 Ω.",
      plus ? "Gas pedal sensor below 3 V at key ON. Or a failed Z9/Z10 sweep." : "Worn multi-step wiper. Or a failed smooth gas pedal sensor.",
      plus ? "Foot off the pedal, then key. Replace the smooth gas pedal sensor if HPD repeats with the pedal up. Also replace it if the sweep is dead." : "Replace the multi-step assembly if the six steps are wrong. Replace the smooth gas pedal sensor if adjustment (page 6-19) does not bring 4600–7000 Ω.",
      [{ name: spec.throttleName }],
      "replace",
    ),
    "ddx-controller": dx("ddx-controller", spec.controllerName, "Book test 10 failed. B+ to M− does not rise to pack at full pedal. The gas pedal sensor is known-good.", "Failed power section. Plus: Z-plug or energy-dump module.", "Make sure the terminal face is clean. Replace the speed box (controller). Plus: check the energy-dump module and brake click switch before you blame the unit.", [{ name: spec.controllerName }], "replace"),
    "ddx-motor": dx("ddx-motor", spec.motorName, "Speed box (controller) output is present. The motor path is not.", plus ? "Open shunt field or armature. Or a silent speed sensor." : "Open field path through the direction switch (F&R). See book test 6. Or worn brushes.", plus ? "Check ohms on F1–F2 and A1–A2. Look at the speed sensor (Z13/Z14)." : "Check ohms in book test 6 both directions. Service brushes (Section 24).", [{ name: spec.motorName }], "replace"),
    "ddx-fr": dx("ddx-fr", "Direction switch field path", "Book test 6 is open in one direction.", "Burned direction switch metal pads (contacts).", "Replace the direction switch (F&R).", [{ name: "Direction switch (F&R)" }], "replace"),
    "ddx-halfspeed": dx("ddx-halfspeed", "Half-speed reverse path", "The cart runs full speed in reverse. Limit #3 or the 3.9 kΩ / 5.1 kΩ resistor.", "A failed limit. Or an open resistor.", "Replace the limit switch or the resistor lead (book test 12 / 13).", [{ name: "Half-speed reverse limit / resistor" }], "replace"),
    "ddx-receptacle": dx("ddx-receptacle", "Plug / fuse link", "No plug drag. Or hot blades. Or an open onboard fuse link.", "Worn J1. Or a blown fuse link.", "Replace the hot or no-drag half. Find the short before you fit a new fuse link.", [{ name: "Charger plug" }, { name: "Onboard fuse link" }], "replace"),
    "ddx-charger": dx("ddx-charger", "PowerDrive charger / cart computer charge", "The charge path at the cart is good. The pack still will not finish.", "Charger output, relay, or cart computer (OBC) energy-unit count.", "Make sure AC is there. Then do Section 23B charger tests. Replace the cart computer (OBC) if the charger runs but never ends correctly.", [{ name: "PowerDrive charger" }, { name: "Cart computer (OBC)" }], "replace"),
    "ddx-braking": dx("ddx-braking", "Motor braking path (Plus)", "Zero-speed, pedal-up, or pedal-down braking is dead.", "Silent speed sensor. Open energy-dump module. Or a stuck brake click switch.", "Check Z13/Z14 pulses. Then the brake click switch and energy-dump module. Speed box (controller) last.", [{ name: "Motor speed sensor" }, { name: "Energy-dump module" }, { name: "Brake click switch" }], "replace"),
  };

  const symptoms: SymptomDef[] = [
    { id: "no-operation", label: "Cart will not run — no click", summary: "Pack ≥ 48 V. Cart computer safety lock (book test 11). Key. Direction switch (F&R). Pedal limit. Coil 190–250 Ω.", manualSection: `${M}, Troubleshooting Guide symptom 1`, startStepId: "dno-setup" },
    { id: "clicks-no-run", label: "Cart will not run — big click switch (solenoid) clicks", summary: "Metal pads inside (contacts). Gas pedal sensor 4600–7000 Ω. Speed box (controller) B+ to M− (book test 10). Motor / direction switch path.", manualSection: `${M}, Troubleshooting Guide symptom 2`, startStepId: "dno-click" },
    { id: "runs-slowly", label: "Cart runs slowly", summary: "Gas pedal sensor window. Half-speed reverse stuck closed. Pack. Motor. Overload. Brakes. Tires.", manualSection: `${M}, Troubleshooting Guide symptom 3`, startStepId: "dsl-pot" },
    { id: "one-direction", label: "Runs in one direction only", summary: plus ? "Z6 white / Z7 blue at the Z-plug, then the speed box (controller)." : "Direction switch (F&R) anti-spark, then book test 6 field path.", manualSection: `${M}, Troubleshooting Guide symptom 5`, startStepId: "dbrake" },
    { id: "not-charging", label: "Cart not being fully charged", summary: "Plug. Fuse link. AC. PowerDrive charger. Cart computer (OBC).", manualSection: `${M}, Troubleshooting Guide symptom 6`, startStepId: "dchg" },
    { id: "warning-light", label: "Battery warning light on", summary: "Below 48 V with no load. Below 25 % charge. AC cut. 16-hour time-out. Or sense-lead fuse.", manualSection: `${M}, Warning-light chart`, startStepId: "dwarn" },
    ...(plus
      ? [
          { id: "no-braking", label: "Zero-speed / pedal-up / pedal-down braking does not work", summary: "Speed sensor Z13/Z14. Brake click switch. Energy-dump module. Then speed box (controller). Pedal-up should slow to ~9 mph from > 12 mph.", manualSection: `${M}, Regenerative / dynamic braking`, startStepId: "dbrake" },
        ]
      : [
          { id: "full-speed-reverse", label: "Runs full speed in reverse", summary: "Half-speed reverse limit or 3.9 kΩ / 5.1 kΩ resistor (book test 12 / 13).", manualSection: `${M}, Troubleshooting Guide symptom 4`, startStepId: "drev-fast" },
          { id: "clicks-on-key", label: "Big click switch (solenoid) clicks when the key is turned on", summary: "Gas pedal limit stuck closed, or pedal out of adjustment (book symptom 8).", manualSection: `${M}, Troubleshooting Guide symptom 8`, startStepId: "dno-pedal" },
        ]),
  ];

  return {
    id: spec.id,
    manufacturer: "club-car",
    manufacturerLabel: "Club Car",
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
