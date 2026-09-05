import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { CaseReport } from "@/components/case/CaseReport";
import { Button } from "@/components/ui/button";
import { getPack } from "@/data/index";
import { useHydrated } from "@/hooks/use-hydrated";
import { useJobStore } from "@/store/jobs";

export const Route = createFileRoute("/print/report/$jobId")({
  component: PrintReport,
});

function PrintReport() {
  const { jobId } = Route.useParams();
  const hydrated = useHydrated();
  const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
  const pack = job ? getPack(job.modelId) : undefined;

  if (!hydrated) return <p className="p-8 text-sm">Loading report…</p>;
  if (!job || !pack) {
    return (
      <main className="p-8">
        <p>This job is not on this tablet.</p>
        <Link to="/">Home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-white text-ink print:max-w-none">
      <div className="no-print flex gap-2 px-6 pt-6">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print / save PDF
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/bench/$jobId" params={{ jobId: job.id }}>
            Back to checks
          </Link>
        </Button>
      </div>
      <CaseReport job={job} pack={pack} printMode />
    </main>
  );
}
