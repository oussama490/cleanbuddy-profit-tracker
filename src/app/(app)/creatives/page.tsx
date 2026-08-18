import { RecordsView } from "@/components/views/RecordsView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function CreativesPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("creative")]);
  return <RecordsView kind="creative" records={records} extrasReady={data.extrasReady} />;
}
