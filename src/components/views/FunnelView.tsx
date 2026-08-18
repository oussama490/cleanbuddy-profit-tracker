"use client";

import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui";
import {
  filterEntries,
  money,
  periodStart,
  summarizePeriod,
  unitCogsFromProducts,
} from "@/lib/insights";
import { formatPercent } from "@/lib/format";
import { formatMoney } from "@/lib/format";
import type { DailyEntry, ExchangeRateSnapshot, ProductCalculation } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FunnelView({
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
  const chart = [...month]
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map((entry) => ({
      date: entry.entry_date.slice(5),
      new: entry.new_orders,
      confirmed: entry.confirmed,
      delivered: entry.delivered,
      returned: entry.returned,
    }));

  const steps = [
    { label: "طلبات جديدة", value: summary.newOrders, pct: 1 },
    {
      label: "مؤكدة",
      value: summary.confirmed,
      pct: summary.confirmationRate ?? 0,
    },
    {
      label: "مسلّمة",
      value: summary.delivered,
      pct: summary.deliveredOfNew ?? 0,
    },
    {
      label: "مرتجعة",
      value: summary.returned,
      pct: summary.returnRate ?? 0,
    },
  ];

  return (
    <div>
      <PageHeader
        kicker="القمع"
        title="من الطلب إلى التسليم"
        description="راقب التأكيد والتسليم خلال ٣٠ يوماً. أي انخفاض هنا يأكل الربح قبل الإعلان."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {steps.map((step) => (
          <KpiCard
            key={step.label}
            label={step.label}
            value={String(step.value)}
            hint={step.label === "طلبات جديدة" ? "الأساس" : formatPercent(step.pct)}
          />
        ))}
      </div>
      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        {steps.slice(0, 3).map((step, index) => (
          <div key={step.label} className="cb-card">
            <p className="text-xs text-muted">{step.label}</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-forest-mid"
                style={{ width: `${Math.max(8, (step.value / Math.max(steps[0].value, 1)) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {index === 0 ? "كل الطلبات" : `${((step.value / Math.max(steps[0].value, 1)) * 100).toFixed(1)}٪ من الجديدة`}
            </p>
          </div>
        ))}
      </div>
      {chart.length === 0 ? (
        <EmptyState title="لا قمع بعد" body="سجّل الطلبات المؤكدة والمسلّمة يومياً." />
      ) : (
        <div className="cb-card" dir="ltr">
          <h2 className="mb-4 text-right text-base font-semibold">حركة القمع — ٣٠ يوماً</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid stroke="#e4dbce" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={36} />
                <Tooltip />
                <Bar dataKey="new" fill="#1c4a43" name="جديدة" />
                <Bar dataKey="confirmed" fill="#b0894d" name="مؤكدة" />
                <Bar dataKey="delivered" fill="#1f7a4d" name="مسلّمة" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {fx ? (
        <p className="mt-4 text-sm text-muted">
          الربح لكل مسلّم تقريبي:{" "}
          {summary.profitPerDeliveredCad
            ? formatMoney(money(summary.profitPerDeliveredCad, currency, fx), currency)
            : "—"}
        </p>
      ) : null}
    </div>
  );
}
