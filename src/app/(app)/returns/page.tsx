import { ReturnsView } from "@/components/views/ReturnsView";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const data = await loadCore();
  return (
    <ReturnsView
      entries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
    />
  );
}
