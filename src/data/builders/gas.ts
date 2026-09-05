import { dx, obs, ohm, volt, yesNo } from "@/data/helpers";
import { gasLayout } from "@/data/layouts";
import type { Diagnosis, DiagnosticStep, ModelPack, SymptomDef } from "@/data/types";

export interface GasSpec {
  id: string;
  manufacturer: "club-car" | "ezgo" | "yamaha";
  manufacturerLabel: string;
  name: string;
  fullName: string;
  years: string;
  architecture: string;
  diagramTitle: string;
  diagramNotes: string[];
  engineName: string;
  engineDesc: string;
  moduleName: string;
  moduleDesc: string;
  ignitionName: string;
  ignitionDesc: string;
  fuelName: string;
  fuelDesc: string;
  killName: string;
  killDesc: string;
  manualPrefix: string;
  oilSensor: boolean;
  efi: boolean;
}

export function buildGas(spec: GasSpec): ModelPack {
  const M = spec.manualPrefix;
  const { components, wires, testPoints } = gasLayout({
    battery: {
      name: "12 V battery",
      description:
        "One 12 V battery starts the engine. Voltage is how strong the electric power is. Look at this number with the key off: 12.4–12.8 V is good. If it drops below 9.5 V while the starter turns, the battery is weak. Clean the black cable at the engine. Paint on the starter mount can stop a crank.",
      commonFailures: ["Battery is low", "Dirty posts", "Battery dies when the starter turns"],
      expectedValues: [
        { label: "Sitting (key off)", value: "12.4–12.8 V" },
        { label: "While the starter turns", value: "≥ 9.5 V" },
      ],
    },
    fuse: {
      name: "Main fuse",
      description: "This fuse feeds the key with 12 V. If the fuse is open (broken), the key, spark, and start all go dead together.",
      commonFailures: ["Opens after a starter click switch short", "Dirty fuse holder"],
      expectedValues: [{ label: "Continuity (is it connected all the way)", value: "Closed" }],
    },
    key: {
      name: "Key / ignition switch",
      description:
        "OFF / ON / START. ON sends power to spark, the kill switch (stop-spark switch), oil, and (if this cart has fuel injection) the fuel-injection computer (ECU). START turns on the starter click switch (solenoid). That is the main power switch for the starter. A worn key drops power on START. Then the click switch chatters.",
      commonFailures: ["Worn START contacts", "Loose plug"],
      expectedValues: [
        { label: "ON", value: "12 V" },
        { label: "START (held)", value: "12 V at click switch coil+" },
      ],
    },
    solenoid: {
      name: "Starter click switch (solenoid)",
      description:
        "The starter click switch (solenoid) is the main power switch for the starter. It has four posts. The two big posts send battery power to the starter. The two small posts are the coil (small magnet wires that pull the click switch in). Key START feeds them through the kill/oil path. A click does not mean the big posts closed.",
      commonFailures: ["Pitted metal pads (click, no crank)", "Open coil", "Stuck plunger"],
      expectedValues: [
        { label: "Coil", value: "3–8 Ω typical" },
        { label: "L2 while cranking", value: "Battery power" },
      ],
    },
    starter: {
      name: "Starter that also makes power (starter-generator)",
      description:
        "Most golf-car engines use a starter-generator (a starter that also makes power). Older ones make power after start. Fuel-injection Kohler uses its own starter. No crank with pack power on the starter stud is the starter or a painted mount.",
      commonFailures: ["Worn brushes", "Open field", "Painted mount (no ground)"],
      expectedValues: [
        { label: "Cranking power at stud", value: "≥ 9.5 V" },
        { label: "Brushes / field", value: "Per engine manual" },
      ],
    },    ignition: {
      name: spec.ignitionName,
      description: spec.ignitionDesc,
      commonFailures: ["Failed spark coil", "Kill wire grounded", "Fouled plug"],
      expectedValues: [
        { label: "Spark at plug (grounded tester)", value: "Blue-white spark" },
        { label: "Primary resistance", value: "Per coil spec" },
      ],
    },
    module: {
      name: spec.moduleName,
      description: spec.moduleDesc,
      commonFailures: ["No power on key-on", "Failed after a jump with reverse polarity", "Dirty plug"],
      expectedValues: [{ label: "Key-on power", value: "12 V" }],
    },
    engine: {
      name: spec.engineName,
      description: spec.engineDesc,
      commonFailures: ["No squeeze (compression)", "Stuck valves", "Flooded carb / EFI"],
      expectedValues: [
        { label: "Cranks", value: "Spins freely, you can hear it" },
        { label: "Compression", value: "Per engine spec (typically ≥ 90 psi class)" },
      ],
    },
    fuel: {
      name: spec.fuelName,
      description: spec.fuelDesc,
      commonFailures: spec.efi
        ? ["Failed pump", "Clogged filter", "No ECU enable"]
        : ["Stuck float", "Clogged jet / filter", "Old fuel"],
      expectedValues: spec.efi
        ? [{ label: "Key-on pump", value: "Runs 1–3 s" }]
        : [{ label: "Fuel at bowl / filter", value: "There, fresh, not mixed with water" }],
    },
    kill: {
      name: spec.killName,
      description: spec.killDesc,
      commonFailures: spec.oilSensor
        ? ["Low oil opening the kill path", "Failed oil switch", "Seat/kill switch stuck"]
        : ["Kill switch stuck closed to ground", "Seat switch open"],
      expectedValues: [{ label: "Run (kill open to ground)", value: "Open" }],
    },  });

  const steps: Record<string, DiagnosticStep> = {
    "g-setup": obs(
      "g-setup",
      "Set the cart up first",
      "Now do this. Put the direction switch (F&R) in Neutral or Park, as this model needs. Key OFF, then ON. Fuel on. Kill switch (stop-spark switch) in RUN. Seat down. Chock the wheels. Make the 12 V battery cables tight at the posts and at the engine.",
      `Factory book: ${M} — Will not crank / will not start, preliminary`,
      ["s2", "s5", "bt1"],
      "Fuel on, kill in RUN, seat down, cables tight?",
      "Look with your eyes. No meter yet.",
      "Setup is right",
      yesNo("Setup is right — keep going", "A switch or cable is wrong", false),
      { kind: "step", id: "g-bat" },
      { kind: "diagnosis", id: "gdx-setup" },
      { caution: "Chock the wheels. Stay away from the starter-generator fan and the carb (mixes gas and air) intake." },
    ),
    "g-bat": volt(
      "g-bat",
      "12 V battery, sitting",
      "Key OFF. Now do this. Measure voltage (how strong the electric power is) across the 12 V battery posts. Do not measure at the click switch. Look at this number. Below 12.2 V: charge first. A battery that is 12.6 V sitting and then drops when the starter turns is still a battery problem.",
      `Factory book: ${M} — Battery`,
      ["bt1"],
      "12 V battery, key off",
      "DC volts on the battery posts.",
      "12.4–12.8 V sitting",
      12.4,
      13.2,
      "12.62",
      { kind: "step", id: "g-fuse" },
      { kind: "diagnosis", id: "gdx-battery" },
    ),
    "g-fuse": obs(
      "g-fuse",
      "Main fuse",
      "Now do this. Pull the main 12 V fuse. Check if it is connected all the way. Then check 12 V on the feed side of the holder.",
      `Factory book: ${M} — Fuse`,
      ["f1"],
      "Main fuse closed?",
      "Ohms (how hard it is for power to flow). Fuse out of the holder.",
      "Closed",
      yesNo("Fuse is good", "Fuse is open"),
      { kind: "step", id: "g-key" },
      { kind: "diagnosis", id: "gdx-fuse" },
    ),
    "g-key": volt(
      "g-key",
      "Key switch ON output",
      "Key ON. Now do this. Measure 12 V at the key ON terminal to the frame. This feeds spark, the kill/oil path, and (if this cart has fuel injection) the fuel-injection computer (ECU).",
      `Factory book: ${M} — Key switch`,
      ["s2", "w-f-key"],
      "Key ON output",
      "DC volts, key ON terminal to battery negative.",
      "11.5–13.2 V",
      11.5,
      13.2,
      "12.4",
      { kind: "step", id: "g-kill" },
      { kind: "diagnosis", id: "gdx-key" },
    ),    "g-kill": obs(
      "g-kill",
      spec.oilSensor ? "Kill / oil / seat path" : "Kill / seat path",
      spec.oilSensor
        ? "Club Car (and some Yamaha) engines will not spark if the oil-warning path is open or oil is low. Check oil first. Then the oil switch. Then the seat/kill switch (stop-spark switch). The spark kill wire must be open to ground for the engine to run."
        : "Now do this. Set the kill switch (stop-spark switch) to RUN. The seat/neutral start switch must be closed as this model needs. The spark kill wire must be open to ground for the engine to run.",
      `Factory book: ${M} — Kill / oil / seat`,
      ["s5", "ign"],
      spec.oilSensor ? "Oil full, kill in RUN, seat down — kill wire NOT grounded?" : "Kill in RUN, seat down — kill wire NOT grounded?",
      "Ohms from the coil kill terminal to the frame, key OFF. Should be open in RUN.",
      "Kill open (engine can run)",
      yesNo("Kill path is open — keep going", "Kill is grounded / oil or seat is open"),
      { kind: "step", id: "g-click" },
      { kind: "diagnosis", id: "gdx-kill" },
    ),
    "g-click": obs(
      "g-click",
      "Starter click switch click",
      "Key to START. Listen at the starter click switch (solenoid). That is the main power switch for the starter. No click = coil path (key START, kill, click-switch coil). Click with no crank = metal pads inside, starter, or ground at the engine.",
      `Factory book: ${M} — Starter solenoid`,
      ["k1", "s2"],
      "Did the click switch click on START?",
      "Listen at K1 while a helper holds START. Do not crank more than 5 s.",
      "You can hear a click",
      [
        { id: "click", label: "Click switch clicked", result: "pass" },
        { id: "noclick", label: "No click", result: "fail" },
      ],
      { kind: "step", id: "g-crank-v" },
      { kind: "step", id: "g-coil-v" },
    ),
    "g-coil-v": volt(
      "g-coil-v",
      "Click-switch coil power on START",
      "Key held in START. Now check if the power is flowing. Voltage is how strong the electric power is. Measure across the two small coil posts. Pack power there and no click = replace the click switch. Dark coil = key START or kill path.",
      `Factory book: ${M} — Solenoid coil`,
      ["k1", "s2", "s5"],
      "Coil power while START is held",
      "DC volts across the small posts. Limit crank to 5 s.",
      "≥ 10 V while START held",
      10,
      13.5,
      "11.8",
      { kind: "diagnosis", id: "gdx-solenoid" },
      { kind: "diagnosis", id: "gdx-start-circuit" },
    ),
    "g-crank-v": volt(
      "g-crank-v",
      "Power at starter while cranking",
      "Key START. Now check if the power is flowing. Voltage is how strong the electric power is. Measure at the starter battery stud to the engine. Look at this number. ≥ 9.5 V and no spin = starter or painted mount. Drop below 9.5 V = battery or cable.",
      `Factory book: ${M} — Starter cranking voltage`,
      ["m1", "k1", "bt1"],
      "Starter stud to engine while cranking",
      "DC volts on the starter stud. Limit crank to 5 s.",
      "≥ 9.5 V while cranking",
      9.5,
      13.5,
      "10.8",
      { kind: "step", id: "g-cranks" },
      { kind: "diagnosis", id: "gdx-battery" },
      { caution: "Do not crank more than 5 seconds. Wait 30 s to cool." },
    ),
    "g-cranks": obs(
      "g-cranks",
      "Does the engine spin?",
      "With ≥ 9.5 V at the starter, the engine must spin. No spin = starter-generator (starter that also makes power) or a stuck engine. Slow spin with good power = something dragging or a weak starter.",
      `Factory book: ${M} — Cranks / no-crank`,
      ["m1", "eng"],
      "Did the engine spin when START was held?",
      "Listen / watch the starter-generator fan. Wheels chocked.",
      "Engine spins",
      yesNo("Engine cranks — go on to spark/fuel", "Does not spin"),
      { kind: "step", id: "g-spark" },
      { kind: "diagnosis", id: "gdx-starter" },
    ),    "g-spark": obs(
      "g-spark",
      "Spark at the plug",
      "Now do this. Take out the plug. Connect a grounded spark tester (or lay the plug on the head). Crank. You need a blue-white spark. No spark with the kill path open = spark coil / spark box (TCI) / fuel-injection computer (ECU) / trigger.",
      `Factory book: ${M} — Ignition / spark`,
      ["ign", "eng", "a1"],
      "Is there a strong spark at the plug while cranking?",
      "Spark tester grounded to the head. Fuel away from the well. Limit crank to 5 s.",
      "Blue-white spark",
      yesNo("Strong spark", "No spark / weak orange spark"),
      { kind: "step", id: "g-fuel" },
      { kind: "diagnosis", id: "gdx-ignition" },
      { caution: "No open-air fuel. Ground the tester to the head, not to a painted shield." },
    ),
    "g-fuel": obs(
      "g-fuel",
      spec.efi ? "EFI fuel pump and rail" : "Fuel at the carb",
      spec.efi
        ? "Key ON: the pump must run 1–3 seconds. EFI is the fuel-injection computer. Check fresh fuel, a live pump fuse, and ECU enable. No pump = fuse, pump, or ECU. Pump runs but no start = injector / compression / spark timing."
        : "Now do this. Check fuel in the tank (not mixed with water or old). Filter not collapsed. Carb (mixes gas and air) bowl has fuel. A flooded engine (plug wet with raw fuel) is mix / float, not spark.",
      `Factory book: ${M} — Fuel delivery`,
      ["carb", "eng"],
      spec.efi ? "Did the pump run on key-on, and is fuel fresh?" : "Is fresh fuel reaching the carb bowl / filter?",
      spec.efi ? "Listen at the tank / rail, key ON." : "Look at the bowl / filter. Plug not wet with raw fuel unless flooded.",
      spec.efi ? "Pump runs, fuel fresh" : "Fuel is there and fresh",
      yesNo("Fuel path is good — keep going", "No fuel / old / flooded"),
      { kind: "step", id: "g-comp" },
      { kind: "diagnosis", id: "gdx-fuel" },
    ),
    "g-comp": obs(
      "g-comp",
      "Compression / what is left",
      "Spark and fuel are there and the engine cranks. Factory leftover causes: low compression, jumped timing, or (if this cart has fuel injection) a fuel-injection computer (ECU) that is not injecting. Check compression per the engine section before you replace the ECU/spark box.",
      `Factory book: ${M} — Cranks, spark, fuel, will not start`,
      ["eng"],
      "Compression in the factory book range and timing marks lined up?",
      "Compression gauge in the plug hole. Check timing marks per the engine book.",
      "Compression and timing OK",
      yesNo("Compression/timing OK — leftover is ECU/carb setup", "Low compression or timing off"),
      { kind: "diagnosis", id: "gdx-module" },
      { kind: "diagnosis", id: "gdx-engine" },
    ),
    "g-dies": obs(
      "g-dies",
      "Starts then dies",
      "Engine fires then dies. Check the kill switch (stop-spark switch) grounding after start (oil switch, seat switch). Or fuel starving (vented cap, clogged filter, EFI pump that only primes). Or a carb that is too lean. Make sure the kill wire stays open after start.",
      `Factory book: ${M} — Starts then dies`,
      ["s5", "carb", "ign"],
      "Does the kill wire stay open after start, and is fuel still reaching the engine?",
      "Probe the kill-to-frame wire after start (should stay open). Fuel at filter/bowl or EFI rail pressure.",
      "Kill stays open and fuel keeps coming",
      yesNo("Kill open, fuel keeps coming — carb/EFI mix or idle path", "Kill grounds or fuel stops"),
      { kind: "diagnosis", id: "gdx-idle" },
      { kind: "diagnosis", id: "gdx-kill" },
    ),
    "g-power": obs(
      "g-power",
      "Runs, low power",
      "Engine runs but the cart is slow. Check a slipping drive clutch / belt, dragging brakes, blocked exhaust, clogged air filter, or (EFI) a limp from a failed sensor. Check belt and brakes before the carb/ECU.",
      `Factory book: ${M} — Low power`,
      ["eng", "carb"],
      "Belt, brakes, air filter, and exhaust clear?",
      "Look, plus a free rear wheel in Neutral (chocked, TOW/Neutral).",
      "Driveline free, filter/exhaust clear",
      yesNo("Mechanical path is free — leftover is fuel/spark", "Belt, brakes, filter, or exhaust is the cause"),
      { kind: "diagnosis", id: "gdx-idle" },
      { kind: "diagnosis", id: "gdx-drag" },
    ),  };

  const diagnoses: Record<string, Diagnosis> = {
    "gdx-setup": dx("gdx-setup", "The cart is not set up yet", "The engine is not allowed to crank or run with the switches like this.", "Kill in OFF, seat up, fuel off, or cables off.", "Set kill to RUN. Seat down. Fuel on. Cables tight.", [], "info"),
    "gdx-battery": dx("gdx-battery", "12 V battery is too low", "Sitting power is below 12.4 V, or the battery drops when the starter turns.", "Dead or weak battery, or dirty cables.", "Charge and load-test. Replace the 12 V battery if it will not hold 9.5 V while the starter turns. Clean cable ends at the engine.", [{ name: "12 V starting battery" }], "replace"),
    "gdx-fuse": dx("gdx-fuse", "Main fuse is open", "The 12 V fuse is open, so key, spark, and START are all dark.", "Shorted click-switch coil or a pinched wire.", "Find the short. Then replace the fuse.", [{ name: "Main 12 V fuse" }], "replace"),
    "gdx-key": dx("gdx-key", "Key switch or feed", "12 V is not leaving the key in ON.", "Worn key switch or open fuse holder.", "Check the fuse feed first. If the feed is good, replace the key switch.", [{ name: "Key / ignition switch" }], "replace"),
    "gdx-kill": dx("gdx-kill", spec.oilSensor ? "Kill / oil / seat path" : "Kill / seat path", "The spark kill wire is grounded, or the oil/seat switch is open, so the engine is not allowed to spark or stay running.", spec.oilSensor ? "Low oil, failed oil switch, or seat/kill switch." : "Kill switch stuck or seat switch open.", spec.oilSensor ? "Fill oil to the dipstick. If oil is full and the kill wire is still grounded, unplug the oil switch first, then the seat/kill switch." : "Set kill to RUN. Replace the switch that is grounding the coil.", [{ name: spec.killName }], "service"),
    "gdx-start-circuit": dx("gdx-start-circuit", "START path is open", "Click-switch coil is dark while START is held.", "Key START contact, kill path, or broken coil wire.", "Check 12 V at key START. Then follow through the kill/oil path to coil+.", [{ name: "Key switch" }, { name: spec.killName }], "replace"),
    "gdx-solenoid": dx("gdx-solenoid", "Starter click switch (solenoid) failed", "Coil power is there. The unit does not click — or it clicks and L2 stays dark.", "Open coil, stuck plunger, or pitted metal pads inside.", "Replace the 12 V 4-post starter click switch (solenoid). Move cables one at a time.", [{ name: "12 V starter click switch (solenoid)" }], "replace"),
    "gdx-starter": dx("gdx-starter", "Starter-generator or engine is stuck", "≥ 9.5 V at the starter stud and the engine does not spin.", "Worn starter, painted mount, or a stuck engine.", "Check starter ground at the engine (scrape paint). If the engine will not turn by hand at the flywheel (spark plug out), the engine is stuck — do not keep cranking.", [{ name: "Starter that also makes power (starter-generator)" }], "replace"),
    "gdx-ignition": dx("gdx-ignition", "No spark — coil / spark box / computer / trigger", "Kill path is open and there is no spark while cranking.", spec.efi ? "Failed spark coil, fuel-injection computer (ECU), or crank/cam trigger." : "Failed spark coil, spark box (TCI), or trigger / flywheel magnet.", `Replace the ${spec.ignitionName} if the numbers are not in the factory book range. If the coil is good, replace the ${spec.moduleName}. Fit a new plug if the old one is fouled.`, [{ name: spec.ignitionName }, { name: spec.moduleName }, { name: "Spark plug" }], "replace"),
    "gdx-fuel": dx("gdx-fuel", spec.efi ? "EFI fuel delivery" : "Fuel / carb (mixes gas and air)", spec.efi ? "Pump did not run, or fuel is old / missing." : "No fresh fuel at the bowl, or the engine is flooded.", spec.efi ? "Pump fuse, pump, or ECU enable." : "Empty tank, clogged filter, stuck float, or old fuel.", spec.efi ? "Check pump fuse and 12 V at the pump on key-on. Replace the pump if it is silent with power. Use fresh fuel." : "Drain old fuel. Replace the filter. Rebuild or replace the carb if the float sticks. Dry a flooded plug.", [{ name: spec.fuelName }, { name: "Fuel filter" }], "replace"),
    "gdx-engine": dx("gdx-engine", "Low compression or timing", "Spark and fuel are there. Compression or timing is not.", "Worn rings/valves, jumped timing, or a stuck valve.", "Repair the engine per the engine section. Do not replace the ECU/TCI for a mechanical miss.", [{ name: spec.engineName, notes: "Top of the engine / timing as needed" }], "replace"),
    "gdx-module": dx("gdx-module", `${spec.moduleName} leftover`, "Crank, spark, fuel, and compression passed. What is left is the control module or a carb/fuel-injection setup that is not in the factory book range.", spec.efi ? "Fuel-injection computer (ECU) not injecting or a failed sensor putting it in a no-run." : "Carb mix/idle path, or spark box (TCI) that sparks on a tester but not under compression.", spec.efi ? `Scan if a tool is available. Replace the ${spec.moduleName} if it is not pulsing the injector with a good crank/cam signal.` : "Rebuild the carb (idle path) before replacing the spark box. If the carb is known-good, replace the module.", [{ name: spec.moduleName }, { name: spec.fuelName }], "service"),
    "gdx-idle": dx("gdx-idle", "Idle / mix / EFI limp", "Engine runs but will not idle or make power after drag is ruled out.", spec.efi ? "Limp from a failed sensor, or a blocked injector." : "Idle mix, clogged jet, or blocked exhaust.", spec.efi ? "Check sensor plugs. Replace the blocked injector/filter." : "Clean or rebuild the carb. Look in the muffler for a collapsed baffle.", [{ name: spec.fuelName }], "service"),
    "gdx-drag": dx("gdx-drag", "Driveline drag or block", "Belt, brakes, air filter, or exhaust is the low-power cause — not the spark module.", "Glazed belt, dragging brakes, clogged filter, collapsed muffler.", "Fix the mechanical item. Retest a hill climb before you send it out.", [{ name: "Drive belt" }, { name: "Brake adjustment" }, { name: "Air filter / muffler" }], "service"),
  };

  const symptoms: SymptomDef[] = [
    { id: "no-crank", label: "Engine will not crank", summary: "Key START does nothing, or the click switch clicks with no spin. Check 12 V battery → fuse → key → kill → click switch → starter.", manualSection: `Factory book: ${M} — Will not crank`, startStepId: "g-setup" },
    { id: "no-start", label: "Cranks, will not start", summary: "Engine spins. Spark, then fuel, then compression — factory order.", manualSection: `Factory book: ${M} — Cranks, will not start`, startStepId: "g-spark" },
    { id: "no-spark", label: "No spark", summary: "Kill/oil path first, then spark coil / spark box (TCI) / fuel-injection computer (ECU).", manualSection: `Factory book: ${M} — Ignition`, startStepId: "g-kill" },
    { id: "starts-dies", label: "Starts then dies", summary: "Kill path grounding after start, or the engine is starving for fuel.", manualSection: `Factory book: ${M} — Starts then dies`, startStepId: "g-dies" },
    { id: "low-power", label: "Runs, low power", summary: "Belt, brakes, filter, exhaust first. Then carb/EFI.", manualSection: `Factory book: ${M} — Low power`, startStepId: "g-power" },
  ];
  return {
    id: spec.id,
    manufacturer: spec.manufacturer,
    manufacturerLabel: spec.manufacturerLabel,
    name: spec.name,
    fullName: spec.fullName,
    voltage: 12,
    powertrain: "gasoline",
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
