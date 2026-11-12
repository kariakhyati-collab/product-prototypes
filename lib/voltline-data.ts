/**
 * Fictional sample data for "Voltline", a mobile-accessories brand, and its
 * rep Arjun's beat in Bengaluru. All names, numbers and shops are invented.
 */

import type { FreeGoodsScheme, Invoice, Product, Slab } from "./field-sales";

export const PRODUCTS: Product[] = [
  { id: "VL-C20", name: "20W USB-C PD charger", category: "Chargers", dealerPaise: 39900, mrpPaise: 79900, mark: "20W" },
  { id: "VL-C33", name: "33W dual-port charger", category: "Chargers", dealerPaise: 54900, mrpPaise: 119900, mark: "33W" },
  { id: "VL-C65", name: "65W GaN charger", category: "Chargers", dealerPaise: 129900, mrpPaise: 249900, mark: "65W" },
  { id: "VL-CC", name: "Dual car charger 30W", category: "Chargers", dealerPaise: 29900, mrpPaise: 69900, mark: "CAR" },
  { id: "VL-CB1", name: "Braided USB-C cable 1m", category: "Cables", dealerPaise: 14900, mrpPaise: 39900, mark: "C1" },
  { id: "VL-CB2", name: "Braided USB-C cable 2m", category: "Cables", dealerPaise: 18900, mrpPaise: 49900, mark: "C2" },
  { id: "VL-LT1", name: "USB-C to Lightning 1m", category: "Cables", dealerPaise: 24900, mrpPaise: 69900, mark: "LT" },
  { id: "VL-PB10", name: "Power bank 10,000 mAh", category: "Power banks", dealerPaise: 74900, mrpPaise: 149900, mark: "10K" },
  { id: "VL-PB20", name: "Power bank 20,000 mAh", category: "Power banks", dealerPaise: 109900, mrpPaise: 219900, mark: "20K" },
  { id: "VL-TWS", name: "Airbeat wireless earbuds", category: "Audio", dealerPaise: 89900, mrpPaise: 199900, mark: "TWS" },
  { id: "VL-NB", name: "Flexband neckband", category: "Audio", dealerPaise: 54900, mrpPaise: 129900, mark: "NB" },
  { id: "VL-TG", name: "Tempered glass, pack of 10", category: "Protection", dealerPaise: 35000, mrpPaise: 150000, mark: "TG" },
];

export const PRODUCTS_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const SCHEMES: FreeGoodsScheme[] = [
  { id: "cables-10-1", label: "Buy 10 get 1 free", productIds: ["VL-CB1", "VL-CB2", "VL-LT1"], buy: 10, free: 1 },
  { id: "audio-5-1", label: "Buy 5 get 1 free", productIds: ["VL-TWS"], buy: 5, free: 1 },
];

export const SLABS: Slab[] = [
  { minPaise: 1_000_000, bps: 300, label: "3% off on orders above ₹10,000" },
  { minPaise: 2_500_000, bps: 500, label: "5% off on orders above ₹25,000" },
];

export const DAY_TARGET_PAISE = 6_000_000;

export interface ShopSeed {
  id: string;
  name: string;
  owner: string;
  area: string;
  phone: string;
  distance: string;
  creditDays: number;
  lastOrder: { date: string; amountPaise: number; summary: string };
  invoices: Invoice[];
  notes: string;
  /** Position on the route sketch, in a 320 x 170 box. */
  x: number;
  y: number;
}

export const SHOPS: ShopSeed[] = [
  {
    id: "s1", name: "Sri Lakshmi Mobiles", owner: "Venkatesh R.", area: "5th Block, Koramangala", phone: "+91 90000 11201",
    distance: "Start", creditDays: 30,
    lastOrder: { date: "Today, 10:05", amountPaise: 985000, summary: "12 chargers, 20 cables, 4 power banks" },
    invoices: [{ id: "INV-2318", date: "28 Oct", amountPaise: 412000, paidPaise: 412000, daysOld: 15 }],
    notes: "Pays on time. Wants POS standee for the 65W GaN launch.",
    x: 34, y: 128,
  },
  {
    id: "s2", name: "Gadget Point", owner: "Imran Pasha", area: "6th Block, Koramangala", phone: "+91 90000 11202",
    distance: "1.4 km · 7 min", creditDays: 30,
    lastOrder: { date: "31 Oct", amountPaise: 1432000, summary: "10 earbuds, 15 cables, 6 chargers" },
    invoices: [
      { id: "INV-2291", date: "5 Oct", amountPaise: 640000, paidPaise: 0, daysOld: 38 },
      { id: "INV-2340", date: "31 Oct", amountPaise: 1432000, paidPaise: 400000, daysOld: 12 },
    ],
    notes: "Asks for 65W GaN every visit. Prefers UPI. Shop closed 1:30–3:30 pm.",
    x: 92, y: 74,
  },
  {
    id: "s3", name: "Mobile Mantra", owner: "Deepa N.", area: "ST Bed Layout", phone: "+91 90000 11203",
    distance: "2.1 km · 11 min", creditDays: 21,
    lastOrder: { date: "3 Nov", amountPaise: 325000, summary: "4 power banks, 6 cables" },
    invoices: [{ id: "INV-2355", date: "3 Nov", amountPaise: 325000, paidPaise: 0, daysOld: 9 }],
    notes: "New counter display installed last week. Check facings and take a photo.",
    x: 152, y: 38,
  },
  {
    id: "s4", name: "HSR Cellular World", owner: "Ravi Kumar", area: "Sector 1, HSR Layout", phone: "+91 90000 11204",
    distance: "3.0 km · 14 min", creditDays: 45,
    lastOrder: { date: "26 Sep", amountPaise: 2280000, summary: "20 power banks, 30 cables, 10 earbuds" },
    invoices: [{ id: "INV-2264", date: "26 Sep", amountPaise: 2280000, paidPaise: 0, daysOld: 47 }],
    notes: "Over credit days. Collect at least half before booking a new order.",
    x: 216, y: 82,
  },
  {
    id: "s5", name: "Phone Care Hub", owner: "Suresh B.", area: "Sector 2, HSR Layout", phone: "+91 90000 11205",
    distance: "1.2 km · 6 min", creditDays: 30,
    lastOrder: { date: "20 Oct", amountPaise: 418000, summary: "10 chargers, 10 cables" },
    invoices: [],
    notes: "Price-sensitive. Pitch the 20W charger + 1m cable combo.",
    x: 262, y: 128,
  },
  {
    id: "s6", name: "Agara Mobiles & Accessories", owner: "Mohammed Arif", area: "Agara", phone: "+91 90000 11206",
    distance: "2.6 km · 12 min", creditDays: 30,
    lastOrder: { date: "22 Oct", amountPaise: 560000, summary: "8 neckbands, 6 car chargers" },
    invoices: [{ id: "INV-2333", date: "22 Oct", amountPaise: 560000, paidPaise: 0, daysOld: 21 }],
    notes: "Owner's son handles orders after 5 pm.",
    x: 296, y: 46,
  },
];
