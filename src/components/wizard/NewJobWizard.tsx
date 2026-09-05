import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Field, inputClass } from "@/components/case/fields";
import { Button } from "@/components/ui/button";
import { MANUFACTURERS, getSymptom, packsFor } from "@/data/index";
import type { BatteryType, ManufacturerId, ModelPack } from "@/data/types";
import { JOB_HEADER_MESSAGES, jobHeaderGaps, jobHeaderSummary } from "@/lib/job-header";
import { useJobStore } from "@/store/jobs";

const STEPS = ["Brand", "Which cart", "What’s wrong", "Job header"] as const;

export function NewJobWizard({ onCancel }: { onCancel?: () => void }) {
  const navigate = useNavigate();
  const createJob = useJobStore((s) => s.createJob);
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
  const [headerAttempted, setHeaderAttempted] = useState(false);

  const models = useMemo(() => (mfg ? packsFor(mfg) : []), [mfg]);
  const electric = models.filter((p) => p.powertrain === "electric");
  const gas = models.filter((p) => p.powertrain === "gasoline");
  const electricCart = model?.powertrain === "electric";

  const gaps = jobHeaderGaps({
    lastName,
    hcpJobNumber: hcp,
    powertrain: model?.powertrain,
    batteryType,
  });
  const headerReady = gaps.length === 0;
  const headerMessage = jobHeaderSummary(gaps);

  function start() {
    if (!model || !symptomId) return;
    if (!headerReady) {
      setHeaderAttempted(true);
      return;
    }
    const symptom = getSymptom(model, symptomId);
    if (!symptom) return;
    const job = createJob({
      modelId: model.id,
      symptomId,
      startStepId: symptom.startStepId,
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
    void navigate({ to: "/bench/$jobId", params: { jobId: job.id } });
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ol className="mb-6 flex gap-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={label}
              className={
                "flex-1 rounded-md px-3 py-2 " +
                (active ? "bg-navy text-navy-fg" : done ? "bg-ok-bg text-ok" : "bg-paper-sunken")
              }
            >
              {n} · {label}
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
                onClick={() => setSymptomId(s.id)}
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
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ChevronLeft className="size-4" />
              Which cart
            </Button>
            <Button className="ml-auto min-w-44" disabled={!symptomId} onClick={() => setStep(4)}>
              Job header
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 && model ? (
        <div>
          <p className="mb-3 text-sm text-ink-muted">
            Every case needs the customer last name and the Housecall Pro job number
            {electricCart ? ", and the battery type" : ""}. Then we can start checks.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer last name">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                aria-label="Customer last name"
                aria-invalid={headerAttempted && gaps.includes("lastName")}
              />
              {headerAttempted && gaps.includes("lastName") ? (
                <span className="mt-1 block text-sm text-danger">{JOB_HEADER_MESSAGES.lastName}</span>
              ) : null}
            </Field>
            <Field label="Housecall Pro job number">
              <input
                value={hcp}
                onChange={(e) => setHcp(e.target.value)}
                className={inputClass}
                aria-label="Housecall Pro job number"
                aria-invalid={headerAttempted && gaps.includes("hcpJobNumber")}
              />
              {headerAttempted && gaps.includes("hcpJobNumber") ? (
                <span className="mt-1 block text-sm text-danger">{JOB_HEADER_MESSAGES.hcpJobNumber}</span>
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
                {headerAttempted && gaps.includes("batteryType") ? (
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
            <Field label="Who checked it (optional)">
              <input value={technician} onChange={(e) => setTechnician(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-ink-subtle">{model.years}</p>
          {headerAttempted && headerMessage ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {headerMessage}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep(3)}>
              <ChevronLeft className="size-4" />
              What’s wrong
            </Button>
            {onCancel ? (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button className="ml-auto min-w-44" onClick={start}>
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
