"use client";

import type { Currency } from "@/lib/types";
import { CURRENCIES } from "@/lib/types";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type DisplayCurrencyState = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyState | null>(null);

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("CAD");

  return (
    <DisplayCurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyState {
  const context = useContext(DisplayCurrencyContext);
  if (!context) {
    throw new Error(
      "useDisplayCurrency must be used within DisplayCurrencyProvider",
    );
  }
  return context;
}

export function CurrencyToggle() {
  const { currency, setCurrency } = useDisplayCurrency();

  return (
    <div className="inline-flex rounded-full border border-teal-200 bg-white p-1">
      {CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          className={`min-h-10 rounded-full px-3 text-sm font-semibold transition ${
            currency === code
              ? "bg-teal-700 text-white"
              : "text-teal-800 hover:bg-teal-50"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
