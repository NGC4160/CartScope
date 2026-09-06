import { useMemo, useRef, useState } from "react";
import { usePublishBayChrome, type BayActionChrome } from "@/components/bay/BayActionBar";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/case/fields";
import type { JobRecord, ModelPack } from "@/data/types";
import { bayCodesActionLabel, bayProgressChip } from "@/lib/bay-chrome";
import { BAY_CHECK_FORM_ID, bayFormSubmitGate } from "@/lib/bay-chrome-action";
import { handheldSaveBlockers } from "@/lib/handheld-form";
import { suggestedHandheldName } from "@/lib/handheld";
import { useJobStore } from "@/store/jobs";

type CounterRow = { fault: string; count: string };

export function CodeGate({
  job,
  pack,
  onChrome,
  bindSubmit,
}: {
  job: JobRecord;
  pack: ModelPack;
  onChrome?: (chrome: BayActionChrome | null) => void;
  bindSubmit?: (fn: () => void) => void;
}) {
  const save = useJobStore((s) => s.saveCodeSave);
  const submitGate = bayFormSubmitGate;
  const prior = job.codeSave;
  const suggestProgram = useMemo(() => suggestedHandheldName(job, "Program"), [job.id, job.lastName, job.hcpJobNumber, job.createdAt]);
  const suggestLog = useMemo(() => suggestedHandheldName(job, "Log"), [job.id, job.lastName, job.hcpJobNumber, job.createdAt]);

  const [programFile, setProgramFile] = useState(prior?.programFileName || suggestProgram);
  const [present, setPresent] = useState(prior?.present ?? "");
  const [history, setHistory] = useState(prior?.history ?? "");
  const [photo, setPhoto] = useState(prior?.photoNote ?? "");
  const [noConnect, setNoConnect] = useState(Boolean(prior?.couldNotConnect));
  const [connectReason, setConnectReason] = useState(prior?.connectReason ?? "");
  const [cleared, setCleared] = useState(Boolean(prior?.cleared));
  const [loggerNotUsed, setLoggerNotUsed] = useState(prior?.loggerNotUsed ?? true);
  const [logFile, setLogFile] = useState(prior?.logFileName || suggestLog);
  const [counters, setCounters] = useState<CounterRow[]>(
    prior?.faultCounters?.length ? prior.faultCounters : [{ fault: "", count: "" }],
  );
  const [counterNotes, setCounterNotes] = useState(prior?.faultCounterNotes ?? "");
  const [odometer, setOdometer] = useState(prior?.odometer ?? "");
  const [faultOdo, setFaultOdo] = useState(prior?.faultOdometer ?? "");
  const [noReadings, setNoReadings] = useState(Boolean(prior?.noControllerReadings));
  const [error, setError] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const errorAnchor = useRef<HTMLDivElement>(null);

  const hasCounter = counters.some((r) => r.fault.trim() && r.count.trim());
  const missing = handheldSaveBlockers({
    noConnect,
    connectReason,
    programFile,
    present,
    history,
    loggerNotUsed,
    logFile,
    noReadings,
    odometer,
    faultOdo,
    counterNotes,
    hasCounter,
  });
  const captured = missing.length === 0;

  function go() {
    setError(null);
    if (!captured) {
      setBlockers(missing.map((b) => b.message));
      setError(`Cannot save yet. ${missing.length} field${missing.length === 1 ? "" : "s"} still need a value.`);
      queueMicrotask(() => errorAnchor.current?.scrollIntoView({ block: "nearest" }));
      return;
    }
    setBlockers([]);
    save(job.id, {
      at: new Date().toISOString(),
      present: present.trim(),
      history: history.trim(),
      photoNote: photo.trim(),
      couldNotConnect: noConnect,
      connectReason: noConnect ? connectReason.trim() : "",
      cleared: captured && cleared && !noConnect,
      programFileName: noConnect ? "" : programFile.trim(),
      logFileName: noConnect || loggerNotUsed ? "" : logFile.trim(),
      loggerNotUsed: noConnect ? true : loggerNotUsed,
      faultCounters: noConnect || noReadings ? [] : counters.filter((r) => r.fault.trim() || r.count.trim()),
      faultCounterNotes: noConnect || noReadings ? "" : counterNotes.trim(),
      odometer: noConnect || noReadings ? "" : odometer.trim(),
      faultOdometer: noConnect || noReadings ? "" : faultOdo.trim(),
      noControllerReadings: noConnect ? true : noReadings,
    });
  }

  bindSubmit?.(go);

  usePublishBayChrome(onChrome, {
    chip: bayProgressChip(job, pack),
    label: bayCodesActionLabel(),
    onAction: go,
  });

  return (
    <form
      id={BAY_CHECK_FORM_ID}
      className="flex h-full min-h-0 flex-col bg-surface"
      onSubmit={(e) => {
        e.preventDefault();
        submitGate.run(go, BAY_CHECK_FORM_ID);
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="font-mono text-xs font-semibold tracking-wide text-navy">HANDHELD</p>
        <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-ink">
          Save a program file before you clear
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink">
          <li>Connect the handheld programmer to the cart.</li>
          <li>
            Before you clear codes, save a program file on the handheld. Present codes and history codes live in that
            program file. Look at both on the handheld before you clear.
          </li>
          <li>
            In CartScope, enter the program file name you used. Write present codes and history codes. Write fault
            counters, odometer, and fault odometer when the handheld shows them.
          </li>
          <li>Only then check that codes were cleared. Or check that you could not connect or could not save.</li>
          <li>
            When you use the logger to record data on a careful move or road test, save a log file on the handheld and
            enter that log file name here.
          </li>
          <li>If you did not run the logger, check “no log file — logger not used.” Do not invent a log name.</li>
        </ol>
        <p className="mt-3 text-sm text-ink-muted">
          Use this name on the handheld: date, last name, job number, then Program or Log. Example: {suggestProgram}
        </p>

        <label className="mt-4 flex min-h-12 items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={noConnect}
            onChange={(e) => {
              setNoConnect(e.target.checked);
              if (e.target.checked) setCleared(false);
            }}
            className="mt-1 size-4 accent-navy"
          />
          Could not connect / could not save
        </label>
        {noConnect ? (
          <Field label="Short reason" className="mt-2" hint="Say what you tried. Do not guess codes.">
            <textarea
              value={connectReason}
              onChange={(e) => setConnectReason(e.target.value)}
              className={inputClass + " min-h-16 py-2"}
            />
          </Field>
        ) : null}

        <div className={"mt-4 grid gap-3 " + (noConnect ? "opacity-50" : "")}>
          <Field
            label="Program file name"
            hint="Present codes and history codes are read from this program file. Keep the handheld ending if it adds one, such as .cpf."
          >
            <input
              value={programFile}
              onChange={(e) => setProgramFile(e.target.value)}
              className={inputClass + " font-mono"}
              disabled={noConnect}
            />
          </Field>
          <Field label="Present codes" hint="Write them from the program file or the handheld screen.">
            <textarea
              value={present}
              onChange={(e) => setPresent(e.target.value)}
              className={inputClass + " min-h-20 py-2"}
              disabled={noConnect}
              placeholder="None, or write each code."
            />
          </Field>
          <Field label="History codes" hint="Same program file. Look at history before you clear.">
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              className={inputClass + " min-h-20 py-2"}
              disabled={noConnect}
              placeholder="None, or write each stored code."
            />
          </Field>
        </div>

        <div className={"mt-5 " + (noConnect ? "opacity-50" : "")}>
          <p className="font-display text-lg font-semibold text-ink">Logger</p>
          <p className="mt-1 text-sm text-ink-muted">
            A log file is only for logger data. Do not make up a second codes file.
          </p>
          <label className="mt-3 flex min-h-12 items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={loggerNotUsed}
              onChange={(e) => setLoggerNotUsed(e.target.checked)}
              disabled={noConnect}
              className="mt-1 size-4 accent-navy"
            />
            No log file — logger not used
          </label>
          <Field label="Log file name" className="mt-2" hint="Only if you used the logger on a careful move or road test.">
            <input
              value={logFile}
              onChange={(e) => setLogFile(e.target.value)}
              className={inputClass + " font-mono"}
              disabled={noConnect || loggerNotUsed}
            />
          </Field>
        </div>

        <div className={"mt-5 " + (noConnect ? "opacity-50" : "")}>
          <p className="font-display text-lg font-semibold text-ink">Fault counters and odometer</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            While connected, open the screens that show fault counters, odometer, and fault odometer if this controller
            has them. Write each fault and its count. Write the odometer and fault odometer exactly as shown. If they
            are not shown, check the box. Do not invent numbers. Do not replace a controller from counters alone.
          </p>
          <label className="mt-3 flex min-h-12 items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={noReadings}
              onChange={(e) => setNoReadings(e.target.checked)}
              disabled={noConnect}
              className="mt-1 size-4 accent-navy"
            />
            This controller does not show fault counters / odometer / fault odometer
          </label>
          <div className="mt-3 grid gap-3">
            <Field label="Odometer reading" hint="Write it exactly as shown, with the unit.">
              <input
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className={inputClass}
                disabled={noConnect || noReadings}
                placeholder="For example 124.6 hours"
              />
            </Field>
            <Field label="Fault odometer reading" hint="Write it exactly as shown, with the unit.">
              <input
                value={faultOdo}
                onChange={(e) => setFaultOdo(e.target.value)}
                className={inputClass}
                disabled={noConnect || noReadings}
                placeholder="For example 18.2 hours"
              />
            </Field>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-subtle">Fault counters</p>
              {counters.map((row, i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_7rem] gap-2">
                  <input
                    value={row.fault}
                    onChange={(e) =>
                      setCounters((rows) => rows.map((r, n) => (n === i ? { ...r, fault: e.target.value } : r)))
                    }
                    className={inputClass}
                    disabled={noConnect || noReadings}
                    placeholder="Fault name or code"
                    aria-label={`Fault ${i + 1} name`}
                  />
                  <input
                    value={row.count}
                    onChange={(e) =>
                      setCounters((rows) => rows.map((r, n) => (n === i ? { ...r, count: e.target.value } : r)))
                    }
                    className={inputClass}
                    disabled={noConnect || noReadings}
                    placeholder="Count"
                    aria-label={`Fault ${i + 1} count`}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={noConnect || noReadings}
                onClick={() => setCounters((rows) => [...rows, { fault: "", count: "" }])}
              >
                Add another fault
              </Button>
            </div>
            <Field label="Fault counter notes">
              <textarea
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                className={inputClass + " min-h-16 py-2"}
                disabled={noConnect || noReadings}
                placeholder="Anything else the screen showed."
              />
            </Field>
            <Field label="Photo of the handheld screen (optional)">
              <input value={photo} onChange={(e) => setPhoto(e.target.value)} className={inputClass} disabled={noConnect} />
            </Field>
          </div>
        </div>

        <label className="mt-4 flex min-h-12 items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={cleared}
            onChange={(e) => setCleared(e.target.checked)}
            disabled={!captured || noConnect}
            className="mt-1 size-4 accent-navy"
          />
          <span>
            I cleared codes after the program file was saved. This stays off until the program file, present codes, and
            history codes are saved, or you check that the handheld could not connect.
          </span>
        </label>

        <div ref={errorAnchor} className="mt-3">
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
        {blockers.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger" role="alert">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </form>
  );
}
