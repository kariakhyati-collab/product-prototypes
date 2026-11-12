"use client";

import { useEffect, useRef, useState } from "react";

export interface NotesContent {
  problem: string;
  users: string[];
  assumptions: string[];
  measure: Array<{ metric: string; why: string }>;
  next: string[];
}

const ACCENTS = {
  teal: { button: "hover:border-teal-600/40 hover:text-teal-700 dark:hover:text-teal-300", dot: "bg-teal-600", heading: "text-teal-700 dark:text-teal-300" },
  violet: { button: "hover:border-violet-600/40 hover:text-violet-700 dark:hover:text-violet-300", dot: "bg-violet-600", heading: "text-violet-700 dark:text-violet-300" },
} as const;

export function ProductNotes({ content, accent }: { content: NotesContent; accent: keyof typeof ACCENTS }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const a = ACCENTS[accent];

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const opener = openerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 ${a.button}`}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M5 3.5h7l3 3v10H5z" strokeLinejoin="round" />
          <path d="M8 9.5h4M8 12.5h4" strokeLinecap="round" />
        </svg>
        Product notes
      </button>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-stone-950/40" onClick={() => setOpen(false)} />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="notes-title"
          inert={!open}
          className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ease-out dark:bg-stone-900 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
            <h2 id="notes-title" className="text-base font-semibold">Product notes</h2>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white"
              aria-label="Close product notes"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="scroll-thin flex-1 space-y-7 overflow-y-auto px-5 py-6 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            <Section title="The problem" className={a.heading}>
              <p>{content.problem}</p>
            </Section>
            <Section title="Who it's for" className={a.heading}>
              <List items={content.users} dot={a.dot} />
            </Section>
            <Section title="Assumptions I'm testing" className={a.heading}>
              <List items={content.assumptions} dot={a.dot} />
            </Section>
            <Section title="What I'd measure" className={a.heading}>
              <dl className="space-y-3">
                {content.measure.map((m) => (
                  <div key={m.metric} className="rounded-xl border border-stone-200 p-3 dark:border-stone-800">
                    <dt className="font-medium text-stone-900 dark:text-stone-100">{m.metric}</dt>
                    <dd className="mt-0.5 text-stone-600 dark:text-stone-400">{m.why}</dd>
                  </div>
                ))}
              </dl>
            </Section>
            <Section title="Deliberately left out" className={a.heading}>
              <List items={content.next} dot={a.dot} />
            </Section>
            <p className="border-t border-stone-200 pt-4 text-xs text-stone-500 dark:border-stone-800">
              Front-end prototype with fictional companies, people and numbers. Nothing is sent anywhere.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Section({ title, className, children }: { title: string; className: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${className}`}>{title}</h3>
      {children}
    </section>
  );
}

function List({ items, dot }: { items: string[]; dot: string }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
