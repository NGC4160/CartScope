import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Field, inputClass } from "@/components/case/fields";
import { Button } from "@/components/ui/button";
import { MANUFACTURERS, getSymptom, packsFor } from "@/data/index";
import type { BatteryType, ManufacturerId, ModelPack } from "@/data/types";
import { JOB_HEADER_MESSAGES, jobHeaderGaps, jobHeaderSummary } from "@/lib/job-header";
import {
  canStartChecks,
  canVisitWizardStep,
  openJobHeader,
  resolveStartJob,
  stepAfterComplaintSelected,
} from "@/lib/wizard-nav";
import type { CreateJobInput } from "@/store/jobs";

const STEPS = ["Brand", "Which cart", "What’s wrong", "Job header"] as const;

export function NewJobWizard({
  onCancel,
  onStartJob,
}: {
  onCancel?: () => void;
  onStartJob: (input: CreateJobInput) => void;
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

  const models = useMemo(() => (mfg ? packsFor(mfg) : []), [mfg]);
  const electric = models.filter((p) => p.powertrain === "electric");
  const gas = models.filter((p) => p.powertrain === "gasoline");
  const electricCart = model?.powertrain === "electric";

  const gaps = jobHeaderGaps({
    lastName,
    hcpJobNumber: hcp,
    powertrain: model?.powertrain,
    batteryType,
    technician,
  });
  const headerReady = canStartChecks(gaps);
  const headerMessage = jobHeaderSummary(gaps);

  function goToHeader() {
    const next = openJobHeader(symptomId);
    if (next) setStep(next);
  }

  function pickComplaint(id: string) {
    setSymptomId(id);
    setStep(stepAfterComplaintSelected());
  }

  function start() {
    const symptom = model && symptomId ? getSymptom(model, symptomId) : undefined;
    const resolved = resolveStartJob({
      hasModel: Boolean(model),
      symptomId,
      startStepId: symptom?.startStepId ?? null,
      gaps,
    });
    if (!resolved.ok || !model) {
      return;
    }
    onStartJob({
      modelId: model.id,
      symptomId: resolved.symptomId,
      startStepId: resolved.startStepId,
      technician,
      serialNumber: serial,
      notes: complaintNote,
      lastName,
      hcpJobNumber: hcp,
      cartYear: year,
      cartMake: model.manufacturerLabel,
      cartModel: model.name,
      batteryType: electricCart ? (batteryType as BatteryType) : undefined,
      complaintNote,
      fuelNote,
    });
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
            {model.symptoms.map((s) => (
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
              </button>
            ))}
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
        </div>
      ) : null}

      {step === 4 && model ? (
        <div>
          <p className="mb-3 text-sm text-ink-muted">
            Every case needs the customer last name, the Housecall Pro job number, and who checked it
            {electricCart ? ", plus the battery type" : ""}. Then we can start checks.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer last name">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                aria-label="Customer last name"
                aria-required
                aria-invalid={gaps.includes("lastName")}
              />
              {gaps.includes("lastName") ? (
                <span className="mt-1 block text-sm text-danger">{JOB_HEADER_MESSAGES.lastName}</span>
              ) : null}
            </Field>
            <Field label="Housecall Pro job number">
              <input
                value={hcp}
                onChange={(e) => setHcp(e.target.value)}
                className={inputClass}
                aria-label="Housecall Pro job number"
                aria-required
                aria-invalid={gaps.includes("hcpJobNumber")}
              />
              {gaps.includes("hcpJobNumber") ? (
                <span className="mt-1 block text-sm text-danger">{JOB_HEADER_MESSAGES.hcpJobNumber}</span>
              ) : null}
            </Field>
            <Field label="Who checked it">
              <input
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className={inputClass}
                aria-label="Who checked it"
                aria-required
                aria-invalid={gaps.includes("technician")}
                autoComplete="name"
              />
              {gaps.includes("technician") ? (
                <span className="mt-1 block text-sm text-danger">{JOB_HEADER_MESSAGES.technician}</span>
              ) : null}
            </Field>
            <Field label="Year">
              <input value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} placeholder="2018" />
            </Field>
            <Field label="Serial (recommended)">
              <input value={serial} onChange={(e) => setSerial(e.target.value)} className={inputClass + " font-mono"} />
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
              <Field label="Fuel note (optional)" className="sm:col-span-2">
                <input
                  value={fuelNote}
                  onChange={(e) => setFuelNote(e.target.value)}
                  className={inputClass}
                  placeholder="Carburetor, fuel injection, old fuel…"
                />
              </Field>
            )}
            <Field label="Short complaint note (optional)" className="sm:col-span-2">
              <input
                value={complaintNote}
                onChange={(e) => setComplaintNote(e.target.value)}
                className={inputClass}
                placeholder="Lights on, codes not checked yet, intermittent…"
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-ink-subtle">{model.years}</p>
          {headerMessage ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {headerMessage}
            </p>
          ) : null}
          <div className="relative z-10 mt-5 flex flex-wrap gap-2 pb-16">
            <Button variant="ghost" onClick={() => setStep(3)}>
              <ChevronLeft className="size-4" />
              What’s wrong
            </Button>
            {onCancel ? (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button className="ml-auto min-w-44" disabled={!headerReady} onClick={start}>
              Start checks
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
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
