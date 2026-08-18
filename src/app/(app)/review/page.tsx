import { RecordsView } from "@/components/views/RecordsView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("review")]);
  return <RecordsView kind="review" records={records} extrasReady={data.extrasReady} />;
}
