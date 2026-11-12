"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ProductNotes, type NotesContent } from "@/components/ProductNotes";
import { ChatPhone } from "./ChatPhone";
import { OpsConsole } from "./OpsConsole";
import { chipsFor, initialState, reducer, type Chip, type ChipAction } from "./engine";

const REPLY_DELAY_MS = 750;

const NOTES: NotesContent = {
  problem:
    "Kirana owners in Pune order from Sundar by phoning or messaging a salesman, who writes it down and calls it in to the order desk. Orders arrive late in the day, items get misheard, and nobody tells the shop that salt is out of stock until the van arrives without it.",
  users: [
    "Retailers (about 300 kirana stores) who already live in chat apps and order 1–3 times a week.",
    "The two-person order desk at Sundar, who re-type every order into the billing system today.",
    "Warehouse and delivery staff, who need a clean, confirmed list per van slot.",
  ],
  assumptions: [
    "Retailers will type or tap orders themselves if it is as easy as messaging a salesman, in Hindi, English or a mix.",
    "A small keyword matcher on the top ~20 SKUs covers most of the volume; anything else can fall back to a human.",
    "Showing stock and a substitute at order time is worth more than a perfect catalogue.",
    "A visible credit-limit check reduces disputes at delivery.",
  ],
  measure: [
    { metric: "Time to place an order", why: "First message to confirmed order. The prototype shows it on every order; target under 2 minutes." },
    { metric: "Order errors", why: "Lines changed or returned after confirmation, compared with salesman-taken orders." },
    { metric: "Repeat rate", why: "Share of retailers who place a second chat order within 14 days." },
    { metric: "Parser fallback rate", why: "Messages the bot could not understand. This decides whether real NLP is worth building." },
    { metric: "Substitute acceptance", why: "How often retailers take the suggested swap instead of skipping the item." },
  ],
  next: [
    "Real messaging integration and template approvals.",
    "Voice notes, photos of handwritten lists and payment links.",
    "Salesman visibility, schemes and returns.",
  ],
};

function clockNow(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function OrderBotDemo() {
  const [state, dispatch] = useReducer(reducer, 0, initialState);
  const [view, setView] = useState<"chat" | "ops">("chat");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    if (!state.flashOrderId) return;
    const t = window.setTimeout(() => dispatch({ type: "clearFlash" }), 2600);
    return () => window.clearTimeout(t);
  }, [state.flashOrderId]);

  const respond = useCallback(
    (userText: string, input: { kind: "text"; text: string } | ChipAction) => {
      dispatch({ type: "user", text: userText, now: Date.now() });
      const epoch = state.epoch;
      const t = window.setTimeout(() => dispatch({ type: "bot", epoch, input, now: Date.now(), clock: clockNow() }), REPLY_DELAY_MS);
      timers.current.push(t);
    },
    [state.epoch],
  );

  const onChip = (chip: Chip) => respond(chip.label, chip.action);
  const onSend = (text: string) => respond(text, { kind: "text", text });

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    dispatch({ type: "reset" });
    setView("chat");
  };

  const switchView = (v: "chat" | "ops") => {
    setView(v);
    dispatch({ type: v === "ops" ? "seenOps" : "seenChat" });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-0 pb-0 sm:px-6 sm:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-5 sm:px-0 sm:pt-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">Prototype 01 · Distribution, India</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Chat ordering for a distributor</h1>
          <p className="mt-1 max-w-3xl text-sm text-stone-600 dark:text-stone-400">
            Kirana stores order from Sundar Distributors over WhatsApp or any chat app. The bot reads the message, checks stock and
            credit, and the order lands on the ops desk. Tap a suggestion or type your own.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProductNotes content={NOTES} accent="teal" />
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

      <div className="sticky top-14 z-20 border-y border-stone-200 bg-stone-50/95 px-4 py-2 backdrop-blur lg:hidden dark:border-stone-800 dark:bg-stone-950/95" role="tablist" aria-label="Choose view">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-200/70 p-1 dark:bg-stone-800">
          <TabButton active={view === "chat"} onClick={() => switchView("chat")} badge={state.unseenChat}>
            Retailer chat
          </TabButton>
          <TabButton active={view === "ops"} onClick={() => switchView("ops")} badge={state.unseenOps}>
            Ops console
          </TabButton>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <div className={`${view === "chat" ? "flex" : "hidden"} h-[calc(100dvh-7.5rem)] flex-col sm:h-auto sm:pt-4 lg:sticky lg:pt-0 lg:top-20 lg:flex lg:h-auto`}>
          <p className="mb-2 hidden text-center text-xs text-stone-500 sm:block dark:text-stone-400">Retailer&apos;s phone · Shree Ganesh Kirana</p>
          <ChatPhone
            messages={state.messages}
            chips={state.typing ? [] : chipsFor(state)}
            typing={state.typing}
            stock={state.stock}
            onSend={onSend}
            onChip={onChip}
          />
        </div>
        <div className={`${view === "ops" ? "block" : "hidden"} px-4 pt-4 sm:px-0 lg:block lg:pt-0`}>
          <p className="mb-2 hidden text-xs text-stone-500 lg:block dark:text-stone-400">Distributor&apos;s ops console</p>
          <OpsConsole
            orders={state.orders}
            stock={state.stock}
            flashOrderId={state.flashOrderId}
            flashSkus={state.flashSkus}
            demoOrderId={state.demoOrderId}
            onAdvance={(id) => dispatch({ type: "advance", orderId: id })}
          />
          <p className="mt-3 px-1 text-xs text-stone-400">
            Fictional distributor, retailers and stock. Product names are used as realistic sample data only.
          </p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, badge, children }: { active: boolean; onClick: () => void; badge: number; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-white" : "text-stone-600 dark:text-stone-400"
      }`}
    >
      {children}
      {badge > 0 && !active ? (
        <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">{badge}</span>
      ) : null}
    </button>
  );
}
