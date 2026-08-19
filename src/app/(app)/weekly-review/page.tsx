import { WeeklyReviewView } from "@/components/views/WeeklyReviewView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function WeeklyReviewPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("review")]);
  return (
    <WeeklyReviewView
      records={records}
      entries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
      extrasReady={data.extrasReady}
    />
  );
}
