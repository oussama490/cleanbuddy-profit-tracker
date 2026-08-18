import { averageUnitCogsCad, dailyAdsCad, dailyNetProfitCad, dailyRevenueCad } from "./calculations";
import { convertFromCad } from "./currency";
import { todayIsoDate } from "./format";
import type {
  Currency,
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
} from "./types";

export type PeriodKey = "7" | "30" | "month" | "all";

export type PeriodSummary = {
  days: number;
  newOrders: number;
  confirmed: number;
  delivered: number;
  returned: number;
  revenueCad: number;
  adsCad: number;
  cogsCad: number;
  profitCad: number;
  confirmationRate: number | null;
  deliveryRate: number | null;
  returnRate: number | null;
  deliveredOfNew: number | null;
  roas: number | null;
  cpaPerNewCad: number | null;
  cpaPerDeliveredCad: number | null;
  aovCad: number | null;
  profitPerDeliveredCad: number | null;
};

function isoDaysAgo(days: number): string {
  const date = new Date(`${todayIsoDate()}T12:00:00`);
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonthIso(): string {
  const today = todayIsoDate();
  return `${today.slice(0, 7)}-01`;
}

export function periodStart(key: PeriodKey): string | null {
  if (key === "7") return isoDaysAgo(6);
  if (key === "30") return isoDaysAgo(29);
  if (key === "month") return startOfMonthIso();
  return null;
}

export function periodLabel(key: PeriodKey): string {
  if (key === "7") return "٧ أيام";
  if (key === "30") return "٣٠ يوماً";
  if (key === "month") return "هذا الشهر";
  return "كل الفترة";
}

export function filterEntries(
  entries: DailyEntry[],
  from: string | null,
  to?: string | null,
): DailyEntry[] {
  return entries.filter((entry) => {
    if (from && entry.entry_date < from) return false;
    if (to && entry.entry_date > to) return false;
    return true;
  });
}

export function summarizePeriod(
  entries: DailyEntry[],
  unitCogsCad: number,
): PeriodSummary {
  const newOrders = entries.reduce((sum, entry) => sum + entry.new_orders, 0);
  const confirmed = entries.reduce((sum, entry) => sum + entry.confirmed, 0);
  const delivered = entries.reduce((sum, entry) => sum + entry.delivered, 0);
  const returned = entries.reduce((sum, entry) => sum + entry.returned, 0);
  const revenueCad = entries.reduce((sum, entry) => sum + dailyRevenueCad(entry), 0);
  const adsCad = entries.reduce((sum, entry) => sum + dailyAdsCad(entry), 0);
  const cogsCad = delivered * unitCogsCad;
  const profitCad = entries.reduce(
    (sum, entry) => sum + dailyNetProfitCad(entry, unitCogsCad),
    0,
  );

  return {
    days: entries.length,
    newOrders,
    confirmed,
    delivered,
    returned,
    revenueCad,
    adsCad,
    cogsCad,
    profitCad,
    confirmationRate: newOrders > 0 ? confirmed / newOrders : null,
    deliveryRate: confirmed > 0 ? delivered / confirmed : null,
    returnRate: confirmed > 0 ? returned / confirmed : null,
    deliveredOfNew: newOrders > 0 ? delivered / newOrders : null,
    roas: adsCad > 0 ? revenueCad / adsCad : null,
    cpaPerNewCad: newOrders > 0 ? adsCad / newOrders : null,
    cpaPerDeliveredCad: delivered > 0 ? adsCad / delivered : null,
    aovCad: delivered > 0 ? revenueCad / delivered : null,
    profitPerDeliveredCad: delivered > 0 ? profitCad / delivered : null,
  };
}

export function money(
  amountCad: number,
  display: Currency,
  snapshot: ExchangeRateSnapshot | null,
): number {
  if (!snapshot) return amountCad;
  return convertFromCad(amountCad, display, snapshot);
}

export function previousPeriodRange(
  key: PeriodKey,
  currentFrom: string | null,
): { from: string | null; to: string | null } {
  if (key === "all" || !currentFrom) return { from: null, to: null };
  const days = key === "7" ? 7 : key === "30" ? 30 : daysInCurrentMonth();
  const fromDate = new Date(`${currentFrom}T12:00:00`);
  fromDate.setDate(fromDate.getDate() - days);
  const toDate = new Date(`${currentFrom}T12:00:00`);
  toDate.setDate(toDate.getDate() - 1);
  return { from: toIso(fromDate), to: toIso(toDate) };
}

function daysInCurrentMonth(): number {
  const today = todayIsoDate();
  const [year, month] = today.split("-").map(Number);
  const last = new Date(year, month, 0).getDate();
  const current = Number(today.slice(8));
  return Math.min(current, last);
}

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

export function unitCogsFromProducts(products: ProductCalculation[]): number {
  return averageUnitCogsCad(products);
}

export function estimatedReturnLossCad(
  returned: number,
  products: ProductCalculation[],
): number {
  if (returned <= 0 || products.length === 0) {
    return returned * unitCogsFromProducts(products);
  }
  const avg = products.reduce((sum, product) => {
    const snapshot = product.exchange_rate_snapshot;
    const supplier = product.supplier_cost_amount * snapshot.toCad[product.supplier_cost_currency];
    const shipping = product.shipping_cost_amount * snapshot.toCad[product.shipping_cost_currency];
    return sum + supplier + shipping;
  }, 0);
  return returned * (avg / products.length);
}

export function breakEvenDeliveries(
  adsCad: number,
  profitPerDeliveredCad: number | null,
): number | null {
  if (!profitPerDeliveredCad || profitPerDeliveredCad <= 0) return null;
  return adsCad / profitPerDeliveredCad;
}

export function projectFromBudget(input: {
  dailyAdsCad: number;
  days: number;
  confirmationPct: number;
  deliveryPct: number;
  clickToOrderPct: number;
  cpcCad: number;
  profitPerDeliveredCad: number;
}): {
  clicks: number;
  newOrders: number;
  delivered: number;
  adsCad: number;
  profitCad: number;
} {
  const adsCad = input.dailyAdsCad * input.days;
  const clicks = input.cpcCad > 0 ? adsCad / input.cpcCad : 0;
  const newOrders = clicks * (input.clickToOrderPct / 100);
  const delivered =
    newOrders * (input.confirmationPct / 100) * (input.deliveryPct / 100);
  const profitCad = delivered * input.profitPerDeliveredCad - adsCad;
  return { clicks, newOrders, delivered, adsCad, profitCad };
}

export function uniqueSnapshots(entries: DailyEntry[]): ExchangeRateSnapshot[] {
  const map = new Map<string, ExchangeRateSnapshot>();
  for (const entry of entries) {
    const key = entry.exchange_rate_snapshot.date;
    if (!map.has(key)) map.set(key, entry.exchange_rate_snapshot);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}
