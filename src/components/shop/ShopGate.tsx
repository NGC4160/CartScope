import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/case/fields";
import { fetchShopGateStatus, lockShop, unlockShop } from "@/lib/shop-gate-client";

type ShopSession = {
  unlocked: boolean;
  configured: boolean;
  lock: () => Promise<void>;
};

const ShopSessionContext = createContext<ShopSession | null>(null);

export function useShopSession(): ShopSession | null {
  return useContext(ShopSessionContext);
}

export function ShopGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchShopGateStatus().then((status) => {
      if (cancelled) return;
      setUnlocked(status.unlocked);
      setConfigured(status.configured);
      setError(status.configured ? null : (status.error ?? null));
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onUnlock(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const status = await unlockShop(password);
    setBusy(false);
    setConfigured(status.configured);
    if (status.unlocked) {
      setPassword("");
      setUnlocked(true);
      setError(null);
      return;
    }
    setError(status.error ?? "Wrong shop password.");
  }

  async function lock() {
    setBusy(true);
    await lockShop();
    setBusy(false);
    setUnlocked(false);
    setPassword("");
  }

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper px-4 text-ink">
        <p className="font-mono text-xs tracking-[0.18em] text-navy">Opening the shop lock…</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-dvh flex-col bg-paper text-ink">
        <header className="flex min-h-14 items-center gap-3 border-b border-navy-deep bg-navy px-4 text-navy-fg">
          <span className="font-display text-lg font-semibold tracking-wide">CartScope</span>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
          <p className="font-mono text-xs font-semibold tracking-[0.18em] text-navy">SHOP LOCK</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Unlock this tablet</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Techs share this tablet. One shop password opens the job list. Customer last names and Housecall Pro
            numbers stay off the public internet.
          </p>
          {!configured ? (
            <p className="mt-4 rounded-md bg-warn-bg px-3 py-3 text-sm text-ink" role="status">
              Shop lock is not set. Ryan must add <span className="font-mono">SHOP_GATE_SECRET</span> on Vercel
              (Production and Preview). Do not put it in the repo.
            </p>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={(event) => void onUnlock(event)}>
              <Field label="Shop password">
                <input
                  type="password"
                  name="shop-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  aria-label="Shop password"
                />
              </Field>
              {error ? (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={busy || !password.trim()}>
                {busy ? "Checking…" : "Unlock shop"}
              </Button>
            </form>
          )}
        </main>
      </div>
    );
  }

  return (
    <ShopSessionContext.Provider value={{ unlocked, configured, lock }}>
      {children}
    </ShopSessionContext.Provider>
  );
}
