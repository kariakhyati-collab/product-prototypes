"use client";

import { useState } from "react";
import { allocateCollection, invoiceDue, oldestDueDays, outstandingPaise, validateCollection, type PaymentMode } from "@/lib/field-sales";
import { formatINR, parseRupeesToPaise } from "@/lib/money";
import { SHOPS } from "@/lib/voltline-data";
import { clockNow, useFieldSales } from "./store";
import { Card, GhostButton, Icon, PrimaryButton, SectionTitle } from "./ui";

const MODES: Array<{ id: PaymentMode; label: string }> = [
  { id: "upi", label: "UPI" },
  { id: "cash", label: "Cash" },
  { id: "cheque", label: "Cheque" },
];

const BANKS = ["HDFC Bank", "State Bank of India", "ICICI Bank", "Canara Bank", "Karnataka Bank"];

export function CollectScreen() {
  const { state, dispatch } = useFieldSales();
  const seed = SHOPS.find((s) => s.id === state.selectedShopId) ?? SHOPS[0];
  const receipt = state.lastReceiptId ? state.receipts.find((r) => r.id === state.lastReceiptId) : null;

  if (receipt && receipt.shopId === seed.id) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center pt-4 text-center">
          <span className="animate-rise flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Icon name="check" className="h-7 w-7" />
          </span>
          <h2 className="mt-3 text-lg font-semibold">{formatINR(receipt.amountPaise)} collected</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">Receipt sent to {seed.owner} by SMS (simulated)</p>
        </div>
        <Card className="mt-5 border-dashed text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <Icon name="receipt" className="h-4 w-4 text-violet-600" /> {receipt.id}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">Today {receipt.at}</span>
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
            <dt className="text-stone-500 dark:text-stone-400">From</dt>
            <dd className="text-right">{seed.name}</dd>
            <dt className="text-stone-500 dark:text-stone-400">Mode</dt>
            <dd className="text-right uppercase">{receipt.mode}</dd>
            <dt className="text-stone-500 dark:text-stone-400">Reference</dt>
            <dd className="text-right font-mono">{receipt.ref}</dd>
            <dt className="text-stone-500 dark:text-stone-400">Collected by</dt>
            <dd className="text-right">Arjun M. (Voltline)</dd>
          </dl>
          <div className="mt-3 border-t border-stone-200 pt-2 text-xs dark:border-stone-800">
            <p className="mb-1 font-semibold">Applied to</p>
            {receipt.allocations.map((a) => (
              <p key={a.invoiceId} className="flex justify-between">
                <span className="font-mono">
                  {a.invoiceId} {a.closes ? <span className="font-sans text-emerald-700 dark:text-emerald-400">· cleared</span> : null}
                </span>
                <span className="tabular-nums">{formatINR(a.appliedPaise)}</span>
              </p>
            ))}
          </div>
          <p className="mt-3 flex justify-between border-t border-stone-200 pt-2 text-sm font-semibold dark:border-stone-800">
            <span>Balance due</span>
            <span className="tabular-nums">{formatINR(receipt.outstandingAfterPaise)}</span>
          </p>
        </Card>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <GhostButton onClick={() => dispatch({ type: "dismissReceipt" })}>New collection</GhostButton>
          <PrimaryButton onClick={() => { dispatch({ type: "dismissReceipt" }); dispatch({ type: "tab", tab: "today" }); }}>Done</PrimaryButton>
        </div>
      </div>
    );
  }

  return <CollectForm key={seed.id} />;
}

function CollectForm() {
  const { state, dispatch } = useFieldSales();
  const seed = SHOPS.find((s) => s.id === state.selectedShopId) ?? SHOPS[0];
  const shop = state.shops[seed.id];
  const due = outstandingPaise(shop.invoices);
  const open = shop.invoices.filter((i) => invoiceDue(i) > 0).sort((a, b) => b.daysOld - a.daysOld);

  const [mode, setMode] = useState<PaymentMode>("upi");
  const [amountText, setAmountText] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [touched, setTouched] = useState(false);

  const amountPaise = amountText.trim() ? parseRupeesToPaise(amountText) : null;
  const errors = validateCollection({ mode, amountPaise, outstandingPaise: due, chequeNo });
  const preview = amountPaise && amountPaise > 0 ? allocateCollection(shop.invoices, Math.min(amountPaise, due)) : null;

  if (due === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold tracking-tight">Collect · {seed.name}</h2>
        <Card className="mt-4 text-center">
          <p className="text-sm font-semibold">Nothing due</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{seed.name} has no open invoices. Pick another shop from Today.</p>
          <GhostButton className="mt-3 w-full" onClick={() => dispatch({ type: "tab", tab: "today" })}>Back to route</GhostButton>
        </Card>
      </div>
    );
  }

  const submit = () => {
    setTouched(true);
    if (errors.length || amountPaise === null) return;
    const ref =
      mode === "upi" ? `UPI ${String(400000000000 + state.seq * 7919).slice(0, 12)}` : mode === "cheque" ? `${bank.split(" ")[0]} #${chequeNo}` : `CASH-${state.seq}`;
    dispatch({ type: "collect", shopId: seed.id, mode, amountPaise, ref, at: clockNow() });
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Collect · {seed.name}</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">Oldest invoice {oldestDueDays(shop.invoices)} days · credit {seed.creditDays} days</p>
      </div>

      <Card>
        <SectionTitle>Outstanding</SectionTitle>
        <p className="text-2xl font-semibold tabular-nums">{formatINR(due)}</p>
        <ul className="mt-2 space-y-1 text-xs">
          {open.map((inv) => (
            <li key={inv.id} className="flex justify-between gap-2">
              <span className="text-stone-500 dark:text-stone-400">
                <span className="font-mono text-stone-700 dark:text-stone-300">{inv.id}</span> · {inv.daysOld}d
              </span>
              <span className={`tabular-nums ${inv.daysOld > seed.creditDays ? "font-semibold text-red-600 dark:text-red-400" : ""}`}>{formatINR(invoiceDue(inv))}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800" role="radiogroup" aria-label="Payment mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${mode === m.id ? "bg-white text-violet-700 shadow-sm dark:bg-stone-950 dark:text-violet-300" : "text-stone-600 dark:text-stone-400"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="amount" className="text-xs font-semibold text-stone-600 dark:text-stone-300">Amount received</label>
        <div className="mt-1 flex items-center rounded-xl border border-stone-200 bg-white px-3 focus-within:border-violet-500 dark:border-stone-700 dark:bg-stone-900">
          <span className="text-stone-400">₹</span>
          <input
            id="amount"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent px-2 py-3 text-lg font-semibold tabular-nums outline-none"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <QuickAmount label={`Full ${formatINR(due)}`} onClick={() => setAmountText(String(due / 100))} />
          {open.length > 1 ? <QuickAmount label={`Oldest ${formatINR(invoiceDue(open[0]))}`} onClick={() => setAmountText(String(invoiceDue(open[0]) / 100))} /> : null}
        </div>
      </div>

      {mode === "upi" ? (
        <Card className="flex items-center gap-3">
          <FakeQr seed={due} />
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Shop scans this Voltline collection QR. The UPI reference fills in automatically.
            <span className="mt-1 block text-stone-400">Demo QR, not a real payment code.</span>
          </p>
        </Card>
      ) : null}
      {mode === "cash" ? (
        <p className="rounded-xl bg-stone-100 px-3 py-2 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          Count notes in front of the owner. Deposit by 6 pm; cash of ₹2,00,000 or more can&apos;t be accepted.
        </p>
      ) : null}
      {mode === "cheque" ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="cheque-no" className="text-xs font-semibold text-stone-600 dark:text-stone-300">Cheque no.</label>
            <input
              id="cheque-no"
              inputMode="numeric"
              maxLength={6}
              value={chequeNo}
              onChange={(e) => setChequeNo(e.target.value.replace(/\D/g, ""))}
              placeholder="6 digits"
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-mono outline-none focus:border-violet-500 dark:border-stone-700 dark:bg-stone-900"
            />
          </div>
          <div>
            <label htmlFor="bank" className="text-xs font-semibold text-stone-600 dark:text-stone-300">Bank</label>
            <select
              id="bank"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-2 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-stone-700 dark:bg-stone-900"
            >
              {BANKS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
      ) : null}

      {preview && preview.allocations.length > 0 ? (
        <div className="rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-800">
          <p className="mb-1 font-semibold">Will be applied oldest first</p>
          {preview.allocations.map((a) => (
            <p key={a.invoiceId} className="flex justify-between">
              <span className="font-mono">
                {a.invoiceId} <span className="font-sans text-stone-500">{a.closes ? "· clears it" : "· part"}</span>
              </span>
              <span className="tabular-nums">{formatINR(a.appliedPaise)}</span>
            </p>
          ))}
          <p className="mt-1 flex justify-between border-t border-stone-100 pt-1 font-semibold dark:border-stone-800">
            <span>Balance after</span>
            <span className="tabular-nums">{formatINR(preview.outstandingAfterPaise)}</span>
          </p>
        </div>
      ) : null}

      {touched && errors.length > 0 ? (
        <ul className="space-y-0.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      ) : null}

      <PrimaryButton className="w-full" onClick={submit}>
        Record {amountPaise ? formatINR(amountPaise) : "payment"}
      </PrimaryButton>
    </div>
  );
}

function QuickAmount({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
      {label}
    </button>
  );
}

/** A decorative, deterministic QR-like grid. Not scannable on purpose. */
function FakeQr({ seed }: { seed: number }) {
  const n = 17;
  const cells: Array<[number, number]> = [];
  let x = (seed % 9973) + 17;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      x = (x * 1103515245 + 12345) % 2147483648;
      const inFinder = (r < 5 && c < 5) || (r < 5 && c >= n - 5) || (r >= n - 5 && c < 5);
      if (!inFinder && x % 3 === 0) cells.push([r, c]);
    }
  }
  const finder = (cx: number, cy: number) => (
    <g key={`${cx}-${cy}`}>
      <rect x={cx} y={cy} width="5" height="5" className="fill-stone-900" />
      <rect x={cx + 1} y={cy + 1} width="3" height="3" className="fill-white" />
      <rect x={cx + 2} y={cy + 2} width="1" height="1" className="fill-stone-900" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-20 w-20 shrink-0 rounded-lg bg-white" aria-label="Sample payment QR (not real)" role="img">
      {cells.map(([r, c]) => <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" className="fill-stone-900" />)}
      {finder(0, 0)}
      {finder(n - 5, 0)}
      {finder(0, n - 5)}
    </svg>
  );
}
