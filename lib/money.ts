/**
 * Money helpers. Every amount in this project is an integer number of paise
 * (1 rupee = 100 paise) so totals never pick up floating-point drift.
 */

function groupIndian(n: number): string {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}`;
}

/** 123456 -> "₹1,234.56", 1500000 -> "₹15,000" (Indian digit grouping). */
export function formatINR(paise: number): string {
  const rounded = Math.round(paise);
  const abs = Math.abs(rounded);
  const rupees = Math.floor(abs / 100);
  const rem = abs % 100;
  const body = groupIndian(rupees) + (rem ? `.${String(rem).padStart(2, "0")}` : "");
  return `${rounded < 0 ? "-" : ""}₹${body}`;
}

/** Parses what a person types ("1,250", "₹ 499.5") into paise. Returns null if invalid. */
export function parseRupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** Applies a rate in basis points (100 bps = 1%) and rounds half up to the nearest paisa. */
export function applyBps(paise: number, bps: number): number {
  return Math.round((paise * bps) / 10000);
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
