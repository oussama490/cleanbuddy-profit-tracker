import type { Currency, ExchangeRateSnapshot } from "./types";
import { convertFromCad, convertToCad } from "./currency";

const numberFormat = new Intl.NumberFormat("ar", {
  numberingSystem: "latn",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNumberFormat = new Intl.NumberFormat("ar", {
  numberingSystem: "latn",
  maximumFractionDigits: 1,
});

const percentFormat = new Intl.NumberFormat("ar", {
  numberingSystem: "latn",
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("ar", {
    numberingSystem: "latn",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatMoney(amount: number, currency: Currency): string {
  return `${numberFormat.format(amount)} ${currency}`;
}

export function formatMoneyCad(amountCad: number): string {
  return formatMoney(amountCad, "CAD");
}

export function formatPercent(ratio: number | null): string {
  if (ratio === null || Number.isNaN(ratio)) return "—";
  return percentFormat.format(ratio);
}

export function formatInteger(value: number): string {
  return compactNumberFormat.format(value);
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat("ar", {
    numberingSystem: "latn",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function moneyInDisplayCurrency(
  amount: number,
  from: Currency,
  display: Currency,
  snapshot: ExchangeRateSnapshot,
): number {
  const cad = convertToCad(amount, from, snapshot);
  return convertFromCad(cad, display, snapshot);
}
