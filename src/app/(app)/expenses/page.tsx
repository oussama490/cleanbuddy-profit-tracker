import { RecordsView } from "@/components/views/RecordsView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("expense")]);
  return <RecordsView kind="expense" records={records} extrasReady={data.extrasReady} />;
}
