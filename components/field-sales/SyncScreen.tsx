"use client";

import { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/money";
import { clockNow, useFieldSales, type QueueItem } from "./store";
import { Card, Icon, PrimaryButton, SectionTitle } from "./ui";

const STEP_MS = 450;

const KIND_LABEL: Record<QueueItem["kind"], string> = {
  check_in: "Check-in",
  check_out: "Visit end",
  order: "Order",
  collection: "Payment",
  note: "Note",
};

export function SyncScreen() {
  const { state, dispatch } = useFieldSales();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [justSynced, setJustSynced] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const pending = state.queue.filter((q) => !q.syncedAt);
  const synced = state.queue.filter((q) => q.syncedAt).reverse();
  const busy = syncingId !== null;

  const syncNow = () => {
    const ids = pending.map((p) => p.id);
    if (!ids.length) return;
    setJustSynced(0);
    ids.forEach((id, i) => {
      timers.current.push(window.setTimeout(() => setSyncingId(id), i * STEP_MS));
      timers.current.push(
        window.setTimeout(() => {
          dispatch({ type: "synced", id, at: clockNow() });
          if (i === ids.length - 1) {
            setSyncingId(null);
            setJustSynced(ids.length);
          }
        }, (i + 1) * STEP_MS),
      );
    });
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold tracking-tight">Sync</h2>

      <Card>
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${state.online ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}>
            <Icon name={state.online ? "cloud" : "cloud-off"} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{state.online ? "Online · 4G" : "Offline"}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Last synced {state.lastSyncAt}</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
            <span>No signal</span>
            <button
              type="button"
              role="switch"
              aria-checked={!state.online}
              aria-label="Simulate no signal"
              disabled={busy}
              onClick={() => dispatch({ type: "online", online: !state.online })}
              className={`relative h-6 w-10 rounded-full transition-colors ${!state.online ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${!state.online ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
            </button>
          </label>
        </div>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
          Everything Arjun does is saved on the phone first. Basements and market lanes often have no signal; nothing is lost.
        </p>
      </Card>

      <div>
        <SectionTitle>Waiting to sync · {pending.length}</SectionTitle>
        {pending.length === 0 ? (
          <Card className="py-6 text-center">
            <p className="text-sm font-semibold">{justSynced ? `Synced ${justSynced} item${justSynced > 1 ? "s" : ""}` : "All caught up"}</p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">Orders and payments reach the office as soon as they sync.</p>
          </Card>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {pending.map((q) => (
              <QueueRow key={q.id} item={q} active={q.id === syncingId} />
            ))}
          </ul>
        )}
      </div>

      <PrimaryButton className="w-full" disabled={!state.online || pending.length === 0 || busy} onClick={syncNow}>
        <Icon name="sync" className={`h-4 w-4 ${busy ? "animate-sweep" : ""}`} />
        {busy ? "Syncing…" : "Sync now"}
      </PrimaryButton>
      {!state.online && pending.length > 0 ? (
        <p className="-mt-2 text-center text-xs text-amber-700 dark:text-amber-400">Offline. These will sync automatically when signal is back.</p>
      ) : null}

      {synced.length > 0 ? (
        <div>
          <SectionTitle>Synced today</SectionTitle>
          <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white opacity-80 dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {synced.map((q) => (
              <QueueRow key={q.id} item={q} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function QueueRow({ item, active }: { item: QueueItem; active?: boolean }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          item.syncedAt ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : active ? "bg-violet-600 text-white" : "bg-stone-100 text-stone-500 dark:bg-stone-800"
        }`}
      >
        <Icon name={item.syncedAt ? "check" : "sync"} className={`h-3.5 w-3.5 ${active ? "animate-sweep" : ""}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{item.label}</span>
        <span className="block text-xs text-stone-500 dark:text-stone-400">
          {KIND_LABEL[item.kind]} · {item.at}
          {item.syncedAt ? ` · synced ${item.syncedAt}` : ""}
        </span>
      </span>
      {item.amountPaise ? <span className="shrink-0 text-sm font-semibold tabular-nums">{formatINR(item.amountPaise)}</span> : null}
    </li>
  );
}
