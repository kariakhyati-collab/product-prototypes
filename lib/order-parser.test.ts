import { describe, expect, it } from "vitest";
import { CATALOG } from "./sundar-catalog";
import { detectIntent, normalize, parseOrder, suggestItem } from "./order-parser";

const parse = (t: string) => parseOrder(t, CATALOG);
const qtyOf = (t: string) => Object.fromEntries(parse(t).lines.map((l) => [l.id, l.qty]));

describe("normalize", () => {
  it("lower-cases, splits hyphens and drops apostrophes", () => {
    expect(normalize("Parle-G, Haldiram's")).toBe("parle g, haldirams");
  });
  it("separates multiplier x from numbers", () => {
    expect(normalize("10x Parle-G")).toBe("10 parle g");
    expect(normalize("Parle-G x10")).toBe("parle g 10");
  });
});

describe("parseOrder", () => {
  it("parses the classic sample message", () => {
    expect(qtyOf("Need 10 Parle-G, 5 Maggi 12-pack")).toEqual({ "PRL-G70": 10, "NES-MG12": 5 });
  });

  it("understands Hinglish", () => {
    expect(qtyOf("10 Maggi bhej do")).toEqual({ "NES-MG12": 10 });
    expect(qtyOf("das parle g aur paanch tata tea chahiye")).toEqual({ "PRL-G70": 10, "TAT-TEA250": 5 });
  });

  it("handles quantities after the product name", () => {
    expect(qtyOf("parle g 10, monaco 4")).toEqual({ "PRL-G70": 10, "PRL-MON": 4 });
  });

  it("handles several items in one segment without commas", () => {
    expect(qtyOf("10 parle g 5 maggi 2 surf")).toEqual({ "PRL-G70": 10, "NES-MG12": 5, "SRF-EW1": 2 });
  });

  it("prefers the longest alias", () => {
    expect(qtyOf("3 parle monaco")).toEqual({ "PRL-MON": 3 });
    expect(qtyOf("2 sundar select salt")).toEqual({ "SDS-SLT1": 2 });
  });

  it("does not read pack sizes as quantities", () => {
    expect(qtyOf("4 tata salt 1kg")).toEqual({ "TAT-SLT1": 4 });
    expect(qtyOf("2 fortune oil 1 litre")).toEqual({ "FOR-SUN1": 2 });
  });

  it("supports dozens and word numbers", () => {
    expect(qtyOf("2 dozen frooti")).toEqual({ "FRT-125": 24 });
    expect(qtyOf("three vim")).toEqual({ "VIM-BAR3": 3 });
  });

  it("sums repeated items", () => {
    expect(qtyOf("2 lux, 3 lux")).toEqual({ "LUX-SG4": 5 });
  });

  it("assumes 1 when no quantity is given and flags it", () => {
    const r = parse("colgate");
    expect(r.lines).toEqual([{ id: "CLG-ST200", qty: 1, qtyAssumed: true }]);
  });

  it("reports unmatched phrases", () => {
    const r = parse("5 oreo, 2 parle g");
    expect(r.lines).toEqual([{ id: "PRL-G70", qty: 2, qtyAssumed: false }]);
    expect(r.unmatched).toEqual(["oreo"]);
  });

  it("returns nothing for chit-chat", () => {
    expect(parse("hello bhaiya").lines).toEqual([]);
  });
});

describe("detectIntent", () => {
  const intent = (t: string) => detectIntent(t, CATALOG);
  it("classifies common messages", () => {
    expect(intent("10 Maggi bhej do")).toBe("order");
    expect(intent("haan theek hai")).toBe("confirm");
    expect(intent("Yes")).toBe("confirm");
    expect(intent("namaste")).toBe("greeting");
    expect(intent("same as last week")).toBe("reorder");
    expect(intent("order status?")).toBe("track");
    expect(intent("send price list")).toBe("catalogue");
    expect(intent("nahi")).toBe("cancel");
    expect(intent("asdfgh")).toBe("unknown");
  });
});

describe("suggestItem", () => {
  it("finds close misspellings", () => {
    expect(suggestItem("magi", CATALOG)?.id).toBe("NES-MG12");
    expect(suggestItem("kurkurey", CATALOG)?.id).toBe("KRK-MM12");
  });
  it("returns null when nothing is close", () => {
    expect(suggestItem("zzzz", CATALOG)).toBeNull();
  });
});
