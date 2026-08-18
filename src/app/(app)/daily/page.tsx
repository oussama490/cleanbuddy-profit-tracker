import { DailyTracker } from "@/components/DailyTracker";
import { I18nHeader } from "@/components/I18nHeader";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const data = await loadCore();
  return (
    <div>
      <I18nHeader kicker="daily.kicker" title="daily.title" description="daily.desc" />
      <DailyTracker entries={data.entries} products={data.products} />
    </div>
  );
}
