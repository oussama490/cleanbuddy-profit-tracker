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

export const JOB_STATUSES = ["active", "ended", "pending"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const TEER_LEVELS = ["0", "1", "2", "3", "4", "5"] as const;
export type TeerLevel = (typeof TEER_LEVELS)[number];

export const EDUCATION_LEVELS = [
  "high_school",
  "one_year",
  "two_year",
  "bachelor",
  "two_or_more",
  "master",
  "phd",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const BUDGET_CATEGORIES = [
  "transport",
  "food",
  "housing",
  "gym",
  "leisure",
  "other",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const INCOME_SOURCES = ["job", "dropshipping", "other"] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

export type Job = {
  id: string;
  job_title: string;
  employer: string;
  start_date: string;
  end_date: string | null;
  noc_code: string;
  teer: TeerLevel;
  hours_per_week: number;
  hourly_wage: number;
  annual_salary: number;
  wage_currency: Currency;
  status: JobStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type JobInput = {
  id?: string;
  job_title: string;
  employer?: string;
  start_date: string;
  end_date?: string | null;
  noc_code?: string;
  teer?: TeerLevel;
  hours_per_week?: number;
  hourly_wage?: number;
  annual_salary?: number;
  wage_currency?: Currency;
  status?: JobStatus;
  notes?: string;
};

export type PrCriteria = {
  id: string;
  age: number;
  education_level: EducationLevel;
  french_clb: number;
  english_clb: number;
  experience_months_override: number | null;
  current_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type PrCriteriaInput = {
  id?: string;
  age: number;
  education_level: EducationLevel;
  french_clb: number;
  english_clb: number;
  experience_months_override?: number | null;
  current_status?: string;
  notes?: string;
};

export type BudgetEntry = {
  id: string;
  entry_date: string;
  category: BudgetCategory;
  amount: number;
  currency: Currency;
  income_source: IncomeSource;
  job_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type BudgetEntryInput = {
  id?: string;
  entry_date: string;
  category: BudgetCategory;
  amount: number;
  currency?: Currency;
  income_source?: IncomeSource;
  job_id?: string | null;
  notes?: string;
};

export type WeeklyReviewMeta = {
  progresPr: string;
  resultatBusiness: string;
  santeForme: string;
};
