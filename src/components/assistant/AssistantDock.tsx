import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askBenchAssistant } from "@/lib/assistant";
import { runJobAssistant } from "@/lib/run-assistant";
import type { JobRecord } from "@/data/types";
import { useJobStore } from "@/store/jobs";

const EXAMPLES = [
  "What should I do next?",
  "The solenoid clicks but the motor does not spin",
  "Batteries look low. Can I keep testing?",
  "Not enough proof yet — what is missing?",
];

export function AssistantDock({
  modelId,
  job,
}: {
  modelId: string;
  job?: JobRecord;
}) {
  const appendAiTurn = useJobStore((s) => s.appendAiTurn);
  const setInclude = useJobStore((s) => s.setIncludeAiInReport);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const thread = useMemo(() => {
    if (job) return job.aiLog ?? [];
    return local;
  }, [job, local, job?.aiLog]);

  async function send(text?: string) {
    const question = (text ?? draft).trim();
    if (!question || busy || !modelId) return;
    setDraft("");
    setError(null);
    setOpen(true);
    setBusy(true);
    if (job) appendAiTurn(job.id, { role: "user", text: question });
    else setLocal((t) => [...t, { role: "user", text: question }]);

    const history = (job ? [...(job.aiLog ?? []), { role: "user" as const, text: question }] : [...local, { role: "user" as const, text: question }]).map(
      (t) => ({ role: t.role, text: t.text }),
    );

    try {
      const res = job
        ? await runJobAssistant(job, question)
        : await askBenchAssistant({
            data: {
              question,
              modelId,
              measurements: [],
              history,
            },
          });
      if (!res.ok) {
        setError(res.error);
      } else if (job) {
        appendAiTurn(job.id, { role: "assistant", text: res.text });
      } else {
        setLocal((t) => [...t, { role: "assistant", text: res.text }]);
      }
    } catch {
      setError("Could not reach the helper. Try again.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <div className="no-print border-t border-navy-deep bg-navy text-navy-fg">
      <button
        type="button"
        className="flex min-h-12 w-full items-center gap-2 px-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-mono text-[11px] font-semibold tracking-[0.16em] uppercase">More helper chat</span>
        <span className="truncate text-sm text-navy-fg/75">
          Extra thread. The check on this screen is the main helper.
        </span>
        {open ? <ChevronDown className="ml-auto size-4 shrink-0" /> : <ChevronUp className="ml-auto size-4 shrink-0" />}
      </button>

      {open ? (
        <div className="border-t border-navy-fg/15 bg-navy-deep px-3 pb-3 pt-2">
          <div ref={scroller} className="mb-2 max-h-56 space-y-2 overflow-y-auto sm:max-h-72">
            {thread.length === 0 ? (
              <div className="flex flex-wrap gap-2 py-1">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => void send(ex)}
                    className="min-h-11 rounded-md bg-navy px-3 text-left text-sm text-navy-fg shadow-[var(--shadow-border)]"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            ) : (
              thread.map((t, i) => (
                <div
                  key={`${t.role}-${i}`}
                  className={
                    "whitespace-pre-wrap rounded-md px-3 py-2 text-sm leading-relaxed " +
                    (t.role === "user" ? "ml-8 bg-navy text-navy-fg" : "mr-4 bg-surface text-ink")
                  }
                >
                  {t.text}
                </div>
              ))
            )}
            {busy ? <p className="px-1 font-mono text-xs text-navy-fg/70">Looking in the factory book…</p> : null}
            {error ? <p className="px-1 text-sm text-warn-bg">{error}</p> : null}
          </div>
          {job ? (
            <label className="mb-2 flex min-h-10 items-center gap-2 text-xs text-navy-fg/80">
              <input
                type="checkbox"
                checked={job.includeAiInReport !== false}
                onChange={(e) => setInclude(job.id, e.target.checked)}
                className="size-4 accent-ok"
              />
              Put this chat on the printed report
            </label>
          ) : null}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Fault code, no reverse, click but no move…"
              className="min-h-12 flex-1 rounded-md bg-surface px-3 text-ink outline-none"
              maxLength={800}
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !draft.trim()} className="min-w-12 shrink-0">
              <Send className="size-4" />
              <span className="hidden sm:inline">Ask</span>
            </Button>
          </form>
        </div>
      ) : (
        <form
          className="flex gap-2 px-3 pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tell me what you see, or type a fault code"
            className="min-h-12 flex-1 rounded-md bg-surface px-3 text-ink outline-none"
            maxLength={800}
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !draft.trim()} className="min-w-12 shrink-0">
            <Send className="size-4" />
            <span className="hidden sm:inline">Ask</span>
          </Button>
        </form>
      )}
    </div>
  );
}
