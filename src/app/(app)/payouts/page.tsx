import { PayoutsView } from "@/components/views/LifeViews";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("payout")]);
  return (
    <PayoutsView
      entries={data.entries}
      snapshot={data.snapshot}
      records={records}
      extrasReady={data.extrasReady}
    />
  );
}
