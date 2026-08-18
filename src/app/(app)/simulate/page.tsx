import { SimulateView } from "@/components/views/SimulateView";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function SimulatePage() {
  const data = await loadCore();
  return <SimulateView entries={data.entries} products={data.products} />;
}
