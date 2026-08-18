import { FunnelView } from "@/components/views/FunnelView";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function FunnelPage() {
  const data = await loadCore();
  return (
    <FunnelView
      entries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
    />
  );
}
