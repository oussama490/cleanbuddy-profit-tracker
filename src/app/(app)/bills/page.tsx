import { RecordsView } from "@/components/views/RecordsView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("bill")]);
  return <RecordsView kind="bill" records={records} extrasReady={data.extrasReady} />;
}
