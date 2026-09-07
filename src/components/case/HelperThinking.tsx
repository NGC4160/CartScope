import { Loader2 } from "lucide-react";

export function HelperThinking({
  variant = "bay",
  testId,
}: {
  variant?: "bay" | "dock";
  testId?: string;
}) {
  const bay = variant === "bay";
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={
        bay
          ? "mt-2 flex items-center gap-2.5 rounded-md border border-navy/25 bg-navy/[0.07] px-3 py-2.5"
          : "flex items-center gap-2.5 rounded-md bg-navy px-3 py-2"
      }
    >
      <Loader2
        className={"size-4 shrink-0 animate-spin " + (bay ? "text-navy" : "text-navy-fg")}
        aria-hidden
      />
      <div>
        <p className={"text-sm font-medium " + (bay ? "text-navy" : "text-navy-fg")}>Helper is thinking</p>
        <p className={"font-mono text-xs " + (bay ? "text-ink-muted" : "text-navy-fg/70")}>
          Looking in the factory book first…
        </p>
      </div>
    </div>
  );
}
