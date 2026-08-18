"use client";

import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui";
import { dailyAdsCad, dailyRevenueCad } from "@/lib/calculations";
import {
  filterEntries,
  money,
  periodStart,
  summarizePeriod,
  unitCogsFromProducts,
} from "@/lib/insights";
import { formatDisplayDate, formatMoney } from "@/lib/format";
import { usePrefs } from "@/components/PrefsProvider";
import type { DailyEntry, ExchangeRateSnapshot, ProductCalculation } from "@/lib/types";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AdsView({
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
  const unitCogsCad = unitCogsFromProducts(products);
  const month = filterEntries(entries, periodStart("30"));
  const summary = summarizePeriod(month, unitCogsCad);
  const fx = snapshot ?? month[0]?.exchange_rate_snapshot ?? null;
  const show = (cad: number) => (fx ? formatMoney(money(cad, currency, fx), currency) : "—");
  const points = [...month]
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map((entry) => {
      const ads = dailyAdsCad(entry);
      const revenue = dailyRevenueCad(entry);
      return {
        date: entry.entry_date.slice(5),
        ads: money(ads, currency, entry.exchange_rate_snapshot),
        roas: ads > 0 ? revenue / ads : 0,
        cpa:
          entry.new_orders > 0
            ? money(ads / entry.new_orders, currency, entry.exchange_rate_snapshot)
            : 0,
      };
    });

  return (
    <div>
      <PageHeader
        kicker={t("nav.ads")}
        title={t("ads.title")}
        description={t("ads.desc")}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t("ads.spend30")} value={show(summary.adsCad)} tone="gold" />
        <KpiCard
          label={t("ads.cpaNew")}
          value={summary.cpaPerNewCad ? show(summary.cpaPerNewCad) : "—"}
        />
        <KpiCard
          label={t("ads.cpaDeliv")}
          value={summary.cpaPerDeliveredCad ? show(summary.cpaPerDeliveredCad) : "—"}
        />
        <KpiCard
          label="ROAS"
          value={summary.roas ? `${summary.roas.toFixed(2)}x` : "—"}
          tone={summary.roas && summary.roas >= 2 ? "profit" : "default"}
        />
      </div>
      {points.length === 0 ? (
        <EmptyState title={t("ads.empty")} body={t("ads.emptyBody")} />
      ) : (
        <div className="cb-card mb-5">
          <h2 className="mb-4 text-base font-semibold">{t("ads.chart")} ({currency})</h2>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ads"
                  stroke="var(--gold)"
                  strokeWidth={1.75}
                  name="Ads"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <section className="cb-card overflow-hidden p-0">
        <div className="border-b border-line px-4 py-3 font-semibold">{t("ads.last")}</div>
        <div className="overflow-x-auto">
          <table className="cb-table">
            <thead>
              <tr>
                {[t("common.date"), t("ads.spend"), t("dash.orders"), "CPA", "ROAS"].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {month.slice(0, 14).map((entry) => {
                const ads = dailyAdsCad(entry);
                const snap = entry.exchange_rate_snapshot;
                const cpa = entry.new_orders > 0 ? ads / entry.new_orders : null;
                const roas = ads > 0 ? dailyRevenueCad(entry) / ads : null;
                return (
                  <tr key={entry.id}>
                    <td>{formatDisplayDate(entry.entry_date)}</td>
                    <td className="cb-num">{formatMoney(money(ads, currency, snap), currency)}</td>
                    <td className="cb-num">{entry.new_orders}</td>
                    <td className="cb-num">
                      {cpa ? formatMoney(money(cpa, currency, snap), currency) : "—"}
                    </td>
                    <td className="cb-num">{roas ? `${roas.toFixed(2)}x` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
