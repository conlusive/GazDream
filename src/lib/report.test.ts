import { describe, expect, it } from "vitest";
import { parseReportInput } from "./report";

const valid = {
  currency: "PLN",
  withVat: false,
  period: "season",
  boilerPrice: 60000,
  prices: { gas: 1700, chips: 300, pellets: 690 },
  rows: [{ crop: "corn", from: 20, to: 14, tonnes: 5000 }],
};

describe("parseReportInput", () => {
  it("accepts a valid calculator state", () => {
    expect(parseReportInput(valid)?.rows[0].tonnes).toBe(5000);
  });

  it("rejects unknown currencies, crops and periods", () => {
    expect(parseReportInput({ ...valid, currency: "USD" })).toBeNull();
    expect(parseReportInput({ ...valid, period: "week" })).toBeNull();
    expect(parseReportInput({ ...valid, rows: [{ ...valid.rows[0], crop: "wheat" }] })).toBeNull();
  });

  it("rejects negative, non-finite and absurdly large numbers", () => {
    expect(parseReportInput({ ...valid, rows: [{ ...valid.rows[0], tonnes: -1 }] })).toBeNull();
    expect(parseReportInput({ ...valid, rows: [{ ...valid.rows[0], tonnes: Number.NaN }] })).toBeNull();
    expect(parseReportInput({ ...valid, rows: [{ ...valid.rows[0], tonnes: 1e12 }] })).toBeNull();
    expect(parseReportInput({ ...valid, prices: { ...valid.prices, gas: -5 } })).toBeNull();
  });

  it("limits the number of batches and rejects non-objects", () => {
    expect(parseReportInput({ ...valid, rows: [] })).toBeNull();
    expect(parseReportInput({ ...valid, rows: Array(6).fill(valid.rows[0]) })).toBeNull();
    expect(parseReportInput(null)).toBeNull();
    expect(parseReportInput("x")).toBeNull();
  });
});
