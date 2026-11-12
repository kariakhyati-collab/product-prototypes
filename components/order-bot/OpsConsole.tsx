"use client";

import { useState } from "react";
import { formatINR } from "@/lib/money";
import { CATALOG } from "@/lib/sundar-catalog";
import type { Stock } from "@/lib/order-cart";
import { STATUSES, type Order, type OrderStatus } from "./engine";
import { formatDuration } from "./ChatPhone";

const LOW_STOCK = 10;

const STATUS_STYLE: Record<OrderStatus, string> = {
  New: "bg-teal-600 text-white",
  Confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  Packed: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Out for delivery": "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

const NEXT_LABEL: Record<OrderStatus, string | null> = {
  New: "Confirm order",
  Confirmed: "Mark packed",
  Packed: "Send out",
  "Out for delivery": null,
};

interface Props {
  orders: Order[];
  stock: Stock;
  flashOrderId: string | null;
  flashSkus: string[];
  demoOrderId: string | null;
  onAdvance: (id: string) => void;
}

export function OpsConsole({ orders, stock, flashOrderId, flashSkus, demoOrderId, onAdvance }: Props) {
  const [filter, setFilter] = useState<OrderStatus | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [lowOnly, setLowOnly] = useState(false);

  const shown = filter === "All" ? orders : orders.filter((o) => o.status === filter);
  const value = orders.reduce((s, o) => s + o.priced.totalPaise, 0);
  const waiting = orders.filter((o) => o.status === "New").length;
  const lowCount = CATALOG.filter((c) => (stock[c.id] ?? 0) <= LOW_STOCK).length;
  const stockRows = CATALOG.filter((c) => !lowOnly || (stock[c.id] ?? 0) <= LOW_STOCK);

  return (
    <section aria-label="Ops console" className="min-w-0 rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-stone-200 px-4 py-3 sm:px-5 dark:border-stone-800">
        <h2 className="text-base font-semibold">Order desk</h2>
        <span className="text-sm text-stone-500 dark:text-stone-400">Sundar Distributors, Pune</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-teal-500" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
          </span>
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-stone-200 sm:grid-cols-4 dark:bg-stone-800">
        <Kpi label="Orders today" value={String(orders.length)} />
        <Kpi label="Value today" value={formatINR(value)} />
        <Kpi label="Waiting to confirm" value={String(waiting)} highlight={waiting > 0} />
        <Kpi label="SKUs low or out" value={String(lowCount)} />
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 border-b border-stone-200 p-4 sm:p-5 xl:border-b-0 xl:border-r dark:border-stone-800">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Incoming orders</h3>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
            {(["All", ...STATUSES] as const).map((s) => {
              const count = s === "All" ? orders.length : orders.filter((o) => o.status === s).length;
              const active = filter === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                  }`}
                >
                  {s} <span className="tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <ul className="space-y-2.5">
            {shown.length === 0 ? (
              <li className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-700">
                No orders in this status.
              </li>
            ) : null}
            {shown.map((o) => {
              const isOpen = openId === o.id || (openId === null && o.id === demoOrderId);
              const idx = STATUSES.indexOf(o.status);
              const next = NEXT_LABEL[o.status];
              return (
                <li
                  key={o.id}
                  className={`rounded-xl border transition-colors ${
                    o.id === demoOrderId ? "border-teal-600/50 bg-teal-50/40 dark:bg-teal-950/20" : "border-stone-200 dark:border-stone-800"
                  } ${o.id === flashOrderId ? "animate-flash animate-rise" : ""}`}
                >
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2 p-3 sm:p-3.5">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? (o.id === demoOrderId ? "" : null) : o.id)}
                      aria-expanded={isOpen}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-xs text-stone-500 dark:text-stone-400">{o.id}</span>
                        {o.id === demoOrderId ? (
                          <span className="rounded bg-teal-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Your demo order</span>
                        ) : null}
                        <span className="text-xs text-stone-400">{o.placedAt} · via chat</span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-semibold">
                        {o.retailer} <span className="font-normal text-stone-500 dark:text-stone-400">· {o.area}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
                        {o.priced.lines.length} items · {o.priced.units} units · Slot {o.slot}
                        {o.secondsToOrder ? ` · ordered in ${formatDuration(o.secondsToOrder)}` : ""}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <span className="text-sm font-semibold tabular-nums">{formatINR(o.priced.totalPaise)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 px-3 py-2.5 sm:px-3.5 dark:border-stone-800">
                    <ol className="flex min-w-0 flex-1 items-center gap-1" aria-label={`Status: ${o.status}`}>
                      {STATUSES.map((s, i) => (
                        <li key={s} className="flex min-w-0 flex-1 items-center gap-1" title={s}>
                          <span className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= idx ? "bg-teal-600" : "bg-stone-200 dark:bg-stone-700"}`} />
                        </li>
                      ))}
                    </ol>
                    {next ? (
                      <button
                        type="button"
                        onClick={() => onAdvance(o.id)}
                        className="shrink-0 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-800 transition-colors hover:border-teal-600 hover:text-teal-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:text-teal-300"
                      >
                        {next} →
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs text-stone-500 dark:text-stone-400">On the way</span>
                    )}
                  </div>

                  {isOpen ? (
                    <table className="w-full border-t border-stone-100 text-xs dark:border-stone-800">
                      <caption className="sr-only">Lines in {o.id}</caption>
                      <tbody>
                        {o.priced.lines.map((l) => (
                          <tr key={l.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                            <td className="py-1.5 pl-3 pr-2 tabular-nums text-stone-500 sm:pl-3.5">{l.qty}×</td>
                            <td className="py-1.5 pr-2">
                              {l.name} <span className="text-stone-400">· {l.unit}</span>
                            </td>
                            <td className="py-1.5 pr-3 text-right tabular-nums sm:pr-3.5">{formatINR(l.totalPaise)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Stock levels</h3>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="accent-teal-600" />
              Low only
            </label>
          </div>
          <ul className="scroll-thin max-h-[520px] space-y-1 overflow-y-auto pr-1">
            {stockRows.map((c) => {
              const s = stock[c.id] ?? 0;
              const out = s === 0;
              const low = !out && s <= LOW_STOCK;
              const flash = flashSkus.includes(c.id);
              return (
                <li
                  key={c.id}
                  className={`rounded-lg px-2 py-1.5 transition-colors duration-700 ${flash ? "bg-teal-50 dark:bg-teal-950/40" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate" title={c.name}>{c.name}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {out ? <Badge tone="red">Out</Badge> : low ? <Badge tone="amber">Low</Badge> : null}
                      <span className={`w-8 text-right font-semibold tabular-nums ${out ? "text-red-600 dark:text-red-400" : ""}`}>{s}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${out ? "bg-red-500" : low ? "bg-amber-500" : "bg-teal-600/70"}`}
                      style={{ width: `${Math.min(100, (s / 140) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-stone-400">Units on hand, after confirmed chat orders are reserved.</p>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white px-4 py-3 sm:px-5 dark:bg-stone-900">
      <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${highlight ? "text-teal-700 dark:text-teal-300" : ""}`}>{value}</p>
    </div>
  );
}

function Badge({ tone, children }: { tone: "red" | "amber"; children: React.ReactNode }) {
  const cls =
    tone === "red"
      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  return <span className={`rounded px-1.5 py-px text-[10px] font-semibold uppercase ${cls}`}>{children}</span>;
}
