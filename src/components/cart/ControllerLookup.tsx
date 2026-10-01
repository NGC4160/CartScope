import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink } from "lucide-react";
import { Field, HeaderNoteInput, inputClass } from "@/components/case/fields";
import { Button } from "@/components/ui/button";
import {
  CONTROLLER_MODELS,
  CONTROLLERS_DRIVE_ROOT_URL,
  docsForModelTag,
  type ControllerDoc,
} from "@/data/controllers";
import {
  applyControllerQuestion,
  resolveController,
  type ControllerQuery,
  type ControllerResolveResult,
} from "@/lib/controller-resolve";

const CHIPS = ["Curtis 1268", "1206MX", "1206HB", "Danaher", "1232E", "Sevcon"] as const;

export function lookupController(query: ControllerQuery): ControllerResolveResult {
  return resolveController(query);
}

export function openDriveDoc(doc: ControllerDoc) {
  if (typeof window === "undefined") return;
  window.open(doc.openUrl, "_blank", "noopener,noreferrer");
}

export function ControllerLookup({
  query,
  result,
  onQuery,
  onResult,
}: {
  query: string;
  result: ControllerResolveResult | null;
  onQuery: (next: string) => void;
  onResult: (next: ControllerResolveResult) => void;
}) {
  const resultAnchor = useRef<HTMLDivElement>(null);

  function find() {
    onResult(resolveController({ query }));
  }

  useEffect(() => {
    if (query.trim().length < 3) return;
    const timer = window.setTimeout(() => {
      onResult(resolveController({ query }));
    }, 160);
    return () => window.clearTimeout(timer);
  }, [query, onResult]);

  useEffect(() => {
    if (!result) return;
    resultAnchor.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [result]);

  return (
    <div className="grid gap-4">
      <Field label="Controller model" hint="Stamp on the box. Not the cart year, make, or model.">
        <HeaderNoteInput
          name="controllerModel"
          value={query}
          onChange={onQuery}
          aria-label="Controller model"
          placeholder="Curtis 1268, 1206MX, Danaher…"
          className={inputClass + " min-h-14 text-lg"}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              find();
            }
          }}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                onQuery(chip);
                onResult(resolveController({ query: chip }));
              }}
              className={
                "min-h-11 rounded-md px-3 text-sm font-medium shadow-[var(--shadow-border)] " +
                (query.toLowerCase() === chip.toLowerCase() ? "bg-navy text-navy-fg" : "bg-surface text-ink")
              }
            >
              {chip}
            </button>
          ))}
        </div>
        <Button type="button" data-testid="find-controller" onClick={find} className="mt-3 w-full">
          Find this controller
        </Button>
      </Field>

      <div ref={resultAnchor}>
        {result?.status === "need-input" ? (
          <p className="rounded-md bg-paper-sunken px-4 py-3 text-sm text-ink-muted" role="status">
            {result.message}
          </p>
        ) : null}

        {result?.status === "none" ? (
          <div
            data-testid="controller-no-match"
            className="rounded-lg bg-warn-bg px-4 py-3 text-sm text-ink"
            role="status"
          >
            <p className="font-medium">No controller book</p>
            <p className="mt-1">{result.message}</p>
          </div>
        ) : null}

        {result?.status === "match" ? (
          <ControllerMatchPanel result={result} query={query} onResult={onResult} />
        ) : null}
      </div>
    </div>
  );
}

export function ControllerMatchPanel({
  result,
  query,
  onResult,
}: {
  result: Extract<ControllerResolveResult, { status: "match" }>;
  query: string;
  onResult: (next: ControllerResolveResult) => void;
}) {
  const docs = result.question ? [] : result.docs;

  return (
    <div
      data-testid="controller-match"
      data-controller-tag={result.modelTag}
      className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]"
    >
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-navy">This controller</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{result.model.fullName}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Tagged <span className="font-mono">{result.model.tag}</span>. Cart year/make/model is a different library.
      </p>

      {result.question ? (
        <div className="mt-4" data-testid="controller-question">
          <p className="mb-2 text-sm font-medium text-ink">{result.question.prompt}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.question.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onResult(applyControllerQuestion({ query }, result.question!.id, option.id))}
                className="min-h-12 rounded-md bg-paper-sunken px-3 text-sm font-medium text-ink shadow-[var(--shadow-border)]"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">On file in Drive</p>
          {docs.map((doc) => (
            <a
              key={doc.id}
              href={doc.openUrl}
              target="_blank"
              rel="noreferrer"
              data-testid={`controller-doc-${doc.id}`}
              className="flex min-h-14 items-start gap-3 rounded-md bg-paper-sunken px-3 py-3 text-ink"
            >
              <BookOpen className="mt-0.5 size-4 shrink-0 text-navy" />
              <span className="min-w-0">
                <span className="block font-medium">{doc.title}</span>
                <span className="block text-sm text-ink-muted">
                  {doc.kind === "manual" ? "Manual" : doc.kind === "codes" ? "Fault codes" : "Install sheet"} · opens
                  in Drive
                </span>
              </span>
              <ExternalLink className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
            </a>
          ))}
          {docs.length > 1 ? (
            <Button
              type="button"
              className="mt-1 w-full"
              data-testid="open-controller-books"
              onClick={() => docs.forEach(openDriveDoc)}
            >
              Open all {docs.length} books
            </Button>
          ) : docs[0] ? (
            <Button type="button" className="mt-1 w-full" onClick={() => openDriveDoc(docs[0]!)}>
              Open this book
            </Button>
          ) : null}
        </div>
      )}

      <p className="mt-4 text-xs text-ink-muted">
        <a href={CONTROLLERS_DRIVE_ROOT_URL} target="_blank" rel="noreferrer" className="font-medium text-navy">
          Manuals / Controllers folder
        </a>
        {" · "}
        <Link to="/controllers" className="font-medium text-navy">
          All controller stamps
        </Link>
      </p>
    </div>
  );
}

export function ControllerStampList() {
  const brands = [
    { id: "curtis", label: "Curtis" },
    { id: "danaher", label: "Danaher" },
    { id: "sevcon", label: "Sevcon" },
  ] as const;

  return (
    <div className="grid gap-8">
      {brands.map((brand) => (
        <section key={brand.id}>
          <h2 className="font-display text-xl font-semibold text-ink">{brand.label}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {CONTROLLER_MODELS.filter((model) => model.brand === brand.id).map((model) => {
              const n = docsForModelTag(model.tag).length;
              return (
                <Link
                  key={model.tag}
                  to="/controllers/$modelTag"
                  params={{ modelTag: model.tag }}
                  className="flex min-h-24 items-start gap-3 rounded-lg bg-surface p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
                >
                  <BookOpen className="mt-0.5 size-5 shrink-0 text-navy" />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold text-ink">{model.name}</p>
                    <p className="text-sm text-ink-muted">{model.fullName}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink-subtle">
                      {n} book{n === 1 ? "" : "s"} · {model.tag}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
