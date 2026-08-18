import { ChecklistView } from "@/components/views/LifeViews";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("checklist")]);
  return <ChecklistView records={records} extrasReady={data.extrasReady} />;
}
