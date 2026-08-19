import { SettingsView } from "@/components/views/SettingsView";
import { lifeTablesReady } from "@/app/actions/life";
import { listWorkspaceRecords } from "@/app/actions/workspace";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [data, records, lifeReady] = await Promise.all([
    loadCore(),
    listWorkspaceRecords(),
    lifeTablesReady(),
  ]);
  return (
    <SettingsView
      supabaseReady={data.supabaseReady}
      schemaReady={data.schemaReady}
      extrasReady={data.extrasReady}
      lifeReady={lifeReady}
      passwordEnabled={data.passwordEnabled}
      productCount={data.products.length}
      entryCount={data.entries.length}
      entries={data.entries}
      products={data.products}
      records={records}
    />
  );
}
