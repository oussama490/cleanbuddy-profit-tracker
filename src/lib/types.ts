export const CURRENCIES = ["MXN", "USD", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type ExchangeRateSnapshot = {
  date: string;
  fetchedAt: string;
  source: "frankfurter";
  toCad: Record<Currency, number>;
};

export type DailyEntry = {
  id: string;
  entry_date: string;
  new_orders: number;
  confirmed: number;
  delivered: number;
  returned: number;
  revenue_amount: number;
  revenue_currency: Currency;
  ads_cost_amount: number;
  ads_cost_currency: Currency;
  exchange_rate_snapshot: ExchangeRateSnapshot;
  created_at: string;
  updated_at: string;
};

export type DailyEntryInput = {
  id?: string;
  entry_date: string;
  new_orders: number;
  confirmed: number;
  delivered: number;
  returned: number;
  revenue_amount: number;
  revenue_currency: Currency;
  ads_cost_amount: number;
  ads_cost_currency: Currency;
  exchange_rate_snapshot: ExchangeRateSnapshot;
};

export type ProductCalculation = {
  id: string;
  product_name: string;
  supplier_cost_amount: number;
  supplier_cost_currency: Currency;
  shipping_cost_amount: number;
  shipping_cost_currency: Currency;
  dropi_commission_pct: number;
  sale_price_amount: number;
  sale_price_currency: Currency;
  ads_cost_per_order_amount: number;
  ads_cost_per_order_currency: Currency;
  exchange_rate_snapshot: ExchangeRateSnapshot;
  created_at: string;
  updated_at: string;
};

export type ProductCalculationInput = {
  id?: string;
  product_name: string;
  supplier_cost_amount: number;
  supplier_cost_currency: Currency;
  shipping_cost_amount: number;
  shipping_cost_currency: Currency;
  dropi_commission_pct: number;
  sale_price_amount: number;
  sale_price_currency: Currency;
  ads_cost_per_order_amount: number;
  ads_cost_per_order_currency: Currency;
  exchange_rate_snapshot: ExchangeRateSnapshot;
};

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };
