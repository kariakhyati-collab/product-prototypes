import type { ReactNode } from "react";

/**
 * A generic phone drawn in CSS (no device brand). Below the `sm` breakpoint
 * it disappears and the app simply fills the viewport, like a real phone.
 */
export function PhoneFrame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      className="relative mx-auto flex h-full w-full flex-col overflow-hidden bg-white sm:h-[760px] sm:w-[380px] lg:h-[clamp(620px,calc(100dvh-15rem),760px)] sm:rounded-[2.75rem] sm:border-[10px] sm:border-stone-900 sm:shadow-[0_30px_60px_-20px_rgb(28_25_23/0.35)] dark:bg-stone-900 sm:dark:border-stone-700"
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-2 z-20 hidden h-5 w-24 -translate-x-1/2 rounded-full bg-stone-900 sm:block dark:bg-stone-700" />
      {children}
    </div>
  );
}

/** Fake status bar shown at the top of the phone screen. */
export function StatusBar({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const color = tone === "light" ? "text-white" : "text-stone-800 dark:text-stone-200";
  return (
    <div className={`hidden h-9 shrink-0 items-end justify-between px-7 pb-1 text-[11px] font-semibold sm:flex ${color}`}>
      <span>10:42</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <svg viewBox="0 0 18 12" className="h-2.5 w-4" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2" width="3" height="10" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" opacity=".35" /></svg>
        <svg viewBox="0 0 26 12" className="h-2.5 w-6" fill="none" stroke="currentColor"><rect x="0.5" y="0.5" width="22" height="11" rx="3" /><rect x="2.5" y="2.5" width="14" height="7" rx="1.5" fill="currentColor" stroke="none" /><path d="M24.5 4v4" strokeLinecap="round" /></svg>
      </span>
    </div>
  );
}
