import { CalendarView } from "@/components/views/LifeViews";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const data = await loadCore();
  return <CalendarView entries={data.entries} />;
}
