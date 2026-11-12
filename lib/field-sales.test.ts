import { describe, expect, it } from "vitest";
import {
  allocateCollection, applyAllocations, dayProgress, oldestDueDays, outstandingPaise, priceOrder, validateCollection,
} from "./field-sales";
import { PRODUCTS_BY_ID, SCHEMES, SHOPS, SLABS } from "./voltline-data";

const price = (q: Record<string, number>) => priceOrder(q, PRODUCTS_BY_ID, SCHEMES, SLABS);

describe("priceOrder", () => {
  it("adds 18% GST with no slab on small orders and nudges to the next slab", () => {
    const p = price({ "VL-C20": 4 }); // 4 x 399
    expect(p.subtotalPaise).toBe(159_600);
    expect(p.discountPaise).toBe(0);
    expect(p.gstPaise).toBe(28_728);
    expect(p.totalPaise).toBe(188_328);
    expect(p.nextSlab).toEqual({ slab: SLABS[0], shortByPaise: 1_000_000 - 159_600 });
  });

  it("gives free goods per completed block", () => {
    const p = price({ "VL-CB1": 21, "VL-TWS": 5 });
    const cable = p.lines.find((l) => l.id === "VL-CB1")!;
    const tws = p.lines.find((l) => l.id === "VL-TWS")!;
    expect(cable.freeQty).toBe(2);
    expect(tws.freeQty).toBe(1);
    expect(p.freeUnits).toBe(3);
  });

  it("applies the highest slab reached", () => {
    const p = price({ "VL-C65": 10 }); // 12,990
    expect(p.slab?.bps).toBe(300);
    expect(p.discountPaise).toBe(38_970);
    expect(p.taxablePaise).toBe(1_260_030);
    expect(p.gstPaise).toBe(226_805); // 226,805.4 rounds down
    expect(p.totalPaise).toBe(1_486_835);

    const big = price({ "VL-PB20": 25 }); // 27,475
    expect(big.slab?.bps).toBe(500);
    expect(big.nextSlab).toBeNull();
  });

  it("ignores zero and unknown lines", () => {
    const p = price({ "VL-C20": 0, nope: 3 });
    expect(p.lines).toEqual([]);
    expect(p.totalPaise).toBe(0);
    expect(p.nextSlab).toBeNull();
  });
});

describe("collections", () => {
  const invoices = SHOPS.find((s) => s.id === "s2")!.invoices; // 6,400 @38d + 10,320 due @12d

  it("computes outstanding and age", () => {
    expect(outstandingPaise(invoices)).toBe(640_000 + 1_032_000);
    expect(oldestDueDays(invoices)).toBe(38);
  });

  it("allocates oldest first", () => {
    const r = allocateCollection(invoices, 800_000);
    expect(r.allocations).toEqual([
      { invoiceId: "INV-2291", appliedPaise: 640_000, closes: true },
      { invoiceId: "INV-2340", appliedPaise: 160_000, closes: false },
    ]);
    expect(r.unappliedPaise).toBe(0);
    expect(r.outstandingAfterPaise).toBe(872_000);

    const after = applyAllocations(invoices, r.allocations);
    expect(outstandingPaise(after)).toBe(872_000);
    expect(oldestDueDays(after)).toBe(12);
  });

  it("keeps any excess as unapplied", () => {
    const r = allocateCollection(invoices, 2_000_000);
    expect(r.unappliedPaise).toBe(2_000_000 - 1_672_000);
    expect(r.outstandingAfterPaise).toBe(0);
  });

  it("validates collection input", () => {
    const base = { outstandingPaise: 1_672_000 };
    expect(validateCollection({ ...base, mode: "upi", amountPaise: 500_000 })).toEqual([]);
    expect(validateCollection({ ...base, mode: "upi", amountPaise: null })).toHaveLength(1);
    expect(validateCollection({ ...base, mode: "upi", amountPaise: 0 })[0]).toMatch(/more than zero/);
    expect(validateCollection({ ...base, mode: "cash", amountPaise: 2_000_000 })[0]).toMatch(/more than the outstanding/);
    expect(validateCollection({ mode: "cash", amountPaise: 20_000_000, outstandingPaise: 30_000_000 })[0]).toMatch(/2,00,000/);
    expect(validateCollection({ ...base, mode: "cheque", amountPaise: 100, chequeNo: "12345" })[0]).toMatch(/6 digits/);
    expect(validateCollection({ ...base, mode: "cheque", amountPaise: 100, chequeNo: "123456" })).toEqual([]);
  });
});

describe("dayProgress", () => {
  it("counts visits and caps the percentage", () => {
    expect(dayProgress(["visited", "planned", "in_visit"], 3_000_000, 6_000_000)).toEqual({
      visited: 2, total: 3, achievedPaise: 3_000_000, targetPaise: 6_000_000, pct: 50,
    });
    expect(dayProgress([], 9_000_000, 6_000_000).pct).toBe(100);
  });
});
