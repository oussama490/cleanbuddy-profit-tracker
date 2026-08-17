import { listDailyEntries, tablesReady } from "@/app/actions/daily";
import { listProducts } from "@/app/actions/products";
import { AppShell } from "@/components/AppShell";
import { fetchExchangeSnapshot } from "@/lib/currency";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ExchangeRateSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [entries, products, rates, schemaReady] = await Promise.all([
    listDailyEntries(),
    listProducts(),
    loadRates(),
    tablesReady(),
  ]);

  return (
    <AppShell
      entries={entries}
      products={products}
      supabaseReady={isSupabaseConfigured()}
      schemaReady={schemaReady}
      passwordEnabled={Boolean(process.env.APP_PASSWORD)}
      initialSnapshot={rates.snapshot}
      ratesError={rates.error}
    />
  );
}

async function loadRates(): Promise<{
  snapshot: ExchangeRateSnapshot | null;
  error: string | null;
}> {
  try {
    return { snapshot: await fetchExchangeSnapshot(), error: null };
  } catch (error) {
    return {
      snapshot: null,
      error:
        error instanceof Error
          ? error.message
          : "فشل تحميل أسعار الصرف.",
    };
  }
}
