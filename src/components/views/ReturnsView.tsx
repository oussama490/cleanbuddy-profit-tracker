"use client";

import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui";
import {
  estimatedReturnLossCad,
  filterEntries,
  money,
  periodStart,
  summarizePeriod,
  unitCogsFromProducts,
} from "@/lib/insights";
import { formatDisplayDate, formatMoney, formatPercent } from "@/lib/format";
import type { DailyEntry, ExchangeRateSnapshot, ProductCalculation } from "@/lib/types";

export function ReturnsView({
  entries,
  products,
  snapshot,
}: {
  entries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
}) {
  const { currency } = useDisplayCurrency();
  const unitCogsCad = unitCogsFromProducts(products);
  const month = filterEntries(entries, periodStart("30"));
  const summary = summarizePeriod(month, unitCogsCad);
  const lossCad = estimatedReturnLossCad(summary.returned, products);
  const fx = snapshot ?? month[0]?.exchange_rate_snapshot ?? null;
  const show = (cad: number) => (fx ? formatMoney(money(cad, currency, fx), currency) : "—");
  const worst = [...month]
    .filter((entry) => entry.returned > 0)
    .sort((a, b) => b.returned - a.returned)
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        kicker="المرتجعات"
        title="تكلفة الرفض"
        description="الطلبات المرتجعة دفعت شحن وتكلفة منتج دون إيراد. هذا تقدير من أرقامك، لك وحدك."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="مرتجع · ٣٠ يوماً" value={String(summary.returned)} tone="loss" />
        <KpiCard label="نسبة الرفض من المؤكد" value={formatPercent(summary.returnRate)} />
        <KpiCard label="تكلفة تقديرية" value={show(lossCad)} hint="منتج + شحن متوسط" />
        <KpiCard label="مسلّم مقابل مرتجع" value={`${summary.delivered} / ${summary.returned}`} />
      </div>
      {worst.length === 0 ? (
        <EmptyState title="لا مرتجعات مسجّلة" body="إذا ظهر رفض في COD، سجّله في إدخال اليوم." />
      ) : (
        <section className="cb-card overflow-hidden p-0">
          <div className="border-b border-line px-4 py-3 font-semibold">أعلى أيام الرفض</div>
          <ul className="divide-y divide-line/80">
            {worst.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{formatDisplayDate(entry.entry_date)}</span>
                <span className="font-semibold text-loss">{entry.returned} مرتجع</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
