import { convertAmount, convertToCad } from "./currency";
import type {
  Currency,
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
} from "./types";

export function confirmationRate(entry: DailyEntry): number | null {
  if (!entry.new_orders) return null;
  return entry.confirmed / entry.new_orders;
}

export function deliveryRate(entry: DailyEntry): number | null {
  if (!entry.confirmed) return null;
  return entry.delivered / entry.confirmed;
}

export function productUnitCogsCad(product: ProductCalculation): number {
  const snapshot = product.exchange_rate_snapshot;
  const supplier = convertToCad(
    product.supplier_cost_amount,
    product.supplier_cost_currency,
    snapshot,
  );
  const shipping = convertToCad(
    product.shipping_cost_amount,
    product.shipping_cost_currency,
    snapshot,
  );
  const sale = convertToCad(
    product.sale_price_amount,
    product.sale_price_currency,
    snapshot,
  );
  const commission = sale * (Number(product.dropi_commission_pct) / 100);
  return supplier + shipping + commission;
}

export function averageUnitCogsCad(products: ProductCalculation[]): number {
  if (products.length === 0) return 0;
  const total = products.reduce(
    (sum, product) => sum + productUnitCogsCad(product),
    0,
  );
  return total / products.length;
}

export function dailyRevenueCad(entry: DailyEntry): number {
  return convertToCad(
    Number(entry.revenue_amount),
    entry.revenue_currency,
    entry.exchange_rate_snapshot,
  );
}

export function dailyAdsCad(entry: DailyEntry): number {
  return convertToCad(
    Number(entry.ads_cost_amount),
    entry.ads_cost_currency,
    entry.exchange_rate_snapshot,
  );
}

export function dailyNetProfitCad(
  entry: DailyEntry,
  unitCogsCad: number,
): number {
  return (
    dailyRevenueCad(entry) -
    dailyAdsCad(entry) -
    Number(entry.delivered) * unitCogsCad
  );
}

export type ProductPricingResult = {
  netMarginMxn: number;
  netMarginCad: number;
  marginPercent: number;
  minSalePriceMxn: number;
  isHealthy: boolean;
};

export function calculateProductPricing(
  input: {
    supplierCostAmount: number;
    supplierCostCurrency: Currency;
    shippingCostAmount: number;
    shippingCostCurrency: Currency;
    dropiCommissionPct: number;
    salePriceAmount: number;
    salePriceCurrency: Currency;
    adsCostPerOrderAmount: number;
    adsCostPerOrderCurrency: Currency;
  },
  snapshot: ExchangeRateSnapshot,
): ProductPricingResult {
  const toMxn = (amount: number, currency: Currency) =>
    convertAmount(amount, currency, "MXN", snapshot);
  const toCad = (amount: number, currency: Currency) =>
    convertToCad(amount, currency, snapshot);

  const supplierMxn = toMxn(
    input.supplierCostAmount,
    input.supplierCostCurrency,
  );
  const shippingMxn = toMxn(
    input.shippingCostAmount,
    input.shippingCostCurrency,
  );
  const adsMxn = toMxn(
    input.adsCostPerOrderAmount,
    input.adsCostPerOrderCurrency,
  );
  const saleMxn = toMxn(input.salePriceAmount, input.salePriceCurrency);
  const commissionMxn = saleMxn * (input.dropiCommissionPct / 100);
  const totalCostMxn = supplierMxn + shippingMxn + adsMxn + commissionMxn;
  const netMarginMxn = saleMxn - totalCostMxn;
  const netMarginCad = toCad(netMarginMxn, "MXN");
  const marginPercent = saleMxn > 0 ? (netMarginMxn / saleMxn) * 100 : 0;

  const fixedCostsMxn = supplierMxn + shippingMxn + adsMxn;
  const remaining = 1 - input.dropiCommissionPct / 100;
  const minSalePriceMxn =
    remaining > 0 ? fixedCostsMxn / remaining : Number.POSITIVE_INFINITY;

  return {
    netMarginMxn,
    netMarginCad,
    marginPercent,
    minSalePriceMxn,
    isHealthy: marginPercent >= 20,
  };
}
