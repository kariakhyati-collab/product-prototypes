"use client";

import { useEffect, useRef } from "react";
import { PhoneFrame, StatusBar } from "@/components/PhoneFrame";
import { ProductNotes, type NotesContent } from "@/components/ProductNotes";
import { CollectScreen } from "./CollectScreen";
import { OrderScreen } from "./OrderScreen";
import { ShopScreen } from "./ShopScreen";
import { SyncScreen } from "./SyncScreen";
import { TodayScreen } from "./TodayScreen";
import { clearSaved, FieldSalesProvider, useFieldSales, type Tab } from "./store";
import { Icon } from "./ui";

const NOTES: NotesContent = {
  problem:
    "Voltline's reps visit 6–10 mobile shops a day. Orders go on paper or in chat to the office, payments are noted in a diary, and the sales manager only learns what happened the next morning. Reps also lose time in shops with no signal, and nobody on the road knows which shop is overdue.",
  users: [
    "Field reps like Arjun, on a budget Android phone, often with one hand free and patchy 4G.",
    "Area sales managers who want to see visits, orders and collections the same day.",
    "Accounts, who need clean receipts allocated against the right invoices.",
  ],
  assumptions: [
    "Offline-first matters more than any feature: every action must work with no signal and sync later.",
    "Check-in before ordering is acceptable to reps if it is one tap and doubles as their visit log.",
    "Showing the next scheme slab at order time lifts order value without discounting by hand.",
    "Showing dues and the overdue flag on every visit improves collections.",
  ],
  measure: [
    { metric: "Orders per visit and order value", why: "Compared with paper orders; the slab nudge should raise average order value." },
    { metric: "Time in shop to book an order", why: "From check-in to order placed. Target under 3 minutes." },
    { metric: "Collection efficiency", why: "Amount collected against amount overdue on the beat, week on week." },
    { metric: "Sync lag", why: "Minutes from action to office. Tells us whether offline mode is hiding problems." },
    { metric: "Visit compliance", why: "Planned shops actually checked in, by rep." },
  ],
  next: [
    "Real GPS, maps and routing; the route here is a sketch.",
    "Login, multiple reps, manager dashboard and approvals.",
    "Returns, replacements under warranty and stock at the shop.",
  ],
};

const STEPS = [
  "On Today, tap stop 2, Gadget Point.",
  "Check in. The time is recorded on the phone.",
  "Take order: add 10 braided 1m cables (1 free) and 4 GaN chargers.",
  "Review the scheme and GST, then place the order. Today's progress jumps.",
  "Collect ₹6,400 by UPI against the oldest invoice.",
  "Open Sync, toggle No signal, then sync when back online.",
];

const TABS: Array<{ id: Tab; label: string; icon: "today" | "shop" | "order" | "collect" | "sync" }> = [
  { id: "today", label: "Today", icon: "today" },
  { id: "shop", label: "Shop", icon: "shop" },
  { id: "order", label: "Order", icon: "order" },
  { id: "collect", label: "Collect", icon: "collect" },
  { id: "sync", label: "Sync", icon: "sync" },
];

export function FieldSalesApp() {
  return (
    <FieldSalesProvider>
      <Layout />
    </FieldSalesProvider>
  );
}

function Layout() {
  const { dispatch } = useFieldSales();
  const reset = () => {
    clearSaved();
    dispatch({ type: "reset" });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col sm:px-6 sm:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-5 sm:px-0 sm:pt-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">Prototype 02 · Field sales, India</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Field-sales app for shop visits</h1>
          <p className="mt-1 max-w-3xl text-sm text-stone-600 dark:text-stone-400">
            Arjun sells Voltline phone accessories to mobile shops in Bengaluru. One app for his route, visits, orders with schemes,
            payment collection and offline sync. Your progress is saved in this browser.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProductNotes content={NOTES} accent="violet" />
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:text-white"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M4 10a6 6 0 1 0 1.8-4.3M4 4v3.5h3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reset demo
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px_1fr]">
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="text-sm font-semibold">Try the flow</h2>
            <ol className="mt-3 space-y-3 text-sm text-stone-600 dark:text-stone-300">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div className="h-[calc(100dvh-3.5rem)] min-w-0 sm:h-auto">
          <PhoneFrame label="Voltline field-sales app">
            <AppShell />
          </PhoneFrame>
        </div>

        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="text-sm font-semibold">Design choices</h2>
            <dl className="mt-3 space-y-4 text-sm">
              {[
                ["Offline first", "Every tap is saved on the phone and queued. Sync is visible, never a mystery."],
                ["Check in, then order", "One tap gives managers a visit log without extra forms for the rep."],
                ["Money upfront", "Dues and overdue days sit on the shop page, so collection happens on the same visit."],
                ["Schemes do the maths", "Free goods, slab discounts and GST are calculated live, with a nudge to the next slab."],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="font-medium">{t}</dt>
                  <dd className="mt-0.5 text-stone-600 dark:text-stone-400">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
      <p className="mt-4 hidden px-4 text-center text-xs text-stone-400 sm:block">Fictional brand, shops, people and numbers.</p>
    </div>
  );
}

function AppShell() {
  const { state, dispatch } = useFieldSales();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pending = state.queue.filter((q) => !q.syncedAt).length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [state.tab, state.selectedShopId]);

  return (
    <>
      <div className="shrink-0 bg-white dark:bg-stone-900">
        <StatusBar />
        <div className="flex items-center gap-2.5 border-b border-stone-200 px-4 pb-2.5 pt-2 sm:pt-1 dark:border-stone-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white" aria-hidden="true">V</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Voltline Field</p>
            <p className="truncate text-[11px] text-stone-500 dark:text-stone-400">Arjun · Koramangala–HSR beat</p>
          </div>
          <span
            className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              state.online ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            }`}
            data-testid="network-badge"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${state.online ? "bg-emerald-500" : "bg-amber-500"}`} />
            {state.online ? "Online" : "Offline"}
            {pending > 0 ? ` · ${pending} pending` : ""}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-950">
        {state.tab === "today" ? <TodayScreen /> : null}
        {state.tab === "shop" ? <ShopScreen /> : null}
        {state.tab === "order" ? <OrderScreen /> : null}
        {state.tab === "collect" ? <CollectScreen /> : null}
        {state.tab === "sync" ? <SyncScreen /> : null}
      </div>

      <nav aria-label="App sections" className="shrink-0 border-t border-stone-200 bg-white pb-1 sm:pb-3 dark:border-stone-800 dark:bg-stone-900">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = state.tab === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "tab", tab: t.id })}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                    active ? "text-violet-700 dark:text-violet-300" : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                  }`}
                >
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-violet-100 dark:bg-violet-950" : ""}`}>
                    <Icon name={t.icon} className="h-5 w-5" />
                  </span>
                  {t.label}
                  {t.id === "sync" && pending > 0 ? (
                    <span className="absolute right-[18%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{pending}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
