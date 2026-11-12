import { describe, expect, it } from "vitest";
import { CATALOG_BY_ID, INITIAL_STOCK } from "./sundar-catalog";
import { applyLines, creditCheck, priceCart, reserveStock } from "./order-cart";

const line = (id: string, qty: number) => ({ id, qty, qtyAssumed: false });

describe("applyLines", () => {
  it("adds in-stock lines", () => {
    const r = applyLines({}, [line("PRL-G70", 10), line("NES-MG12", 5)], CATALOG_BY_ID, INITIAL_STOCK);
    expect(r.cart).toEqual({ "PRL-G70": 10, "NES-MG12": 5 });
    expect(r.issues).toEqual([]);
  });

  it("flags out-of-stock items with an in-stock substitute", () => {
    const r = applyLines({}, [line("TAT-SLT1", 3)], CATALOG_BY_ID, INITIAL_STOCK);
    expect(r.cart).toEqual({});
    expect(r.issues).toEqual([{ kind: "out_of_stock", id: "TAT-SLT1", qty: 3, substituteId: "SDS-SLT1" }]);
  });

  it("drops the substitute when it is also out of stock", () => {
    const r = applyLines({}, [line("TAT-SLT1", 3)], CATALOG_BY_ID, { ...INITIAL_STOCK, "SDS-SLT1": 0 });
    expect(r.issues[0]).toMatchObject({ kind: "out_of_stock", substituteId: undefined });
  });

  it("raises below-MOQ quantities", () => {
    const r = applyLines({}, [line("FOR-SUN1", 2)], CATALOG_BY_ID, INITIAL_STOCK);
    expect(r.cart["FOR-SUN1"]).toBe(5);
    expect(r.issues).toEqual([{ kind: "raised_to_moq", id: "FOR-SUN1", requested: 2, moq: 5 }]);
  });

  it("caps at available stock", () => {
    const r = applyLines({}, [line("KRK-MM12", 10)], CATALOG_BY_ID, INITIAL_STOCK);
    expect(r.cart["KRK-MM12"]).toBe(6);
    expect(r.issues[0]).toEqual({ kind: "short_stock", id: "KRK-MM12", requested: 10, available: 6 });
  });

  it("adds to an existing cart without mutating it", () => {
    const cart = { "PRL-G70": 4 };
    const r = applyLines(cart, [line("PRL-G70", 6)], CATALOG_BY_ID, INITIAL_STOCK);
    expect(r.cart["PRL-G70"]).toBe(10);
    expect(cart["PRL-G70"]).toBe(4);
  });
});

describe("priceCart", () => {
  it("totals in paise", () => {
    const p = priceCart({ "PRL-G70": 10, "NES-MG12": 5, "SDS-SLT1": 3 }, CATALOG_BY_ID);
    expect(p.totalPaise).toBe(10 * 10800 + 5 * 15600 + 3 * 23500);
    expect(p.totalPaise).toBe(256500);
    expect(p.units).toBe(18);
  });
});

describe("creditCheck", () => {
  it("passes when the order fits", () => {
    const c = creditCheck(1_500_000, 420_000, 256_500);
    expect(c).toMatchObject({ ok: true, usedAfterPaise: 676_500, availableAfterPaise: 823_500, overByPaise: 0, usedAfterPct: 45 });
  });
  it("fails and reports the excess when over the limit", () => {
    const c = creditCheck(1_500_000, 1_400_000, 250_000);
    expect(c).toMatchObject({ ok: false, overByPaise: 150_000, availableAfterPaise: 0, usedAfterPct: 100 });
  });
});

describe("reserveStock", () => {
  it("decrements stock and never goes negative", () => {
    expect(reserveStock({ a: 5, b: 1 }, { a: 2, b: 4 })).toEqual({ a: 3, b: 0 });
  });
});
