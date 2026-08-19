import { getPrCriteria, lifeTablesReady, listJobs } from "@/app/actions/life";
import { PrTrackerView } from "@/components/views/PrTrackerView";

export const dynamic = "force-dynamic";

export default async function PrTrackerPage() {
  const [jobs, criteria, lifeReady] = await Promise.all([
    listJobs(),
    getPrCriteria(),
    lifeTablesReady(),
  ]);
  return <PrTrackerView jobs={jobs} criteria={criteria} lifeReady={lifeReady} />;
}
