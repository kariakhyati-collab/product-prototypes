"use client";

import { useState } from "react";
import { priceOrder, type Product } from "@/lib/field-sales";
import { formatINR } from "@/lib/money";
import { PRODUCTS, PRODUCTS_BY_ID, SCHEMES, SHOPS, SLABS } from "@/lib/voltline-data";
import { clockNow, useFieldSales } from "./store";
import { Card, GhostButton, Icon, PrimaryButton } from "./ui";

const CATEGORIES = ["All", "Chargers", "Cables", "Power banks", "Audio", "Protection"] as const;

export function OrderScreen() {
  const { state, dispatch } = useFieldSales();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [reviewing, setReviewing] = useState(false);

  const seed = SHOPS.find((s) => s.id === state.selectedShopId) ?? SHOPS[0];
  const shop = state.shops[seed.id];
  const pricing = priceOrder(state.cart, PRODUCTS_BY_ID, SCHEMES, SLABS);
  const lastOrder = state.lastOrderId ? state.orders.find((o) => o.id === state.lastOrderId) : null;

  if (lastOrder && lastOrder.shopId === seed.id) {
    return (
      <div className="flex flex-col items-center p-6 pt-10 text-center">
        <span className="animate-rise flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Order {lastOrder.id} saved</h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
          {seed.name} · {formatINR(lastOrder.pricing.totalPaise)} incl. GST
        </p>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {state.online ? "Will sync on your next sync." : "You're offline. It's safe on this phone and will sync later."}
        </p>
        <Card className="mt-5 w-full text-left text-xs">
          <Row label="Units" value={`${lastOrder.pricing.units}${lastOrder.pricing.freeUnits ? ` + ${lastOrder.pricing.freeUnits} free` : ""}`} />
          <Row label="Scheme discount" value={lastOrder.pricing.discountPaise ? `− ${formatINR(lastOrder.pricing.discountPaise)}` : "None"} />
          <Row label="Counts toward target" value={formatINR(lastOrder.pricing.taxablePaise)} strong />
        </Card>
        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <GhostButton onClick={() => dispatch({ type: "tab", tab: "collect" })}>Collect payment</GhostButton>
          <PrimaryButton
            onClick={() => {
              dispatch({ type: "checkOut", shopId: seed.id, at: clockNow() });
              dispatch({ type: "dismissOrder" });
              dispatch({ type: "tab", tab: "today" });
            }}
          >
            End visit
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const products = PRODUCTS.filter((p) => (cat === "All" || p.category === cat) && (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)));
  const canOrder = shop.status === "in_visit";

  return (
    <div className="flex min-h-full flex-col">
      <div className="space-y-2.5 p-4 pb-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="truncate text-base font-semibold tracking-tight">Order · {seed.name}</h2>
        </div>
        {!canOrder ? (
          <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
            <span className="flex-1">Check in at {seed.name} to place an order. You can still browse prices.</span>
            <button
              type="button"
              onClick={() => dispatch({ type: "checkIn", shopId: seed.id, at: clockNow() })}
              className="shrink-0 rounded-lg bg-violet-600 px-2.5 py-1.5 font-semibold text-white hover:bg-violet-700"
            >
              Check in
            </button>
          </div>
        ) : null}
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <input
            id="product-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chargers, cables…"
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-violet-500 dark:border-stone-700 dark:bg-stone-900"
          />
        </div>
        <div className="scroll-thin -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                cat === c ? "bg-violet-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="font-semibold">Schemes</span> · Cables 10+1 free · Earbuds 5+1 free · 3% off over ₹10k, 5% over ₹25k
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pb-28">
        {products.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-sm text-stone-500">No products match &ldquo;{query}&rdquo;.</p>
        ) : null}
        {products.map((p) => (
          <ProductCard key={p.id} product={p} qty={state.cart[p.id] ?? 0} onQty={(qty) => dispatch({ type: "qty", productId: p.id, qty })} />
        ))}
      </div>

      {pricing.lines.length > 0 ? (
        <div className="sticky bottom-0 mt-auto border-t border-stone-200 bg-white/95 p-3 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
          {pricing.nextSlab ? (
            <p className="mb-2 text-center text-[11px] text-violet-700 dark:text-violet-300">
              Add {formatINR(pricing.nextSlab.shortByPaise)} more to unlock {pricing.nextSlab.slab.bps / 100}% off
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setReviewing(true)}
            className="flex w-full items-center justify-between rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            <span>{pricing.units} units · {formatINR(pricing.totalPaise)}</span>
            <span className="flex items-center gap-1">Review <Icon name="chevron" className="h-4 w-4" /></span>
          </button>
        </div>
      ) : null}

      {reviewing && pricing.lines.length > 0 ? (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-stone-950/40" onClick={() => setReviewing(false)}>
          <div
            role="dialog"
            aria-label="Order summary"
            className="animate-rise max-h-[90%] overflow-y-auto rounded-t-3xl bg-white p-4 dark:bg-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-700" />
            <h3 className="text-base font-semibold">Order summary</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">{seed.name}</p>
            <ul className="mt-3 divide-y divide-stone-100 text-sm dark:divide-stone-800">
              {pricing.lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="font-semibold tabular-nums">{l.qty}×</span> {PRODUCTS_BY_ID[l.id].name}
                    {l.freeQty ? <span className="mt-0.5 block text-xs font-medium text-emerald-700 dark:text-emerald-400">+ {l.freeQty} free · {l.schemeLabel}</span> : null}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatINR(l.grossPaise)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1 border-t border-stone-200 pt-2 text-xs dark:border-stone-800">
              <Row label="Subtotal" value={formatINR(pricing.subtotalPaise)} />
              <Row
                label={pricing.slab ? `Scheme: ${pricing.slab.bps / 100}% slab discount` : "Slab discount"}
                value={pricing.discountPaise ? `− ${formatINR(pricing.discountPaise)}` : "—"}
                tone={pricing.discountPaise ? "good" : undefined}
              />
              <Row label="GST 18%" value={formatINR(pricing.gstPaise)} />
              <Row label="Total" value={formatINR(pricing.totalPaise)} strong />
            </div>
            {pricing.nextSlab ? (
              <p className="mt-2 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs text-violet-800 dark:bg-violet-950/60 dark:text-violet-200">
                {formatINR(pricing.nextSlab.shortByPaise)} more gets {seed.owner.split(" ")[0]} {pricing.nextSlab.slab.bps / 100}% off the whole order.
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <GhostButton onClick={() => setReviewing(false)}>Edit</GhostButton>
              <PrimaryButton
                disabled={!canOrder}
                onClick={() => {
                  dispatch({ type: "placeOrder", at: clockNow() });
                  setReviewing(false);
                }}
              >
                Place order
              </PrimaryButton>
            </div>
            {!canOrder ? <p className="mt-2 text-center text-xs text-stone-500">Check in first to place the order.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProductCard({ product: p, qty, onQty }: { product: Product; qty: number; onQty: (q: number) => void }) {
  const scheme = SCHEMES.find((s) => s.productIds.includes(p.id));
  return (
    <div className={`flex flex-col rounded-2xl border bg-white p-2 transition-colors dark:bg-stone-900 ${qty ? "border-violet-500" : "border-stone-200 dark:border-stone-800"}`}>
      <div className="flex h-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-stone-100 text-sm font-bold tracking-tight text-violet-700 dark:from-violet-950 dark:to-stone-800 dark:text-violet-300">
        {p.mark}
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.25rem] text-xs font-medium leading-tight">{p.name}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">
        {formatINR(p.dealerPaise)} <span className="text-[11px] font-normal text-stone-400 line-through">{formatINR(p.mrpPaise)}</span>
      </p>
      <p className="h-4 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">{scheme ? scheme.label : ""}</p>
      <div className="mt-1.5 flex items-center justify-between rounded-xl bg-stone-100 p-0.5 dark:bg-stone-800">
        <button type="button" aria-label={`Remove one ${p.name}`} disabled={qty === 0} onClick={() => onQty(qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-700 hover:bg-white disabled:opacity-30 dark:text-stone-200 dark:hover:bg-stone-700">
          <Icon name="minus" className="h-4 w-4" />
        </button>
        <label className="sr-only" htmlFor={`qty-${p.id}`}>Quantity of {p.name}</label>
        <input
          id={`qty-${p.id}`}
          inputMode="numeric"
          value={qty}
          onChange={(e) => onQty(Number(e.target.value.replace(/\D/g, "")) || 0)}
          className="w-10 bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
        />
        <button type="button" aria-label={`Add one ${p.name}`} onClick={() => onQty(qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700">
          <Icon name="plus" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "good" }) {
  return (
    <div className={`flex justify-between gap-2 py-0.5 ${strong ? "text-sm font-semibold" : ""}`}>
      <span className={strong ? "" : "text-stone-500 dark:text-stone-400"}>{label}</span>
      <span className={`tabular-nums ${tone === "good" ? "text-emerald-700 dark:text-emerald-400" : ""}`}>{value}</span>
    </div>
  );
}
