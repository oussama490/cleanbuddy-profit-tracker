import { AppFrame } from "@/components/AppFrame";
import { DisplayCurrencyProvider } from "@/components/DisplayCurrency";
import { RatesProvider } from "@/components/RatesProvider";
import { loadRates } from "@/lib/load";
import { appPassword, isSupabaseConfigured } from "@/lib/env";
import { tablesReady } from "@/app/actions/daily";
import type { ReactNode } from "react";

export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [rates, schemaReady] = await Promise.all([loadRates(), tablesReady()]);

  return (
    <RatesProvider
      initialSnapshot={rates.snapshot}
      initialError={rates.error}
    >
      <DisplayCurrencyProvider>
        <AppFrame
          passwordEnabled={Boolean(appPassword())}
          supabaseReady={isSupabaseConfigured()}
          schemaReady={schemaReady}
        >
          {children}
        </AppFrame>
      </DisplayCurrencyProvider>
    </RatesProvider>
  );
}
