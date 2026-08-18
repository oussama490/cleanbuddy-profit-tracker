import { convertAmount, convertToCad } from "./currency";
import type { DailyEntry, ExchangeRateSnapshot } from "./types";

export const DEFAULT_CONFIRMATION_PCT = 50;
export const DEFAULT_DELIVERY_PCT = 70;
export const DEFAULT_SAFETY_PCT = 25;
export const DEFAULT_CLICK_TO_ORDER_PCT = 2;

export type AdsEstimate = {
  productCostMxn: number;
  commissionMxn: number;
  grossBeforeAdsMxn: number;
  grossBeforeAdsPct: number;
  deliveredOfNew: number;
  expectedGrossPerOrderMxn: number;
  breakEvenCpaMxn: number;
  maxCpaMxn: number;
  maxCpaUsd: number;
  maxCpaCad: number;
  recommendedCpaMxn: number;
  recommendedCpaUsd: number;
  maxCpcUsd: number | null;
  netIfRecommendedMxn: number;
  netIfRecommendedPct: number;
  verdict: "go" | "caution" | "nogo";
};

export function historicalFunnel(entries: DailyEntry[]): {
  confirmationPct: number | null;
  deliveryPct: number | null;
} {
  const newOrders = entries.reduce((sum, entry) => sum + entry.new_orders, 0);
  const confirmed = entries.reduce((sum, entry) => sum + entry.confirmed, 0);
  const delivered = entries.reduce((sum, entry) => sum + entry.delivered, 0);
  return {
    confirmationPct: newOrders > 0 ? (confirmed / newOrders) * 100 : null,
    deliveryPct: confirmed > 0 ? (delivered / confirmed) * 100 : null,
  };
}

export function estimateAds(input: {
  supplierMxn: number;
  shippingMxn: number;
  saleMxn: number;
  dropiCommissionPct: number;
  confirmationPct: number;
  deliveryPct: number;
  safetyPct: number;
  clickToOrderPct: number;
  snapshot: ExchangeRateSnapshot;
}): AdsEstimate | null {
  if (input.saleMxn <= 0) return null;

  const commissionMxn = input.saleMxn * (input.dropiCommissionPct / 100);
  const productCostMxn = input.supplierMxn + input.shippingMxn;
  const grossBeforeAdsMxn = input.saleMxn - productCostMxn - commissionMxn;
  const confirm = Math.min(Math.max(input.confirmationPct, 0), 100) / 100;
  const delivery = Math.min(Math.max(input.deliveryPct, 0), 100) / 100;
  const deliveredOfNew = confirm * delivery;
  const expectedGrossPerOrderMxn = grossBeforeAdsMxn * deliveredOfNew;
  const safety = Math.min(Math.max(input.safetyPct, 0), 95) / 100;
  const breakEvenCpaMxn = Math.max(expectedGrossPerOrderMxn, 0);
  const maxCpaMxn = Math.max(breakEvenCpaMxn * (1 - safety), 0);
  const recommendedCpaMxn = maxCpaMxn;
  const clickRate = Math.min(Math.max(input.clickToOrderPct, 0), 100) / 100;
  const maxCpcUsd =
    clickRate > 0
      ? convertAmount(maxCpaMxn, "MXN", "USD", input.snapshot) * clickRate
      : null;
  const netIfRecommendedMxn = expectedGrossPerOrderMxn - recommendedCpaMxn;
  const netIfRecommendedPct =
    input.saleMxn > 0 ? (netIfRecommendedMxn / input.saleMxn) * 100 : 0;

  let verdict: AdsEstimate["verdict"] = "nogo";
  if (maxCpaMxn > 0 && convertAmount(maxCpaMxn, "MXN", "USD", input.snapshot) >= 6) {
    verdict = "go";
  } else if (maxCpaMxn > 0) {
    verdict = "caution";
  }

  return {
    productCostMxn,
    commissionMxn,
    grossBeforeAdsMxn,
    grossBeforeAdsPct:
      input.saleMxn > 0 ? (grossBeforeAdsMxn / input.saleMxn) * 100 : 0,
    deliveredOfNew,
    expectedGrossPerOrderMxn,
    breakEvenCpaMxn,
    maxCpaMxn,
    maxCpaUsd: convertAmount(maxCpaMxn, "MXN", "USD", input.snapshot),
    maxCpaCad: convertToCad(maxCpaMxn, "MXN", input.snapshot),
    recommendedCpaMxn,
    recommendedCpaUsd: convertAmount(
      recommendedCpaMxn,
      "MXN",
      "USD",
      input.snapshot,
    ),
    maxCpcUsd,
    netIfRecommendedMxn,
    netIfRecommendedPct,
    verdict,
  };
}

export function salePriceCoveringCpaMxn(input: {
  supplierMxn: number;
  shippingMxn: number;
  dropiCommissionPct: number;
  cpaMxn: number;
  targetMarginPct: number;
}): number | null {
  const denominator =
    1 - input.dropiCommissionPct / 100 - input.targetMarginPct / 100;
  if (denominator <= 0) return null;
  const numerator = input.supplierMxn + input.shippingMxn + input.cpaMxn;
  if (numerator <= 0) return null;
  return numerator / denominator;
}

export function costSharePct(part: number, sale: number): number {
  if (sale <= 0) return 0;
  return (part / sale) * 100;
}
