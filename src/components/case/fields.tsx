import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import type { MeasurementKind } from "@/data/types";
import { commitMeterReading, sanitizeMeterInput } from "@/lib/meter-input";
import { sanitizeVoltageInput } from "@/lib/voltage-input";

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
    <div className={className}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </div>
  );
}

/** Controlled header / note field. Reads every keystroke and stays in React state. */
export function HeaderNoteInput({
  name,
  value,
  onChange,
  className = inputClass,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  name: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <input
      {...rest}
      name={name}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={rest.autoComplete ?? "off"}
      autoCorrect="off"
      spellCheck={false}
      className={className}
    />
  );
}

export function VoltageInput({
  value,
  onChange,
  className = "",
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => onChange(sanitizeVoltageInput(e.target.value))}
      className={className}
    />
  );
}

export const MeterNumberInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
    value: string;
    onChange: (next: string) => void;
    kind: MeasurementKind;
  }
>(function MeterNumberInput(
  { value, onChange, kind, className = "", onFocus, onBlur, onKeyDown, ...rest },
  ref,
) {
  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      onFocus={(e) => {
        e.currentTarget.select();
        onFocus?.(e);
      }}
      onChange={(e) => onChange(sanitizeMeterInput(e.target.value, kind))}
      onBlur={(e) => {
        const commit = commitMeterReading(e.currentTarget.value, { kind });
        if (commit.ok) onChange(commit.raw);
        onBlur?.(e);
      }}
      onKeyDown={onKeyDown}
      className={className}
    />
  );
});

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
