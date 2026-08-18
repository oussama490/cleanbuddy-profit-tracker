export const SALES_MODELS = ["cod", "prepaid"] as const;
export type SalesModel = (typeof SALES_MODELS)[number];

export const FULFILLMENT_APPS = [
  "dropi",
  "cj",
  "shopify",
  "traditional",
  "custom",
] as const;
export type FulfillmentApp = (typeof FULFILLMENT_APPS)[number];

export const PRODUCT_DECISIONS = ["scale", "watch", "kill"] as const;
export type ProductDecision = (typeof PRODUCT_DECISIONS)[number];

export type ShopSettings = {
  salesModel: SalesModel;
  fulfillment: FulfillmentApp;
  customApp: string;
  shopifyStore: string;
  shopifyUrl: string;
  payoutDelayDays: number;
  ownerPayPct: number;
};

export const DEFAULT_SHOP: ShopSettings = {
  salesModel: "cod",
  fulfillment: "dropi",
  customApp: "",
  shopifyStore: "",
  shopifyUrl: "",
  payoutDelayDays: 14,
  ownerPayPct: 30,
};

export type ProductOps = {
  sales_model: SalesModel;
  fulfillment: FulfillmentApp;
  fulfillment_custom: string;
  shopify_url: string;
  decision: ProductDecision;
  decision_note: string;
};

export type DailyOps = {
  sales_model: SalesModel;
  fulfillment: FulfillmentApp;
  fulfillment_custom: string;
};

export const DEFAULT_PRODUCT_OPS: ProductOps = {
  sales_model: "cod",
  fulfillment: "dropi",
  fulfillment_custom: "",
  shopify_url: "",
  decision: "watch",
  decision_note: "",
};

export const DEFAULT_DAILY_OPS: DailyOps = {
  sales_model: "cod",
  fulfillment: "dropi",
  fulfillment_custom: "",
};

export function isSalesModel(value: unknown): value is SalesModel {
  return value === "cod" || value === "prepaid";
}

export function isFulfillment(value: unknown): value is FulfillmentApp {
  return (FULFILLMENT_APPS as readonly string[]).includes(String(value));
}

export function isDecision(value: unknown): value is ProductDecision {
  return value === "scale" || value === "watch" || value === "kill";
}

export function parseProductOps(raw: unknown): ProductOps {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    sales_model: isSalesModel(value.sales_model) ? value.sales_model : "cod",
    fulfillment: isFulfillment(value.fulfillment) ? value.fulfillment : "dropi",
    fulfillment_custom: String(value.fulfillment_custom ?? ""),
    shopify_url: String(value.shopify_url ?? ""),
    decision: isDecision(value.decision) ? value.decision : "watch",
    decision_note: String(value.decision_note ?? ""),
  };
}

export function parseDailyOps(raw: unknown): DailyOps {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    sales_model: isSalesModel(value.sales_model) ? value.sales_model : "cod",
    fulfillment: isFulfillment(value.fulfillment) ? value.fulfillment : "dropi",
    fulfillment_custom: String(value.fulfillment_custom ?? ""),
  };
}

export function parseShopSettings(raw: unknown): ShopSettings {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    salesModel: isSalesModel(value.salesModel) ? value.salesModel : DEFAULT_SHOP.salesModel,
    fulfillment: isFulfillment(value.fulfillment) ? value.fulfillment : DEFAULT_SHOP.fulfillment,
    customApp: String(value.customApp ?? ""),
    shopifyStore: String(value.shopifyStore ?? ""),
    shopifyUrl: String(value.shopifyUrl ?? ""),
    payoutDelayDays: Number(value.payoutDelayDays) || DEFAULT_SHOP.payoutDelayDays,
    ownerPayPct: Number(value.ownerPayPct) || DEFAULT_SHOP.ownerPayPct,
  };
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function loggingStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : addDaysIso(today, -1);
  if (!set.has(cursor)) return 0;
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDaysIso(cursor, -1);
  }
  return streak;
}

export function fulfillmentLabel(
  app: FulfillmentApp,
  custom: string,
  lang: "ar" | "fr",
): string {
  if (app === "custom" && custom.trim()) return custom.trim();
  const ar: Record<FulfillmentApp, string> = {
    dropi: "Dropi",
    cj: "CJ Dropshipping",
    shopify: "Shopify",
    traditional: "Dropshipping تقليدي",
    custom: "تطبيق آخر",
  };
  const fr: Record<FulfillmentApp, string> = {
    dropi: "Dropi",
    cj: "CJ Dropshipping",
    shopify: "Shopify",
    traditional: "Dropshipping classique",
    custom: "Autre app",
  };
  return lang === "fr" ? fr[app] : ar[app];
}

export function commissionLabel(app: FulfillmentApp, lang: "ar" | "fr"): string {
  if (lang === "fr") {
    if (app === "dropi") return "Commission Dropi (%)";
    if (app === "cj") return "Frais CJ (%)";
    if (app === "shopify") return "Frais Shopify + paiement (%)";
    if (app === "traditional") return "Frais / commission (%)";
    return "Frais de l’app (%)";
  }
  if (app === "dropi") return "عمولة Dropi (%)";
  if (app === "cj") return "رسوم CJ (%)";
  if (app === "shopify") return "رسوم Shopify + الدفع (%)";
  if (app === "traditional") return "رسوم / عمولة (%)";
  return "رسوم التطبيق (%)";
}
