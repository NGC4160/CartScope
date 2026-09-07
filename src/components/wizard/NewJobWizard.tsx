import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Field, HeaderNoteInput, inputClass } from "@/components/case/fields";
import { Button } from "@/components/ui/button";
import { MANUFACTURERS, packsFor } from "@/data/index";
import type { BatteryType, ManufacturerId, ModelPack } from "@/data/types";
import { JOB_HEADER_MESSAGES, jobHeaderGaps, jobHeaderSummary } from "@/lib/job-header";
import {
  attemptStartChecks,
  complaintHasFirstStep,
  packYearCheck,
  readHeaderSnapshot,
  startBlockers,
  startIsReady,
  type HeaderSnapshot,
} from "@/lib/start-checks";
import {
  canVisitWizardStep,
  openJobHeader,
  stepAfterComplaintSelected,
} from "@/lib/wizard-nav";
import { sanitizeCartYearInput, supportedYearsHint, yearStatusNote } from "@/lib/year-compat";
import type { CreateJobInput } from "@/store/jobs";

export type StartJobResult =
  | { ok: true; jobId: string }
  | { ok: false; message: string };

const STEPS = ["Brand", "Which cart", "What’s wrong", "Job header"] as const;

/**
 * Last-mile rewrite on the Job header paint path. Do not inline into the
 * wizard body — that function minifies `U`/`W`/`K` over year-compat names.
 */
function jobHeaderYearText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.replace(/1991\s*[–—-]\s*1990/g, "1991–1996");
}

export function NewJobWizard({
  onCancel,
  onStartJob,
}: {
  onCancel?: () => void;
  onStartJob: (input: CreateJobInput) => StartJobResult | Promise<StartJobResult | void> | void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mfg, setMfg] = useState<ManufacturerId | null>(null);
  const [model, setModel] = useState<ModelPack | null>(null);
  const [symptomId, setSymptomId] = useState<string | null>(null);
  const [technician, setTechnician] = useState("");
  const [serial, setSerial] = useState("");
  const [lastName, setLastName] = useState("");
  const [hcp, setHcp] = useState("");
  const [year, setYear] = useState("");
  const [batteryType, setBatteryType] = useState<BatteryType | "">("");
  const [complaintNote, setComplaintNote] = useState("");
  const [fuelNote, setFuelNote] = useState("");
  const [startErrors, setStartErrors] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const startReasonRef = useRef<HTMLDivElement>(null);

  const models = useMemo(() => (mfg ? packsFor(mfg) : []), [mfg]);
  const electric = models.filter((p) => p.powertrain === "electric");
  const gas = models.filter((p) => p.powertrain === "gasoline");
  const electricCart = model?.powertrain === "electric";

  const header: HeaderSnapshot = {
    lastName,
    hcpJobNumber: hcp,
    technician,
    cartYear: year,
    serialNumber: serial,
    batteryType,
    complaintNote,
    fuelNote,
  };
  const liveRef = useRef(header);
  liveRef.current = header;

  const gaps = jobHeaderGaps({
    lastName,
    hcpJobNumber: hcp,
    powertrain: model?.powertrain,
    batteryType,
    technician,
  });
  const headerMessage = jobHeaderSummary(gaps);
  const yearCheck = model ? packYearCheck(model, year) : { status: "ok" as const };
  const yearNote = jobHeaderYearText(yearStatusNote(yearCheck));
  const yearMessage =
    yearCheck.status === "unsupported" ? jobHeaderYearText(yearCheck.message) : null;
  const yearsHint = jobHeaderYearText(
    model ? supportedYearsHint(model.years, model.id, { yearMin: model.yearMin, yearMax: model.yearMax }) : null,
  );
  const blockers = startBlockers({ pack: model, symptomId, header, yearCheck }).map((b) => ({
    ...b,
    message: jobHeaderYearText(b.message) ?? b.message,
  }));
  const startReady = startIsReady(blockers);
  const complaintReady = complaintHasFirstStep(model, symptomId);

  useEffect(() => {
    if (startReady) setStartErrors([]);
  }, [startReady]);

  function goToHeader() {
    const next = openJobHeader(symptomId);
    if (next) setStep(next);
  }

  function pickComplaint(id: string) {
    setSymptomId(id);
    setStep(stepAfterComplaintSelected());
  }

  function applySnapshot(next: HeaderSnapshot) {
    setLastName(next.lastName);
    setHcp(next.hcpJobNumber);
    setTechnician(next.technician);
    setYear(sanitizeCartYearInput(next.cartYear));
    setSerial(next.serialNumber);
    setBatteryType(next.batteryType);
    setComplaintNote(next.complaintNote);
    setFuelNote(next.fuelNote);
  }

  async function startFromForm(form?: HTMLFormElement | null) {
    const snapshot = readHeaderSnapshot(form ? new FormData(form) : null, liveRef.current);
    applySnapshot(snapshot);
    setStartErrors([]);
    const attempted = attemptStartChecks({
      pack: model,
      symptomId,
      header: snapshot,
    });
    if (!attempted.ok) {
      setStarting(false);
      setStartErrors(attempted.messages);
      startReasonRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    setStartErrors([]);
    setStarting(true);
    try {
      const result = await onStartJob(attempted.jobInput);
      if (result && result.ok === false) {
        setStarting(false);
        setStartErrors([result.message, `Start route: ${attempted.routeLabel}`]);
      }
    } catch {
      setStarting(false);
      setStartErrors([
        `Could not start checks for ${attempted.routeLabel}. Try Start again.`,
        `Start route: ${attempted.routeLabel}`,
      ]);
    }
  }

  function requestStart(form?: HTMLFormElement | null) {
    if (starting) return;
    void startFromForm(form ?? formRef.current);
  }

  function onStartSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    requestStart(e.currentTarget);
  }

  function onStartClick() {
    requestStart(formRef.current);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ol className="mb-6 flex gap-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const active = step === n;
          const done = step > n;
          const reachable = canVisitWizardStep(n, {
            manufacturer: mfg,
            hasModel: Boolean(model),
            symptomId,
          });
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                onClick={() => {
                  if (!reachable) return;
                  if (n === 4) {
                    goToHeader();
                    return;
                  }
                  setStep(n);
                }}
                className={
                  "w-full rounded-md px-3 py-2 text-left " +
                  (active
                    ? "bg-navy text-navy-fg"
                    : done
                      ? "bg-ok-bg text-ok"
                      : "bg-paper-sunken") +
                  (reachable ? "" : " opacity-60")
                }
              >
                {n} · {label}
              </button>
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {MANUFACTURERS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMfg(m.id);
                setModel(null);
                setSymptomId(null);
                setStep(2);
              }}
              className="min-h-36 rounded-lg bg-surface p-5 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <p className="font-display text-2xl font-semibold text-ink">{m.label}</p>
              <p className="mt-2 text-sm leading-snug text-ink-muted">{m.blurb}</p>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-6">
          <ModelGroup
            title="Electric"
            packs={electric}
            onPick={(p) => {
              setModel(p);
              setSymptomId(null);
              setBatteryType("");
              setStep(3);
            }}
          />
          <ModelGroup
            title="Gas"
            packs={gas}
            onPick={(p) => {
              setModel(p);
              setSymptomId(null);
              setBatteryType("");
              setStep(3);
            }}
          />
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ChevronLeft className="size-4" />
            Brand
          </Button>
        </div>
      ) : null}

      {step === 3 && model ? (
        <div>
          <p className="mb-3 text-sm text-ink-muted">
            What is wrong with <span className="font-medium text-ink">{model.fullName}</span>? Pick the main problem.
            These come from the factory book.
          </p>
          <div className="grid gap-2">
            {model.symptoms.map((s) => {
              const pathReady = complaintHasFirstStep(model, s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickComplaint(s.id)}
                  className={
                    "min-h-16 rounded-md px-4 py-3 text-left shadow-[var(--shadow-border)] transition-[background-color,box-shadow] duration-150 " +
                    (symptomId === s.id ? "bg-navy text-navy-fg" : "bg-surface text-ink hover:shadow-[var(--shadow-border-hover)]")
                  }
                >
                  <p className="font-medium">{s.label}</p>
                  <p className={"text-sm " + (symptomId === s.id ? "text-navy-fg/80" : "text-ink-muted")}>{s.summary}</p>
                  {pathReady ? null : (
                    <p
                      className={
                        "mt-1 text-sm font-medium " + (symptomId === s.id ? "text-navy-fg" : "text-danger")
                      }
                    >
                      No first factory check on file — Start stays blocked.
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          <div className="relative z-10 mt-5 flex flex-wrap gap-2 pb-16">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ChevronLeft className="size-4" />
              Which cart
            </Button>
            <Button className="ml-auto min-w-44" disabled={!symptomId} onClick={goToHeader}>
              Job header
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {symptomId && !complaintReady ? (
            <p className="mt-3 text-sm font-medium text-danger" role="status">
              This complaint has no first factory check. Start will stay blocked until you pick another problem.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 4 && model ? (
        <form ref={formRef} noValidate onSubmit={onStartSubmit}>
          <p className="mb-3 text-sm text-ink-muted">
            Every case needs the customer last name, the Housecall Pro job number, and who checked it
            {electricCart ? ", plus the battery type" : ""}. Then we can start checks.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer last name">
              <HeaderNoteInput
                name="lastName"
                value={lastName}
                onChange={setLastName}
                aria-label="Customer last name"
                aria-required
                aria-invalid={gaps.includes("lastName")}
                autoComplete="family-name"
              />
              {gaps.includes("lastName") ? (
                <span className="mt-1 block text-sm text-danger">{JOB_HEADER_MESSAGES.lastName}</span>
              ) : null}
            </Field>
            <Field label="Housecall Pro job number">
              <HeaderNoteInput
                name="hcpJobNumber"
                value={hcp}
                onChange={setHcp}
                aria-label="Housecall Pro job number"
                aria-required
                aria-invalid={gaps.includes("hcpJobNumber")}
              />
              {gaps.includes("hcpJobNumber") ? (
                <span className="mt-1 block text-sm text-danger">{JOB_HEADER_MESSAGES.hcpJobNumber}</span>
              ) : null}
            </Field>
            <Field label="Who checked it">
              <HeaderNoteInput
                name="technician"
                value={technician}
                onChange={setTechnician}
                aria-label="Who checked it"
                aria-required
                aria-invalid={gaps.includes("technician")}
                autoComplete="name"
              />
              {gaps.includes("technician") ? (
                <span className="mt-1 block text-sm text-danger">{JOB_HEADER_MESSAGES.technician}</span>
              ) : null}
            </Field>
            <Field label="Year" hint="Type the four-digit year. The box stays empty until you type.">
              <HeaderNoteInput
                name="cartYear"
                value={year}
                onChange={(next) => setYear(sanitizeCartYearInput(next))}
                inputMode="numeric"
                aria-label="Year"
                aria-invalid={Boolean(yearMessage)}
                aria-describedby="year-compat-note"
              />
              <span
                id="year-compat-note"
                data-testid="year-compat"
                data-pack-year-span={yearsHint ?? yearNote ?? ""}
                className={
                  "mt-1 block text-sm " + (yearMessage ? "font-medium text-danger" : "text-ink-muted")
                }
              >
                {yearNote ??
                  yearsHint ??
                  "Year is optional. If you enter one, we check it against the factory book on file."}
              </span>
            </Field>
            <Field label="Serial (recommended)">
              <HeaderNoteInput
                name="serialNumber"
                value={serial}
                onChange={setSerial}
                className={inputClass + " font-mono"}
                aria-label="Serial"
              />
            </Field>
            <Field label="Make">
              <input value={model.manufacturerLabel} readOnly className={inputClass + " bg-paper-sunken"} />
            </Field>
            <Field label="Model">
              <input value={model.name} readOnly className={inputClass + " bg-paper-sunken"} />
            </Field>
            {electricCart ? (
              <div className="sm:col-span-2">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-subtle">Battery type</p>
                <input type="hidden" name="batteryType" value={batteryType} />
                <div className="grid grid-cols-2 gap-2">
                  {(["lead-acid", "lithium"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBatteryType(t)}
                      className={
                        "min-h-12 rounded-md px-3 text-sm font-medium shadow-[var(--shadow-border)] " +
                        (batteryType === t ? "bg-navy text-navy-fg" : "bg-surface text-ink")
                      }
                    >
                      {t === "lead-acid" ? "Lead-acid" : "Lithium"}
                    </button>
                  ))}
                </div>
                {gaps.includes("batteryType") ? (
                  <p className="mt-2 text-sm text-danger">{JOB_HEADER_MESSAGES.batteryType}</p>
                ) : null}
              </div>
            ) : (
              <>
              <input type="hidden" name="batteryType" value="" />
              <Field label="Fuel note (optional)" className="sm:col-span-2">
                <HeaderNoteInput
                  name="fuelNote"
                  value={fuelNote}
                  onChange={setFuelNote}
                  placeholder="Carburetor, fuel injection, old fuel…"
                  aria-label="Fuel note"
                />
              </Field>
              </>
            )}
            <Field label="Short complaint note (optional)" className="sm:col-span-2">
              <HeaderNoteInput
                name="complaintNote"
                value={complaintNote}
                onChange={setComplaintNote}
                placeholder="Lights on, codes not checked yet, intermittent…"
                aria-label="Short complaint note"
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-ink-subtle">{model.years}</p>
          {headerMessage ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {headerMessage}
            </p>
          ) : null}
          <div
            className="sticky bottom-0 z-30 isolate mt-5 border-t border-navy-deep bg-paper px-1 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
          >
            {!startReady ? (
              <div
                ref={startReasonRef}
                data-testid="start-blocked-reason"
                className="mb-2 rounded-md bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
                role="alert"
              >
                <p>Start is blocked. {blockers[0]?.message ?? startErrors[0]}</p>
                {blockers.slice(1).map((b) => (
                  <p key={b.kind + b.message} className="mt-1 font-normal">
                    {b.message}
                  </p>
                ))}
              </div>
            ) : startErrors.length > 0 ? (
              <div
                ref={startReasonRef}
                data-testid="start-blocked-reason"
                className="mb-2 rounded-md bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
                role="alert"
              >
                {startErrors.map((m) => (
                  <p key={m}>{m}</p>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(3)}>
              <ChevronLeft className="size-4" />
              What’s wrong
            </Button>
            {onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            </div>
            <Button
              type="button"
              data-testid="start-checks"
              data-start-checks=""
              data-start-ready={startReady && !starting ? "true" : "false"}
              className={"mt-2 w-full min-w-44 touch-manipulation active:scale-100" + (startReady ? "" : " opacity-40")}
              aria-disabled={!startReady || starting}
              aria-busy={starting}
              disabled={starting}
              onClick={onStartClick}
            >
              <span className="pointer-events-none truncate">
                {starting ? "Starting checks…" : "Start checks"}
              </span>
              {starting ? null : <ChevronRight className="pointer-events-none size-4" />}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function ModelGroup({
  title,
  packs,
  onPick,
}: {
  title: string;
  packs: ModelPack[];
  onPick: (p: ModelPack) => void;
}) {
  if (packs.length === 0) return null;
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-navy">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {packs.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className="min-h-24 rounded-lg bg-surface p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)] sm:p-5"
          >
            <p className="font-display text-lg font-semibold text-ink sm:text-xl">{p.name}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {p.voltage} V · {p.architecture}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">{p.years}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
