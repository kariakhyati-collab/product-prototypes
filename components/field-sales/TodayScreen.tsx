"use client";

import { dayProgress, oldestDueDays, outstandingPaise } from "@/lib/field-sales";
import { formatINR } from "@/lib/money";
import { DAY_TARGET_PAISE, SHOPS } from "@/lib/voltline-data";
import { useFieldSales, type ShopStatus } from "./store";
import { Card, Icon, Pill, SectionTitle } from "./ui";

export function TodayScreen() {
  const { state, dispatch } = useFieldSales();
  const statuses = SHOPS.map((s) => state.shops[s.id].status);
  const achieved = SHOPS.reduce((sum, s) => sum + state.shops[s.id].orderedPaise, 0);
  const collected = SHOPS.reduce((sum, s) => sum + state.shops[s.id].collectedPaise, 0);
  const progress = dayProgress(statuses, achieved, DAY_TARGET_PAISE);
  const nextId = SHOPS.find((s) => state.shops[s.id].status === "in_visit")?.id ?? SHOPS.find((s) => state.shops[s.id].status === "planned")?.id;
  const open = (shopId: string) => dispatch({ type: "select", shopId, tab: "shop" });

  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="text-xs text-stone-500 dark:text-stone-400">Today&apos;s beat · Koramangala → HSR → Agara</p>
        <h2 className="text-lg font-semibold tracking-tight">Good morning, Arjun</h2>
      </div>

      <Card className="bg-gradient-to-br from-violet-600 to-violet-700 text-white dark:border-violet-800 dark:from-violet-700 dark:to-violet-900">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-violet-100">Sales today</p>
          <p className="text-xs text-violet-100">Target {formatINR(DAY_TARGET_PAISE)}</p>
        </div>
        <p className="mt-1 text-2xl font-semibold tabular-nums" data-testid="achieved">{formatINR(achieved)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Target achieved">
          <div className="h-full rounded-full bg-white transition-[width] duration-700 ease-out" style={{ width: `${Math.max(2, progress.pct)}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Visits" value={`${progress.visited}/${progress.total}`} />
          <Stat label="Of target" value={`${progress.pct}%`} />
          <Stat label="Collected" value={formatINR(collected)} />
        </div>
      </Card>

      <Card className="p-3">
        <SectionTitle>Route</SectionTitle>
        <RouteMap statuses={Object.fromEntries(SHOPS.map((s) => [s.id, state.shops[s.id].status]))} nextId={nextId} onPick={open} />
      </Card>

      <div>
        <SectionTitle>Shops · {SHOPS.length} stops</SectionTitle>
        <ol className="space-y-2">
          {SHOPS.map((s, i) => {
            const st = state.shops[s.id];
            const due = outstandingPaise(st.invoices);
            const overdue = oldestDueDays(st.invoices) > s.creditDays;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => open(s.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-colors hover:border-violet-400 dark:bg-stone-900 ${
                    s.id === nextId ? "border-violet-500 ring-2 ring-violet-500/15" : "border-stone-200 dark:border-stone-800"
                  }`}
                >
                  <StopBadge n={i + 1} status={st.status} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.name}</span>
                    <span className="block truncate text-xs text-stone-500 dark:text-stone-400">{s.area} · {s.distance}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <StatusPill status={st.status} isNext={s.id === nextId} />
                      {st.orderedPaise > 0 ? <Pill tone="violet">Ordered {formatINR(st.orderedPaise)}</Pill> : null}
                      {due > 0 ? <Pill tone={overdue ? "red" : "stone"}>{overdue ? "Overdue" : "Dues"} {formatINR(due)}</Pill> : null}
                    </span>
                  </span>
                  <Icon name="chevron" className="h-4 w-4 shrink-0 text-stone-400" />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-1 py-2">
      <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-violet-100">{label}</p>
    </div>
  );
}

function StatusPill({ status, isNext }: { status: ShopStatus; isNext: boolean }) {
  if (status === "visited") return <Pill tone="green">Visited</Pill>;
  if (status === "in_visit") return <Pill tone="violet">In visit</Pill>;
  return isNext ? <Pill tone="violet">Next stop</Pill> : <Pill tone="stone">Planned</Pill>;
}

function StopBadge({ n, status }: { n: number; status: ShopStatus }) {
  if (status === "visited") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
        <Icon name="check" className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
        status === "in_visit" ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" : "border-stone-300 text-stone-600 dark:border-stone-600 dark:text-stone-300"
      }`}
    >
      {n}
    </span>
  );
}

function RouteMap({ statuses, nextId, onPick }: { statuses: Record<string, ShopStatus>; nextId?: string; onPick: (id: string) => void }) {
  const points = SHOPS.map((s) => `${s.x},${s.y}`).join(" ");
  return (
    <svg viewBox="0 0 330 170" className="h-auto w-full" role="img" aria-label="Sketch of today's route through six shops">
      <rect x="0" y="0" width="330" height="170" rx="12" className="fill-stone-50 dark:fill-stone-950" />
      {/* stylised streets */}
      <g className="stroke-stone-200 dark:stroke-stone-800" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M10 100 C 90 90, 140 120, 320 96" />
        <path d="M120 10 L 140 160" />
        <path d="M230 10 C 220 70, 250 110, 240 160" />
        <path d="M10 40 L 320 60" />
      </g>
      <path d="M268 18 h40 v24 h-40z" className="fill-emerald-100 dark:fill-emerald-950" opacity="0.8" />
      <text x="288" y="34" textAnchor="middle" className="fill-emerald-700 dark:fill-emerald-400" fontSize="7">Agara Lake</text>
      <polyline points={points} fill="none" className="stroke-violet-300 dark:stroke-violet-700" strokeWidth="2" strokeDasharray="4 4" />
      {SHOPS.map((s, i) => {
        const st = statuses[s.id];
        const isNext = s.id === nextId;
        return (
          <g key={s.id} role="button" tabIndex={0} aria-label={`Stop ${i + 1}: ${s.name}`} onClick={() => onPick(s.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(s.id)} className="cursor-pointer outline-none">
            {isNext ? <circle cx={s.x} cy={s.y} r="11" className="animate-ping-soft fill-violet-500/40" style={{ transformOrigin: `${s.x}px ${s.y}px` }} /> : null}
            <circle
              cx={s.x}
              cy={s.y}
              r="10"
              className={st === "visited" ? "fill-violet-600" : isNext || st === "in_visit" ? "fill-white stroke-violet-600 dark:fill-stone-900" : "fill-white stroke-stone-400 dark:fill-stone-900"}
              strokeWidth="2"
            />
            <text x={s.x} y={s.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="600" className={st === "visited" ? "fill-white" : "fill-stone-700 dark:fill-stone-200"}>
              {st === "visited" ? "✓" : i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
