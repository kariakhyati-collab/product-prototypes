import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{children}</h3>
      {action}
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = "", type = "button" }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700 active:bg-violet-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:bg-stone-700 dark:disabled:text-stone-400 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-violet-600/50 hover:text-violet-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:text-violet-300 ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({ tone, children }: { tone: "violet" | "green" | "amber" | "red" | "stone"; children: ReactNode }) {
  const map = {
    violet: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    stone: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  } as const;
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[tone]}`}>{children}</span>;
}

type IconName = "today" | "shop" | "order" | "collect" | "sync" | "check" | "pin" | "phone" | "search" | "minus" | "plus" | "cloud" | "cloud-off" | "receipt" | "note" | "chevron";

const PATHS: Record<IconName, ReactNode> = {
  today: <><path d="M4 6h16M4 12h10M4 18h7" /><circle cx="18" cy="16" r="3" /></>,
  shop: <><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.5 11.5V20h13v-8.5M10 20v-5h4v5" /></>,
  order: <><path d="M6 4h12l1 16H5z" /><path d="M9 8a3 3 0 0 0 6 0" /></>,
  collect: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  sync: <><path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" /><path d="M18.5 3v4.5H14M5.5 21v-4.5H10" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  cloud: <path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.6A3.8 3.8 0 0 1 17.5 18.5z" />,
  "cloud-off": <><path d="M7 18.5a4.5 4.5 0 0 1-.6-9M10 5.5a6 6 0 0 1 7.9 5.6 3.8 3.8 0 0 1 1.9 6.6M17.5 18.5H11" /><path d="m4 4 16 16" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  note: <><path d="M5 4h10l4 4v12H5z" /><path d="M9 12h6M9 16h4" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
