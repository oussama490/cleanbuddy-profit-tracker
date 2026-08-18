import { RecordsView } from "@/components/views/RecordsView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const [data, records] = await Promise.all([
    loadCore(),
    loadRecords("journal"),
  ]);
  return (
    <RecordsView
      kind="journal"
      records={records}
      extrasReady={data.extrasReady}
    />
  );
}
