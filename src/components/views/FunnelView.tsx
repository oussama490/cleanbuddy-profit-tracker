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
import { usePrefs } from "@/components/PrefsProvider";
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
  const { t } = usePrefs();
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
    { key: "new", label: t("funnel.new"), value: summary.newOrders, pct: 1 },
    {
      key: "confirmed",
      label: t("funnel.confirmed"),
      value: summary.confirmed,
      pct: summary.confirmationRate ?? 0,
    },
    {
      key: "delivered",
      label: t("funnel.delivered"),
      value: summary.delivered,
      pct: summary.deliveredOfNew ?? 0,
    },
    {
      key: "returned",
      label: t("funnel.returnedShort"),
      value: summary.returned,
      pct: summary.returnRate ?? 0,
    },
  ];

  return (
    <div>
      <PageHeader
        kicker={t("nav.funnel")}
        title={t("funnel.title")}
        description={t("funnel.desc")}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {steps.map((step) => (
          <KpiCard
            key={step.key}
            label={step.label}
            value={String(step.value)}
            hint={step.key === "new" ? t("funnel.base") : formatPercent(step.pct)}
          />
        ))}
      </div>
      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        {steps.slice(0, 3).map((step, index) => (
          <div key={step.key} className="cb-card">
            <p className="text-xs text-muted">{step.label}</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-forest-mid"
                style={{ width: `${Math.max(8, (step.value / Math.max(steps[0].value, 1)) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {index === 0
                ? t("funnel.all")
                : `${((step.value / Math.max(steps[0].value, 1)) * 100).toFixed(1)}% ${t("funnel.ofNew")}`}
            </p>
          </div>
        ))}
      </div>
      {chart.length === 0 ? (
        <EmptyState title={t("funnel.empty")} body={t("funnel.emptyBody")} />
      ) : (
        <div className="cb-card">
          <h2 className="mb-4 text-base font-semibold">{t("funnel.chart")}</h2>
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
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
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="new" fill="var(--forest-mid)" name={t("funnel.new")} />
                <Bar dataKey="confirmed" fill="var(--gold)" name={t("funnel.confirmed")} />
                <Bar dataKey="delivered" fill="var(--profit)" name={t("funnel.delivered")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {fx ? (
        <p className="mt-4 text-sm text-muted">
          {t("funnel.perDelivered")}:{" "}
          {summary.profitPerDeliveredCad
            ? formatMoney(money(summary.profitPerDeliveredCad, currency, fx), currency)
            : "—"}
        </p>
      ) : null}
    </div>
  );
}
