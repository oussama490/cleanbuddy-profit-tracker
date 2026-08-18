import { ReportsView } from "@/components/views/ReportsView";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await loadCore();
  return (
    <ReportsView
      entries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
    />
  );
}
