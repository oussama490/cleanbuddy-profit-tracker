"use client";

import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { usePrefs } from "@/components/PrefsProvider";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui";
import {
  filterEntries,
  money,
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
  const { t } = usePrefs();
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
        kicker={t("nav.reports")}
        title={t("reports.title")}
        description={t("reports.desc")}
        actions={
          <button className="cb-btn-ghost" type="button" onClick={exportCsv} disabled={rows.length === 0}>
            {t("reports.export")}
          </button>
        }
      />
      <div className="mb-5 overflow-x-auto">
        <div className="cb-seg">
          {PERIODS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`cb-seg-item whitespace-nowrap px-3 text-[12px] ${
                period === key ? "cb-seg-item-on" : ""
              }`}
            >
              {t(`period.${key}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t("dash.profit")} value={show(summary.profitCad)} tone={summary.profitCad >= 0 ? "profit" : "loss"} />
        <KpiCard label={t("dash.revenue")} value={show(summary.revenueCad)} />
        <KpiCard label={t("nav.ads")} value={show(summary.adsCad)} tone="gold" />
        <KpiCard label={t("reports.days")} value={String(summary.days)} />
      </div>
      <section className="cb-card overflow-hidden p-0">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t("reports.empty")} body={t("reports.emptyBody")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="cb-table">
              <thead>
                <tr>
                  {[
                    t("common.date"),
                    t("dash.orders"),
                    t("reports.confirm"),
                    t("reports.deliver"),
                    t("dash.rev"),
                    t("dash.profitShort"),
                  ].map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...rows]
                  .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
                  .map((entry) => {
                    const snap = entry.exchange_rate_snapshot;
                    return (
                      <tr key={entry.id}>
                        <td className="cb-num">{formatDisplayDate(entry.entry_date)}</td>
                        <td className="cb-num">{entry.new_orders}</td>
                        <td className="cb-num">{formatPercent(confirmationRate(entry))}</td>
                        <td className="cb-num">{formatPercent(deliveryRate(entry))}</td>
                        <td className="cb-num">
                          {formatMoney(money(dailyRevenueCad(entry), currency, snap), currency)}
                        </td>
                        <td className="cb-num">
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
