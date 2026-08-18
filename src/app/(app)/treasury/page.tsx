import { TreasuryView } from "@/components/views/TreasuryView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function TreasuryPage() {
  const [data, records] = await Promise.all([loadCore(), loadRecords("cash")]);
  return (
    <TreasuryView
      entries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
      records={records}
      extrasReady={data.extrasReady}
    />
  );
}
