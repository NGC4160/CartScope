import { createServerFn } from "@tanstack/react-start";
import { BRAIN_CASES_FOLDER, BRAIN_REPO } from "@/lib/brain-case";
import { findPiiLeaks } from "@/lib/redact";

export type BrainFileStatus = "sent" | "queued" | "rejected";

export type BrainFileResult =
  | { ok: true; status: "sent" | "queued"; detail?: string }
  | { ok: false; status: "rejected" | "failed"; error: string };

export interface BrainFileInput {
  filename: string;
  path: string;
  markdown: string;
}

const FILENAME_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/;

function validatePayload(input: BrainFileInput): string | null {
  if (!FILENAME_RE.test(input.filename)) return "Bad shop-file name.";
  if (input.path !== `${BRAIN_CASES_FOLDER}/${input.filename}`) return "Bad shop-file path.";
  if (input.markdown.length < 40 || input.markdown.length > 80000) return "Shop file is the wrong size.";
  const leaks = findPiiLeaks(`${input.filename}\n${input.path}\n${input.markdown}`);
  if (leaks.length) return "Shop copy still has private info. It was not sent.";
  return null;
}

async function signBody(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const fileBrainCase = createServerFn({ method: "POST" })
  .validator((input: BrainFileInput) => input)
  .handler(async ({ data }): Promise<BrainFileResult> => {
    const problem = validatePayload(data);
    if (problem) return { ok: false, status: "rejected", error: problem };

    const webhook = process.env.BRAIN_WEBHOOK_URL?.trim();
    if (!webhook) {
      return {
        ok: true,
        status: "queued",
        detail: "No shop filing path is set. The redacted copy is ready on this device.",
      };
    }

    const body = JSON.stringify({
      repo: BRAIN_REPO,
      folder: BRAIN_CASES_FOLDER,
      path: data.path,
      filename: data.filename,
      markdown: data.markdown,
      source: "cartscope",
      filedAt: new Date().toISOString(),
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const secret = process.env.BRAIN_WEBHOOK_SECRET?.trim();
    if (secret) {
      headers["X-CartScope-Signature"] = await signBody(secret, body);
    }

    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok || res.status === 409) {
        return { ok: true, status: "sent" };
      }
      return {
        ok: false,
        status: "failed",
        error: `Shop filing path said ${res.status}. Try again.`,
      };
    } catch {
      return {
        ok: false,
        status: "failed",
        error: "Could not reach the shop filing path. Try again.",
      };
    }
  });
