"use client";

import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import {
  allocateCollection, applyAllocations, priceOrder, type Allocation, type Invoice, type OrderPricing, type PaymentMode,
} from "@/lib/field-sales";
import { PRODUCTS_BY_ID, SCHEMES, SHOPS, SLABS } from "@/lib/voltline-data";

export type Tab = "today" | "shop" | "order" | "collect" | "sync";
export type ShopStatus = "planned" | "in_visit" | "visited";

export interface ShopState {
  status: ShopStatus;
  checkInAt?: string;
  checkOutAt?: string;
  invoices: Invoice[];
  orderedPaise: number;
  collectedPaise: number;
  notes: string;
}

export interface QueueItem {
  id: string;
  kind: "check_in" | "check_out" | "order" | "collection" | "note";
  shopId: string;
  label: string;
  amountPaise?: number;
  at: string;
  syncedAt?: string;
}

export interface PlacedOrder {
  id: string;
  shopId: string;
  at: string;
  pricing: OrderPricing;
}

export interface Receipt {
  id: string;
  shopId: string;
  at: string;
  mode: PaymentMode;
  ref: string;
  amountPaise: number;
  allocations: Allocation[];
  outstandingAfterPaise: number;
}

export interface FSState {
  v: 1;
  shops: Record<string, ShopState>;
  selectedShopId: string;
  tab: Tab;
  cart: Record<string, number>;
  online: boolean;
  queue: QueueItem[];
  orders: PlacedOrder[];
  receipts: Receipt[];
  lastOrderId: string | null;
  lastReceiptId: string | null;
  lastSyncAt: string;
  seq: number;
}

export function initialFSState(): FSState {
  const shops: Record<string, ShopState> = {};
  for (const s of SHOPS) {
    shops[s.id] = { status: "planned", invoices: s.invoices, orderedPaise: 0, collectedPaise: 0, notes: s.notes };
  }
  shops.s1 = { ...shops.s1, status: "visited", checkInAt: "09:48", checkOutAt: "10:21", orderedPaise: 985000 };
  return {
    v: 1,
    shops,
    selectedShopId: "s2",
    tab: "today",
    cart: {},
    online: true,
    queue: [
      { id: "q-1", kind: "check_in", shopId: "s1", label: "Checked in at Sri Lakshmi Mobiles", at: "09:48", syncedAt: "09:48" },
      { id: "q-2", kind: "order", shopId: "s1", label: "Order VL-0411 · Sri Lakshmi Mobiles", amountPaise: 1162300, at: "10:19", syncedAt: "10:22" },
    ],
    orders: [],
    receipts: [],
    lastOrderId: null,
    lastReceiptId: null,
    lastSyncAt: "10:22",
    seq: 3,
  };
}

export type FSAction =
  | { type: "hydrate"; state: FSState }
  | { type: "reset" }
  | { type: "tab"; tab: Tab }
  | { type: "select"; shopId: string; tab?: Tab }
  | { type: "checkIn"; shopId: string; at: string }
  | { type: "checkOut"; shopId: string; at: string }
  | { type: "qty"; productId: string; qty: number }
  | { type: "clearCart" }
  | { type: "placeOrder"; at: string }
  | { type: "collect"; shopId: string; mode: PaymentMode; amountPaise: number; ref: string; at: string }
  | { type: "note"; shopId: string; text: string; at: string }
  | { type: "online"; online: boolean }
  | { type: "synced"; id: string; at: string }
  | { type: "dismissOrder" }
  | { type: "dismissReceipt" };

const shopName = (id: string) => SHOPS.find((s) => s.id === id)?.name ?? id;

function enqueue(state: FSState, item: Omit<QueueItem, "id">): Pick<FSState, "queue" | "seq"> {
  return { queue: [...state.queue, { ...item, id: `q-${state.seq}` }], seq: state.seq + 1 };
}

export function fsReducer(state: FSState, action: FSAction): FSState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "reset":
      return initialFSState();
    case "tab":
      return { ...state, tab: action.tab };
    case "select":
      return {
        ...state,
        selectedShopId: action.shopId,
        tab: action.tab ?? state.tab,
        cart: action.shopId === state.selectedShopId ? state.cart : {},
        lastOrderId: null,
        lastReceiptId: null,
      };
    case "checkIn": {
      const shop = state.shops[action.shopId];
      if (!shop || shop.status === "in_visit") return state;
      // Only one open visit at a time: close any other.
      const shops = Object.fromEntries(
        Object.entries(state.shops).map(([id, s]) => [id, s.status === "in_visit" ? { ...s, status: "visited" as const, checkOutAt: action.at } : s]),
      );
      shops[action.shopId] = { ...shop, status: "in_visit", checkInAt: action.at, checkOutAt: undefined };
      return { ...state, shops, ...enqueue(state, { kind: "check_in", shopId: action.shopId, label: `Checked in at ${shopName(action.shopId)}`, at: action.at }) };
    }
    case "checkOut": {
      const shop = state.shops[action.shopId];
      if (!shop || shop.status !== "in_visit") return state;
      return {
        ...state,
        shops: { ...state.shops, [action.shopId]: { ...shop, status: "visited", checkOutAt: action.at } },
        ...enqueue(state, { kind: "check_out", shopId: action.shopId, label: `Visit ended at ${shopName(action.shopId)}`, at: action.at }),
      };
    }
    case "qty": {
      const cart = { ...state.cart };
      const qty = Math.max(0, Math.min(999, Math.floor(action.qty)));
      if (qty === 0) delete cart[action.productId];
      else cart[action.productId] = qty;
      return { ...state, cart };
    }
    case "clearCart":
      return { ...state, cart: {} };
    case "placeOrder": {
      const shopId = state.selectedShopId;
      const shop = state.shops[shopId];
      const pricing = priceOrder(state.cart, PRODUCTS_BY_ID, SCHEMES, SLABS);
      if (!shop || shop.status !== "in_visit" || pricing.lines.length === 0) return state;
      const id = `VL-${String(412 + state.orders.length).padStart(4, "0")}`;
      const queued = enqueue(state, { kind: "order", shopId, label: `Order ${id} · ${shopName(shopId)}`, amountPaise: pricing.totalPaise, at: action.at });
      const invoice: Invoice = { id: `INV-${2400 + state.orders.length}`, date: "Today", amountPaise: pricing.totalPaise, paidPaise: 0, daysOld: 0 };
      return {
        ...state,
        ...queued,
        cart: {},
        orders: [...state.orders, { id, shopId, at: action.at, pricing }],
        lastOrderId: id,
        shops: {
          ...state.shops,
          [shopId]: { ...shop, orderedPaise: shop.orderedPaise + pricing.taxablePaise, invoices: [...shop.invoices, invoice] },
        },
      };
    }
    case "collect": {
      const shop = state.shops[action.shopId];
      if (!shop || action.amountPaise <= 0) return state;
      const result = allocateCollection(shop.invoices, action.amountPaise);
      const id = `RC-${1872 + state.receipts.length}`;
      const receipt: Receipt = {
        id, shopId: action.shopId, at: action.at, mode: action.mode, ref: action.ref, amountPaise: action.amountPaise,
        allocations: result.allocations, outstandingAfterPaise: result.outstandingAfterPaise,
      };
      return {
        ...state,
        ...enqueue(state, { kind: "collection", shopId: action.shopId, label: `Receipt ${id} · ${shopName(action.shopId)}`, amountPaise: action.amountPaise, at: action.at }),
        receipts: [...state.receipts, receipt],
        lastReceiptId: id,
        shops: {
          ...state.shops,
          [action.shopId]: { ...shop, invoices: applyAllocations(shop.invoices, result.allocations), collectedPaise: shop.collectedPaise + action.amountPaise },
        },
      };
    }
    case "note": {
      const shop = state.shops[action.shopId];
      if (!shop) return state;
      return {
        ...state,
        shops: { ...state.shops, [action.shopId]: { ...shop, notes: action.text } },
        ...enqueue(state, { kind: "note", shopId: action.shopId, label: `Note updated · ${shopName(action.shopId)}`, at: action.at }),
      };
    }
    case "online":
      return { ...state, online: action.online };
    case "synced":
      return {
        ...state,
        lastSyncAt: action.at,
        queue: state.queue.map((q) => (q.id === action.id ? { ...q, syncedAt: action.at } : q)),
      };
    case "dismissOrder":
      return { ...state, lastOrderId: null };
    case "dismissReceipt":
      return { ...state, lastReceiptId: null };
  }
}

const STORAGE_KEY = "voltline-field-sales:v1";

function load(): FSState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FSState;
    return parsed && parsed.v === 1 && parsed.shops && parsed.queue ? parsed : null;
  } catch {
    return null;
  }
}

function save(state: FSState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage full: the demo still works, it just won't survive a reload.
  }
}

export function clearSaved() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const Ctx = createContext<{ state: FSState; dispatch: Dispatch<FSAction> } | null>(null);

export function FieldSalesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(fsReducer, undefined, initialFSState);
  const hydrated = useRef(false);

  useEffect(() => {
    const saved = load();
    if (saved) dispatch({ type: "hydrate", state: saved });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) save(state);
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useFieldSales() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFieldSales must be used inside FieldSalesProvider");
  return ctx;
}

export function clockNow(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
