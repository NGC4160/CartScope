import { useMemo } from "react";
import type { ComponentDef, ModelPack, Side, TerminalDef, WireKind } from "@/data/types";
import { KIND_WORDS } from "@/data/plain-terms";

export const DIAGRAM_W = 1080;
export const DIAGRAM_H = 640;

type TermPos = { x: number; y: number; side: Side; label: string; componentId: string };

function termPos(c: ComponentDef, t: TerminalDef): TermPos {
  const { x, y, w, h } = c;
  const p =
    t.side === "n"
      ? { x: x + t.t * w, y }
      : t.side === "s"
        ? { x: x + t.t * w, y: y + h }
        : t.side === "w"
          ? { x, y: y + t.t * h }
          : { x: x + w, y: y + t.t * h };
  return { ...p, side: t.side, label: t.label, componentId: c.id };
}

function indexTerminals(pack: ModelPack): Map<string, TermPos> {
  const m = new Map<string, TermPos>();
  for (const c of pack.components) {
    for (const t of c.terminals) m.set(t.id, termPos(c, t));
  }
  return m;
}

const KIND_STROKE: Record<WireKind, string> = {
  power: "var(--color-power)",
  control: "var(--color-control)",
  ground: "var(--color-ground)",
};

function pathFor(
  from: TermPos,
  to: TermPos,
  waypoints?: { x: number; y: number }[],
): string {
  const pts = [{ x: from.x, y: from.y }, ...(waypoints ?? []), { x: to.x, y: to.y }];
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

function headerFill(kind: ComponentDef["kind"]): string {
  switch (kind) {
    case "battery":
      return "var(--color-navy)";
    case "solenoid":
      return "var(--color-power)";
    case "controller":
      return "var(--color-navy-deep)";
    case "motor":
      return "var(--color-ink)";
    case "sensor":
      return "var(--color-control)";
    case "switch":
      return "var(--color-control)";
    case "fuse":
      return "var(--color-warn)";
    case "brake":
      return "var(--color-power)";
    case "engine":
      return "var(--color-ink)";
    case "ignition":
      return "var(--color-warn)";
    case "computer":
      return "var(--color-navy)";
    case "charger":
    case "receptacle":
      return "var(--color-ok)";
    default:
      return "var(--color-ink-muted)";
  }
}

export function SystemDiagram({
  pack,
  highlight = [],
  selectedId,
  onSelect,
  printMode = false,
}: {
  pack: ModelPack;
  highlight?: string[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  printMode?: boolean;
}) {
  const terms = useMemo(() => indexTerminals(pack), [pack]);
  const hi = useMemo(() => new Set(highlight), [highlight]);

  return (
    <svg
      viewBox={`0 0 ${DIAGRAM_W} ${DIAGRAM_H}`}
      preserveAspectRatio="xMidYMid meet"
      className={printMode ? "h-auto w-full" : "h-full w-full"}
      style={printMode ? { aspectRatio: `${DIAGRAM_W} / ${DIAGRAM_H}` } : undefined}
      role="img"
      aria-label={pack.diagramTitle}
    >
      <rect width={DIAGRAM_W} height={DIAGRAM_H} fill={printMode ? "#fff" : "var(--color-surface)"} />
      <rect x={12} y={10} width={6} height={36} fill="var(--color-navy)" />
      <text
        x={28}
        y={24}
        fill="var(--color-ink)"
        fontFamily="var(--font-display)"
        fontSize={15}
        fontWeight={700}
        letterSpacing="0.04em"
      >
        {pack.diagramTitle}
      </text>
      <text x={28} y={42} fill="var(--color-ink-muted)" fontFamily="var(--font-sans)" fontSize={10}>
        {pack.fullName} · {pack.architecture}
      </text>

      <g transform="translate(780, 14)">
        <LegendSwatch color="var(--color-power)" label="Power wires" />
        <g transform="translate(118, 0)">
          <LegendSwatch color="var(--color-control)" label="Control wires" />
        </g>
        <g transform="translate(250, 0)">
          <LegendSwatch color="var(--color-ground)" label="Ground wires" />
        </g>
      </g>

      {pack.wires.map((w) => {
        const a = terms.get(w.from);
        const b = terms.get(w.to);
        if (!a || !b) return null;
        const active = hi.has(w.id) || hi.has(a.componentId) || hi.has(b.componentId);
        const d = pathFor(a, b, w.waypoints);
        return (
          <path
            key={w.id}
            d={d}
            fill="none"
            stroke={KIND_STROKE[w.kind]}
            strokeWidth={active ? 4.2 : 2.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={hi.size && !active ? 0.28 : 1}
          />
        );
      })}

      {pack.components.map((c) => {
        const active = hi.has(c.id) || selectedId === c.id;
        const dim = hi.size > 0 && !active;
        return (
          <g
            key={c.id}
            transform={`translate(${c.x}, ${c.y})`}
            opacity={dim ? 0.38 : 1}
            className="cursor-pointer"
            onClick={() => onSelect?.(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(c.id);
              }
            }}
          >
            {active ? (
              <rect
                x={-5}
                y={-5}
                width={c.w + 10}
                height={c.h + 10}
                rx={10}
                fill="none"
                stroke="var(--color-navy)"
                strokeWidth={2.2}
              />
            ) : null}
            <rect
              width={c.w}
              height={c.h}
              rx={8}
              fill="var(--color-surface)"
              stroke="var(--color-line-strong)"
              strokeWidth={1.2}
            />
            <rect width={c.w} height={22} rx={8} fill={headerFill(c.kind)} />
            <rect y={14} width={c.w} height={8} fill={headerFill(c.kind)} />
            <text
              x={10}
              y={15}
              fill="#f4f0e6"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fontWeight={600}
            >
              {c.ref}
            </text>
            <text
              x={c.w - 10}
              y={15}
              textAnchor="end"
              fill="#f4f0e6"
              fontFamily="var(--font-sans)"
              fontSize={10}
              opacity={0.85}
            >
              {KIND_WORDS[c.kind]?.toUpperCase() ?? c.kind.toUpperCase()}
            </text>
            <text
              x={c.w / 2}
              y={c.h / 2 + 10}
              textAnchor="middle"
              fill="var(--color-ink)"
              fontFamily="var(--font-sans)"
              fontSize={c.w > 150 ? 13 : 11}
              fontWeight={600}
            >
              {c.name}
            </text>
            {c.terminals.map((t) => {
              const p = termPos({ ...c, x: 0, y: 0 }, t);
              return (
                <g key={t.id}>
                  <circle cx={p.x} cy={p.y} r={4.2} fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth={1.2} />
                  <text
                    x={p.x + (t.side === "e" ? -8 : t.side === "w" ? 8 : 0)}
                    y={p.y + (t.side === "n" ? 12 : t.side === "s" ? -8 : -8)}
                    textAnchor={t.side === "e" ? "end" : t.side === "w" ? "start" : "middle"}
                    fill="var(--color-ink-subtle)"
                    fontFamily="var(--font-mono)"
                    fontSize={8}
                  >
                    {t.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {pack.testPoints.map((tp) => (
        <g key={tp.id} transform={`translate(${tp.x}, ${tp.y})`}>
          <circle r={9} fill="var(--color-paper)" stroke="var(--color-navy)" strokeWidth={1.4} />
          <text
            textAnchor="middle"
            y={3.5}
            fill="var(--color-navy)"
            fontFamily="var(--font-mono)"
            fontSize={8}
            fontWeight={600}
          >
            {tp.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <g>
      <line x1={0} y1={12} x2={22} y2={12} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <text x={28} y={16} fill="var(--color-ink-muted)" fontFamily="var(--font-sans)" fontSize={11}>
        {label}
      </text>
    </g>
  );
}

export function findComponent(pack: ModelPack, id: string | null | undefined) {
  if (!id) return undefined;
  return pack.components.find((c) => c.id === id);
}
