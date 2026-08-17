import type { Currency, ExchangeRateSnapshot } from "./types";
import { CURRENCIES } from "./types";

const FRANKFURTER_URL =
  "https://api.frankfurter.app/latest?from=CAD&to=MXN,USD";

type FrankfurterResponse = {
  amount: number;
  base: string;
  date: string;
  rates: {
    MXN?: number;
    USD?: number;
  };
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function convertToCad(
  amount: number,
  currency: Currency,
  snapshot: ExchangeRateSnapshot,
): number {
  return amount * snapshot.toCad[currency];
}

export function convertFromCad(
  amountCad: number,
  currency: Currency,
  snapshot: ExchangeRateSnapshot,
): number {
  const rate = snapshot.toCad[currency];
  if (!rate) return 0;
  return amountCad / rate;
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  snapshot: ExchangeRateSnapshot,
): number {
  if (from === to) return amount;
  return convertFromCad(convertToCad(amount, from, snapshot), to, snapshot);
}

export function otherCurrencies(current: Currency): Currency[] {
  return CURRENCIES.filter((currency) => currency !== current);
}

export function snapshotFromFrankfurter(
  data: FrankfurterResponse,
  fetchedAt = new Date().toISOString(),
): ExchangeRateSnapshot {
  const mxnPerCad = data.rates.MXN;
  const usdPerCad = data.rates.USD;

  if (!mxnPerCad || !usdPerCad) {
    throw new Error("Frankfurter n'a pas renvoyé les taux MXN/USD.");
  }

  return {
    date: data.date,
    fetchedAt,
    source: "frankfurter",
    toCad: {
      CAD: 1,
      MXN: 1 / mxnPerCad,
      USD: 1 / usdPerCad,
    },
  };
}

export async function fetchExchangeSnapshot(): Promise<ExchangeRateSnapshot> {
  const response = await fetch(FRANKFURTER_URL, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Frankfurter HTTP ${response.status}`);
  }

  const data = (await response.json()) as FrankfurterResponse;
  return snapshotFromFrankfurter(data);
}

export function isValidSnapshot(
  value: unknown,
): value is ExchangeRateSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as ExchangeRateSnapshot;
  return (
    typeof snapshot.date === "string" &&
    typeof snapshot.fetchedAt === "string" &&
    snapshot.source === "frankfurter" &&
    typeof snapshot.toCad?.CAD === "number" &&
    typeof snapshot.toCad?.MXN === "number" &&
    typeof snapshot.toCad?.USD === "number"
  );
}
