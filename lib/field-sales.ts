/**
 * Pure logic for the Voltline field-sales app: order pricing with schemes,
 * GST, outstanding dues and collection allocation. Integer paise throughout.
 */

import { applyBps } from "./money";

export interface Product {
  id: string;
  name: string;
  category: "Chargers" | "Cables" | "Power banks" | "Audio" | "Protection";
  dealerPaise: number;
  mrpPaise: number;
  /** Two-letter mark used for the product tile. */
  mark: string;
}

/** "Buy N, get M free" on the listed products, counted per product line. */
export interface FreeGoodsScheme {
  id: string;
  label: string;
  productIds: string[];
  buy: number;
  free: number;
}

/** Order-value slab discount, in basis points. */
export interface Slab {
  minPaise: number;
  bps: number;
  label: string;
}

export const GST_BPS = 1800; // 18% on mobile accessories

export interface OrderLine {
  id: string;
  qty: number;
  freeQty: number;
  unitPaise: number;
  grossPaise: number;
  schemeLabel?: string;
}

export interface OrderPricing {
  lines: OrderLine[];
  units: number;
  freeUnits: number;
  subtotalPaise: number;
  slab: Slab | null;
  discountPaise: number;
  taxablePaise: number;
  gstPaise: number;
  totalPaise: number;
  /** The next slab up and how much more the shop needs to order to reach it. */
  nextSlab: { slab: Slab; shortByPaise: number } | null;
}

export function priceOrder(
  qtys: Record<string, number>,
  products: Record<string, Product>,
  schemes: FreeGoodsScheme[],
  slabs: Slab[],
): OrderPricing {
  const lines: OrderLine[] = [];
  for (const [id, qty] of Object.entries(qtys)) {
    const p = products[id];
    if (!p || qty <= 0) continue;
    const scheme = schemes.find((s) => s.productIds.includes(id));
    const freeQty = scheme ? Math.floor(qty / scheme.buy) * scheme.free : 0;
    lines.push({
      id,
      qty,
      freeQty,
      unitPaise: p.dealerPaise,
      grossPaise: p.dealerPaise * qty,
      schemeLabel: scheme?.label,
    });
  }

  const subtotalPaise = lines.reduce((s, l) => s + l.grossPaise, 0);
  const sorted = [...slabs].sort((a, b) => b.minPaise - a.minPaise);
  const slab = sorted.find((s) => subtotalPaise >= s.minPaise) ?? null;
  const discountPaise = slab ? applyBps(subtotalPaise, slab.bps) : 0;
  const taxablePaise = subtotalPaise - discountPaise;
  const gstPaise = applyBps(taxablePaise, GST_BPS);

  const higher = [...slabs].sort((a, b) => a.minPaise - b.minPaise).find((s) => s.minPaise > subtotalPaise);
  const nextSlab = subtotalPaise > 0 && higher ? { slab: higher, shortByPaise: higher.minPaise - subtotalPaise } : null;

  return {
    lines,
    units: lines.reduce((s, l) => s + l.qty, 0),
    freeUnits: lines.reduce((s, l) => s + l.freeQty, 0),
    subtotalPaise,
    slab,
    discountPaise,
    taxablePaise,
    gstPaise,
    totalPaise: taxablePaise + gstPaise,
    nextSlab,
  };
}

export interface Invoice {
  id: string;
  date: string;
  amountPaise: number;
  paidPaise: number;
  daysOld: number;
}

export function invoiceDue(inv: Invoice): number {
  return Math.max(0, inv.amountPaise - inv.paidPaise);
}

export function outstandingPaise(invoices: Invoice[]): number {
  return invoices.reduce((s, i) => s + invoiceDue(i), 0);
}

/** Oldest unpaid invoice age in days, or 0 if nothing is due. */
export function oldestDueDays(invoices: Invoice[]): number {
  return invoices.filter((i) => invoiceDue(i) > 0).reduce((m, i) => Math.max(m, i.daysOld), 0);
}

export interface Allocation {
  invoiceId: string;
  appliedPaise: number;
  closes: boolean;
}

export interface AllocationResult {
  allocations: Allocation[];
  /** Money left over after every invoice is cleared (an advance). */
  unappliedPaise: number;
  outstandingAfterPaise: number;
}

/** Applies a collection to invoices oldest-first, the usual distributor rule. */
export function allocateCollection(invoices: Invoice[], amountPaise: number): AllocationResult {
  let remaining = Math.max(0, Math.round(amountPaise));
  const allocations: Allocation[] = [];
  const oldestFirst = [...invoices].filter((i) => invoiceDue(i) > 0).sort((a, b) => b.daysOld - a.daysOld);

  for (const inv of oldestFirst) {
    if (remaining === 0) break;
    const due = invoiceDue(inv);
    const applied = Math.min(due, remaining);
    remaining -= applied;
    allocations.push({ invoiceId: inv.id, appliedPaise: applied, closes: applied === due });
  }

  const applied = allocations.reduce((s, a) => s + a.appliedPaise, 0);
  return {
    allocations,
    unappliedPaise: remaining,
    outstandingAfterPaise: outstandingPaise(invoices) - applied,
  };
}

export function applyAllocations(invoices: Invoice[], allocations: Allocation[]): Invoice[] {
  return invoices.map((inv) => {
    const a = allocations.find((x) => x.invoiceId === inv.id);
    return a ? { ...inv, paidPaise: inv.paidPaise + a.appliedPaise } : inv;
  });
}

export type PaymentMode = "upi" | "cash" | "cheque";

/** Indian law (s.269ST) bars accepting ₹2,00,000 or more in cash in one go. */
export const CASH_LIMIT_PAISE = 20_000_000;

export function validateCollection(input: {
  mode: PaymentMode;
  amountPaise: number | null;
  outstandingPaise: number;
  chequeNo?: string;
}): string[] {
  const errors: string[] = [];
  const { mode, amountPaise, outstandingPaise: due, chequeNo } = input;
  if (amountPaise === null) errors.push("Enter a valid amount, e.g. 4,500 or 4500.50");
  else if (amountPaise <= 0) errors.push("Amount must be more than zero");
  else {
    if (amountPaise > due) errors.push("Amount is more than the outstanding balance");
    if (mode === "cash" && amountPaise >= CASH_LIMIT_PAISE) errors.push("Cash of ₹2,00,000 or more can't be accepted in one go");
  }
  if (mode === "cheque" && !/^\d{6}$/.test(chequeNo ?? "")) errors.push("Cheque number must be 6 digits");
  return errors;
}

export interface DayProgress {
  visited: number;
  total: number;
  achievedPaise: number;
  targetPaise: number;
  /** 0..100 */
  pct: number;
}

export function dayProgress(statuses: string[], achievedPaise: number, targetPaise: number): DayProgress {
  return {
    visited: statuses.filter((s) => s === "visited").length,
    total: statuses.length,
    achievedPaise,
    targetPaise,
    pct: targetPaise > 0 ? Math.min(100, Math.floor((achievedPaise * 100) / targetPaise)) : 0,
  };
}
