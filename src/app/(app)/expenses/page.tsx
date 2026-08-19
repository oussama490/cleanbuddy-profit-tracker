import { lifeTablesReady, listBudgetEntries, listJobs } from "@/app/actions/life";
import { BudgetView } from "@/components/views/BudgetView";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [data, entries, jobs, lifeReady, legacyExpenses] = await Promise.all([
    loadCore(),
    listBudgetEntries(),
    listJobs(),
    lifeTablesReady(),
    loadRecords("expense"),
  ]);
  return (
    <BudgetView
      entries={entries}
      jobs={jobs}
      dailyEntries={data.entries}
      products={data.products}
      snapshot={data.snapshot}
      legacyExpenses={legacyExpenses}
      lifeReady={lifeReady}
    />
  );
}
