import { createFileRoute } from "@tanstack/react-router";

const noStore = { "Cache-Control": "no-store" as const };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: noStore });
}

export const Route = createFileRoute("/api/jobs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { gatedSharedJobsGet } = await import("@/lib/shop-jobs-api");
        const result = await gatedSharedJobsGet(request);
        return json(result.body, result.status);
      },
      PUT: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }
        const { gatedSharedJobsPut } = await import("@/lib/shop-jobs-api");
        const result = await gatedSharedJobsPut(request, body);
        return json(result.body, result.status);
      },
    },
  },
});
