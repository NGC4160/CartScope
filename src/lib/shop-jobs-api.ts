import { authorizeShopRequest } from "./shop-gate.ts";
import {
  handleSharedJobsGet,
  handleSharedJobsPut,
  type SharedJobsApiResult,
} from "./shared-jobs-api.ts";

function denied(result: ReturnType<typeof authorizeShopRequest>): SharedJobsApiResult {
  return {
    status: result.status,
    body: {
      ok: false,
      error: result.body.error,
    },
  };
}

export async function gatedSharedJobsGet(request: Request): Promise<SharedJobsApiResult> {
  const gate = authorizeShopRequest(request);
  if (!gate.body.ok) return denied(gate);
  return handleSharedJobsGet();
}

export async function gatedSharedJobsPut(
  request: Request,
  body: unknown,
): Promise<SharedJobsApiResult> {
  const gate = authorizeShopRequest(request);
  if (!gate.body.ok) return denied(gate);
  return handleSharedJobsPut(body);
}
