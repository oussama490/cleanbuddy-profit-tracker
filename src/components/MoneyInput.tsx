"use client";

import { convertAmount, otherCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { Currency, ExchangeRateSnapshot } from "@/lib/types";
import { CURRENCIES } from "@/lib/types";

type MoneyInputProps = {
  id: string;
  label: string;
  amount: string;
  currency: Currency;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: Currency) => void;
  snapshot: ExchangeRateSnapshot | null;
  hint?: string;
};

export function MoneyInput({
  id,
  label,
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  snapshot,
  hint,
}: MoneyInputProps) {
  const numericAmount = Number(amount);
  const hasAmount = amount !== "" && Number.isFinite(numericAmount);

  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="flex gap-2">
        <input
          id={id}
          className="cb-input min-w-0 flex-1"
          inputMode="decimal"
          type="text"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          placeholder="0"
        />
        <select
          aria-label="العملة"
          className="cb-input w-24 shrink-0 px-2"
          value={currency}
          onChange={(event) =>
            onCurrencyChange(event.target.value as Currency)
          }
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
      <p className="min-h-5 text-xs text-teal-800">
        {hasAmount && snapshot
          ? `= ${otherCurrencies(currency)
              .map((code) =>
                formatMoney(
                  convertAmount(numericAmount, currency, code, snapshot),
                  code,
                ),
              )
              .join(" / ")}`
          : snapshot
            ? "أدخل مبلغاً لعرض التحويل"
            : "جاري تحميل أسعار الصرف..."}
      </p>
    </label>
  );
}
