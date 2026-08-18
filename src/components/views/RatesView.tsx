"use client";

import { useRates } from "@/components/RatesProvider";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui";
import { uniqueSnapshots } from "@/lib/insights";
import { formatDisplayDate, formatNumber } from "@/lib/format";
import type { DailyEntry, ExchangeRateSnapshot } from "@/lib/types";

export function RatesView({
  entries,
  snapshot,
}: {
  entries: DailyEntry[];
  snapshot: ExchangeRateSnapshot | null;
}) {
  const { refresh, loading, error } = useRates();
  const current = snapshot;
  const history = uniqueSnapshots(entries);

  function cadPer(code: "MXN" | "USD") {
    if (!current) return "—";
    const perCad = 1 / current.toCad[code];
    return formatNumber(perCad, 4);
  }

  return (
    <div>
      <PageHeader
        kicker="أسعار الصرف"
        title="MXN · USD · CAD"
        description="المرجع الداخلي هو الدولار الكندي. كل إدخال يومي يحتفظ بلقطة حتى لا يتغيّر التاريخ."
        actions={
          <button className="cb-btn-ghost" type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? "جاري التحديث..." : "تحديث الآن"}
          </button>
        }
      />
      {error ? <p className="mb-4 text-sm text-loss">{error}</p> : null}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="1 CAD = MXN" value={cadPer("MXN")} tone="gold" />
        <KpiCard label="1 CAD = USD" value={cadPer("USD")} />
        <KpiCard
          label="تاريخ السوق"
          value={current?.date ? formatDisplayDate(current.date) : "—"}
          hint={current ? "Frankfurter" : "غير محمّل"}
        />
      </div>
      {history.length === 0 ? (
        <EmptyState title="لا لقطات تاريخية" body="ستظهر هنا أسعار الأيام التي حفظتها." />
      ) : (
        <section className="cb-card overflow-hidden p-0">
          <div className="border-b border-line px-4 py-3 font-semibold">لقطات محفوظة مع الإدخالات</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead className="bg-[#f6f1e8] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">MXN / CAD</th>
                  <th className="px-4 py-3 font-medium">USD / CAD</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.date} className="border-t border-line/70">
                    <td className="px-4 py-3">{formatDisplayDate(item.date)}</td>
                    <td className="px-4 py-3">{formatNumber(1 / item.toCad.MXN, 4)}</td>
                    <td className="px-4 py-3">{formatNumber(1 / item.toCad.USD, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
