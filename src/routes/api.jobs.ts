import { createFileRoute } from "@tanstack/react-router";

const noStore = { "Cache-Control": "no-store" as const };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: noStore });
}

export const Route = createFileRoute("/api/jobs")({
  server: {
    handlers: {
      GET: async () => {
        const { handleSharedJobsGet } = await import("@/lib/shared-jobs-api");
        const result = await handleSharedJobsGet();
        return json(result.body, result.status);
      },
      PUT: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }
        const { handleSharedJobsPut } = await import("@/lib/shared-jobs-api");
        const result = await handleSharedJobsPut(body);
        return json(result.body, result.status);
      },
    },
  },
});
