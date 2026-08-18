import { DashboardView } from "@/components/views/DashboardView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await loadCore();
  const goals = await loadRecords("goal");
  return (
    <DashboardView
      entries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
      goals={goals}
    />
  );
}
