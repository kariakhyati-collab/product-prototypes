/**
 * Cart rules for the chat ordering bot: stock checks, minimum order
 * quantities, substitutes, totals and the retailer's credit limit.
 * Pure functions, integer paise throughout.
 */

import type { CatalogItem } from "./sundar-catalog";
import type { ParsedLine } from "./order-parser";

export type Cart = Record<string, number>;
export type Stock = Record<string, number>;

export type CartIssue =
  | { kind: "out_of_stock"; id: string; qty: number; substituteId?: string }
  | { kind: "raised_to_moq"; id: string; requested: number; moq: number }
  | { kind: "short_stock"; id: string; requested: number; available: number };

export interface ApplyResult {
  cart: Cart;
  added: string[];
  issues: CartIssue[];
}

/** Adds parsed lines to a cart, enforcing stock and MOQ. Never mutates its inputs. */
export function applyLines(
  cart: Cart,
  lines: ParsedLine[],
  catalogById: Record<string, CatalogItem>,
  stock: Stock,
): ApplyResult {
  const next: Cart = { ...cart };
  const added: string[] = [];
  const issues: CartIssue[] = [];

  for (const line of lines) {
    const item = catalogById[line.id];
    if (!item || line.qty <= 0) continue;
    const available = stock[line.id] ?? 0;

    if (available <= 0) {
      const sub = item.substituteId;
      issues.push({
        kind: "out_of_stock",
        id: line.id,
        qty: line.qty,
        substituteId: sub && (stock[sub] ?? 0) > 0 ? sub : undefined,
      });
      continue;
    }

    let qty = (next[line.id] ?? 0) + line.qty;
    if (qty < item.moq) {
      issues.push({ kind: "raised_to_moq", id: line.id, requested: qty, moq: item.moq });
      qty = item.moq;
    }
    if (qty > available) {
      issues.push({ kind: "short_stock", id: line.id, requested: qty, available });
      qty = available;
    }
    next[line.id] = qty;
    added.push(line.id);
  }

  return { cart: next, added, issues };
}

export interface PricedLine {
  id: string;
  name: string;
  unit: string;
  qty: number;
  unitPaise: number;
  totalPaise: number;
}

export interface PricedCart {
  lines: PricedLine[];
  totalPaise: number;
  units: number;
}

export function priceCart(cart: Cart, catalogById: Record<string, CatalogItem>): PricedCart {
  const lines: PricedLine[] = [];
  for (const [id, qty] of Object.entries(cart)) {
    const item = catalogById[id];
    if (!item || qty <= 0) continue;
    lines.push({ id, name: item.name, unit: item.unit, qty, unitPaise: item.pricePaise, totalPaise: item.pricePaise * qty });
  }
  return {
    lines,
    totalPaise: lines.reduce((s, l) => s + l.totalPaise, 0),
    units: lines.reduce((s, l) => s + l.qty, 0),
  };
}

export interface CreditCheck {
  ok: boolean;
  limitPaise: number;
  usedPaise: number;
  usedAfterPaise: number;
  availableAfterPaise: number;
  /** How much the order goes over the limit (0 when ok). */
  overByPaise: number;
  /** 0..100, share of the limit used after this order (capped). */
  usedAfterPct: number;
}

export function creditCheck(limitPaise: number, usedPaise: number, orderPaise: number): CreditCheck {
  const usedAfterPaise = usedPaise + orderPaise;
  const overByPaise = Math.max(0, usedAfterPaise - limitPaise);
  return {
    ok: overByPaise === 0,
    limitPaise,
    usedPaise,
    usedAfterPaise,
    availableAfterPaise: Math.max(0, limitPaise - usedAfterPaise),
    overByPaise,
    usedAfterPct: limitPaise > 0 ? Math.min(100, Math.round((usedAfterPaise * 100) / limitPaise)) : 100,
  };
}

/** Removes ordered quantities from stock (called when an order is placed). */
export function reserveStock(stock: Stock, cart: Cart): Stock {
  const next = { ...stock };
  for (const [id, qty] of Object.entries(cart)) next[id] = Math.max(0, (next[id] ?? 0) - qty);
  return next;
}
