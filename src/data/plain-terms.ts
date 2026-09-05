/** Simple words for parts and meter readings. Shown on the bench. */

export const KIND_WORDS: Record<string, string> = {
  battery: "batteries",
  switch: "switch",
  solenoid: "solenoid",
  controller: "controller",
  motor: "motor",
  sensor: "gas pedal sensor",
  charger: "charger",
  computer: "cart computer",
  fuse: "fuse",
  receptacle: "plug",
  buzzer: "buzzer",
  brake: "brake",
  engine: "engine",
  ignition: "spark system",
  other: "part",
};

export function unitHelp(kind?: string, unit?: string): string | null {
  if (kind === "voltage" || unit === "V") {
    return "Voltage (V) is how strong the electric power is. A bigger number means more power.";
  }
  if (kind === "resistance" || unit === "Ω") {
    return "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is open (broken).";
  }
  if (kind === "continuity") {
    return "This check asks: is the wire connected all the way? Closed = good. Open = broken.";
  }
  return null;
}

/** Extra plain-word hints for terms that show up in the current step. */
export function termHints(text: string): string[] {
  const t = text.toLowerCase();
  const hints: string[] = [];
  const add = (hit: boolean, hint: string) => {
    if (hit && !hints.includes(hint)) hints.push(hint);
  };
  add(/volt|\bv\b|power is flowing/.test(t), "Voltage is how strong the electric power is.");
  add(/ohm|Ω/.test(t), "Ohms (Ω) tell you how hard it is for power to flow. OL means the path is broken.");
  add(/solenoid/.test(t), "The solenoid is the main power switch. It sends power to the motor.");
  add(/controller|power box|\bmcu\b/.test(t), "The controller sets how fast the cart goes.");
  add(/throttle|\bmcor\b|\btps\b|\bits\b|gas pedal|potentiometer|\bpot\b/.test(t), "The throttle is the gas pedal sensor. It tells the cart how hard you press the pedal.");
  add(/tow\/run|tow-run|tow =|run-storage/.test(t), "Tow/Run (or Run-Storage): Tow/Storage = off for work. Run = ready to drive.");
  add(/lockout/.test(t), "Lockout is a safety lock that stops the cart.");
  add(/f&r|forward\/reverse|direction switch/.test(t), "The direction switch (F&R) picks Forward, Reverse, or Neutral.");
  return hints.slice(0, 4);
}
