import { RecordsView } from "@/components/views/RecordsView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const [data, records] = await Promise.all([
    loadCore(),
    loadRecords("supplier"),
  ]);
  return (
    <RecordsView
      kind="supplier"
      records={records}
      extrasReady={data.extrasReady}
    />
  );
}
