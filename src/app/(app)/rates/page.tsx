import { RatesView } from "@/components/views/RatesView";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  const data = await loadCore();
  return <RatesView entries={data.entries} snapshot={data.snapshot} />;
}
