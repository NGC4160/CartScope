import type { ComponentDef, TestPointDef, WireDef } from "@/data/types";

export interface LabeledBlock {
  name: string;
  description: string;
  commonFailures: string[];
  expectedValues: { label: string; value: string }[];
}

function c(
  partial: Omit<ComponentDef, "commonFailures" | "expectedValues" | "description"> & {
    description: string;
    commonFailures: string[];
    expectedValues: { label: string; value: string }[];
  },
): ComponentDef {
  return partial;
}

export function dcPowerLayout(opts: {
  battery: LabeledBlock;
  tow: LabeledBlock;
  solenoid: LabeledBlock;
  controller: LabeledBlock;
  motor: LabeledBlock;
  key: LabeledBlock;
  fr: LabeledBlock;
  throttle: LabeledBlock;
  computer: LabeledBlock & { kind: "computer" | "charger" };
  receptacle: LabeledBlock;
  fuse: LabeledBlock;
  buzzer?: LabeledBlock;
  extraFuse?: LabeledBlock;
  motorFieldLabel?: { a2: string; f1: string; f2: string };
}): { components: ComponentDef[]; wires: WireDef[]; testPoints: TestPointDef[] } {
  const f2 = opts.motorFieldLabel ?? { a2: "A2", f1: "S1", f2: "S2" };
  const hasExtra = Boolean(opts.extraFuse);
  const components: ComponentDef[] = [
    c({
      id: "bt1",
      ref: "BT1",
      name: opts.battery.name,
      kind: "battery",
      description: opts.battery.description,
      commonFailures: opts.battery.commonFailures,
      expectedValues: opts.battery.expectedValues,
      x: 36,
      y: 210,
      w: 198,
      h: 148,
      terminals: [
        { id: "bt1-p", label: "B+", side: "e", t: 0.32 },
        { id: "bt1-n", label: "B−", side: "e", t: 0.72 },
      ],
    }),
    c({
      id: "s1",
      ref: "S1",
      name: opts.tow.name,
      kind: "switch",
      description: opts.tow.description,
      commonFailures: opts.tow.commonFailures,
      expectedValues: opts.tow.expectedValues,
      x: 36,
      y: 78,
      w: 198,
      h: 58,
      terminals: [
        { id: "s1-in", label: "B− IN", side: "s", t: 0.3 },
        { id: "s1-out", label: "RUN", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "k1",
      ref: "K1",
      name: opts.solenoid.name,
      kind: "solenoid",
      description: opts.solenoid.description,
      commonFailures: opts.solenoid.commonFailures,
      expectedValues: opts.solenoid.expectedValues,
      x: 300,
      y: 226,
      w: 168,
      h: 116,
      terminals: [
        { id: "k1-l1", label: "L1", side: "w", t: 0.32 },
        { id: "k1-l2", label: "L2", side: "e", t: 0.32 },
        { id: "k1-c+", label: "COIL+", side: "w", t: 0.78 },
        { id: "k1-c-", label: "COIL−", side: "e", t: 0.78 },
      ],
    }),
    c({
      id: "a1",
      ref: "A1",
      name: opts.controller.name,
      kind: "controller",
      description: opts.controller.description,
      commonFailures: opts.controller.commonFailures,
      expectedValues: opts.controller.expectedValues,
      x: 536,
      y: 198,
      w: 196,
      h: 164,
      terminals: [
        { id: "a1-bp", label: "B+", side: "w", t: 0.28 },
        { id: "a1-bn", label: "B−", side: "s", t: 0.28 },
        { id: "a1-m", label: "M−", side: "e", t: 0.38 },
        { id: "a1-sig", label: "16-PIN", side: "n", t: 0.72 },
      ],
    }),
    c({
      id: "m1",
      ref: "M1",
      name: opts.motor.name,
      kind: "motor",
      description: opts.motor.description,
      commonFailures: opts.motor.commonFailures,
      expectedValues: opts.motor.expectedValues,
      x: 800,
      y: 214,
      w: 236,
      h: 132,
      terminals: [
        { id: "m1-a1", label: "A1", side: "w", t: 0.28 },
        { id: "m1-a2", label: f2.a2, side: "n", t: 0.45 },
        { id: "m1-s1", label: f2.f1, side: "n", t: 0.72 },
        { id: "m1-s2", label: f2.f2, side: "s", t: 0.55 },
        { id: "m1-ss", label: "SS", side: "e", t: 0.25 },
      ],
    }),
    c({
      id: "s2",
      ref: "S2",
      name: opts.key.name,
      kind: "switch",
      description: opts.key.description,
      commonFailures: opts.key.commonFailures,
      expectedValues: opts.key.expectedValues,
      x: 300,
      y: 400,
      w: 140,
      h: 54,
      terminals: [
        { id: "s2-in", label: "IN", side: "n", t: 0.35 },
        { id: "s2-out", label: "ON", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "s3",
      ref: "S3",
      name: opts.fr.name,
      kind: "switch",
      description: opts.fr.description,
      commonFailures: opts.fr.commonFailures,
      expectedValues: opts.fr.expectedValues,
      x: 468,
      y: 400,
      w: 150,
      h: 54,
      terminals: [
        { id: "s3-in", label: "CTL", side: "w", t: 0.5 },
        { id: "s3-out", label: "F/R", side: "e", t: 0.5 },
        { id: "s3-s2", label: "FLD", side: "n", t: 0.72 },
      ],
    }),
    c({
      id: "s4",
      ref: "S4",
      name: opts.throttle.name,
      kind: "sensor",
      description: opts.throttle.description,
      commonFailures: opts.throttle.commonFailures,
      expectedValues: opts.throttle.expectedValues,
      x: 648,
      y: 390,
      w: 168,
      h: 74,
      terminals: [
        { id: "s4-in", label: "IN", side: "w", t: 0.38 },
        { id: "s4-out", label: "SW", side: "n", t: 0.55 },
        { id: "s4-pot", label: "SIG", side: "e", t: 0.55 },
      ],
    }),
    c({
      id: "a2",
      ref: opts.computer.kind === "charger" ? "CHG" : "A2",
      name: opts.computer.name,
      kind: opts.computer.kind,
      description: opts.computer.description,
      commonFailures: opts.computer.commonFailures,
      expectedValues: opts.computer.expectedValues,
      x: 800,
      y: 72,
      w: 236,
      h: 70,
      terminals: [
        { id: "a2-en", label: "EN", side: "w", t: 0.5 },
        { id: "a2-ch", label: "CHG", side: "s", t: 0.7 },
      ],
    }),
    c({
      id: "j1",
      ref: "J1",
      name: opts.receptacle.name,
      kind: "receptacle",
      description: opts.receptacle.description,
      commonFailures: opts.receptacle.commonFailures,
      expectedValues: opts.receptacle.expectedValues,
      x: hasExtra ? 260 : 260,
      y: 78,
      w: hasExtra ? 118 : 168,
      h: 58,
      terminals: [{ id: "j1-dc", label: "DC", side: "e", t: 0.5 }],
    }),
    c({
      id: "f1",
      ref: "F1",
      name: opts.fuse.name,
      kind: "fuse",
      description: opts.fuse.description,
      commonFailures: opts.fuse.commonFailures,
      expectedValues: opts.fuse.expectedValues,
      x: hasExtra ? 456 : 456,
      y: 78,
      w: hasExtra ? 100 : 118,
      h: 58,
      terminals: [
        { id: "f1-in", label: "IN", side: "w", t: 0.5 },
        { id: "f1-out", label: "OUT", side: "s", t: 0.5 },
      ],
    }),
    c({
      id: "h1",
      ref: "H1",
      name: opts.buzzer?.name ?? "Reverse buzzer",
      kind: "buzzer",
      description: opts.buzzer?.description ?? "Sounds in reverse. Feed is a quick reverse-microswitch check.",
      commonFailures: opts.buzzer?.commonFailures ?? ["Open coil", "Disconnected ground"],
      expectedValues: opts.buzzer?.expectedValues ?? [{ label: "Reverse selected", value: "Audible tone" }],
      x: 600,
      y: 78,
      w: 168,
      h: 58,
      terminals: [{ id: "h1-in", label: "R", side: "w", t: 0.5 }],
    }),
    c({
      id: "gnd",
      ref: "GND",
      name: "Frame ground",
      kind: "other",
      description: "Controller B−, coil returns, and computer grounds land on the chassis. A painted boss mimics a dead controller.",
      commonFailures: ["Painted mounting boss", "Loose controller bolts"],
      expectedValues: [{ label: "Controller case to pack B− (RUN)", value: "< 0.2 Ω" }],
      x: 800,
      y: 560,
      w: 236,
      h: 48,
      terminals: [{ id: "gnd-1", label: "CHASSIS", side: "n", t: 0.35 }],
    }),
  ];

  if (opts.extraFuse) {
    components.push(
      c({
        id: "f2",
        ref: "F2",
        name: opts.extraFuse.name,
        kind: "fuse",
        description: opts.extraFuse.description,
        commonFailures: opts.extraFuse.commonFailures,
        expectedValues: opts.extraFuse.expectedValues,
        x: 392,
        y: 78,
        w: 56,
        h: 58,
        terminals: [
          { id: "f2-in", label: "IN", side: "w", t: 0.5 },
          { id: "f2-out", label: "OUT", side: "e", t: 0.5 },
        ],
      }),
    );
  }

  const wires: WireDef[] = [
    { id: "w-bt-k", kind: "power", from: "bt1-p", to: "k1-l1", label: "B+" },
    { id: "w-k-a", kind: "power", from: "k1-l2", to: "a1-bp", label: "B+ CTRL" },
    { id: "w-a-m", kind: "power", from: "a1-m", to: "m1-a1", label: "M−" },
    { id: "w-a2s1", kind: "power", from: "m1-a2", to: "m1-s1", label: "JPR", waypoints: [{ x: 910, y: 188 }] },
    { id: "w-s2-fr", kind: "power", from: "m1-s2", to: "s3-s2", label: "FIELD" },
    { id: "w-bt-n-s1", kind: "ground", from: "bt1-n", to: "s1-in", label: "B−" },
    {
      id: "w-s1-a1",
      kind: "ground",
      from: "s1-out",
      to: "a1-bn",
      label: "RUN B−",
      waypoints: [
        { x: 250, y: 107 },
        { x: 250, y: 380 },
        { x: 590, y: 380 },
      ],
    },
    { id: "w-a1-gnd", kind: "ground", from: "a1-bn", to: "gnd-1" },
    {
      id: "w-k-gnd",
      kind: "ground",
      from: "k1-c-",
      to: "gnd-1",
      waypoints: [
        { x: 500, y: 360 },
        { x: 500, y: 470 },
        { x: 800, y: 470 },
      ],
    },
    {
      id: "w-bt-f",
      kind: "control",
      from: "bt1-p",
      to: "f1-in",
      label: "CTL FEED",
      waypoints: [
        { x: 250, y: 258 },
        { x: 250, y: 107 },
      ],
    },
    { id: "w-f-key", kind: "control", from: "f1-out", to: "s2-in" },
    { id: "w-key-fr", kind: "control", from: "s2-out", to: "s3-in" },
    { id: "w-fr-mcor", kind: "control", from: "s3-out", to: "s4-in" },
    {
      id: "w-mcor-coil",
      kind: "control",
      from: "s4-out",
      to: "k1-c+",
      waypoints: [
        { x: 740, y: 360 },
        { x: 280, y: 360 },
        { x: 280, y: 316 },
      ],
    },
    { id: "w-mcor-sig", kind: "control", from: "s4-pot", to: "a1-sig", label: "THROTTLE" },
    {
      id: "w-obc-en",
      kind: "control",
      from: "a2-en",
      to: "k1-c-",
      label: "LOCKOUT",
      waypoints: [
        { x: 780, y: 107 },
        { x: 780, y: 340 },
        { x: 490, y: 340 },
      ],
    },
    {
      id: "w-j-obc",
      kind: "power",
      from: "j1-dc",
      to: "a2-ch",
      waypoints: [
        { x: 444, y: 107 },
        { x: 444, y: 50 },
        { x: 966, y: 50 },
      ],
    },
    {
      id: "w-fr-buzz",
      kind: "control",
      from: "s3-out",
      to: "h1-in",
      waypoints: [
        { x: 630, y: 400 },
        { x: 630, y: 136 },
      ],
    },
    {
      id: "w-ss",
      kind: "control",
      from: "m1-ss",
      to: "a1-sig",
      label: "SPEED",
      waypoints: [
        { x: 1040, y: 248 },
        { x: 1040, y: 168 },
        { x: 674, y: 168 },
      ],
    },
  ];

  if (opts.extraFuse) {
    wires.push(
      { id: "w-s1-f2", kind: "control", from: "s1-out", to: "f2-in", label: "RUN" },
      {
        id: "w-f2-a",
        kind: "control",
        from: "f2-out",
        to: "a1-sig",
        label: "3 A",
        waypoints: [
          { x: 444, y: 107 },
          { x: 444, y: 168 },
          { x: 674, y: 168 },
        ],
      },
    );
  }

  const testPoints: TestPointDef[] = [
    { id: "tp-pack", label: "TP1", x: 242, y: 250, componentId: "bt1", expected: opts.battery.expectedValues[0]?.value ?? "Pack V" },
    { id: "tp-l1", label: "TP2", x: 292, y: 252, componentId: "k1", expected: "Pack V" },
    { id: "tp-l2", label: "TP3", x: 476, y: 252, componentId: "k1", expected: "Pack V, pedal down" },
    { id: "tp-coil", label: "TP4", x: 292, y: 316, componentId: "k1", expected: opts.solenoid.expectedValues[0]?.value ?? "Coil" },
    { id: "tp-thr", label: "TP5", x: 824, y: 410, componentId: "s4", expected: opts.throttle.expectedValues[0]?.value ?? "Throttle" },
    { id: "tp-16", label: "TP6", x: 674, y: 190, componentId: "a1", expected: "16-pin" },
  ];

  return { components, wires, testPoints };
}

export function acPowerLayout(opts: {
  battery: LabeledBlock;
  tow: LabeledBlock;
  solenoid: LabeledBlock;
  controller: LabeledBlock;
  motor: LabeledBlock;
  key: LabeledBlock;
  fr: LabeledBlock;
  throttle: LabeledBlock;
  brake: LabeledBlock;
  fuse: LabeledBlock;
  receptacle: LabeledBlock;
}): { components: ComponentDef[]; wires: WireDef[]; testPoints: TestPointDef[] } {
  const components: ComponentDef[] = [
    c({
      id: "bt1",
      ref: "BT1",
      name: opts.battery.name,
      kind: "battery",
      description: opts.battery.description,
      commonFailures: opts.battery.commonFailures,
      expectedValues: opts.battery.expectedValues,
      x: 36,
      y: 210,
      w: 198,
      h: 148,
      terminals: [
        { id: "bt1-p", label: "B+", side: "e", t: 0.32 },
        { id: "bt1-n", label: "B−", side: "e", t: 0.72 },
      ],
    }),
    c({
      id: "s1",
      ref: "S1",
      name: opts.tow.name,
      kind: "switch",
      description: opts.tow.description,
      commonFailures: opts.tow.commonFailures,
      expectedValues: opts.tow.expectedValues,
      x: 36,
      y: 78,
      w: 198,
      h: 58,
      terminals: [
        { id: "s1-in", label: "IN", side: "s", t: 0.35 },
        { id: "s1-out", label: "RUN", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "k1",
      ref: "K1",
      name: opts.solenoid.name,
      kind: "solenoid",
      description: opts.solenoid.description,
      commonFailures: opts.solenoid.commonFailures,
      expectedValues: opts.solenoid.expectedValues,
      x: 300,
      y: 226,
      w: 168,
      h: 116,
      terminals: [
        { id: "k1-l1", label: "L1", side: "w", t: 0.32 },
        { id: "k1-l2", label: "L2", side: "e", t: 0.32 },
        { id: "k1-c+", label: "COIL+", side: "w", t: 0.78 },
        { id: "k1-c-", label: "COIL−", side: "e", t: 0.78 },
      ],
    }),
    c({
      id: "a1",
      ref: "A1",
      name: opts.controller.name,
      kind: "controller",
      description: opts.controller.description,
      commonFailures: opts.controller.commonFailures,
      expectedValues: opts.controller.expectedValues,
      x: 536,
      y: 188,
      w: 196,
      h: 176,
      terminals: [
        { id: "a1-bp", label: "B+", side: "w", t: 0.22 },
        { id: "a1-bn", label: "B−", side: "s", t: 0.28 },
        { id: "a1-u", label: "U", side: "e", t: 0.22 },
        { id: "a1-v", label: "V", side: "e", t: 0.5 },
        { id: "a1-w", label: "W", side: "e", t: 0.78 },
        { id: "a1-sig", label: "SIG", side: "n", t: 0.7 },
      ],
    }),
    c({
      id: "m1",
      ref: "M1",
      name: opts.motor.name,
      kind: "motor",
      description: opts.motor.description,
      commonFailures: opts.motor.commonFailures,
      expectedValues: opts.motor.expectedValues,
      x: 800,
      y: 200,
      w: 236,
      h: 156,
      terminals: [
        { id: "m1-u", label: "U", side: "w", t: 0.22 },
        { id: "m1-v", label: "V", side: "w", t: 0.5 },
        { id: "m1-w", label: "W", side: "w", t: 0.78 },
        { id: "m1-enc", label: "ENC", side: "n", t: 0.7 },
      ],
    }),
    c({
      id: "s2",
      ref: "S2",
      name: opts.key.name,
      kind: "switch",
      description: opts.key.description,
      commonFailures: opts.key.commonFailures,
      expectedValues: opts.key.expectedValues,
      x: 300,
      y: 400,
      w: 140,
      h: 54,
      terminals: [
        { id: "s2-in", label: "IN", side: "n", t: 0.35 },
        { id: "s2-out", label: "ON", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "s3",
      ref: "S3",
      name: opts.fr.name,
      kind: "switch",
      description: opts.fr.description,
      commonFailures: opts.fr.commonFailures,
      expectedValues: opts.fr.expectedValues,
      x: 468,
      y: 400,
      w: 150,
      h: 54,
      terminals: [
        { id: "s3-in", label: "CTL", side: "w", t: 0.5 },
        { id: "s3-out", label: "FNR", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "s4",
      ref: "S4",
      name: opts.throttle.name,
      kind: "sensor",
      description: opts.throttle.description,
      commonFailures: opts.throttle.commonFailures,
      expectedValues: opts.throttle.expectedValues,
      x: 648,
      y: 390,
      w: 168,
      h: 74,
      terminals: [
        { id: "s4-sig", label: "SIG", side: "n", t: 0.5 },
        { id: "s4-5v", label: "5 V", side: "w", t: 0.45 },
      ],
    }),
    c({
      id: "br1",
      ref: "BR1",
      name: opts.brake.name,
      kind: "brake",
      description: opts.brake.description,
      commonFailures: opts.brake.commonFailures,
      expectedValues: opts.brake.expectedValues,
      x: 800,
      y: 72,
      w: 236,
      h: 70,
      terminals: [
        { id: "br1+", label: "REL+", side: "w", t: 0.45 },
        { id: "br1-", label: "REL−", side: "s", t: 0.3 },
      ],
    }),
    c({
      id: "f1",
      ref: "F1",
      name: opts.fuse.name,
      kind: "fuse",
      description: opts.fuse.description,
      commonFailures: opts.fuse.commonFailures,
      expectedValues: opts.fuse.expectedValues,
      x: 456,
      y: 78,
      w: 118,
      h: 58,
      terminals: [
        { id: "f1-in", label: "IN", side: "w", t: 0.5 },
        { id: "f1-out", label: "OUT", side: "s", t: 0.5 },
      ],
    }),
    c({
      id: "j1",
      ref: "J1",
      name: opts.receptacle.name,
      kind: "receptacle",
      description: opts.receptacle.description,
      commonFailures: opts.receptacle.commonFailures,
      expectedValues: opts.receptacle.expectedValues,
      x: 260,
      y: 78,
      w: 168,
      h: 58,
      terminals: [{ id: "j1-dc", label: "DC", side: "e", t: 0.5 }],
    }),
    c({
      id: "gnd",
      ref: "GND",
      name: "Frame ground",
      kind: "other",
      description: "Controller case and brake return.",
      commonFailures: ["Painted mounting plate"],
      expectedValues: [{ label: "Case to B−", value: "< 0.2 Ω" }],
      x: 800,
      y: 560,
      w: 236,
      h: 48,
      terminals: [{ id: "gnd-1", label: "CHASSIS", side: "n", t: 0.35 }],
    }),
  ];

  const wires: WireDef[] = [
    { id: "w-bt-k", kind: "power", from: "bt1-p", to: "k1-l1", label: "B+" },
    { id: "w-k-a", kind: "power", from: "k1-l2", to: "a1-bp", label: "B+ CTRL" },
    { id: "w-u", kind: "power", from: "a1-u", to: "m1-u", label: "U" },
    { id: "w-v", kind: "power", from: "a1-v", to: "m1-v", label: "V" },
    { id: "w-w", kind: "power", from: "a1-w", to: "m1-w", label: "W" },
    { id: "w-bt-n", kind: "ground", from: "bt1-n", to: "s1-in" },
    {
      id: "w-s1-a",
      kind: "control",
      from: "s1-out",
      to: "a1-sig",
      label: "RUN",
      waypoints: [
        { x: 250, y: 107 },
        { x: 250, y: 160 },
        { x: 674, y: 160 },
      ],
    },
    { id: "w-a-gnd", kind: "ground", from: "a1-bn", to: "gnd-1" },
    {
      id: "w-k-gnd",
      kind: "ground",
      from: "k1-c-",
      to: "gnd-1",
      waypoints: [
        { x: 500, y: 360 },
        { x: 500, y: 470 },
        { x: 800, y: 470 },
      ],
    },
    {
      id: "w-bt-f",
      kind: "control",
      from: "bt1-p",
      to: "f1-in",
      waypoints: [
        { x: 250, y: 258 },
        { x: 250, y: 107 },
      ],
    },
    { id: "w-f-key", kind: "control", from: "f1-out", to: "s2-in" },
    { id: "w-key-fnr", kind: "control", from: "s2-out", to: "s3-in" },
    { id: "w-fnr-sig", kind: "control", from: "s3-out", to: "a1-sig", waypoints: [{ x: 630, y: 188 }] },
    { id: "w-its", kind: "control", from: "s4-sig", to: "a1-sig", label: "THROTTLE" },
    { id: "w-5v", kind: "control", from: "a1-sig", to: "s4-5v", label: "5 V" },
    {
      id: "w-brk",
      kind: "control",
      from: "a1-sig",
      to: "br1+",
      label: "BRAKE REL",
      waypoints: [
        { x: 720, y: 160 },
        { x: 720, y: 107 },
      ],
    },
    { id: "w-brk-g", kind: "ground", from: "br1-", to: "gnd-1", waypoints: [{ x: 870, y: 160 }] },
    { id: "w-enc", kind: "control", from: "m1-enc", to: "a1-sig", label: "ENC", waypoints: [{ x: 966, y: 168 }] },
    {
      id: "w-coil",
      kind: "control",
      from: "s3-out",
      to: "k1-c+",
      waypoints: [
        { x: 630, y: 427 },
        { x: 280, y: 427 },
        { x: 280, y: 316 },
      ],
    },
  ];

  const testPoints: TestPointDef[] = [
    { id: "tp-pack", label: "TP1", x: 242, y: 250, componentId: "bt1", expected: opts.battery.expectedValues[0]?.value ?? "Pack V" },
    { id: "tp-brk", label: "TP2", x: 792, y: 90, componentId: "br1", expected: opts.brake.expectedValues[0]?.value ?? "Brake" },
    { id: "tp-its", label: "TP3", x: 732, y: 378, componentId: "s4", expected: opts.throttle.expectedValues[0]?.value ?? "Throttle" },
    { id: "tp-enc", label: "TP4", x: 966, y: 192, componentId: "m1", expected: "Encoder" },
    { id: "tp-uvw", label: "TP5", x: 792, y: 248, componentId: "m1", expected: opts.motor.expectedValues[0]?.value ?? "U-V-W" },
  ];

  return { components, wires, testPoints };
}

export function gasLayout(opts: {
  battery: LabeledBlock;
  fuse: LabeledBlock;
  key: LabeledBlock;
  solenoid: LabeledBlock;
  starter: LabeledBlock;
  ignition: LabeledBlock;
  module: LabeledBlock;
  engine: LabeledBlock;
  fuel: LabeledBlock;
  kill: LabeledBlock;
}): { components: ComponentDef[]; wires: WireDef[]; testPoints: TestPointDef[] } {
  const components: ComponentDef[] = [
    c({
      id: "bt1",
      ref: "BT1",
      name: opts.battery.name,
      kind: "battery",
      description: opts.battery.description,
      commonFailures: opts.battery.commonFailures,
      expectedValues: opts.battery.expectedValues,
      x: 36,
      y: 210,
      w: 198,
      h: 148,
      terminals: [
        { id: "bt1-p", label: "B+", side: "e", t: 0.32 },
        { id: "bt1-n", label: "B−", side: "e", t: 0.72 },
      ],
    }),
    c({
      id: "f1",
      ref: "F1",
      name: opts.fuse.name,
      kind: "fuse",
      description: opts.fuse.description,
      commonFailures: opts.fuse.commonFailures,
      expectedValues: opts.fuse.expectedValues,
      x: 36,
      y: 78,
      w: 198,
      h: 58,
      terminals: [
        { id: "f1-in", label: "IN", side: "s", t: 0.5 },
        { id: "f1-out", label: "OUT", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "k1",
      ref: "K1",
      name: opts.solenoid.name,
      kind: "solenoid",
      description: opts.solenoid.description,
      commonFailures: opts.solenoid.commonFailures,
      expectedValues: opts.solenoid.expectedValues,
      x: 300,
      y: 226,
      w: 168,
      h: 116,
      terminals: [
        { id: "k1-l1", label: "BAT", side: "w", t: 0.32 },
        { id: "k1-l2", label: "STR", side: "e", t: 0.32 },
        { id: "k1-c+", label: "COIL+", side: "w", t: 0.78 },
        { id: "k1-c-", label: "COIL−", side: "e", t: 0.78 },
      ],
    }),
    c({
      id: "m1",
      ref: "M1",
      name: opts.starter.name,
      kind: "motor",
      description: opts.starter.description,
      commonFailures: opts.starter.commonFailures,
      expectedValues: opts.starter.expectedValues,
      x: 536,
      y: 214,
      w: 196,
      h: 132,
      terminals: [
        { id: "m1-in", label: "BAT", side: "w", t: 0.35 },
        { id: "m1-gnd", label: "GND", side: "s", t: 0.5 },
      ],
    }),
    c({
      id: "eng",
      ref: "ENG",
      name: opts.engine.name,
      kind: "engine",
      description: opts.engine.description,
      commonFailures: opts.engine.commonFailures,
      expectedValues: opts.engine.expectedValues,
      x: 800,
      y: 198,
      w: 236,
      h: 164,
      terminals: [
        { id: "eng-spk", label: "SPK", side: "w", t: 0.28 },
        { id: "eng-fuel", label: "FUEL", side: "s", t: 0.55 },
      ],
    }),
    c({
      id: "s2",
      ref: "S2",
      name: opts.key.name,
      kind: "switch",
      description: opts.key.description,
      commonFailures: opts.key.commonFailures,
      expectedValues: opts.key.expectedValues,
      x: 300,
      y: 78,
      w: 168,
      h: 58,
      terminals: [
        { id: "s2-in", label: "IN", side: "w", t: 0.5 },
        { id: "s2-on", label: "ON", side: "s", t: 0.35 },
        { id: "s2-st", label: "START", side: "s", t: 0.72 },
      ],
    }),
    c({
      id: "s5",
      ref: "S5",
      name: opts.kill.name,
      kind: "switch",
      description: opts.kill.description,
      commonFailures: opts.kill.commonFailures,
      expectedValues: opts.kill.expectedValues,
      x: 492,
      y: 78,
      w: 168,
      h: 58,
      terminals: [
        { id: "s5-in", label: "IN", side: "w", t: 0.5 },
        { id: "s5-out", label: "OK", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "ign",
      ref: "IGN",
      name: opts.ignition.name,
      kind: "ignition",
      description: opts.ignition.description,
      commonFailures: opts.ignition.commonFailures,
      expectedValues: opts.ignition.expectedValues,
      x: 684,
      y: 78,
      w: 168,
      h: 58,
      terminals: [
        { id: "ign-in", label: "IN", side: "w", t: 0.5 },
        { id: "ign-out", label: "COIL", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "a1",
      ref: "A1",
      name: opts.module.name,
      kind: "controller",
      description: opts.module.description,
      commonFailures: opts.module.commonFailures,
      expectedValues: opts.module.expectedValues,
      x: 300,
      y: 400,
      w: 236,
      h: 74,
      terminals: [
        { id: "a1-pwr", label: "B+", side: "n", t: 0.3 },
        { id: "a1-sig", label: "SIG", side: "e", t: 0.5 },
      ],
    }),
    c({
      id: "carb",
      ref: "FUEL",
      name: opts.fuel.name,
      kind: "other",
      description: opts.fuel.description,
      commonFailures: opts.fuel.commonFailures,
      expectedValues: opts.fuel.expectedValues,
      x: 560,
      y: 400,
      w: 196,
      h: 74,
      terminals: [{ id: "carb-in", label: "IN", side: "w", t: 0.5 }],
    }),
    c({
      id: "gnd",
      ref: "GND",
      name: "Frame ground",
      kind: "other",
      description: "Engine block, solenoid return, and 12 V negative. A painted starter boss is a classic no-crank.",
      commonFailures: ["Painted starter mounting", "Corroded battery negative"],
      expectedValues: [{ label: "Engine block to battery B−", value: "< 0.2 Ω" }],
      x: 800,
      y: 560,
      w: 236,
      h: 48,
      terminals: [{ id: "gnd-1", label: "CHASSIS", side: "n", t: 0.35 }],
    }),
  ];

  const wires: WireDef[] = [
    { id: "w-bt-k", kind: "power", from: "bt1-p", to: "k1-l1", label: "B+" },
    { id: "w-k-st", kind: "power", from: "k1-l2", to: "m1-in", label: "STARTER" },
    { id: "w-bt-n", kind: "ground", from: "bt1-n", to: "gnd-1", waypoints: [{ x: 250, y: 470 }, { x: 800, y: 470 }] },
    { id: "w-st-g", kind: "ground", from: "m1-gnd", to: "gnd-1" },
    { id: "w-bt-f", kind: "control", from: "bt1-p", to: "f1-in", waypoints: [{ x: 250, y: 258 }, { x: 250, y: 136 }] },
    { id: "w-f-key", kind: "control", from: "f1-out", to: "s2-in" },
    { id: "w-key-on", kind: "control", from: "s2-on", to: "a1-pwr", label: "IGN" },
    {
      id: "w-key-st",
      kind: "control",
      from: "s2-st",
      to: "k1-c+",
      label: "START",
      waypoints: [
        { x: 380, y: 160 },
        { x: 280, y: 160 },
        { x: 280, y: 316 },
      ],
    },
    { id: "w-key-kill", kind: "control", from: "s2-on", to: "s5-in", waypoints: [{ x: 384, y: 160 }] },
    { id: "w-kill-ign", kind: "control", from: "s5-out", to: "ign-in" },
    { id: "w-ign-eng", kind: "control", from: "ign-out", to: "eng-spk", label: "SPARK" },
    { id: "w-mod-fuel", kind: "control", from: "a1-sig", to: "carb-in", label: "FUEL" },
    { id: "w-fuel-eng", kind: "control", from: "carb-in", to: "eng-fuel", waypoints: [{ x: 720, y: 470 }] },
    { id: "w-k-gnd", kind: "ground", from: "k1-c-", to: "gnd-1", waypoints: [{ x: 500, y: 360 }, { x: 500, y: 470 }] },
  ];

  const testPoints: TestPointDef[] = [
    { id: "tp-bat", label: "TP1", x: 242, y: 250, componentId: "bt1", expected: opts.battery.expectedValues[0]?.value ?? "12.4–12.8 V" },
    { id: "tp-coil", label: "TP2", x: 292, y: 316, componentId: "k1", expected: "12 V cranking" },
    { id: "tp-spk", label: "TP3", x: 792, y: 230, componentId: "eng", expected: "Spark at plug" },
    { id: "tp-ign", label: "TP4", x: 860, y: 107, componentId: "ign", expected: "Kill open to run" },
  ];

  return { components, wires, testPoints };
}
