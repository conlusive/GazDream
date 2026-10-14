export type Fuel = "gas" | "chips" | "pellets";

export type FuelPrices = Record<Fuel, number>; // gas: per 1000 m3, chips/pellets: per tonne
export type FuelUse = Record<Fuel, number>; // fuel units per 1 tonne of grain per 1% moisture removed

/**
 * PLACEHOLDER values derived from the illustrative example in the spec
 * (6% removed: gas 3.36, chips 1.96, pellets 2.86 EUR/t at 400 / 70 / 160 prices).
 * Replace with real boiler data from the technical specialist before launch.
 */
export const PLACEHOLDER_FUEL_USE: FuelUse = {
  gas: 1.4 / 1000, // 1000 m3 units
  chips: 0.028 / 6,
  pellets: 0.017875 / 6,
};

export type CalculatorInput = {
  moistureFrom: number; // %
  moistureTo: number; // %
  tonnes: number;
  prices: FuelPrices;
  fuelUse?: FuelUse;
  vatRate?: number; // 0.23 = add VAT to fuel prices; omit for net
};

export type FuelResult = {
  fuel: Fuel;
  costPerTonne: number;
  totalCost: number;
  savingsVsGas: number;
  savingsPercent: number;
};

export type CalculatorResult = {
  removedPercent: number;
  results: FuelResult[];
  cheapest: Fuel | null;
};

const FUELS: Fuel[] = ["gas", "chips", "pellets"];

export function calculate(input: CalculatorInput): CalculatorResult {
  const { moistureFrom, moistureTo, tonnes, prices, vatRate = 0 } = input;
  const fuelUse = input.fuelUse ?? PLACEHOLDER_FUEL_USE;

  if (![moistureFrom, moistureTo, tonnes, ...Object.values(prices)].every(Number.isFinite)) {
    throw new RangeError("All inputs must be finite numbers");
  }
  if (tonnes < 0 || Object.values(prices).some((p) => p < 0)) {
    throw new RangeError("Tonnes and prices must not be negative");
  }

  const removedPercent = Math.max(0, moistureFrom - moistureTo);
  const vat = 1 + vatRate;

  const costPerTonneOf = (fuel: Fuel) =>
    removedPercent * fuelUse[fuel] * prices[fuel] * vat;
  const gasPerTonne = costPerTonneOf("gas");

  const results = FUELS.map<FuelResult>((fuel) => {
    const costPerTonne = costPerTonneOf(fuel);
    const savingsPerTonne = gasPerTonne - costPerTonne;
    return {
      fuel,
      costPerTonne,
      totalCost: costPerTonne * tonnes,
      savingsVsGas: savingsPerTonne * tonnes,
      savingsPercent: gasPerTonne > 0 ? (savingsPerTonne / gasPerTonne) * 100 : 0,
    };
  });

  const cheapest =
    removedPercent === 0
      ? null
      : results.reduce((best, r) => (r.costPerTonne < best.costPerTonne ? r : best)).fuel;

  return { removedPercent, results, cheapest };
}
