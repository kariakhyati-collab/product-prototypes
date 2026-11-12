/**
 * The conversation engine for the order-bot prototype: a reducer that turns
 * retailer messages and ops-console actions into chat replies and orders.
 * Parsing and cart maths live in lib/; this file is the script around them.
 */

import { applyLines, creditCheck, priceCart, reserveStock, type Cart, type CartIssue, type CreditCheck, type PricedCart, type Stock } from "@/lib/order-cart";
import { detectIntent, parseOrder, suggestItem, type Intent } from "@/lib/order-parser";
import { CATALOG, CATALOG_BY_ID, INITIAL_STOCK } from "@/lib/sundar-catalog";
import { formatINR } from "@/lib/money";

export const RETAILER = {
  name: "Shree Ganesh Kirana",
  owner: "Ramesh Patil",
  area: "Kothrud",
  creditLimitPaise: 1_500_000,
  creditUsedPaise: 420_000,
};

export const LAST_ORDER: Cart = { "PRL-G70": 8, "NES-MG12": 4, "TAT-TEA250": 6, "SRF-EW1": 5, "VIM-BAR3": 10 };

export const STATUSES = ["New", "Confirmed", "Packed", "Out for delivery"] as const;
export type OrderStatus = (typeof STATUSES)[number];

export interface Order {
  id: string;
  retailer: string;
  area: string;
  placedAt: string;
  slot: string;
  status: OrderStatus;
  priced: PricedCart;
  fromChat: boolean;
  /** Seconds from first message to confirmed order, for the demo order. */
  secondsToOrder?: number;
}

export type ChipAction =
  | { kind: "say"; text: string }
  | { kind: "swap" }
  | { kind: "skip" }
  | { kind: "confirm" }
  | { kind: "more" }
  | { kind: "cancel" }
  | { kind: "slot"; slot: string }
  | { kind: "track" }
  | { kind: "new" }
  | { kind: "reorder" }
  | { kind: "catalogue" };

export interface Chip {
  label: string;
  action: ChipAction;
  primary?: boolean;
}

export type Msg =
  | { id: number; from: "user"; text: string }
  | { id: number; from: "bot"; kind: "text"; text: string; tone?: "warn" | "success" }
  | { id: number; from: "bot"; kind: "added"; lines: Array<{ name: string; qty: number; unit: string }>; issues: IssueView[] }
  | { id: number; from: "bot"; kind: "summary"; priced: PricedCart; credit: CreditCheck }
  | { id: number; from: "bot"; kind: "placed"; orderId: string; slot: string; totalPaise: number; seconds: number }
  | { id: number; from: "bot"; kind: "catalogue" };

export interface IssueView {
  tone: "warn" | "info";
  text: string;
}

type Stage = "idle" | "resolving" | "review" | "slot" | "placed";

export interface State {
  epoch: number;
  seq: number;
  stage: Stage;
  messages: Msg[];
  cart: Cart;
  pending: { oosId: string; qty: number; subId?: string } | null;
  stock: Stock;
  orders: Order[];
  nextOrderNo: number;
  startedAt: number | null;
  typing: boolean;
  demoOrderId: string | null;
  flashOrderId: string | null;
  flashSkus: string[];
  unseenOps: number;
  unseenChat: number;
}

const SEED_ORDERS: Order[] = [
  seedOrder("SD-2040", "New Balaji Kirana", "Erandwane", "09:05", "Today 4–6 pm", "New", { "ASH-ATA5": 6, "FOR-SUN1": 10, "TAT-TEA250": 4, "HLD-AB200": 12 }),
  seedOrder("SD-2039", "Om Sai Provision", "Warje", "08:40", "Today 4–6 pm", "Confirmed", { "PRL-G70": 6, "BRT-GDC": 3, "SRF-EW1": 4 }),
  seedOrder("SD-2038", "Laxmi General Stores", "Karve Nagar", "08:12", "Today 11 am–1 pm", "Packed", { "NES-MG12": 6, "LUX-SG4": 5, "CLG-ST200": 6, "KRK-MM12": 2, "DTL-OR3": 2 }),
  seedOrder("SD-2037", "Patil Super Mart", "Kothrud Depot", "07:55", "Today 9–11 am", "Out for delivery", { "FRT-125": 3, "BRB-RL250": 6, "VIM-BAR3": 12 }),
];

function seedOrder(id: string, retailer: string, area: string, placedAt: string, slot: string, status: OrderStatus, cart: Cart): Order {
  return { id, retailer, area, placedAt, slot, status, priced: priceCart(cart, CATALOG_BY_ID), fromChat: true };
}

export function initialState(epoch = 0): State {
  return {
    epoch,
    seq: 2,
    stage: "idle",
    messages: [
      {
        id: 1,
        from: "bot",
        kind: "text",
        text: `Namaste ${RETAILER.owner.split(" ")[0]} ji! This is Sundar Distributors' order line. Type your order the way you'd tell our salesman, for example "10 Parle-G, 5 Maggi". Hindi or English both work.`,
      },
    ],
    cart: {},
    pending: null,
    stock: { ...INITIAL_STOCK },
    orders: SEED_ORDERS,
    nextOrderNo: 2041,
    startedAt: null,
    typing: false,
    demoOrderId: null,
    flashOrderId: null,
    flashSkus: [],
    unseenOps: 0,
    unseenChat: 0,
  };
}

export const SLOTS = ["Tomorrow 8–10 am", "Tomorrow 4–6 pm", "Saturday 8–10 am"];

export function chipsFor(state: State): Chip[] {
  switch (state.stage) {
    case "idle":
      return [
        { label: "Need 10 Parle-G, 5 Maggi 12-pack, 3 Tata Salt", action: { kind: "say", text: "Need 10 Parle-G, 5 Maggi 12-pack, 3 Tata Salt" }, primary: true },
        { label: "10 Maggi bhej do", action: { kind: "say", text: "10 Maggi bhej do" } },
        { label: "Repeat last week's order", action: { kind: "reorder" } },
        { label: "Price list", action: { kind: "catalogue" } },
      ];
    case "resolving": {
      const p = state.pending;
      if (!p) return [];
      const oos = CATALOG_BY_ID[p.oosId];
      const sub = p.subId ? CATALOG_BY_ID[p.subId] : null;
      return [
        ...(sub ? [{ label: `Yes, send ${shortName(sub.name)}`, action: { kind: "swap" } as ChipAction, primary: true }] : []),
        { label: `Skip ${shortName(oos.name)}`, action: { kind: "skip" } },
      ];
    }
    case "review": {
      const priced = priceCart(state.cart, CATALOG_BY_ID);
      const credit = creditCheck(RETAILER.creditLimitPaise, RETAILER.creditUsedPaise, priced.totalPaise);
      return [
        ...(credit.ok ? [{ label: "Confirm order", action: { kind: "confirm" } as ChipAction, primary: true }] : []),
        { label: "Add more items", action: { kind: "more" } },
        { label: "Cancel", action: { kind: "cancel" } },
      ];
    }
    case "slot":
      return SLOTS.map((s, i) => ({ label: s, action: { kind: "slot", slot: s }, primary: i === 0 }));
    case "placed":
      return [
        { label: "Where is my order?", action: { kind: "track" }, primary: true },
        { label: "Start a new order", action: { kind: "new" } },
      ];
  }
}

export function shortName(name: string): string {
  return name.replace(/\s\d.*$/, "");
}

export type Action =
  | { type: "user"; text: string; now: number }
  | { type: "bot"; epoch: number; input: { kind: "text"; text: string } | ChipAction; now: number; clock: string }
  | { type: "advance"; orderId: string }
  | { type: "seenOps" }
  | { type: "seenChat" }
  | { type: "clearFlash" }
  | { type: "reset" };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return initialState(state.epoch + 1);
    case "seenOps":
      return state.unseenOps ? { ...state, unseenOps: 0 } : state;
    case "seenChat":
      return state.unseenChat ? { ...state, unseenChat: 0 } : state;
    case "clearFlash":
      return { ...state, flashOrderId: null, flashSkus: [] };
    case "user": {
      const msg: Msg = { id: state.seq, from: "user", text: action.text };
      return {
        ...state,
        seq: state.seq + 1,
        messages: [...state.messages, msg],
        typing: true,
        startedAt: state.startedAt ?? action.now,
      };
    }
    case "advance":
      return advanceOrder(state, action.orderId);
    case "bot":
      if (action.epoch !== state.epoch) return state;
      return { ...botTurn(state, action.input, action.now, action.clock), typing: false };
  }
}

function advanceOrder(state: State, orderId: string): State {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return state;
  const idx = STATUSES.indexOf(order.status);
  if (idx >= STATUSES.length - 1) return state;
  const status = STATUSES[idx + 1];
  const orders = state.orders.map((o) => (o.id === orderId ? { ...o, status } : o));
  if (orderId !== state.demoOrderId) return { ...state, orders };

  const text: Record<OrderStatus, string> = {
    New: "",
    Confirmed: `Update on ${orderId}: confirmed by the Sundar order desk. We'll pack it this evening.`,
    Packed: `Update on ${orderId}: packed and loaded for your slot (${order.slot}). Driver: Santosh, Kothrud route 2.`,
    "Out for delivery": `Update on ${orderId}: out for delivery now. Please keep ${formatINR(order.priced.totalPaise)} ready or it goes on your credit.`,
  };
  return {
    ...state,
    orders,
    seq: state.seq + 1,
    unseenChat: state.unseenChat + 1,
    messages: [...state.messages, { id: state.seq, from: "bot", kind: "text", text: text[status], tone: "success" }],
  };
}

/** Builds the bot's reply. Returns the next state with any new bot messages appended. */
function botTurn(state: State, input: { kind: "text"; text: string } | ChipAction, now: number, clock: string): State {
  const out: Msg[] = [];
  let seq = state.seq;
  const say = (text: string, tone?: "warn" | "success") => out.push({ id: seq++, from: "bot", kind: "text", text, tone });
  let next: State = { ...state };

  const showSummary = () => {
    const priced = priceCart(next.cart, CATALOG_BY_ID);
    if (priced.lines.length === 0) {
      next.stage = "idle";
      say("Your order is empty right now. Send me the items you need.");
      return;
    }
    const credit = creditCheck(RETAILER.creditLimitPaise, RETAILER.creditUsedPaise, priced.totalPaise);
    out.push({ id: seq++, from: "bot", kind: "summary", priced, credit });
    if (!credit.ok) {
      say(`This order is ${formatINR(credit.overByPaise)} over your credit limit. Remove a few items, or pay old dues to our salesman and I'll release it.`, "warn");
    }
    next.stage = "review";
  };

  const handleOrderText = (text: string) => {
    next.pending = null;
    const parsed = parseOrder(text, CATALOG);
    const result = applyLines(next.cart, parsed.lines, CATALOG_BY_ID, next.stock);
    next.cart = result.cart;

    const added = result.added.map((id) => ({ name: CATALOG_BY_ID[id].name, qty: parsed.lines.find((l) => l.id === id)!.qty, unit: CATALOG_BY_ID[id].unit }));
    const issues = result.issues.filter((i) => i.kind !== "out_of_stock").map(issueView);
    for (const id of parsed.lines.filter((l) => l.qtyAssumed).map((l) => l.id)) {
      if (result.added.includes(id)) issues.push({ tone: "info", text: `No quantity for ${shortName(CATALOG_BY_ID[id].name)}, so I put 1 ${CATALOG_BY_ID[id].unit.toLowerCase()}. Tell me if you want more.` });
    }
    for (const phrase of parsed.unmatched) {
      const s = suggestItem(phrase, CATALOG);
      issues.push({ tone: "warn", text: s ? `I couldn't find "${phrase}". Did you mean ${s.name}? Send it again with the right name.` : `I couldn't find "${phrase}" in our list.` });
    }
    if (added.length || issues.length) out.push({ id: seq++, from: "bot", kind: "added", lines: added, issues });

    const oos = result.issues.find((i): i is Extract<CartIssue, { kind: "out_of_stock" }> => i.kind === "out_of_stock");
    if (oos) {
      const item = CATALOG_BY_ID[oos.id];
      const sub = oos.substituteId ? CATALOG_BY_ID[oos.substituteId] : null;
      if (sub) {
        const diff = item.pricePaise - sub.pricePaise;
        say(`${item.name} is out of stock until Friday. Can I send ${sub.name} instead? Same ${sub.unit.toLowerCase()}, ${formatINR(sub.pricePaise)}${diff > 0 ? ` (${formatINR(diff)} less)` : ""}.`, "warn");
        next.pending = { oosId: oos.id, qty: oos.qty, subId: sub.id };
        next.stage = "resolving";
        return;
      }
      say(`${item.name} is out of stock until Friday, so I've left it out.`, "warn");
    }
    showSummary();
  };

  const kind: Resolved = input.kind === "text" ? textToAction(input.text, state) : input;

  switch (kind.kind) {
    case "say":
      handleOrderText(kind.text);
      break;
    case "swap": {
      const p = next.pending;
      next.pending = null;
      if (p?.subId) {
        const r = applyLines(next.cart, [{ id: p.subId, qty: p.qty, qtyAssumed: false }], CATALOG_BY_ID, next.stock);
        next.cart = r.cart;
        say(`Done, added ${p.qty} × ${CATALOG_BY_ID[p.subId].name}.`);
      }
      showSummary();
      break;
    }
    case "skip": {
      const p = next.pending;
      next.pending = null;
      if (p) say(`OK, leaving out ${shortName(CATALOG_BY_ID[p.oosId].name)}. I'll message you when it's back.`);
      showSummary();
      break;
    }
    case "confirm": {
      if (state.stage !== "review") {
        say(state.stage === "resolving" ? "Please choose an option for the out-of-stock item first." : "There's nothing to confirm yet. Send me your items.");
        break;
      }
      const credit = creditCheck(RETAILER.creditLimitPaise, RETAILER.creditUsedPaise, priceCart(next.cart, CATALOG_BY_ID).totalPaise);
      if (!credit.ok) {
        say("I can't confirm while the order is over your credit limit.", "warn");
        break;
      }
      next.stage = "slot";
      say("Great. When should we deliver? Our Kothrud van has these slots:");
      break;
    }
    case "more":
      say("Sure, send the extra items and I'll add them to this order.");
      break;
    case "cancel":
      next.cart = {};
      next.pending = null;
      next.stage = "idle";
      next.startedAt = null;
      say("Order cancelled. Nothing was booked. Message me whenever you're ready.");
      break;
    case "slot": {
      if (state.stage !== "slot") {
        say("Let's finish the order first, then pick a slot.");
        break;
      }
      const priced = priceCart(next.cart, CATALOG_BY_ID);
      const id = `SD-${next.nextOrderNo}`;
      const seconds = Math.max(1, Math.round((now - (state.startedAt ?? now)) / 1000));
      const order: Order = { id, retailer: RETAILER.name, area: RETAILER.area, placedAt: clock, slot: kind.slot, status: "New", priced, fromChat: true, secondsToOrder: seconds };
      next = {
        ...next,
        orders: [order, ...next.orders],
        stock: reserveStock(next.stock, next.cart),
        flashSkus: Object.keys(next.cart),
        flashOrderId: id,
        demoOrderId: id,
        nextOrderNo: next.nextOrderNo + 1,
        cart: {},
        stage: "placed",
        startedAt: null,
        unseenOps: next.unseenOps + 1,
      };
      out.push({ id: seq++, from: "bot", kind: "placed", orderId: id, slot: kind.slot, totalPaise: priced.totalPaise, seconds });
      break;
    }
    case "track": {
      const order = state.orders.find((o) => o.id === state.demoOrderId);
      if (!order) say("You don't have an open order right now.");
      else say(`${order.id} is "${order.status}". Delivery slot: ${order.slot}. I'll message you at every step.`);
      break;
    }
    case "new":
      next.stage = "idle";
      say("Sure, what do you need this time?");
      break;
    case "reorder": {
      const lines = Object.entries(LAST_ORDER).map(([id, qty]) => ({ id, qty, qtyAssumed: false }));
      const r = applyLines(next.cart, lines, CATALOG_BY_ID, next.stock);
      next.cart = r.cart;
      say("Here's last Tuesday's order again. Change anything by sending new quantities.");
      showSummary();
      break;
    }
    case "catalogue":
      out.push({ id: seq++, from: "bot", kind: "catalogue" });
      break;
    case "fallback":
      if (kind.intent === "greeting") {
        say(`Namaste! What would you like to order today? You can also tap "Repeat last week's order".`);
      } else if (kind.intent === "help") {
        say(`Just type items with quantities, like "12 Good Day, 2 Surf Excel" or "das Parle-G bhej do". I'll check stock, show the total and book a delivery slot.`);
      } else {
        const s = suggestItem(kind.text, CATALOG);
        say(
          s
            ? `Sorry, I didn't catch that. Did you mean ${s.name}? Try "5 ${shortName(s.name)}".`
            : `Sorry, I didn't catch that. Try something like "10 Parle-G, 5 Maggi", or tap an option below.`,
        );
      }
      break;
  }

  return { ...next, seq, messages: [...state.messages, ...out] };
}

type Resolved = ChipAction | { kind: "fallback"; intent: Intent; text: string };

/** Maps free text to the same actions the chips use, with a friendly fallback. */
function textToAction(text: string, state: State): Resolved {
  const intent = detectIntent(text, CATALOG);
  switch (intent) {
    case "order":
      return { kind: "say", text };
    case "reorder":
      return { kind: "reorder" };
    case "confirm":
      if (state.stage === "resolving") return { kind: "swap" };
      if (state.stage === "slot") return { kind: "slot", slot: SLOTS[0] };
      return { kind: "confirm" };
    case "cancel":
      return state.stage === "resolving" ? { kind: "skip" } : { kind: "cancel" };
    case "track":
      return { kind: "track" };
    case "catalogue":
      return { kind: "catalogue" };
    default:
      return { kind: "fallback", intent, text };
  }
}

function issueView(issue: CartIssue): IssueView {
  const item = CATALOG_BY_ID[issue.id];
  switch (issue.kind) {
    case "raised_to_moq":
      return { tone: "info", text: `${shortName(item.name)} has a minimum of ${issue.moq}, so I've made it ${issue.moq}.` };
    case "short_stock":
      return { tone: "warn", text: `Only ${issue.available} of ${shortName(item.name)} in stock, so I've added ${issue.available}.` };
    case "out_of_stock":
      return { tone: "warn", text: `${item.name} is out of stock.` };
  }
}
