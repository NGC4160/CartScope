import { useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { usePublishBayChrome, type BayActionChrome } from "@/components/bay/BayActionBar";
import { BaySaveNotice } from "@/components/bay/BaySaveNotice";
import { Button } from "@/components/ui/button";
import { Field, inputClass, IrUnitPicker, VoltageInput } from "@/components/case/fields";
import type { JobRecord, ModelPack, PackCheckRecord, PackCellReading, PackDraft } from "@/data/types";
import { IR_UNIT_HELP, resolveIrUnit } from "@/lib/ir-unit";
import { bayPackActionLabel, bayProgressChip } from "@/lib/bay-chrome";
import { BAY_CHECK_FORM_ID, bayFormSubmitGate, type BaySaveHandler } from "@/lib/bay-chrome-action";
import { packLayout, scaledLeadAcidLimits } from "@/lib/pack-layout";
import {
  applyBulkAgeUnreadable,
  packPasteTemplate,
  packSaveBlockers,
  parseBulkPackPaste,
  typedVoltage,
  type PackBlocker,
  type PackCellDraft,
} from "@/lib/pack-form";
import {
  evaluateLeadAcid,
  irSpreadNote,
  monthsOld,
  parseAgeMonthYear,
  parseVolts,
} from "@/lib/pack-rules";
import { useJobStore } from "@/store/jobs";

function draftsFrom(
  prior: PackCheckRecord | undefined,
  draft: PackDraft | undefined,
  count: number,
): PackCellDraft[] {
  return Array.from({ length: count }, (_, i) => {
    const d = draft?.cells[i];
    const c = prior?.cells[i];
    return {
      volts: d?.volts ?? c?.volts ?? "",
      ir: d?.ir ?? c?.ir ?? "",
      irUnit: resolveIrUnit(d?.irUnit ?? c?.irUnit),
      age: d?.age ?? c?.ageMonthYear ?? "",
      ageSkip: d?.ageSkip ?? Boolean(c?.ageNotReadable),
    };
  });
}

export function PackGate({
  job,
  pack,
  onChrome,
  bindSubmit,
}: {
  job: JobRecord;
  pack: ModelPack;
  onChrome?: (chrome: BayActionChrome | null) => void;
  bindSubmit?: (fn: BaySaveHandler) => void;
}) {
  const save = useJobStore((s) => s.savePackCheck);
  const patchJob = useJobStore((s) => s.patchJob);
  const submitGate = bayFormSubmitGate;
  const layout = packLayout(pack);
  const lim = scaledLeadAcidLimits(layout.nominalV);
  const lithium = job.batteryType === "lithium";

  const prior = job.packCheck;
  const draft = job.packDraft;
  const [cells, setCells] = useState<PackCellDraft[]>(() => draftsFrom(prior, draft, layout.count));
  const [loadDrop, setLoadDrop] = useState(draft?.loadDrop ?? prior?.loadDropPct ?? "");
  const [monitorV, setMonitorV] = useState(draft?.monitorV ?? prior?.lithiumMonitorV ?? "");
  const [minCell, setMinCell] = useState(draft?.minCell ?? prior?.lithiumMinCell ?? "");
  const [faults, setFaults] = useState(draft?.faults ?? prior?.lithiumFaults ?? "");
  const [noMonitor, setNoMonitor] = useState(draft?.noMonitor ?? Boolean(prior?.lithiumNoMonitor));
  const [irSkip, setIrSkip] = useState(draft?.irSkip ?? Boolean(prior?.irCouldNotMeasure));
  const [irSkipReason, setIrSkipReason] = useState(draft?.irSkipReason ?? prior?.irSkipReason ?? "");
  const [agePhoto, setAgePhoto] = useState(draft?.agePhoto ?? prior?.ageLabelPhotoNote ?? "");
  const [testPath, setTestPath] = useState(false);
  const [testNote, setTestNote] = useState(draft?.testNote ?? job.testBattery?.measuredProblem ?? "");
  const [paste, setPaste] = useState("");
  const [pasteNote, setPasteNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<PackBlocker[]>([]);
  const errorAnchor = useRef<HTMLDivElement>(null);

  const live = { cells, loadDrop, monitorV, minCell, faults, noMonitor, irSkip, irSkipReason, agePhoto, testNote };
  const liveRef = useRef(live);
  liveRef.current = live;

  function persistDraft(next?: Partial<typeof live>) {
    const snap = { ...liveRef.current, ...next };
    patchJob(job.id, {
      packDraft: {
        cells: snap.cells,
        loadDrop: snap.loadDrop,
        monitorV: snap.monitorV,
        minCell: snap.minCell,
        faults: snap.faults,
        noMonitor: snap.noMonitor,
        irSkip: snap.irSkip,
        irSkipReason: snap.irSkipReason,
        agePhoto: snap.agePhoto,
        testNote: snap.testNote,
      },
    });
  }

  const numericCells = useMemo(
    () => cells.map((c) => typedVoltage(c.volts)).filter((n): n is number => n != null),
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
    () => (lithium || irSkip ? null : irSpreadNote(cells.map((c) => ({ ir: c.ir, unit: resolveIrUnit(c.irUnit) })))),
    [lithium, irSkip, cells],
  );

  function patchCell(i: number, patch: Partial<PackCellDraft>) {
    const next = liveRef.current.cells.map((x, idx) => (idx === i ? { ...x, ...patch } : x));
    liveRef.current = { ...liveRef.current, cells: next };
    setCells(next);
  }

  function currentBlockers() {
    return packSaveBlockers({
      lithium,
      cellCount: layout.count,
      cells: liveRef.current.cells,
      irSkip: liveRef.current.irSkip,
      irSkipReason: liveRef.current.irSkipReason,
      monitorV: liveRef.current.monitorV,
      noMonitor: liveRef.current.noMonitor,
    });
  }

  function showBlockers(list: ReturnType<typeof packSaveBlockers>): string {
    setBlockers(list);
    const message = list.length
      ? `Cannot save yet. ${list.length} field${list.length === 1 ? "" : "s"} still need a value.`
      : "Cannot save yet.";
    setError(list.length ? message : null);
    queueMicrotask(() => errorAnchor.current?.scrollIntoView({ block: "nearest" }));
    return message;
  }

  function applyPaste() {
    const result = parseBulkPackPaste(paste, cells, layout.count);
    setCells(result.cells);
    liveRef.current = { ...liveRef.current, cells: result.cells };
    persistDraft({ cells: result.cells });
    setPasteNote(result.message);
  }

  function buildRecord(verdict: PackCheckRecord["verdict"], issues: string[]): PackCheckRecord {
    const mapped: PackCellReading[] = cells.map((c, index) => ({
      index,
      volts: c.volts,
      ir: irSkip || lithium ? undefined : c.ir.trim() || undefined,
      irUnit: irSkip || lithium ? undefined : resolveIrUnit(c.irUnit),
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

  function continuePass(): string | void {
    const missing = currentBlockers();
    if (missing.length) {
      return showBlockers(missing);
    }
    setBlockers([]);
    setError(null);
    if (!lithium && !evalr.pass) {
      const message = "This pack does not pass. Charge or fix it first, or continue on a test battery.";
      setError(message);
      queueMicrotask(() => errorAnchor.current?.scrollIntoView({ block: "nearest" }));
      return message;
    }
    save(job.id, buildRecord("pass", irNote ? [irNote] : []));
  }

  function stayAndCharge() {
    const missing = currentBlockers();
    if (missing.length) {
      showBlockers(missing);
      return;
    }
    save(job.id, buildRecord("fail", evalr.issues));
    setBlockers([]);
    setError(null);
    setTestPath(false);
  }

  function continueTestBattery(): string | void {
    const missing = currentBlockers();
    if (missing.length) {
      return showBlockers(missing);
    }
    if (!testNote.trim() || testNote.trim().length < 8) {
      const message = "Write what you measured on the pack, and that later steps used a known-good test battery.";
      setError(message);
      queueMicrotask(() => errorAnchor.current?.scrollIntoView({ block: "nearest" }));
      return message;
    }
    save(job.id, buildRecord("fail", evalr.issues), { used: true, measuredProblem: testNote.trim() });
  }

  const canOfferFailPath = !lithium && !evalr.pass && numericCells.length >= layout.count;
  const packAction = {
    lithium,
    packPass: evalr.pass,
    testPath,
    cellsReady: numericCells.length >= layout.count,
  };

  const submit = lithium || evalr.pass || numericCells.length < layout.count ? continuePass : continueTestBattery;
  bindSubmit?.(submit);

  usePublishBayChrome(onChrome, {
    chip: bayProgressChip(job, pack),
    label: bayPackActionLabel(packAction),
    onAction: submit,
    disabled: false,
    error,
    errorDetails: blockers.map((b) => b.message),
  });

  return (
    <form
      id={BAY_CHECK_FORM_ID}
      noValidate
      className="flex h-full min-h-0 flex-col bg-surface"
      onSubmit={(e) => {
        e.preventDefault();
        submitGate.run(submit, BAY_CHECK_FORM_ID);
      }}
    >
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
              Measure internal resistance on each battery with the internal resistance meter. Write the reading and pick
              milliohms (mΩ) or megaohms (MΩ). Golf-cart lead-acid pack IR is almost always milliohms.
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
            <Field label="Monitor or battery-management pack voltage" hint="Type the number from the monitor. Example: 48.2 V">
              <VoltageInput
                value={monitorV}
                onChange={(next) => {
                  setMonitorV(next);
                  liveRef.current = { ...liveRef.current, monitorV: next };
                }}
                onBlur={() => persistDraft()}
                className={inputClass}
                placeholder="Type the number from the monitor"
                aria-label="Monitor pack voltage"
              />
            </Field>
            <Field label="Lowest cell (if shown)">
              <input
                value={minCell}
                onChange={(e) => {
                  setMinCell(e.target.value);
                  liveRef.current = { ...liveRef.current, minCell: e.target.value };
                }}
                onBlur={() => persistDraft()}
                className={inputClass}
              />
            </Field>
            <Field label="Monitor faults (if any)">
              <input
                value={faults}
                onChange={(e) => {
                  setFaults(e.target.value);
                  liveRef.current = { ...liveRef.current, faults: e.target.value };
                }}
                onBlur={() => persistDraft()}
                className={inputClass}
              />
            </Field>
            <label className="flex min-h-10 items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={noMonitor}
                onChange={(e) => {
                  setNoMonitor(e.target.checked);
                  persistDraft({ noMonitor: e.target.checked });
                }}
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
            <Field
              label={`Paste ${layout.count} battery rows`}
              hint="One battery per line: volts, IR, age. Or a single line of voltages. Tab, comma, or spaces. Values stay after you leave a field."
            >
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                className={inputClass + " min-h-28 py-2 font-mono text-sm"}
                placeholder={packPasteTemplate(layout.count)}
                aria-label={`Paste ${layout.count} battery rows`}
              />
            </Field>
            <Button type="button" variant="secondary" size="sm" onClick={applyPaste} disabled={!paste.trim()}>
              Fill batteries from paste
            </Button>
            {pasteNote ? <p className="text-sm text-ink">{pasteNote}</p> : null}
            <label className="flex min-h-12 items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={irSkip}
                onChange={(e) => {
                  setIrSkip(e.target.checked);
                  persistDraft({ irSkip: e.target.checked });
                }}
                className="mt-1 size-4 accent-navy"
              />
              Could not measure internal resistance
            </label>
            {irSkip ? (
              <Field label="Short reason" hint="Say what blocked the IR meter. Do not invent a reading.">
                <input
                  value={irSkipReason}
                  onChange={(e) => {
                    setIrSkipReason(e.target.value);
                    liveRef.current = { ...liveRef.current, irSkipReason: e.target.value };
                  }}
                  onBlur={() => persistDraft()}
                  className={inputClass}
                  aria-label="Short reason"
                />
              </Field>
            ) : null}
            <label className="flex min-h-12 items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={cells.length > 0 && cells.every((c) => c.ageSkip)}
                onChange={(e) => {
                  const next = applyBulkAgeUnreadable(cells, e.target.checked);
                  setCells(next);
                  liveRef.current = { ...liveRef.current, cells: next };
                  persistDraft({ cells: next });
                }}
                className="mt-1 size-4 accent-navy"
              />
              All ages not readable
            </label>
            <div className="grid gap-3">
              {cells.map((c, i) => (
                <div key={`battery-${i}`} className="rounded-md border border-line p-3">
                  <p className="mb-2 font-medium text-ink">Battery {i + 1}</p>
                  <div className="grid gap-3">
                    <Field
                      label={`Battery ${i + 1} resting volts`}
                      hint={`Type the meter number. Example: ${lim.chargeTarget} V`}
                    >
                      <VoltageInput
                        value={c.volts}
                        onChange={(next) => patchCell(i, { volts: next })}
                        onBlur={() => persistDraft()}
                        className={inputClass + " font-mono"}
                        placeholder="Type the number from your meter"
                        aria-label={`Battery ${i + 1} resting volts`}
                      />
                    </Field>
                    <Field
                      label={`Battery ${i + 1} internal resistance`}
                      hint={IR_UNIT_HELP}
                    >
                      <div className="flex min-w-0 items-stretch gap-2">
                        <input
                          value={c.ir}
                          onChange={(e) => patchCell(i, { ir: e.target.value })}
                          onBlur={() => persistDraft()}
                          className={inputClass + " min-w-0 flex-1 font-mono"}
                          placeholder={resolveIrUnit(c.irUnit) === "megohm" ? "MΩ as shown" : "mΩ as shown"}
                          disabled={irSkip}
                          aria-label={`Battery ${i + 1} internal resistance`}
                        />
                        <IrUnitPicker
                          value={resolveIrUnit(c.irUnit)}
                          disabled={irSkip}
                          onChange={(unit) => {
                            patchCell(i, { irUnit: unit });
                            persistDraft();
                          }}
                        />
                      </div>
                    </Field>
                    <Field label={`Battery ${i + 1} age`} hint="Month and year only. Example: 09/2024">
                      <input
                        value={c.age}
                        onChange={(e) => patchCell(i, { age: e.target.value })}
                        onBlur={() => persistDraft()}
                        className={inputClass}
                        placeholder="Type month and year"
                        disabled={c.ageSkip}
                        aria-label={`Battery ${i + 1} age`}
                      />
                    </Field>
                  </div>
                  <label className="mt-2 flex min-h-10 items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={c.ageSkip}
                      onChange={(e) => {
                        patchCell(i, { ageSkip: e.target.checked });
                        persistDraft();
                      }}
                      className="size-4 accent-navy"
                      aria-label={`Battery ${i + 1} age not readable`}
                    />
                    Age not readable
                  </label>
                </div>
              ))}
            </div>
            <Field label="Photo of date labels (optional)">
              <input
                value={agePhoto}
                onChange={(e) => {
                  setAgePhoto(e.target.value);
                  liveRef.current = { ...liveRef.current, agePhoto: e.target.value };
                }}
                onBlur={() => persistDraft()}
                className={inputClass}
              />
            </Field>
            <Field
              label="Short load drop percent (optional)"
              hint="Wheels up. Pack should not drop more than about 5 percent. Example: 3.2"
            >
              <VoltageInput
                value={loadDrop}
                onChange={(next) => {
                  setLoadDrop(next);
                  liveRef.current = { ...liveRef.current, loadDrop: next };
                }}
                onBlur={() => persistDraft()}
                className={inputClass + " font-mono"}
                placeholder="Type the number from your meter"
                aria-label="Short load drop percent"
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
                  onChange={(e) => {
                    setTestNote(e.target.value);
                    liveRef.current = { ...liveRef.current, testNote: e.target.value };
                  }}
                  onBlur={() => persistDraft()}
                  className={inputClass + " min-h-24 py-2"}
                  placeholder="Pack resting 46.1 V, battery 3 at 7.9 V. Later steps used a known-good test battery."
                />
              </Field>
            ) : null}
          </div>
        ) : null}

      </div>
      {onChrome ? <div ref={errorAnchor} /> : (
        <div ref={errorAnchor}>
          <BaySaveNotice title={error} details={blockers.map((b) => b.message)} />
        </div>
      )}
    </form>
  );
}