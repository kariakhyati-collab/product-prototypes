"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PhoneFrame, StatusBar } from "@/components/PhoneFrame";
import { formatINR } from "@/lib/money";
import { CATALOG } from "@/lib/sundar-catalog";
import type { Stock } from "@/lib/order-cart";
import { RETAILER, type Chip, type Msg } from "./engine";

interface Props {
  messages: Msg[];
  chips: Chip[];
  typing: boolean;
  stock: Stock;
  onSend: (text: string) => void;
  onChip: (chip: Chip) => void;
}

export function ChatPhone({ messages, chips, typing, stock, onSend, onChip }: Props) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages.length, typing]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <PhoneFrame label="Retailer's chat with Sundar Distributors">
      <div className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <StatusBar />
        <div className="flex items-center gap-3 px-4 pb-3 pt-2 sm:pt-1">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-sm font-bold text-white">
            SD
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-stone-900" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Sundar Distributors</p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">Order assistant · replies in seconds</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="chat-backdrop scroll-thin flex-1 space-y-2.5 overflow-y-auto px-3 py-4" aria-live="polite">
        <p className="mx-auto w-fit rounded-full bg-white/80 px-3 py-1 text-[11px] text-stone-500 shadow-sm dark:bg-stone-800/80 dark:text-stone-400">
          {RETAILER.name}, {RETAILER.area} · Today
        </p>
        {messages.map((m) => (
          <Message key={m.id} msg={m} stock={stock} />
        ))}
        {typing ? (
          <div className="animate-rise flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-stone-200 bg-white px-3.5 py-3 dark:border-stone-700 dark:bg-stone-800" aria-label="Sundar is typing">
            {[0, 1, 2].map((i) => (
              <span key={i} className="animate-dot h-1.5 w-1.5 rounded-full bg-teal-600" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-stone-200 bg-white px-3 pb-3 pt-2.5 dark:border-stone-800 dark:bg-stone-900 sm:pb-5">
        {chips.length > 0 ? (
          <div className="mb-2.5 flex flex-wrap gap-1.5" aria-label="Quick replies">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                disabled={typing}
                onClick={() => onChip(c)}
                className={`rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
                  c.primary
                    ? "border-teal-600 bg-teal-600 text-white hover:bg-teal-700"
                    : "border-teal-600/30 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-400/30 dark:bg-teal-950/60 dark:text-teal-200 dark:hover:bg-teal-900/60"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : null}
        <form onSubmit={submit} className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">Type a message</label>
          <input
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your order…"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-stone-400 focus:border-teal-600 focus:bg-white dark:border-stone-700 dark:bg-stone-800 dark:focus:bg-stone-800"
          />
          <button
            type="submit"
            disabled={!draft.trim() || typing}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white transition-colors hover:bg-teal-700 disabled:bg-stone-300 dark:disabled:bg-stone-700"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M3.4 2.6a.75.75 0 0 0-1 .9l1.9 5.7h6.2a.75.75 0 0 1 0 1.5H4.3l-1.9 5.7a.75.75 0 0 0 1 .9l14-7a.75.75 0 0 0 0-1.3l-14-6.4Z" />
            </svg>
          </button>
        </form>
      </div>
    </PhoneFrame>
  );
}

function Message({ msg, stock }: { msg: Msg; stock: Stock }) {
  if (msg.from === "user") {
    return (
      <div className="animate-rise ml-auto w-fit max-w-[82%] rounded-2xl rounded-br-md bg-teal-600 px-3.5 py-2 text-sm text-white shadow-sm">
        {msg.text}
      </div>
    );
  }

  const bubble = "animate-rise w-fit max-w-[88%] rounded-2xl rounded-bl-md border bg-white text-sm shadow-sm dark:bg-stone-800";

  switch (msg.kind) {
    case "text": {
      const tone =
        msg.tone === "warn"
          ? "border-amber-300 dark:border-amber-500/40"
          : msg.tone === "success"
            ? "border-teal-300 dark:border-teal-500/40"
            : "border-stone-200 dark:border-stone-700";
      return (
        <div className={`${bubble} ${tone} px-3.5 py-2`}>
          {msg.tone === "warn" ? <span className="mb-0.5 block text-[11px] font-semibold text-amber-700 dark:text-amber-400">Heads up</span> : null}
          {msg.text}
        </div>
      );
    }
    case "added":
      return (
        <div className={`${bubble} border-stone-200 px-3.5 py-2.5 dark:border-stone-700`}>
          {msg.lines.length > 0 ? (
            <>
              <p className="mb-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">Got it, added:</p>
              <ul className="space-y-1">
                {msg.lines.map((l) => (
                  <li key={l.name} className="flex gap-2">
                    <span className="font-semibold tabular-nums text-teal-700 dark:text-teal-300">{l.qty}×</span>
                    <span>
                      {l.name} <span className="text-stone-500 dark:text-stone-400">· {l.unit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {msg.issues.length > 0 ? (
            <ul className={`space-y-1 text-xs ${msg.lines.length ? "mt-2 border-t border-stone-100 pt-2 dark:border-stone-700" : ""}`}>
              {msg.issues.map((i) => (
                <li key={i.text} className={i.tone === "warn" ? "text-amber-700 dark:text-amber-400" : "text-stone-600 dark:text-stone-300"}>
                  {i.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    case "summary": {
      const { priced, credit } = msg;
      const usedPct = Math.round((credit.usedPaise * 100) / credit.limitPaise);
      const orderPct = Math.max(0, credit.usedAfterPct - usedPct);
      return (
        <div className={`${bubble} w-[88%] overflow-hidden border-stone-200 dark:border-stone-700`}>
          <div className="flex items-center justify-between bg-stone-50 px-3.5 py-2 dark:bg-stone-900/60">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Order summary</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">{priced.units} units</span>
          </div>
          <ul className="divide-y divide-stone-100 px-3.5 dark:divide-stone-700">
            {priced.lines.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="leading-snug">
                    <span className="font-semibold tabular-nums">{l.qty} ×</span> {l.name}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {l.unit} · {formatINR(l.unitPaise)} each
                  </p>
                </div>
                <span className="shrink-0 tabular-nums">{formatINR(l.totalPaise)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-stone-200 px-3.5 py-2.5 dark:border-stone-700">
            <span className="font-semibold">Total</span>
            <span className="text-base font-semibold tabular-nums">{formatINR(priced.totalPaise)}</span>
          </div>
          <div className="border-t border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs dark:border-stone-700 dark:bg-stone-900/60">
            <p className="font-medium text-stone-700 dark:text-stone-200">
              Credit: {formatINR(credit.usedPaise)} of {formatINR(credit.limitPaise)} used
            </p>
            <div className="my-1.5 flex h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700" role="img" aria-label={`${credit.usedAfterPct}% of credit used after this order`}>
              <span className="bg-stone-500" style={{ width: `${usedPct}%` }} />
              <span className={credit.ok ? "bg-teal-500" : "bg-amber-500"} style={{ width: `${orderPct}%` }} />
            </div>
            <p className={credit.ok ? "text-stone-500 dark:text-stone-400" : "font-medium text-amber-700 dark:text-amber-400"}>
              {credit.ok
                ? `After this order: ${formatINR(credit.usedAfterPaise)} used · ${formatINR(credit.availableAfterPaise)} left`
                : `Over limit by ${formatINR(credit.overByPaise)}`}
            </p>
            <p className="mt-1 text-stone-400">Prices include GST. Pay on delivery or on credit.</p>
          </div>
        </div>
      );
    }
    case "placed":
      return (
        <div className={`${bubble} w-[88%] border-teal-300 px-3.5 py-3 dark:border-teal-500/40`}>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white" aria-hidden="true">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="m5 10.5 3.2 3L15 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="font-semibold">Order {msg.orderId} placed</p>
          </div>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-stone-500 dark:text-stone-400">Delivery</dt>
            <dd>{msg.slot}</dd>
            <dt className="text-stone-500 dark:text-stone-400">Amount</dt>
            <dd className="tabular-nums">{formatINR(msg.totalPaise)}</dd>
            <dt className="text-stone-500 dark:text-stone-400">Time taken</dt>
            <dd className="tabular-nums">{formatDuration(msg.seconds)}</dd>
          </dl>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">I&apos;ll message you here when it&apos;s confirmed, packed and on the way.</p>
        </div>
      );
    case "catalogue": {
      const picks = CATALOG.filter((_, i) => i % 2 === 0).slice(0, 9);
      return (
        <div className={`${bubble} w-[88%] border-stone-200 px-3.5 py-2.5 dark:border-stone-700`}>
          <p className="mb-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">Today&apos;s rates (incl. GST)</p>
          <ul className="space-y-1.5 text-xs">
            {picks.map((c) => {
              const s = stock[c.id] ?? 0;
              return (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    {c.name} <span className="text-stone-400">· {c.unit}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="tabular-nums">{formatINR(c.pricePaise)}</span>
                    {s === 0 ? <span className="rounded bg-amber-100 px-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">OUT</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">+ {CATALOG.length - picks.length} more. Just type what you need.</p>
        </div>
      );
    }
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}
