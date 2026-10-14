import { describe, expect, it } from "vitest";
import { calculate } from "./index";

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
