import { createFileRoute } from "@tanstack/react-router";

const noStore = { "Cache-Control": "no-store" as const };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: noStore });
}

export const Route = createFileRoute("/api/cron/backup-jobs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleJobsBackupGet } = await import("@/lib/jobs-backup");
        const result = await handleJobsBackupGet(request);
        return json(result.body, result.status);
      },
    },
  },
});
