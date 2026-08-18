import { DailyTracker } from "@/components/DailyTracker";
import { PageHeader } from "@/components/ui";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const data = await loadCore();
  return (
    <div>
      <PageHeader
        kicker="التشغيل"
        title="إدخال اليوم"
        description="طلبات، تأكيد، تسليم، إيرادات وإعلانات. التاريخ الافتراضي هو اليوم."
      />
      <DailyTracker entries={data.entries} products={data.products} />
    </div>
  );
}
