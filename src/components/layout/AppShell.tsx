import { Link } from "@tanstack/react-router";
import { Cable } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({
  children,
  right,
  lockViewport = false,
}: {
  children: ReactNode;
  right?: ReactNode;
  lockViewport?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col bg-paper text-ink " +
        (lockViewport
          ? "h-dvh overflow-hidden print:h-auto print:overflow-visible"
          : "min-h-dvh")
      }
    >
      <header className="no-print sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-navy-deep bg-navy px-4 text-navy-fg">
        <Link to="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="font-display text-lg font-semibold tracking-wide">CartScope</span>
        </Link>
        <p className="hidden text-xs tracking-wide text-navy-fg/70 sm:block">Easy checks from the factory book</p>
        <Link
          to="/wiring"
          className="ml-2 hidden min-h-10 items-center gap-1.5 rounded-md px-3 text-sm text-navy-fg/90 hover:bg-navy-deep sm:flex"
        >
          <Cable className="size-4" />
          Wire maps
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/wiring"
            className="flex size-10 items-center justify-center rounded-md text-navy-fg sm:hidden"
            aria-label="Wire maps"
          >
            <Cable className="size-5" />
          </Link>
          {right}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#1e3a5f" />
      <polyline
        points="5,20 11,20 14,10 18,24 21,16 27,16"
        fill="none"
        stroke="#f4f0e6"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="25" y="14" width="4" height="4" fill="#b42318" />
    </svg>
  );
}
