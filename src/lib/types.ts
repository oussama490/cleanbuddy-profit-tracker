import type { DailyOps, ProductOps } from "./commerce";

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
  ops: DailyOps;
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
  ops?: DailyOps;
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
  ops: ProductOps;
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
  ops?: ProductOps;
};

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export const WORKSPACE_KINDS = [
  "journal",
  "goal",
  "cash",
  "supplier",
  "checklist",
  "bill",
  "payout",
  "creative",
  "review",
  "expense",
  "shop",
] as const;
export type WorkspaceKind = (typeof WORKSPACE_KINDS)[number];

export type WorkspaceRecord = {
  id: string;
  kind: WorkspaceKind;
  title: string;
  body: string;
  amount: number;
  currency: Currency;
  entry_date: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WorkspaceRecordInput = {
  id?: string;
  kind: WorkspaceKind;
  title: string;
  body?: string;
  amount?: number;
  currency?: Currency;
  entry_date?: string | null;
  meta?: Record<string, unknown>;
};
