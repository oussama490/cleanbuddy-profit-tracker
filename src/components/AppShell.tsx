"use client";

import { logoutAction } from "@/app/login/actions";
import type {
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
} from "@/lib/types";
import { useState } from "react";
import { DailyTracker } from "./DailyTracker";
import { CurrencyToggle, DisplayCurrencyProvider } from "./DisplayCurrency";
import { ProductCalculator } from "./ProductCalculator";
import { RatesProvider } from "./RatesProvider";

type AppShellProps = {
  entries: DailyEntry[];
  products: ProductCalculation[];
  supabaseReady: boolean;
  schemaReady: boolean;
  passwordEnabled: boolean;
  initialSnapshot: ExchangeRateSnapshot | null;
  ratesError: string | null;
};

export function AppShell({
  entries,
  products,
  supabaseReady,
  schemaReady,
  passwordEnabled,
  initialSnapshot,
  ratesError,
}: AppShellProps) {
  const [tab, setTab] = useState<"daily" | "pricing">("daily");

  return (
    <RatesProvider
      initialSnapshot={initialSnapshot}
      initialError={ratesError}
    >
      <DisplayCurrencyProvider>
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-10 pt-5">
          <header className="mb-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-teal-800">Cleanbuddy</p>
                <h1 className="text-2xl font-bold leading-tight text-stone-900">
                  تتبع أرباح كلينبادي
                </h1>
              </div>
              {passwordEnabled ? (
                <form action={logoutAction}>
                  <button className="text-sm text-stone-500 underline" type="submit">
                    خروج
                  </button>
                </form>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-500">العملة المرجعية للعرض</p>
              <CurrencyToggle />
            </div>
          </header>

          {!supabaseReady ? (
            <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              أضف متغيرات Supabase في ملف البيئة ثم نفّذ supabase/schema.sql لتخزين البيانات.
            </p>
          ) : !schemaReady ? (
            <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              المفاتيح صحيحة، لكن الجداول غير موجودة بعد. افتح SQL Editor في
              Supabase، الصق محتوى ملف schema.sql ثم اضغط Run.
            </p>
          ) : null}

          <nav className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-stone-200">
            <button
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                tab === "daily" ? "bg-teal-700 text-white" : "text-stone-600"
              }`}
              type="button"
              onClick={() => setTab("daily")}
            >
              الأداء اليومي
            </button>
            <button
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                tab === "pricing" ? "bg-teal-700 text-white" : "text-stone-600"
              }`}
              type="button"
              onClick={() => setTab("pricing")}
            >
              حاسبة التسعير
            </button>
          </nav>

          {tab === "daily" ? (
            <DailyTracker entries={entries} products={products} />
          ) : (
            <ProductCalculator products={products} />
          )}
        </div>
      </DisplayCurrencyProvider>
    </RatesProvider>
  );
}
