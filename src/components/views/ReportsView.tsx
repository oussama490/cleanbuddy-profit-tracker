"use client";

import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui";
import {
  filterEntries,
  money,
  periodLabel,
  periodStart,
  summarizePeriod,
  unitCogsFromProducts,
  type PeriodKey,
} from "@/lib/insights";
import {
  confirmationRate,
  dailyAdsCad,
  dailyNetProfitCad,
  dailyRevenueCad,
  deliveryRate,
} from "@/lib/calculations";
import { formatDisplayDate, formatMoney, formatPercent } from "@/lib/format";
import type { DailyEntry, ExchangeRateSnapshot, ProductCalculation } from "@/lib/types";
import { useMemo, useState } from "react";

const PERIODS: PeriodKey[] = ["7", "30", "month", "all"];

export function ReportsView({
  entries,
  products,
  snapshot,
}: {
  entries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
}) {
  const { currency } = useDisplayCurrency();
  const [period, setPeriod] = useState<PeriodKey>("month");
  const unitCogsCad = unitCogsFromProducts(products);
  const rows = useMemo(
    () => filterEntries(entries, periodStart(period)),
    [entries, period],
  );
  const summary = summarizePeriod(rows, unitCogsCad);
  const fx = snapshot ?? rows[0]?.exchange_rate_snapshot ?? null;
  const show = (cad: number) => (fx ? formatMoney(money(cad, currency, fx), currency) : "—");

  function exportCsv() {
    const header = [
      "date",
      "new_orders",
      "confirmed",
      "delivered",
      "returned",
      `revenue_${currency}`,
      `ads_${currency}`,
      `profit_${currency}`,
      "confirm_rate",
      "delivery_rate",
    ];
    const body = [...rows]
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
      .map((entry) => {
        const snap = entry.exchange_rate_snapshot;
        return [
          entry.entry_date,
          entry.new_orders,
          entry.confirmed,
          entry.delivered,
          entry.returned,
          money(dailyRevenueCad(entry), currency, snap).toFixed(2),
          money(dailyAdsCad(entry), currency, snap).toFixed(2),
          money(dailyNetProfitCad(entry, unitCogsCad), currency, snap).toFixed(2),
          confirmationRate(entry) ?? "",
          deliveryRate(entry) ?? "",
        ];
      });
    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cleanbuddy-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        kicker="التقارير"
        title="تقرير الفترة"
        description="كل الأرقام في جدول واحد، مع تصدير لملفك الشخصي."
        actions={
          <button className="cb-btn-ghost" type="button" onClick={exportCsv} disabled={rows.length === 0}>
            تصدير CSV
          </button>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {PERIODS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ${
              period === key ? "bg-forest text-white" : "border border-line bg-white text-muted"
            }`}
          >
            {periodLabel(key)}
          </button>
        ))}
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="الربح" value={show(summary.profitCad)} tone={summary.profitCad >= 0 ? "profit" : "loss"} />
        <KpiCard label="الإيرادات" value={show(summary.revenueCad)} />
        <KpiCard label="الإعلانات" value={show(summary.adsCad)} tone="gold" />
        <KpiCard label="أيام مسجّلة" value={String(summary.days)} />
      </div>
      <section className="cb-card overflow-hidden p-0">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title="لا بيانات في هذه الفترة" body="أضف إدخالات يومية لبناء التقرير." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead className="bg-[#f6f1e8] text-muted">
                <tr>
                  {["التاريخ", "طلبات", "تأكيد", "تسليم", "إيراد", "ربح"].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...rows]
                  .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
                  .map((entry) => {
                    const snap = entry.exchange_rate_snapshot;
                    return (
                      <tr key={entry.id} className="border-t border-line/70">
                        <td className="px-4 py-3">{formatDisplayDate(entry.entry_date)}</td>
                        <td className="px-4 py-3">{entry.new_orders}</td>
                        <td className="px-4 py-3">{formatPercent(confirmationRate(entry))}</td>
                        <td className="px-4 py-3">{formatPercent(deliveryRate(entry))}</td>
                        <td className="px-4 py-3">
                          {formatMoney(money(dailyRevenueCad(entry), currency, snap), currency)}
                        </td>
                        <td className="px-4 py-3">
                          {formatMoney(
                            money(dailyNetProfitCad(entry, unitCogsCad), currency, snap),
                            currency,
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
