"use client";

import { DailyChart } from "@/components/DailyChart";
import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui";
import {
  deltaPct,
  filterEntries,
  money,
  periodLabel,
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
import { RitualStrip } from "@/components/views/LifeViews";
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
      <PageHeader
        kicker="لوحة التحكم"
        title={new Date().getHours() < 17 ? "صباح الخير" : "مساء الخير"}
        description="ملخص ربحك، قمعك، وإعلاناتك — في شاشة واحدة، لك وحدك."
        actions={
          <Link href="/daily" className="cb-btn px-5">
            إدخال اليوم
          </Link>
        }
      />
      <RitualStrip entries={entries} products={products} snapshot={snapshot} />

      <div className="mb-5 flex flex-wrap gap-2">
        {PERIODS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ${
              period === key
                ? "bg-forest text-white"
                : "border border-line bg-card text-muted"
            }`}
          >
            {periodLabel(key)}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={`صافي الربح · ${periodLabel(period)}`}
          value={show(summary.profitCad)}
          hint={
            profitDelta === null
              ? "لا مقارنة بعد"
              : `${profitDelta >= 0 ? "+" : ""}${(profitDelta * 100).toFixed(1)}% مقابل الفترة السابقة`
          }
          tone={summary.profitCad >= 0 ? "profit" : "loss"}
        />
        <KpiCard label="الإيرادات" value={show(summary.revenueCad)} hint={`${summary.delivered} طلب مسلّم`} />
        <KpiCard
          label="تكلفة الإعلانات"
          value={show(summary.adsCad)}
          hint={summary.roas ? `ROAS ${summary.roas.toFixed(2)}x` : "لا إعلانات بعد"}
          tone="gold"
        />
        <KpiCard
          label="قمع التحويل"
          value={`${formatPercent(summary.confirmationRate)} / ${formatPercent(summary.deliveryRate)}`}
          hint="تأكيد / تسليم"
        />
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <article className="cb-card lg:col-span-2">
          <p className="text-sm font-semibold">اليوم</p>
          {todaySummary ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Mini label="طلبات" value={String(todaySummary.newOrders)} />
              <Mini label="مسلّم" value={String(todaySummary.delivered)} />
              <Mini label="إيراد" value={show(todaySummary.revenueCad)} />
              <Mini
                label="ربح"
                value={show(todaySummary.profitCad)}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              لم تُسجّل أرقام اليوم بعد.{" "}
              <Link className="font-semibold text-forest-mid underline" href="/daily">
                أضف الإدخال
              </Link>
            </p>
          )}
        </article>
        <article className="cb-card">
          <p className="text-sm font-semibold">هدف الشهر</p>
          {activeGoal && goalAmountCad > 0 ? (
            <>
              <p className="mt-3 text-2xl font-bold text-forest-mid">
                {show(monthSummary.profitCad)}
              </p>
              <p className="text-xs text-muted">
                من {show(goalAmountCad)} · {activeGoal.title}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">
              لا هدف بعد.{" "}
              <Link className="font-semibold text-forest-mid underline" href="/goals">
                حدّد هدف الربح
              </Link>
            </p>
          )}
        </article>
      </div>

      <div className="mb-5">
        <DailyChart entries={currentEntries} unitCogsCad={unitCogsCad} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="cb-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">المنتجات حسب الهامش</p>
            <Link href="/products" className="text-sm text-forest-mid underline">
              الحاسبة
            </Link>
          </div>
          {ranked.length === 0 ? (
            <EmptyState title="لا منتجات بعد" body="احفظ منتجاً في حاسبة التسعير لترتيب الهوامش." />
          ) : (
            <ul className="space-y-2">
              {ranked.slice(0, 5).map(({ product, pricing }) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.id}`}
                    className="flex items-center justify-between rounded-2xl border border-line bg-white px-3 py-3"
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
        <article className="cb-card">
          <p className="font-semibold">اختصارات</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["/ads", "إعلانات", "CPA وROAS"],
              ["/funnel", "القمع", "تأكيد وتسليم"],
              ["/simulate", "محاكاة", "ميزانية يومية"],
              ["/reports", "تقرير", "تصدير CSV"],
            ].map(([href, label, hint]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-line bg-white px-3 py-3"
              >
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted">{hint}</p>
              </Link>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f6f1e8] px-3 py-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-forest-mid">{value}</p>
    </div>
  );
}
