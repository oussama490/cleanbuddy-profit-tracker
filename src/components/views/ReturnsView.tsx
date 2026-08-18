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
import { usePrefs } from "@/components/PrefsProvider";
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
  const { t } = usePrefs();
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
        kicker={t("nav.returns")}
        title={t("returns.title")}
        description={t("returns.desc")}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t("returns.count")} value={String(summary.returned)} tone="loss" />
        <KpiCard label={t("returns.rate")} value={formatPercent(summary.returnRate)} />
        <KpiCard label={t("returns.cost")} value={show(lossCad)} hint={t("returns.hint")} />
        <KpiCard label={t("returns.vs")} value={`${summary.delivered} / ${summary.returned}`} />
      </div>
      {worst.length === 0 ? (
        <EmptyState title={t("returns.empty")} body={t("returns.emptyBody")} />
      ) : (
        <section className="cb-card overflow-hidden p-0">
          <div className="border-b border-line px-4 py-3 font-semibold">{t("returns.worst")}</div>
          <ul className="divide-y divide-line/80">
            {worst.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{formatDisplayDate(entry.entry_date)}</span>
                <span className="font-semibold text-loss">{t("returns.item", { n: entry.returned })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
