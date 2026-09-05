/**
 * Keep each battery voltage as its own clean numeric string.
 * Never append a new typing pass onto a previous value (the 8.308.30 bug).
 */
export function sanitizeVoltageInput(raw: string): string {
  if (!raw) return "";
  let body = raw.replace(/\s+/g, "").replace(",", ".");
  let sign = "";
  if (body.startsWith("-")) {
    sign = "-";
    body = body.slice(1);
  }
  body = body.replace(/[^\d.]/g, "");
  const dup = body.match(/^(\d+)\.(\d+)\1\.\2$/);
  if (dup) return sign + `${dup[1]}.${dup[2]}`;
  const firstDot = body.indexOf(".");
  if (firstDot >= 0) {
    const whole = body.slice(0, firstDot).replace(/\./g, "") || "0";
    const frac = body.slice(firstDot + 1).replace(/\./g, "").slice(0, 3);
    return sign + whole + "." + frac;
  }
  return sign + body;
}

export function isCleanVoltageField(raw: string): boolean {
  if (!raw.trim()) return true;
  return /^-?\d+(?:[.,]\d{1,3})?$/.test(raw.trim());
}
