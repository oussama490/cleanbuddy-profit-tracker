"use client";

import { DailyChart } from "@/components/DailyChart";
import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { EmptyState, KpiCard } from "@/components/ui";
import {
  deltaPct,
  filterEntries,
  money,
  periodStart,
  previousPeriodRange,
  summarizePeriod,
  unitCogsFromProducts,
  type PeriodKey,
} from "@/lib/insights";
import { formatMoney, formatPercent, todayIsoDate } from "@/lib/format";
import { calculateProductPricing } from "@/lib/calculations";
import { convertToCad } from "@/lib/currency";
import type {
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
  WorkspaceRecord,
} from "@/lib/types";
import { usePrefs } from "@/components/PrefsProvider";
import Link from "next/link";
import { useMemo, useState } from "react";

const PERIODS: PeriodKey[] = ["7", "30", "month", "all"];

export function DashboardView({
  entries,
  products,
  snapshot,
  goals,
}: {
  entries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
  goals: WorkspaceRecord[];
}) {
  const { currency } = useDisplayCurrency();
  const { t } = usePrefs();
  const [period, setPeriod] = useState<PeriodKey>("30");
  const unitCogsCad = unitCogsFromProducts(products);
  const from = periodStart(period);
  const currentEntries = useMemo(
    () => filterEntries(entries, from),
    [entries, from],
  );
  const summary = summarizePeriod(currentEntries, unitCogsCad);
  const prevRange = previousPeriodRange(period, from);
  const prevSummary = summarizePeriod(
    filterEntries(entries, prevRange.from, prevRange.to),
    unitCogsCad,
  );
  const profitDelta = deltaPct(summary.profitCad, prevSummary.profitCad);
  const fx = snapshot ?? entries[0]?.exchange_rate_snapshot ?? null;
  const show = (cad: number) => (fx ? formatMoney(money(cad, currency, fx), currency) : "—");
  const today = entries.find((entry) => entry.entry_date === todayIsoDate());
  const todaySummary = today
    ? summarizePeriod([today], unitCogsCad)
    : null;
  const activeGoal = goals[0];
  const goalAmountCad =
    activeGoal && fx
      ? convertToCad(activeGoal.amount, activeGoal.currency, fx)
      : (activeGoal?.amount ?? 0);
  const monthSummary = summarizePeriod(
    filterEntries(entries, periodStart("month")),
    unitCogsCad,
  );
  const goalProgress =
    goalAmountCad > 0
      ? Math.min(100, (monthSummary.profitCad / goalAmountCad) * 100)
      : 0;

  const ranked = products
    .map((product) => ({
      product,
      pricing: calculateProductPricing(
        {
          supplierCostAmount: product.supplier_cost_amount,
          supplierCostCurrency: product.supplier_cost_currency,
          shippingCostAmount: product.shipping_cost_amount,
          shippingCostCurrency: product.shipping_cost_currency,
          dropiCommissionPct: product.dropi_commission_pct,
          salePriceAmount: product.sale_price_amount,
          salePriceCurrency: product.sale_price_currency,
          adsCostPerOrderAmount: product.ads_cost_per_order_amount,
          adsCostPerOrderCurrency: product.ads_cost_per_order_currency,
        },
        product.exchange_rate_snapshot,
      ),
    }))
    .sort((a, b) => b.pricing.marginPercent - a.pricing.marginPercent);

  return (
    <div>
      <section className="cb-till mb-6">
        <div className="relative z-[1] flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--led)]">
              {t("dash.profit")} · {t(`period.${period}`)}
            </p>
            <p className="cb-till-num mt-3">{show(summary.profitCad)}</p>
            <p className="mt-3 text-sm text-white/50">
              {profitDelta === null
                ? t("dash.noCompare")
                : `${profitDelta >= 0 ? "+" : ""}${(profitDelta * 100).toFixed(1)}% ${t("dash.vsPrev")}`}
            </p>
          </div>
          <Link href="/daily" className="cb-btn-led px-5">
            {t("enter.today")}
          </Link>
        </div>
      </section>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="cb-page-title">
            {new Date().getHours() < 17 ? t("greeting.morning") : t("greeting.evening")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("dash.desc")}</p>
        </div>
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

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label={t("dash.revenue")}
          value={show(summary.revenueCad)}
          hint={t("dash.deliveredCount", { n: summary.delivered })}
        />
        <KpiCard
          label={t("dash.ads")}
          value={show(summary.adsCad)}
          hint={summary.roas ? `ROAS ${summary.roas.toFixed(2)}x` : t("dash.noAds")}
          tone="gold"
        />
        <KpiCard
          label={t("dash.funnel")}
          value={`${formatPercent(summary.confirmationRate)} / ${formatPercent(summary.deliveryRate)}`}
          hint={t("dash.confirmDeliver")}
        />
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <article className="cb-card lg:col-span-2">
          <p className="text-sm font-semibold">{t("dash.today")}</p>
          {todaySummary ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Mini label={t("dash.orders")} value={String(todaySummary.newOrders)} />
              <Mini label={t("dash.delivered")} value={String(todaySummary.delivered)} />
              <Mini label={t("dash.rev")} value={show(todaySummary.revenueCad)} />
              <Mini label={t("dash.profitShort")} value={show(todaySummary.profitCad)} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {t("dash.noToday")}{" "}
              <Link className="font-semibold text-forest-mid underline" href="/daily">
                {t("dash.addToday")}
              </Link>
            </p>
          )}
        </article>
        <article className="cb-card">
          <p className="text-sm font-semibold">{t("dash.monthGoal")}</p>
          {activeGoal && goalAmountCad > 0 ? (
            <>
              <p className="cb-num mt-3 text-2xl font-semibold text-foreground">
                {show(monthSummary.profitCad)}
              </p>
              <p className="text-xs text-muted">
                {t("dash.from")} {show(goalAmountCad)} · {activeGoal.title}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-forest-mid"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {t("dash.noGoal")}{" "}
              <Link className="font-semibold text-forest-mid underline" href="/goals">
                {t("dash.setGoal")}
              </Link>
            </p>
          )}
        </article>
      </div>

      <div className="mb-5">
        <DailyChart entries={currentEntries} unitCogsCad={unitCogsCad} />
      </div>

      <article className="cb-card">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold">{t("dash.byMargin")}</p>
          <Link href="/products" className="text-sm text-forest-mid underline">
            {t("dash.calc")}
          </Link>
        </div>
        {ranked.length === 0 ? (
          <EmptyState title={t("dash.noProducts")} body={t("dash.noProductsBody")} />
        ) : (
          <ul className="space-y-2">
            {ranked.slice(0, 5).map(({ product, pricing }) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                    className="flex items-center justify-between rounded-lg border border-line bg-background px-3 py-3"
                >
                  <span className="font-medium">{product.product_name}</span>
                  <span
                    className={`text-sm font-semibold ${
                      pricing.isHealthy ? "text-profit" : "text-loss"
                    }`}
                  >
                    {pricing.marginPercent.toFixed(1)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background px-3 py-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="cb-num mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
