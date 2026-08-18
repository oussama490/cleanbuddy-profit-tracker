import { AdsView } from "@/components/views/AdsView";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const data = await loadCore();
  return (
    <AdsView
      entries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
    />
  );
}
