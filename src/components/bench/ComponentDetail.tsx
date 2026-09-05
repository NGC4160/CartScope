import { X } from "lucide-react";
import type { ComponentDef } from "@/data/types";
import { KIND_WORDS, termHints } from "@/data/plain-terms";
import { Button } from "@/components/ui/button";

export function ComponentDetail({
  component,
  onClose,
}: {
  component: ComponentDef;
  onClose: () => void;
}) {
  const hints = termHints(`${component.name} ${component.description} ${component.kind}`);
  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg bg-surface shadow-[var(--shadow-border)]">
      <header className="flex items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-mono text-xs font-semibold tracking-wide text-navy">{component.ref}</p>
          <h2 className="font-display text-xl font-semibold leading-tight text-ink">{component.name}</h2>
          <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-subtle">
            {KIND_WORDS[component.kind] ?? component.kind}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="size-5" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
        <p className="text-sm leading-relaxed text-ink-muted">{component.description}</p>
        {hints.length > 0 ? (
          <ul className="mt-3 space-y-1 rounded-md bg-ok-bg px-3 py-2 text-xs leading-relaxed text-ink">
            {hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null}
        <h3 className="mt-4 font-display text-sm font-semibold uppercase tracking-wide text-ink">
          Numbers to look for
        </h3>
        <dl className="mt-2 divide-y divide-line">
          {component.expectedValues.map((ev) => (
            <div key={ev.label} className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-sm text-ink-muted">{ev.label}</dt>
              <dd className="font-mono text-sm font-medium tabular-nums text-ink">{ev.value}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mt-4 font-display text-sm font-semibold uppercase tracking-wide text-ink">
          What often breaks
        </h3>
        <ul className="mt-2 space-y-1.5">
          {component.commonFailures.map((f) => (
            <li key={f} className="flex gap-2 text-sm leading-snug text-ink-muted">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-power" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
