"use client";

import { useState } from "react";
import { invoiceDue, oldestDueDays, outstandingPaise } from "@/lib/field-sales";
import { formatINR } from "@/lib/money";
import { SHOPS } from "@/lib/voltline-data";
import { clockNow, useFieldSales } from "./store";
import { Card, GhostButton, Icon, Pill, PrimaryButton, SectionTitle } from "./ui";

export function ShopScreen() {
  const { state, dispatch } = useFieldSales();
  const seed = SHOPS.find((s) => s.id === state.selectedShopId) ?? SHOPS[0];
  const shop = state.shops[seed.id];
  const due = outstandingPaise(shop.invoices);
  const oldest = oldestDueDays(shop.invoices);
  const overdue = oldest > seed.creditDays;
  const index = SHOPS.findIndex((s) => s.id === seed.id);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-base font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          {seed.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-stone-500 dark:text-stone-400">Stop {index + 1} of {SHOPS.length}</p>
          <h2 className="text-lg font-semibold leading-tight tracking-tight">{seed.name}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <Icon name="pin" className="h-3.5 w-3.5" /> {seed.area}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <Icon name="phone" className="h-3.5 w-3.5" /> {seed.owner} · {seed.phone}
          </p>
        </div>
      </div>

      <Card>
        {shop.status === "planned" ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Not visited yet</p>
              <span className="text-xs text-emerald-700 dark:text-emerald-400">Location matched · 40 m</span>
            </div>
            <PrimaryButton className="w-full" onClick={() => dispatch({ type: "checkIn", shopId: seed.id, at: clockNow() })}>
              <Icon name="pin" className="h-4 w-4" /> Check in
            </PrimaryButton>
            <p className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">Check-in records time and location, even offline.</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{shop.status === "in_visit" ? "Visit in progress" : "Visited"}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400" data-testid="checkin-time">
                  Checked in {shop.checkInAt}
                  {shop.checkOutAt ? ` · out ${shop.checkOutAt}` : ""}
                </p>
              </div>
              {shop.status === "in_visit" ? <Pill tone="violet">In visit</Pill> : <Pill tone="green">Done</Pill>}
            </div>
            {shop.orderedPaise > 0 || shop.collectedPaise > 0 ? (
              <p className="mt-2 text-xs text-stone-600 dark:text-stone-300">
                Today: ordered {formatINR(shop.orderedPaise)} · collected {formatINR(shop.collectedPaise)}
              </p>
            ) : null}
            {shop.status === "in_visit" ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <PrimaryButton onClick={() => dispatch({ type: "tab", tab: "order" })}>
                  <Icon name="order" className="h-4 w-4" /> Take order
                </PrimaryButton>
                <GhostButton onClick={() => dispatch({ type: "tab", tab: "collect" })}>
                  <Icon name="collect" className="h-4 w-4" /> Collect
                </GhostButton>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "checkOut", shopId: seed.id, at: clockNow() })}
                  className="col-span-2 py-1.5 text-xs font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
                >
                  End visit without order
                </button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <GhostButton onClick={() => dispatch({ type: "checkIn", shopId: seed.id, at: clockNow() })}>Visit again</GhostButton>
                <GhostButton onClick={() => dispatch({ type: "tab", tab: "today" })}>Back to route</GhostButton>
              </div>
            )}
          </>
        )}
      </Card>

      {overdue ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-semibold">Payment overdue: {oldest} days (credit is {seed.creditDays})</p>
          <p className="mt-0.5">Collect at least part of {formatINR(due)} before booking a new order.</p>
        </div>
      ) : null}

      <Card>
        <SectionTitle
          action={due > 0 ? (
            <button type="button" onClick={() => dispatch({ type: "tab", tab: "collect" })} className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
              Collect
            </button>
          ) : undefined}
        >
          Outstanding
        </SectionTitle>
        <p className="text-xl font-semibold tabular-nums">{formatINR(due)}</p>
        {shop.invoices.filter((i) => invoiceDue(i) > 0).length > 0 ? (
          <ul className="mt-2 divide-y divide-stone-100 text-xs dark:divide-stone-800">
            {shop.invoices.filter((i) => invoiceDue(i) > 0).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2 py-1.5">
                <span>
                  <span className="font-mono">{inv.id}</span> <span className="text-stone-500 dark:text-stone-400">· {inv.date} · {inv.daysOld}d</span>
                </span>
                <span className={`tabular-nums ${inv.daysOld > seed.creditDays ? "font-semibold text-red-600 dark:text-red-400" : ""}`}>{formatINR(invoiceDue(inv))}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Nothing due. Good standing.</p>
        )}
      </Card>

      <Card>
        <SectionTitle>Last order</SectionTitle>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm">{seed.lastOrder.summary}</p>
          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatINR(seed.lastOrder.amountPaise)}</p>
        </div>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{seed.lastOrder.date}</p>
      </Card>

      <NotesCard key={seed.id} shopId={seed.id} initial={shop.notes} />
    </div>
  );
}

function NotesCard({ shopId, initial }: { shopId: string; initial: string }) {
  const { dispatch } = useFieldSales();
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <SectionTitle>Notes</SectionTitle>
      <label htmlFor={`notes-${shopId}`} className="sr-only">Shop notes</label>
      <textarea
        id={`notes-${shopId}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={3}
        className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-sm outline-none focus:border-violet-500 dark:border-stone-700 dark:bg-stone-800"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-stone-500 dark:text-stone-400">{saved ? "Saved · queued to sync" : "Visible to your manager after sync"}</span>
        <button
          type="button"
          disabled={saved || text === initial}
          onClick={() => {
            dispatch({ type: "note", shopId, text, at: clockNow() });
            setSaved(true);
          }}
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:text-stone-400 disabled:hover:bg-transparent dark:text-violet-300 dark:hover:bg-violet-950"
        >
          Save note
        </button>
      </div>
    </Card>
  );
}
