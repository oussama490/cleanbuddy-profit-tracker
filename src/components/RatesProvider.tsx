"use client";

import type { ExchangeRateSnapshot } from "@/lib/types";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type RatesState = {
  snapshot: ExchangeRateSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const RatesContext = createContext<RatesState | null>(null);

export function RatesProvider({
  children,
  initialSnapshot,
  initialError = null,
}: {
  children: ReactNode;
  initialSnapshot: ExchangeRateSnapshot | null;
  initialError?: string | null;
}) {
  const [snapshot, setSnapshot] = useState<ExchangeRateSnapshot | null>(
    initialSnapshot,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rates", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "فشل تحميل أسعار الصرف.");
      }
      setSnapshot(data as ExchangeRateSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل أسعار الصرف.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RatesContext.Provider value={{ snapshot, loading, error, refresh }}>
      {children}
    </RatesContext.Provider>
  );
}

export function useRates(): RatesState {
  const context = useContext(RatesContext);
  if (!context) {
    throw new Error("useRates must be used within RatesProvider");
  }
  return context;
}
