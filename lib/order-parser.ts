/**
 * A deliberately small, dependency-free order parser for chat messages from
 * kirana retailers. It understands English, Hinglish fillers ("bhej do",
 * "chahiye", "aur") and number words, and maps phrases to catalogue SKUs.
 *
 * It is not NLP: it is a keyword matcher with a few rules, which is exactly
 * what a prototype needs to test whether retailers will order this way.
 */

import type { CatalogItem } from "./sundar-catalog";

export interface ParsedLine {
  id: string;
  qty: number;
  /** True when the retailer named the item but no quantity, so we assumed 1. */
  qtyAssumed: boolean;
}

export interface ParseResult {
  lines: ParsedLine[];
  /** Phrases that looked like products but matched nothing. */
  unmatched: string[];
}

export type Intent =
  | "order"
  | "confirm"
  | "cancel"
  | "greeting"
  | "reorder"
  | "track"
  | "catalogue"
  | "help"
  | "unknown";

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, fifty: 50,
  // Hinglish. "do" (2) is left out on purpose: it collides with "bhej do".
  ek: 1, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, che: 6, saat: 7, aath: 8,
  nau: 9, das: 10, barah: 12, baarah: 12, pandrah: 15, bees: 20, pachas: 50, pachaas: 50,
};

const UNIT_WORDS = new Set(["kg", "g", "gm", "gms", "gram", "grams", "ml", "l", "ltr", "litre", "liter", "litres"]);

const PACK_WORDS = new Set([
  "pack", "packs", "packet", "packets", "pkt", "pkts", "box", "boxes", "case", "cases", "tray", "trays",
  "bale", "bales", "bag", "bags", "pouch", "pouches", "pcs", "pc", "piece", "pieces", "nos", "units", "unit",
  "strip", "strips", "tube", "tubes", "carton", "cartons", "dabba", "peti",
]);

const FILLER_WORDS = new Set([
  "need", "needs", "want", "send", "please", "pls", "plz", "kindly", "order", "i", "we", "us", "me", "my",
  "mujhe", "hume", "humko", "bhej", "bhejo", "bhejna", "bhejdo", "dedo", "de", "dena", "chahiye", "chaiye",
  "chahie", "also", "bhi", "more", "x", "of", "the", "some", "a", "an", "add", "for", "to", "today", "kal",
  "ji", "bhai", "sir", "bhaiya", "hai", "hain", "karo", "kar", "do", "can", "you", "get", "naya", "new",
]);

/** Lower-case, strip punctuation, split hyphens, glue "10x" style quantities apart. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/(\d)\s*x\b/g, "$1 ")
    .replace(/\bx\s*(\d)/g, " $1")
    .replace(/[^a-z0-9,\n;+\s]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function splitSegments(normalized: string): string[] {
  return normalized
    .split(/[,\n;+]|\band\b|\baur\b|\bplus\b/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface AliasEntry {
  id: string;
  words: string[];
}

function buildAliasIndex(catalog: CatalogItem[]): AliasEntry[] {
  const entries: AliasEntry[] = [];
  for (const item of catalog) {
    for (const alias of item.aliases) {
      entries.push({ id: item.id, words: normalize(alias).split(" ") });
    }
  }
  // Longest alias first so "maggi 12 pack" beats "maggi" and "parle monaco" beats "parle".
  return entries.sort((a, b) => b.words.length - a.words.length || b.words.join(" ").length - a.words.join(" ").length);
}

interface Match {
  id: string;
  start: number;
  end: number; // exclusive word index
}

interface QtyToken {
  pos: number;
  value: number;
}

function parseSegment(words: string[], aliases: AliasEntry[]): { matches: Match[]; qtys: QtyToken[]; leftovers: string[] } {
  const taken = new Array<boolean>(words.length).fill(false);
  const matches: Match[] = [];

  for (const alias of aliases) {
    const n = alias.words.length;
    for (let i = 0; i + n <= words.length; i++) {
      let ok = true;
      for (let k = 0; k < n; k++) {
        if (taken[i + k] || words[i + k] !== alias.words[k]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        for (let k = 0; k < n; k++) taken[i + k] = true;
        matches.push({ id: alias.id, start: i, end: i + n });
      }
    }
  }
  matches.sort((a, b) => a.start - b.start);

  const qtys: QtyToken[] = [];
  const leftovers: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (taken[i]) continue;
    const w = words[i];
    const next = words[i + 1];

    // "1 kg", "250 g": a size, not a quantity.
    if (/^\d+$/.test(w) && next && UNIT_WORDS.has(next)) {
      taken[i] = taken[i + 1] = true;
      i++;
      continue;
    }
    // "1kg", "500ml"
    if (/^\d+(kg|g|gm|gms|ml|l|ltr)$/.test(w)) continue;

    if (w === "dozen" || w === "darjan") {
      const prev = qtys[qtys.length - 1];
      if (prev && prev.pos === i - 1) prev.value *= 12;
      else qtys.push({ pos: i, value: 12 });
      continue;
    }
    if (/^\d+$/.test(w)) {
      qtys.push({ pos: i, value: Number(w) });
      continue;
    }
    if (w in NUMBER_WORDS) {
      qtys.push({ pos: i, value: NUMBER_WORDS[w] });
      continue;
    }
    if (FILLER_WORDS.has(w) || PACK_WORDS.has(w) || UNIT_WORDS.has(w)) continue;
    leftovers.push(w);
  }

  return { matches, qtys, leftovers };
}

function assignQuantities(matches: Match[], qtys: QtyToken[]): Array<number | null> {
  if (matches.length === 0) return [];
  const used = new Set<number>();
  // If the message starts with a number ("10 parle g"), quantities come before names.
  const qtyBefore = qtys.some((q) => q.pos < matches[0].start);

  return matches.map((m, idx) => {
    let best: QtyToken | undefined;
    if (qtyBefore) {
      const lo = idx > 0 ? matches[idx - 1].end : -1;
      for (const q of qtys) if (q.pos >= lo && q.pos < m.start && !used.has(q.pos)) best = q; // closest wins (last)
    } else {
      const hi = idx < matches.length - 1 ? matches[idx + 1].start : Infinity;
      for (const q of qtys) {
        if (q.pos >= m.end && q.pos < hi && !used.has(q.pos)) {
          best = q;
          break;
        }
      }
    }
    if (!best) return null;
    used.add(best.pos);
    return best.value;
  });
}

export function parseOrder(text: string, catalog: CatalogItem[]): ParseResult {
  const aliases = buildAliasIndex(catalog);
  const totals = new Map<string, ParsedLine>();
  const unmatched: string[] = [];

  for (const segment of splitSegments(normalize(text))) {
    const words = segment.split(" ").filter(Boolean);
    const { matches, qtys, leftovers } = parseSegment(words, aliases);

    if (matches.length === 0) {
      if (leftovers.length > 0) unmatched.push(leftovers.join(" "));
      continue;
    }

    const assigned = assignQuantities(matches, qtys);
    matches.forEach((m, i) => {
      const q = assigned[i];
      const qty = q ?? 1;
      if (qty <= 0) return;
      const prev = totals.get(m.id);
      totals.set(m.id, {
        id: m.id,
        qty: (prev?.qty ?? 0) + qty,
        qtyAssumed: (prev?.qtyAssumed ?? false) || q === null,
      });
    });
  }

  return { lines: [...totals.values()], unmatched };
}

const INTENT_PATTERNS: Array<[Exclude<Intent, "order" | "unknown">, RegExp]> = [
  ["reorder", /\b(reorder|re order|repeat|same as last|last order|last week|pichla|pichhla|wahi|same order)\b/],
  ["confirm", /^(yes|y|yeah|yep|haan|han|ha|haa|confirm|confirmed|ok|okay|theek hai|thik hai|done|place order|go ahead|sahi hai|chalega)\b/],
  ["cancel", /^(no|nope|nahi|nahin|cancel|stop|rehne do)\b/],
  ["track", /\b(status|track|where is|kab|kidhar|kahan|delivery kab)\b/],
  ["catalogue", /\b(catalogue|catalog|price list|rate list|rates|menu|stock|what do you have|kya hai)\b/],
  ["help", /\b(help|madad|how)\b/],
  ["greeting", /^(hi|hello|hey|namaste|namaskar|ram ram|good morning|gm)\b/],
];

/** Decides what a free-typed message is asking for. Product matches win over keywords. */
export function detectIntent(text: string, catalog: CatalogItem[]): Intent {
  const n = normalize(text);
  if (!n) return "unknown";
  const reorder = INTENT_PATTERNS[0][1].test(n);
  if (reorder) return "reorder";
  if (parseOrder(text, catalog).lines.length > 0) return "order";
  for (const [intent, re] of INTENT_PATTERNS) if (re.test(n)) return intent;
  return "unknown";
}

function bigrams(s: string): string[] {
  const t = s.replace(/\s+/g, "");
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
}

/** Dice similarity on character bigrams, 0..1. */
export function similarity(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.length === 0 || B.length === 0) return 0;
  const pool = [...B];
  let hits = 0;
  for (const g of A) {
    const i = pool.indexOf(g);
    if (i >= 0) {
      hits++;
      pool.splice(i, 1);
    }
  }
  return (2 * hits) / (A.length + B.length);
}

/** Best "did you mean" for a phrase we could not match, or null if nothing is close. */
export function suggestItem(phrase: string, catalog: CatalogItem[], threshold = 0.45): CatalogItem | null {
  const p = normalize(phrase);
  let best: { item: CatalogItem; score: number } | null = null;
  for (const item of catalog) {
    for (const alias of [...item.aliases, item.name.toLowerCase()]) {
      const score = similarity(p, normalize(alias));
      if (!best || score > best.score) best = { item, score };
    }
  }
  return best && best.score >= threshold ? best.item : null;
}
