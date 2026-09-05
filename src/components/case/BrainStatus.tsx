import { useState } from "react";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrainCopyRecord } from "@/data/types";

export function BrainStatus({
  copy,
  busy,
  onRetry,
}: {
  copy?: BrainCopyRecord;
  busy?: boolean;
  onRetry?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!copy && !busy) return null;

  async function copyMd() {
    if (!copy?.markdown) return;
    try {
      await navigator.clipboard.writeText(copy.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* tablet may block clipboard */
    }
  }

  function downloadMd() {
    if (!copy) return;
    const blob = new Blob([copy.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = copy.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const waiting = copy && (copy.status === "queued" || copy.status === "failed");
  const ready = Boolean(copy?.markdown) && copy?.status !== "sent";

  return (
    <section
      className="mt-6 border border-line bg-surface-2 p-4"
      data-brain-status={copy?.status ?? "ready"}
    >
      <p className="font-mono text-xs tracking-[0.18em] text-navy">SHOP FILE</p>
      <ul className="mt-2 grid gap-1 text-sm">
        <li className="flex items-center gap-2 text-ok">
          <Check className="size-4 shrink-0" />
          Saved on this device
        </li>
        {copy?.status === "sent" ? (
          <li className="flex items-center gap-2 text-ok">
            <Check className="size-4 shrink-0" />
            Brain copy sent (redacted)
          </li>
        ) : ready ? (
          <li className="text-ink">Brain copy ready</li>
        ) : busy ? (
          <li className="text-ink-muted">Sending shop copy…</li>
        ) : null}
        {waiting ? <li className="text-ink">Brain copy waiting — retry</li> : null}
      </ul>
      <p className="mt-2 text-sm text-ink-muted">
        The shop copy has no last name and no job number. The full case stays on this tablet.
      </p>
      {copy?.filename ? (
        <p className="mt-1 font-mono text-xs text-ink-subtle">{copy.path}</p>
      ) : null}
      {copy?.error && copy.status === "failed" ? (
        <p className="mt-2 text-sm text-ink-muted">{copy.error}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {waiting && onRetry ? (
          <Button variant="secondary" onClick={onRetry} disabled={busy}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => void copyMd()} disabled={!copy}>
          <Copy className="size-4" />
          {copied ? "Copied shop file" : "Copy shop file"}
        </Button>
        <Button variant="ghost" onClick={downloadMd} disabled={!copy}>
          <Download className="size-4" />
          Save shop file
        </Button>
        <Button variant="ghost" onClick={() => setOpen((v) => !v)} disabled={!copy}>
          {open ? "Hide shop copy" : "Show shop copy"}
        </Button>
      </div>

      {open && copy ? (
        <pre
          data-testid="shop-copy"
          className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-paper px-3 py-2 font-mono text-xs leading-relaxed text-ink"
        >
          {copy.markdown}
        </pre>
      ) : null}
    </section>
  );
}
