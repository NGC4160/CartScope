import { createFileRoute } from "@tanstack/react-router";
import { logServer } from "@/lib/server-log";

const noStore = { "Cache-Control": "no-store" as const };

function json(data: unknown, status = 200, setCookie?: string) {
  const headers = new Headers(noStore);
  headers.set("Content-Type", "application/json");
  if (setCookie) headers.append("Set-Cookie", setCookie);
  return new Response(JSON.stringify(data), { status, headers });
}

export const Route = createFileRoute("/api/shop-gate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleShopGateGet } = await import("@/lib/shop-gate");
        const result = handleShopGateGet(request);
        return json(result.body, result.status, result.setCookie);
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch (error) {
          logServer("warn", "shop_gate_invalid_json", { error });
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }
        const { handleShopGatePost } = await import("@/lib/shop-gate");
        const result = handleShopGatePost(request, body);
        return json(result.body, result.status, result.setCookie);
      },
    },
  },
});
