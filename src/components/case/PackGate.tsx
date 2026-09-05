import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/case/fields";
import type { JobRecord, ModelPack, PackCheckRecord, PackCellReading } from "@/data/types";
import { packLayout, scaledLeadAcidLimits } from "@/lib/pack-layout";
import {
  evaluateLeadAcid,
  irSpreadNote,
  monthsOld,
  parseAgeMonthYear,
  parseVolts,
} from "@/lib/pack-rules";
import { useJobStore } from "@/store/jobs";

type CellDraft = {
  volts: string;
  ir: string;
  age: string;
  ageSkip: boolean;
};

function draftsFrom(prior: PackCheckRecord | undefined, count: number): CellDraft[] {
  return Array.from({ length: count }, (_, i) => {
    const c = prior?.cells[i];
    return {
      volts: c?.volts ?? "",
      ir: c?.ir ?? "",
      age: c?.ageMonthYear ?? "",
      ageSkip: Boolean(c?.ageNotReadable),
    };
  });
}

export function PackGate({ job, pack }: { job: JobRecord; pack: ModelPack }) {
  const save = useJobStore((s) => s.savePackCheck);
  const layout = packLayout(pack);
  const lim = scaledLeadAcidLimits(layout.nominalV);
  const lithium = job.batteryType === "lithium";

  const prior = job.packCheck;
  const [cells, setCells] = useState<CellDraft[]>(() => draftsFrom(prior, layout.count));
  const [loadDrop, setLoadDrop] = useState(prior?.loadDropPct ?? "");
  const [monitorV, setMonitorV] = useState(prior?.lithiumMonitorV ?? "");
  const [minCell, setMinCell] = useState(prior?.lithiumMinCell ?? "");
  const [faults, setFaults] = useState(prior?.lithiumFaults ?? "");
  const [noMonitor, setNoMonitor] = useState(Boolean(prior?.lithiumNoMonitor));
  const [irSkip, setIrSkip] = useState(Boolean(prior?.irCouldNotMeasure));
  const [irSkipReason, setIrSkipReason] = useState(prior?.irSkipReason ?? "");
  const [agePhoto, setAgePhoto] = useState(prior?.ageLabelPhotoNote ?? "");
  const [testPath, setTestPath] = useState(false);
  const [testNote, setTestNote] = useState(job.testBattery?.measuredProblem ?? "");
  const [error, setError] = useState<string | null>(null);

  const numericCells = useMemo(
    () => cells.map((c) => parseVolts(c.volts)).filter((n): n is number => n != null),
    [cells],
  );
  const agesMonths = useMemo(
    () =>
      cells.map((c) => {
        if (c.ageSkip) return null;
        const parsed = parseAgeMonthYear(c.age);
        return parsed ? monthsOld(parsed) : null;
      }),
    [cells],
  );
  const loadPct = parseVolts(loadDrop);
  const evalr = useMemo(
    () =>
      lithium
        ? { pass: true, issues: [] as string[] }
        : evaluateLeadAcid(numericCells, layout.nominalV, loadPct, agesMonths),
    [lithium, numericCells, layout.nominalV, loadPct, agesMonths],
  );
  const irNote = useMemo(
    () => (lithium || irSkip ? null : irSpreadNote(cells.map((c) => c.ir))),
    [lithium, irSkip, cells],
  );

  function patchCell(i: number, patch: Partial<CellDraft>) {
    setCells((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function irAgeReady(): boolean {
    if (lithium) return true;
    const irOk = irSkip ? irSkipReason.trim().length >= 4 : cells.every((c) => c.ir.trim().length > 0);
    const ageOk = cells.every((c) => c.ageSkip || parseAgeMonthYear(c.age));
    return irOk && ageOk;
  }

  function buildRecord(verdict: PackCheckRecord["verdict"], issues: string[]): PackCheckRecord {
    const mapped: PackCellReading[] = cells.map((c, index) => ({
      index,
      volts: c.volts,
      ir: irSkip || lithium ? undefined : c.ir.trim() || undefined,
      irCouldNot: !lithium && irSkip ? true : undefined,
      irSkipReason: !lithium && irSkip ? irSkipReason.trim() : undefined,
      ageMonthYear: lithium || c.ageSkip ? undefined : c.age.trim() || undefined,
      ageNotReadable: !lithium && c.ageSkip ? true : undefined,
    }));
    const allIssues = irNote && verdict === "pass" ? [...issues, irNote] : irNote ? [...issues, irNote] : issues;
    return {
      at: new Date().toISOString(),
      chemistry: lithium ? "lithium" : "lead-acid",
      cellCount: layout.count,
      nominalV: layout.nominalV,
      cells: mapped,
      loadDropPct: loadDrop.trim() || undefined,
      irCouldNotMeasure: lithium ? undefined : irSkip,
      irSkipReason: lithium || !irSkip ? undefined : irSkipReason.trim(),
      ageLabelPhotoNote: lithium ? undefined : agePhoto.trim() || undefined,
      irSpreadNote: irNote || undefined,
      verdict,
      issues: allIssues,
      lithiumMonitorV: monitorV.trim() || undefined,
      lithiumMinCell: minCell.trim() || undefined,
      lithiumFaults: faults.trim() || undefined,
      lithiumNoMonitor: noMonitor,
    };
  }

  function continuePass() {
    setError(null);
    if (lithium) {
      if (!noMonitor && !monitorV.trim()) {
        setError("Type the monitor pack voltage, or check that no monitor is connected.");
        return;
      }
      save(job.id, buildRecord("pass", []));
      return;
    }
    if (numericCells.length < layout.count) {
      setError(`Type resting voltage for each of the ${layout.count} batteries.`);
      return;
    }
    if (!irAgeReady()) {
      setError(
        irSkip && irSkipReason.trim().length < 4
          ? "Write a short reason that the IR meter could not be used."
          : "Write internal resistance from the IR meter for each battery (or check could not measure), and month/year age or age not readable.",
      );
      return;
    }
    if (!evalr.pass) {
      setError("This pack does not pass. Charge or fix it first, or continue on a test battery.");
      return;
    }
    save(job.id, buildRecord("pass", irNote ? [irNote] : []));
  }

  function stayAndCharge() {
    if (!lithium && numericCells.length < layout.count) {
      setError(`Type resting voltage for each of the ${layout.count} batteries.`);
      return;
    }
    if (!irAgeReady()) {
      setError("Still write each battery’s internal resistance and age (or the skip reasons) before you leave this pack.");
      return;
    }
    save(job.id, buildRecord("fail", evalr.issues));
    setError(null);
    setTestPath(false);
  }

  function continueTestBattery() {
    if (!testNote.trim() || testNote.trim().length < 8) {
      setError("Write what you measured on the pack, and that later steps used a known-good test battery.");
      return;
    }
    if (!lithium && numericCells.length < layout.count) {
      setError(`Type resting voltage for each of the ${layout.count} batteries first.`);
      return;
    }
    if (!irAgeReady()) {
      setError("Keep this pack’s voltage, internal resistance, and age on the case even if you continue on a test battery.");
      return;
    }
    save(job.id, buildRecord("fail", evalr.issues), { used: true, measuredProblem: testNote.trim() });
  }

  const canOfferFailPath = !lithium && !evalr.pass && numericCells.length >= layout.count;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="font-mono text-xs font-semibold tracking-wide text-navy">BATTERY PACK</p>
        <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-ink">
          Check the pack before you blame other parts
        </h2>
        {lithium ? (
          <p className="mt-3 text-sm leading-relaxed text-ink">
            Read the battery monitor. Do not use lead-acid internal resistance or date-code fields on a lithium pack.
          </p>
        ) : (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink">
            <li>Measure resting voltage on each battery.</li>
            <li>
              Measure internal resistance on each battery with the internal resistance meter. Write the reading for each
              battery, with the unit the meter shows.
            </li>
            <li>
              Read the date on each battery and enter month and year. If the date cannot be read, mark age not readable.
            </li>
            <li>
              If the pack fails and you continue on a test battery, still keep these cart batteries’ voltage, internal
              resistance, and age on the case.
            </li>
          </ol>
        )}
        <p className="mt-2 text-sm text-ink-muted">
          This cart uses {layout.label}. Confirm that count on the cart before you trust the numbers.
        </p>

        {lithium ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-md bg-warn-bg px-3 py-2 text-sm text-warn">
              A cart that runs is not a finished lithium conversion. Do not claim UL listing or a ten-year warranty. Do
              not use the lead-acid shop voltage rules on this pack. Lead-acid internal resistance is not applicable.
            </div>
            <Field label="Monitor or battery-management pack voltage">
              <input
                inputMode="decimal"
                value={monitorV}
                onChange={(e) => setMonitorV(e.target.value)}
                className={inputClass}
                placeholder="48.2"
              />
            </Field>
            <Field label="Lowest cell (if shown)">
              <input value={minCell} onChange={(e) => setMinCell(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Monitor faults (if any)">
              <input value={faults} onChange={(e) => setFaults(e.target.value)} className={inputClass} />
            </Field>
            <label className="flex min-h-10 items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={noMonitor}
                onChange={(e) => setNoMonitor(e.target.checked)}
                className="size-4 accent-navy"
              />
              No monitor is connected. I will write what I can see.
            </label>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-ink-muted">
              Each {layout.nominalV} V battery should rest at least about {lim.restMin} V. If it is under, charge toward
              about {lim.chargeTarget} V before load tests. After a full charge, batteries more than about{" "}
              {lim.spreadMax.toFixed(2)} V apart are a pack problem. Dead floor is about {lim.deadFloor} V. A short load
              with the wheels up should not drop the pack more than about {lim.loadDropMaxPct} percent.
            </p>
            <label className="flex min-h-12 items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={irSkip}
                onChange={(e) => setIrSkip(e.target.checked)}
                className="mt-1 size-4 accent-navy"
              />
              Could not measure internal resistance
            </label>
            {irSkip ? (
              <Field label="Short reason" hint="Say what blocked the IR meter. Do not invent a reading.">
                <input value={irSkipReason} onChange={(e) => setIrSkipReason(e.target.value)} className={inputClass} />
              </Field>
            ) : null}
            <div className="grid gap-3">
              {cells.map((c, i) => (
                <div key={i} className="rounded-md border border-line p-3">
                  <p className="mb-2 font-medium text-ink">Battery {i + 1}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Field label={`Battery ${i + 1} resting volts`}>
                      <input
                        inputMode="decimal"
                        value={c.volts}
                        onChange={(e) => patchCell(i, { volts: e.target.value })}
                        className={inputClass + " font-mono"}
                        placeholder={String(lim.chargeTarget)}
                      />
                    </Field>
                    <Field
                      label={`Battery ${i + 1} internal resistance`}
                      hint="From the IR meter, as shown."
                    >
                      <input
                        value={c.ir}
                        onChange={(e) => patchCell(i, { ir: e.target.value })}
                        className={inputClass + " font-mono"}
                        placeholder="mΩ as shown"
                        disabled={irSkip}
                      />
                    </Field>
                    <Field label={`Battery ${i + 1} age`} hint="Month and year only, such as 09/2024.">
                      <input
                        value={c.age}
                        onChange={(e) => patchCell(i, { age: e.target.value })}
                        className={inputClass}
                        placeholder="09/2024"
                        disabled={c.ageSkip}
                      />
                    </Field>
                  </div>
                  <label className="mt-2 flex min-h-10 items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={c.ageSkip}
                      onChange={(e) => patchCell(i, { ageSkip: e.target.checked })}
                      className="size-4 accent-navy"
                      aria-label={`Battery ${i + 1} age not readable`}
                    />
                    Age not readable
                  </label>
                </div>
              ))}
            </div>
            <Field label="Photo of date labels (optional)">
              <input value={agePhoto} onChange={(e) => setAgePhoto(e.target.value)} className={inputClass} />
            </Field>
            <Field
              label="Short load drop percent (optional)"
              hint="Wheels up. Pack should not drop more than about 5 percent."
            >
              <input
                inputMode="decimal"
                value={loadDrop}
                onChange={(e) => setLoadDrop(e.target.value)}
                className={inputClass + " font-mono"}
                placeholder="3.2"
              />
            </Field>
          </div>
        )}

        {!lithium && numericCells.length > 0 ? (
          <div
            className={
              "mt-4 rounded-md px-3 py-3 text-sm " + (evalr.pass ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn")
            }
          >
            <p className="flex items-center gap-2 font-medium">
              {!evalr.pass ? <AlertTriangle className="size-4 shrink-0" /> : null}
              {evalr.pass
                ? "These resting numbers are in the shop range."
                : "These batteries are too low or uneven to trust."}
            </p>
            {evalr.issues.map((i) => (
              <p key={i} className="mt-1 text-ink">
                {i}
              </p>
            ))}
            {irNote ? <p className="mt-1 text-ink">{irNote}</p> : null}
          </div>
        ) : null}

        {canOfferFailPath ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-ink">
              You can charge or fix them first, or continue on a known-good test battery. If you continue, you must write
              what you measured and that later steps used a test battery. Keep the cart batteries’ voltage, internal
              resistance, and age on this case.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={stayAndCharge}>
                Fix or charge pack first
              </Button>
              <Button variant="secondary" onClick={() => setTestPath(true)}>
                Continue on a known-good test battery
              </Button>
            </div>
            {testPath ? (
              <Field label="What you measured, and that later steps used a test battery">
                <textarea
                  value={testNote}
                  onChange={(e) => setTestNote(e.target.value)}
                  className={inputClass + " min-h-24 py-2"}
                  placeholder="Pack resting 46.1 V, battery 3 at 7.9 V. Later steps used a known-good test battery."
                />
              </Field>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {lithium || evalr.pass || numericCells.length < layout.count ? (
            <Button onClick={continuePass} className="min-w-44" disabled={!lithium && numericCells.length >= layout.count && !irAgeReady()}>
              Save pack and go on
            </Button>
          ) : testPath ? (
            <Button
              onClick={continueTestBattery}
              className="min-w-44"
              disabled={testNote.trim().length < 8 || !irAgeReady()}
            >
              Save test-battery note and go on
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}