import { BAY_PANES, BAY_TAP_MIN_PX, type BayPane } from "@/lib/bay-chrome";

export function BayDock({
  value,
  onChange,
  diagramDisabled,
}: {
  value: BayPane;
  onChange: (pane: BayPane) => void;
  diagramDisabled?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Bay views"
      data-testid="bay-dock"
      className="no-print grid grid-cols-4 gap-1 border-b border-line bg-surface px-2 py-1.5"
    >
      {BAY_PANES.map((pane) => {
        const active = value === pane.id;
        const disabled = pane.id === "diagram" && diagramDisabled;
        return (
          <button
            key={pane.id}
            type="button"
            role="tab"
            aria-selected={active}
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
