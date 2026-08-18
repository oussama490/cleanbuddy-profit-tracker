import { RecordsView } from "@/components/views/RecordsView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("goal")]);
  return (
    <RecordsView kind="goal" records={records} extrasReady={data.extrasReady} />
  );
}
