import { SearchView } from "@/components/views/LifeViews";
import { listWorkspaceRecords } from "@/app/actions/workspace";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const [data, records] = await Promise.all([loadCore(), listWorkspaceRecords()]);
  return (
    <SearchView entries={data.entries} products={data.products} records={records} />
  );
}
