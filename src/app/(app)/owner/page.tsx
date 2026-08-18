import { OwnerView } from "@/components/views/LifeViews";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const data = await loadCore();
  return (
    <OwnerView
      entries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
    />
  );
}
