import { SHOP_GATE_API_PATH } from "./shop-gate-meta.ts";

export type ShopGateClientStatus = {
  unlocked: boolean;
  configured: boolean;
  error?: string;
};

async function readStatus(response: Response): Promise<ShopGateClientStatus> {
  const body = (await response.json().catch(() => null)) as {
    ok?: boolean;
    unlocked?: boolean;
    configured?: boolean;
    error?: string;
  } | null;
  return {
    unlocked: Boolean(body?.ok && body.unlocked),
    configured: body?.configured !== false,
    error: typeof body?.error === "string" ? body.error : undefined,
  };
}

export async function fetchShopGateStatus(): Promise<ShopGateClientStatus> {
  try {
    const response = await fetch(SHOP_GATE_API_PATH, {
      cache: "no-store",
      credentials: "same-origin",
    });
    return readStatus(response);
  } catch {
    return { unlocked: false, configured: true, error: "Could not reach the shop lock." };
  }
}

export async function unlockShop(password: string): Promise<ShopGateClientStatus> {
  try {
    const response = await fetch(SHOP_GATE_API_PATH, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return readStatus(response);
  } catch {
    return { unlocked: false, configured: true, error: "Could not reach the shop lock." };
  }
}

export async function lockShop(): Promise<ShopGateClientStatus> {
  try {
    const response = await fetch(SHOP_GATE_API_PATH, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lock: true }),
    });
    const status = await readStatus(response);
    return { ...status, unlocked: false };
  } catch {
    return { unlocked: false, configured: true, error: "Could not lock the shop." };
  }
}
