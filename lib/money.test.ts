import { describe, expect, it } from "vitest";
import { applyBps, formatINR, parseRupeesToPaise } from "./money";

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(1_500_000)).toBe("₹15,000");
    expect(formatINR(1_234_567_800)).toBe("₹1,23,45,678");
    expect(formatINR(99)).toBe("₹0.99");
    expect(formatINR(123456)).toBe("₹1,234.56");
    expect(formatINR(-50000)).toBe("-₹500");
  });
});

describe("parseRupeesToPaise", () => {
  it("parses what people type", () => {
    expect(parseRupeesToPaise("1,250")).toBe(125000);
    expect(parseRupeesToPaise("₹ 499.5")).toBe(49950);
    expect(parseRupeesToPaise("0.05")).toBe(5);
  });
  it("rejects junk", () => {
    expect(parseRupeesToPaise("")).toBeNull();
    expect(parseRupeesToPaise("12.345")).toBeNull();
    expect(parseRupeesToPaise("abc")).toBeNull();
    expect(parseRupeesToPaise("-5")).toBeNull();
  });
});

describe("applyBps", () => {
  it("rounds half up to the paisa", () => {
    expect(applyBps(1_000_000, 300)).toBe(30_000);
    expect(applyBps(150, 1800)).toBe(27);
    expect(applyBps(25, 1800)).toBe(5); // 4.5 -> 5
  });
});
