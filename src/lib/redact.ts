/** Strip customer identity from text that will leave the tablet. */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE =
  /(?<!\d)(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?!\d)/g;
const ADDRESS_RE =
  /\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Way|Hwy|Highway|Pkwy|Parkway|Cir|Circle|Pl|Place|Ter|Terrace)\.?\b/gi;
const HCP_RE = /\bHCP[\s#:._-]*\d[A-Z0-9-]*\b/gi;
const INVOICE_RE = /\b(?:INV|invoice)[\s#:._-]*[A-Z0-9-]+\b/gi;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function reset(re: RegExp) {
  re.lastIndex = 0;
}

export function collectSecrets(input: {
  lastName?: string;
  hcpJobNumber?: string;
}): string[] {
  const out: string[] = [];
  const last = input.lastName?.trim();
  const hcp = input.hcpJobNumber?.trim();
  if (last && last.length >= 2) out.push(last);
  if (hcp && hcp.length >= 2) out.push(hcp);
  if (hcp) {
    const tail = hcp.replace(/^HCP[\s#:._-]*/i, "").trim();
    if (tail && tail.length >= 4 && tail !== last) out.push(tail);
  }
  const seen = new Set<string>();
  return out
    .filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.length - a.length);
}

export function redactText(text: string, secrets: string[]): string {
  if (!text) return text;
  let out = text;
  out = out.replace(EMAIL_RE, "[redacted-email]");
  out = out.replace(PHONE_RE, "[redacted-phone]");
  out = out.replace(ADDRESS_RE, "[redacted-address]");
  out = out.replace(HCP_RE, "[redacted-job]");
  out = out.replace(INVOICE_RE, "[redacted-invoice]");
  for (const secret of secrets) {
    if (secret.length < 2) continue;
    const re = new RegExp(`\\b${escapeRegExp(secret)}\\b`, "gi");
    out = out.replace(re, "[redacted]");
  }
  return out;
}

export function findPiiLeaks(text: string, secrets: string[] = []): string[] {
  const leaks: string[] = [];
  const blob = text ?? "";
  for (const secret of secrets) {
    if (secret.length < 2) continue;
    const re = new RegExp(`\\b${escapeRegExp(secret)}\\b`, "i");
    if (re.test(blob)) leaks.push("customer-secret");
  }
  reset(EMAIL_RE);
  if (EMAIL_RE.test(blob)) leaks.push("email");
  reset(PHONE_RE);
  if (PHONE_RE.test(blob)) leaks.push("phone");
  reset(ADDRESS_RE);
  if (ADDRESS_RE.test(blob)) leaks.push("address");
  reset(HCP_RE);
  if (HCP_RE.test(blob)) leaks.push("job-number");
  if (/customer last name/i.test(blob)) leaks.push("last-name-label");
  if (/housecall\s*pro/i.test(blob)) leaks.push("hcp-label");
  if (/\b(?:job number|hcp job)\b/i.test(blob) && /hcp[\s#:._-]*\d/i.test(blob)) {
    leaks.push("job-number-phrase");
  }
  return [...new Set(leaks)];
}

export function mdCell(value: string): string {
  return (value || "").replace(/\s+/g, " ").replace(/\|/g, "/").trim();
}

export function slugPart(value: string, max = 40): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}
