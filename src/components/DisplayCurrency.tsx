"use client";

import type { Currency } from "@/lib/types";
import { CURRENCIES } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type DisplayCurrencyState = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyState | null>(null);
const STORAGE_KEY = "cb-display-currency";
const EVENT_KEY = "cb-currency";

function isCurrency(value: string | null): value is Currency {
  return value === "MXN" || value === "USD" || value === "CAD";
}

function getCurrency(): Currency {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return isCurrency(saved) ? saved : "CAD";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(EVENT_KEY, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(EVENT_KEY, onStoreChange);
  };
}

function getServerCurrency(): Currency {
  return "CAD";
}

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribe, getCurrency, getServerCurrency);

  const setCurrency = useCallback((next: Currency) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT_KEY));
  }, []);

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
    <div className="inline-flex rounded-full border border-line bg-white p-1 shadow-sm">
      {CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          className={`min-h-9 rounded-full px-3 text-xs font-bold tracking-wide transition ${
            currency === code
              ? "bg-forest text-white"
              : "text-forest-mid hover:bg-gold-soft/50"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
