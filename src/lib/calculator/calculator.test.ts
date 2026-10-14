import { describe, expect, it } from "vitest";
import { calculate, calculateBatches, paybackPeriods } from "./index";

const base = {
  moistureFrom: 20,
  moistureTo: 14,
  tonnes: 1000,
  prices: { gas: 400, chips: 70, pellets: 160 },
};

describe("calculate", () => {
  it("matches hand-calculated costs for 6% removal", () => {
    const r = calculate(base);
    const by = Object.fromEntries(r.results.map((x) => [x.fuel, x]));
    expect(r.removedPercent).toBe(6);
    expect(by.gas.costPerTonne).toBeCloseTo(2.88, 2);
    expect(by.chips.costPerTonne).toBeCloseTo(1.05, 2);
    expect(by.pellets.costPerTonne).toBeCloseTo(2.4, 2);
    expect(by.chips.savingsVsGas).toBeCloseTo(1830, 0);
    expect(by.chips.savingsPercent).toBeCloseTo(63.5, 1);
    expect(by.pellets.savingsVsGas).toBeCloseTo(480, 0);
    expect(r.cheapest).toBe("chips");
  });

  it("shows negative savings honestly when a fuel is dearer than gas", () => {
    const r = calculate({ ...base, prices: { gas: 400, chips: 200, pellets: 160 } });
    const chips = r.results.find((x) => x.fuel === "chips")!;
    expect(chips.savingsVsGas).toBeLessThan(0);
    expect(r.cheapest).not.toBe("chips");
  });

  it("returns zero cost and no winner when nothing is removed", () => {
    const r = calculate({ ...base, moistureFrom: 14, moistureTo: 14 });
    expect(r.removedPercent).toBe(0);
    expect(r.cheapest).toBeNull();
    expect(r.results.every((x) => x.totalCost === 0)).toBe(true);
  });

  it("clamps negative moisture difference to zero", () => {
    expect(calculate({ ...base, moistureFrom: 10, moistureTo: 14 }).removedPercent).toBe(0);
  });

  it("applies VAT to all fuels without changing the percentage", () => {
    const net = calculate(base);
    const gross = calculate({ ...base, vatRate: 0.23 });
    expect(gross.results[0].costPerTonne).toBeCloseTo(net.results[0].costPerTonne * 1.23, 6);
    expect(gross.results[1].savingsPercent).toBeCloseTo(net.results[1].savingsPercent, 6);
  });

  it("rejects invalid input", () => {
    expect(() => calculate({ ...base, tonnes: -1 })).toThrow(RangeError);
    expect(() => calculate({ ...base, tonnes: NaN })).toThrow(RangeError);
  });
});

describe("calculateBatches", () => {
  const prices = base.prices;
  const a = { moistureFrom: 20, moistureTo: 14, tonnes: 1000 };
  const b = { moistureFrom: 18, moistureTo: 13, tonnes: 500 };

  it("equals the single calculation for one batch", () => {
    const one = calculate({ ...a, prices });
    const multi = calculateBatches({ batches: [a], prices });
    expect(multi.results.map((r) => r.totalCost)).toEqual(one.results.map((r) => r.totalCost));
    expect(multi.cheapest).toBe(one.cheapest);
  });

  it("sums totals and savings across crops", () => {
    const sum = calculateBatches({ batches: [a, b], prices });
    const ra = calculate({ ...a, prices });
    const rb = calculate({ ...b, prices });
    const chips = sum.results.find((r) => r.fuel === "chips")!;
    expect(chips.totalCost).toBeCloseTo(
      ra.results[1].totalCost + rb.results[1].totalCost,
      6,
    );
    expect(chips.savingsVsGas).toBeCloseTo(ra.results[1].savingsVsGas + rb.results[1].savingsVsGas, 6);
    expect(sum.totalTonnes).toBe(1500);
    expect(sum.removedPercent).toBeCloseTo((6 * 1000 + 5 * 500) / 1500, 6);
  });

  it("handles an empty list and zero tonnes without a winner", () => {
    expect(calculateBatches({ batches: [], prices }).cheapest).toBeNull();
    expect(calculateBatches({ batches: [{ ...a, tonnes: 0 }], prices }).cheapest).toBeNull();
  });
});

describe("paybackPeriods", () => {
  it("divides the price by the savings", () => {
    expect(paybackPeriods(100_000, 50_000)).toBe(2);
    expect(paybackPeriods(75_000, 50_000)).toBeCloseTo(1.5, 6);
  });
  it("returns null when it never pays back or input is unusable", () => {
    expect(paybackPeriods(100_000, 0)).toBeNull();
    expect(paybackPeriods(100_000, -5)).toBeNull();
    expect(paybackPeriods(0, 5)).toBeNull();
    expect(paybackPeriods(NaN, 5)).toBeNull();
  });
});
