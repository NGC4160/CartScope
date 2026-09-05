import type { ReactNode } from "react";

export const inputClass =
  "min-h-12 w-full rounded-md bg-surface px-3 text-ink shadow-[var(--shadow-border)] outline-none";

export function Field({
  label,
  children,
  className = "",
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function YesNo({
  value,
  onChange,
  yes = "Yes",
  no = "No",
}: {
  value: string;
  onChange: (v: "yes" | "no") => void;
  yes?: string;
  no?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("yes")}
        className={
          "min-h-12 rounded-md px-3 text-sm font-medium shadow-[var(--shadow-border)] " +
          (value === "yes" ? "bg-navy text-navy-fg" : "bg-surface text-ink")
        }
      >
        {yes}
      </button>
      <button
        type="button"
        onClick={() => onChange("no")}
        className={
          "min-h-12 rounded-md px-3 text-sm font-medium shadow-[var(--shadow-border)] " +
          (value === "no" ? "bg-navy text-navy-fg" : "bg-surface text-ink")
        }
      >
        {no}
      </button>
    </div>
  );
}
