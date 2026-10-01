import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cable, FileText } from "lucide-react";
import { Field, HeaderNoteInput, inputClass } from "@/components/case/fields";
import { YearGlovePad } from "@/components/cart/YearGlovePad";
import { ControllerMatchPanel } from "@/components/cart/ControllerLookup";
import { Button } from "@/components/ui/button";
import { controllerStampsForPack } from "@/data/controllers";
import { getPack } from "@/data/index";
import { sheetsForPack } from "@/data/wiring";
import { manualsOnFile } from "@/lib/manuals";
import {
  applyCartQuestion,
  resolveCart,
  type CartQuery,
  type CartResolveResult,
} from "@/lib/cart-resolve";
import {
  CONTROLLER_ONLY_CART_MESSAGE,
  resolveController,
  type ControllerResolveResult,
} from "@/lib/controller-resolve";
import { sanitizeCartYearInput } from "@/lib/year-compat";

const MAKE_CHIPS = ["Club Car", "EZ-GO", "Yamaha"] as const;

export function lookupCart(query: CartQuery): CartResolveResult {
  return resolveCart(query);
}

export function CartLookup({
  year,
  make,
  model,
  result,
  onYear,
  onMake,
  onModel,
  onResult,
  onOpen,
  openLabel = "Use this cart",
}: {
  year: string;
  make: string;
  model: string;
  result: CartResolveResult | null;
  onYear: (next: string) => void;
  onMake: (next: string) => void;
  onModel: (next: string) => void;
  onResult: (next: CartResolveResult) => void;
  onOpen?: (packId: string) => void;
  openLabel?: string;
}) {
  const query: CartQuery = { year, make, model };
  const resultAnchor = useRef<HTMLDivElement>(null);
  const [controllerResult, setControllerResult] = useState<ControllerResolveResult | null>(null);
  const controllerOnly = result?.status === "none" && result.message === CONTROLLER_ONLY_CART_MESSAGE;

  function find() {
    onResult(resolveCart(query));
  }

  useEffect(() => {
    const y = year.trim();
    if (y.length !== 4 || make.trim().length < 2 || model.trim().length < 3) return;
    const timer = window.setTimeout(() => {
      onResult(resolveCart({ year, make, model }));
    }, 160);
    return () => window.clearTimeout(timer);
  }, [year, make, model, onResult]);

  useEffect(() => {
    if (!result) return;
    resultAnchor.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [result]);

  useEffect(() => {
    if (!controllerOnly) {
      setControllerResult(null);
      return;
    }
    setControllerResult(resolveController({ query: `${make} ${model}`.trim() }));
  }, [controllerOnly, make, model]);

  return (
    <div className="grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)] md:items-start">
      <Field label="Year" hint="Four-digit year on the cart.">
        <HeaderNoteInput
          name="lookupYear"
          value={year}
          onChange={(next) => onYear(sanitizeCartYearInput(next))}
          inputMode="numeric"
          enterKeyHint="done"
          aria-label="Cart year"
          className={inputClass + " min-h-16 text-2xl tabular-nums tracking-wide"}
        />
        <YearGlovePad year={year} onChange={onYear} />
      </Field>

      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Make">
            <HeaderNoteInput
              name="lookupMake"
              value={make}
              onChange={onMake}
              aria-label="Cart make"
              placeholder="Club Car, EZ-GO, Yamaha…"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {MAKE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onMake(chip)}
                  className={
                    "min-h-11 rounded-md px-3 text-sm font-medium shadow-[var(--shadow-border)] " +
                    (make.toLowerCase() === chip.toLowerCase()
                      ? "bg-navy text-navy-fg"
                      : "bg-surface text-ink")
                  }
                >
                  {chip}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Model" hint="Precedent, TXT, Drive2, Onward, RXV…">
            <HeaderNoteInput
              name="lookupModel"
              value={model}
              onChange={onModel}
              aria-label="Cart model"
              placeholder="Precedent, TXT, Drive2…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  find();
                }
              }}
            />
            <Button type="button" data-testid="find-cart" onClick={find} className="mt-3 w-full">
              Find this cart
            </Button>
          </Field>
        </div>

        <div ref={resultAnchor}>
          {result?.status === "need-input" ? (
            <p className="rounded-md bg-paper-sunken px-4 py-3 text-sm text-ink-muted" role="status">
              {result.message}
            </p>
          ) : null}

          {result?.status === "none" && !controllerOnly ? (
            <div
              data-testid="cart-no-match"
              className="rounded-lg bg-warn-bg px-4 py-3 text-sm text-ink"
              role="status"
            >
              <p className="font-medium">No exact match</p>
              <p className="mt-1">{result.message}</p>
              {result.closestYearSpan ? (
                <p className="mt-2 text-ink-muted">Closest year range on file: {result.closestYearSpan}.</p>
              ) : null}
            </div>
          ) : null}

          {controllerOnly && controllerResult?.status === "match" ? (
            <div data-testid="cart-controller-redirect">
              <p className="mb-3 rounded-md bg-paper-sunken px-4 py-3 text-sm text-ink-muted">
                That stamp is a controller book, not a cart. To start a cart check, type the year, make, and model on
                the vehicle.
              </p>
              <ControllerMatchPanel
                result={controllerResult}
                query={`${make} ${model}`.trim()}
                onResult={setControllerResult}
              />
            </div>
          ) : null}

          {controllerOnly && controllerResult && controllerResult.status !== "match" ? (
            <div
              data-testid="cart-controller-redirect"
              className="rounded-lg bg-warn-bg px-4 py-3 text-sm text-ink"
              role="status"
            >
              <p className="font-medium">Controller stamp</p>
              <p className="mt-1">{CONTROLLER_ONLY_CART_MESSAGE}</p>
              <Link to="/controllers" className="mt-2 inline-flex min-h-11 items-center font-medium text-navy">
                Open controller books
              </Link>
            </div>
          ) : null}

          {result?.status === "match" ? (
            <CartMatchPanel result={result} query={query} onResult={onResult} onOpen={onOpen} openLabel={openLabel} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CartMatchPanel({
  result,
  query,
  onResult,
  onOpen,
  openLabel,
}: {
  result: Extract<CartResolveResult, { status: "match" }>;
  query: CartQuery;
  onResult: (next: CartResolveResult) => void;
  onOpen?: (packId: string) => void;
  openLabel: string;
}) {
  const pack = getPack(result.packId);
  const sheets = pack ? sheetsForPack(pack.id) : [];
  const manuals = pack ? manualsOnFile(pack, sheets) : null;
  const controllerStamps = controllerStampsForPack(result.packId);
  const siblingSheets = result.siblings.flatMap((sib) =>
    sheetsForPack(sib.id).map((sheet) => ({ sheet, packName: sib.name })),
  );

  return (
    <div data-testid="cart-match" data-pack-id={result.packId} className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-navy">This cart</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{result.pack.fullName}</h2>
      <p className="mt-1 text-sm text-ink-muted">{result.yearSpan || result.pack.years}</p>

      {result.question ? (
        <div className="mt-4" data-testid="cart-question">
          <p className="mb-2 text-sm font-medium text-ink">{result.question.prompt}</p>
          <div className="grid grid-cols-2 gap-2">
            {result.question.options.map((option) => {
              const selected =
                (result.question?.id === "powertrain" && result.pack.powertrain === option.id) ||
                (result.question?.id === "voltage" && String(result.pack.voltage) === option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onResult(applyCartQuestion(query, result.question!.id, option.id))}
                  className={
                    "min-h-12 rounded-md px-3 text-sm font-medium shadow-[var(--shadow-border)] " +
                    (selected ? "bg-navy text-navy-fg" : "bg-paper-sunken text-ink")
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">On file</p>
        {manuals?.items.slice(0, 4).map((item) => (
          <p key={item.title + item.ref} className="flex items-start gap-2 text-sm text-ink">
            <FileText className="mt-0.5 size-4 shrink-0 text-navy" />
            <span>
              <span className="font-medium">{item.title}</span>
              <span className="block text-ink-muted">{item.ref}</span>
            </span>
          </p>
        ))}
        {sheets.length > 0 ? (
          <Link
            to="/wiring/$modelId"
            params={{ modelId: result.packId }}
            className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-navy"
          >
            <Cable className="size-4" />
            {sheets.length} wire picture{sheets.length === 1 ? "" : "s"}
          </Link>
        ) : (
          <p className="text-sm text-ink-muted">No scanned wire picture on this pack yet. The check screen still has the color picture.</p>
        )}
        {result.question && siblingSheets.length > 0 ? (
          <div className="mt-2 rounded-md bg-paper-sunken px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Also on file for this year/model</p>
            <ul className="mt-1 grid gap-1 text-sm text-ink-muted">
              {siblingSheets.slice(0, 6).map(({ sheet, packName }) => (
                <li key={sheet.id}>
                  {packName}: {sheet.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {controllerStamps.length > 0 ? (
          <div className="mt-2 rounded-md bg-paper-sunken px-3 py-2" data-testid="controller-stamps-secondary">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
              Controller books by stamp — not this cart year
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              If the box says {controllerStamps.map((m) => m.name).join(", ")}, open that controller book. Versions
              differ — read the stamp.
            </p>
            <Link to="/controllers" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-navy">
              Open by controller model
            </Link>
          </div>
        ) : null}
      </div>

      {onOpen ? (
        <Button type="button" className="mt-4 w-full" data-testid="use-cart" onClick={() => onOpen(result.packId)}>
          {openLabel}
        </Button>
      ) : null}
    </div>
  );
}
