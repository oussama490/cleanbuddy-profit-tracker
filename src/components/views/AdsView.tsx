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
        kicker="الإعلانات"
        title="إنفاقك الحقيقي"
        description="من إدخالاتك اليومية: التكلفة، CPA لكل طلب جديد، وROAS. الحاسبة تبقى للحد الأقصى المقبول."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="إنفاق ٣٠ يوماً" value={show(summary.adsCad)} tone="gold" />
        <KpiCard
          label="CPA / طلب جديد"
          value={summary.cpaPerNewCad ? show(summary.cpaPerNewCad) : "—"}
        />
        <KpiCard
          label="CPA / مسلّم"
          value={summary.cpaPerDeliveredCad ? show(summary.cpaPerDeliveredCad) : "—"}
        />
        <KpiCard
          label="ROAS"
          value={summary.roas ? `${summary.roas.toFixed(2)}x` : "—"}
          tone={summary.roas && summary.roas >= 2 ? "profit" : "default"}
        />
      </div>
      {points.length === 0 ? (
        <EmptyState title="لا إنفاق مسجّل" body="أضف تكلفة الإعلانات في إدخال اليوم." />
      ) : (
        <div className="cb-card mb-5" dir="ltr">
          <h2 className="mb-4 text-right text-base font-semibold">الإنفاق اليومي ({currency})</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid stroke="#e4dbce" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip />
                <Line type="monotone" dataKey="ads" stroke="#b0894d" strokeWidth={2} name="Ads" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <section className="cb-card overflow-hidden p-0">
        <div className="border-b border-line px-4 py-3 font-semibold">آخر الأيام</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-[#f6f1e8] text-muted">
              <tr>
                {["التاريخ", "إنفاق", "طلبات", "CPA", "ROAS"].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
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
                  <tr key={entry.id} className="border-t border-line/70">
                    <td className="px-4 py-3">{formatDisplayDate(entry.entry_date)}</td>
                    <td className="px-4 py-3">{formatMoney(money(ads, currency, snap), currency)}</td>
                    <td className="px-4 py-3">{entry.new_orders}</td>
                    <td className="px-4 py-3">
                      {cpa ? formatMoney(money(cpa, currency, snap), currency) : "—"}
                    </td>
                    <td className="px-4 py-3">{roas ? `${roas.toFixed(2)}x` : "—"}</td>
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
