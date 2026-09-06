import { BAY_TAP_MIN_PX, bayDockPanes, type BayPane } from "@/lib/bay-chrome";

export function BayDock({
  value,
  onChange,
  diagramDisabled,
  hideChecks,
}: {
  value: BayPane;
  onChange: (pane: BayPane) => void;
  diagramDisabled?: boolean;
  hideChecks?: boolean;
}) {
  const panes = bayDockPanes({ hideChecks });
  return (
    <div
      role="tablist"
      aria-label="Bay views"
      data-testid="bay-dock"
      data-bay-report-open={hideChecks ? "" : undefined}
      className={
        "no-print grid gap-1 border-b border-line bg-surface px-2 py-1.5 " +
        (panes.length === 3 ? "grid-cols-3" : "grid-cols-4")
      }
    >
      {panes.map((pane) => {
        const active = value === pane.id;
        const disabled = pane.id === "diagram" && diagramDisabled;
        return (
          <button
            key={pane.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-bay-dock-checks={pane.id === "checks" ? "" : undefined}
            disabled={disabled}
            onClick={() => onChange(pane.id)}
            className={
              "rounded-md px-1 text-sm font-semibold shadow-[var(--shadow-border)] " +
              (active ? "bg-navy text-navy-fg" : "bg-surface-2 text-ink") +
              (disabled ? " opacity-40" : "")
            }
            style={{ minHeight: BAY_TAP_MIN_PX }}
          >
            {pane.label}
          </button>
        );
      })}
    </div>
  );
}
