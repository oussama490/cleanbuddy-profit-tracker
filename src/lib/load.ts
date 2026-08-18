import { listDailyEntries, tablesReady } from "@/app/actions/daily";
import { listProducts } from "@/app/actions/products";
import { extrasReady, listWorkspaceRecords } from "@/app/actions/workspace";
import { fetchExchangeSnapshot } from "@/lib/currency";
import { appPassword, isSupabaseConfigured } from "@/lib/env";
import type {
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
  WorkspaceKind,
  WorkspaceRecord,
} from "@/lib/types";

export async function loadRates(): Promise<{
  snapshot: ExchangeRateSnapshot | null;
  error: string | null;
}> {
  try {
    return { snapshot: await fetchExchangeSnapshot(), error: null };
  } catch (error) {
    return {
      snapshot: null,
      error:
        error instanceof Error ? error.message : "فشل تحميل أسعار الصرف.",
    };
  }
}

export async function loadCore() {
  const [entries, products, rates, schemaReady, extras] = await Promise.all([
    listDailyEntries(),
    listProducts(),
    loadRates(),
    tablesReady(),
    extrasReady(),
  ]);

  return {
    entries,
    products,
    snapshot: rates.snapshot,
    ratesError: rates.error,
    schemaReady,
    extrasReady: extras,
    supabaseReady: isSupabaseConfigured(),
    passwordEnabled: Boolean(appPassword()),
  };
}

export async function loadRecords(kind: WorkspaceKind): Promise<WorkspaceRecord[]> {
  return listWorkspaceRecords(kind);
}

export type CoreData = {
  entries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
  ratesError: string | null;
  schemaReady: boolean;
  extrasReady: boolean;
  supabaseReady: boolean;
  passwordEnabled: boolean;
};
