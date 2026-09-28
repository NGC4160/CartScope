import { sanitizeCartYearInput } from "@/lib/year-compat";

const YEAR_PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export function YearGlovePad({
  year,
  onChange,
}: {
  year: string;
  onChange: (next: string) => void;
}) {
  function press(key: (typeof YEAR_PAD_KEYS)[number]) {
    if (key === "clear") {
      onChange("");
      return;
    }
    if (key === "back") {
      onChange(sanitizeCartYearInput(year.slice(0, -1)));
      return;
    }
    onChange(sanitizeCartYearInput(year + key));
  }

  return (
    <div
      data-testid="year-glove-pad"
      className="mt-2 grid grid-cols-3 gap-2"
      role="group"
      aria-label="Year number pad"
    >
      {YEAR_PAD_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          data-testid={`year-pad-${key}`}
          aria-label={
            key === "clear" ? "Clear year" : key === "back" ? "Backspace year" : `Year digit ${key}`
          }
          onClick={() => press(key)}
          className="min-h-14 rounded-md bg-surface text-lg font-semibold tabular-nums text-ink shadow-[var(--shadow-border)] touch-manipulation"
        >
          {key === "clear" ? "Clear" : key === "back" ? "Back" : key}
        </button>
      ))}
    </div>
  );
}
