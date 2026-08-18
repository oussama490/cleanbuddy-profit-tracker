"use client";

import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { usePrefs } from "@/components/PrefsProvider";
import { KpiCard, PageHeader } from "@/components/ui";
import { RecordsView } from "@/components/views/RecordsView";
import { convertToCad } from "@/lib/currency";
import {
  money,
  summarizePeriod,
  unitCogsFromProducts,
} from "@/lib/insights";
import { formatMoney } from "@/lib/format";
import type {
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
  WorkspaceRecord,
} from "@/lib/types";

export function TreasuryView({
  entries,
  products,
  snapshot,
  records,
  extrasReady,
}: {
  entries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
  records: WorkspaceRecord[];
  extrasReady: boolean;
}) {
  const { currency } = useDisplayCurrency();
  const { t } = usePrefs();
  const unitCogsCad = unitCogsFromProducts(products);
  const summary = summarizePeriod(entries, unitCogsCad);
  const fx = snapshot ?? entries[0]?.exchange_rate_snapshot ?? null;
  const show = (cad: number) => (fx ? formatMoney(money(cad, currency, fx), currency) : "—");
  const movementsCad = records.reduce((sum, record) => {
    const snap = fx;
    if (!snap) return sum + record.amount;
    return sum + convertToCad(record.amount, record.currency, snap);
  }, 0);

  return (
    <div>
      <PageHeader
        kicker={t("nav.treasury")}
        title={t("treasury.title")}
        description={t("treasury.desc")}
      />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label={t("treasury.ops")}
          value={show(summary.profitCad)}
          tone={summary.profitCad >= 0 ? "profit" : "loss"}
        />
        <KpiCard label={t("treasury.moves")} value={show(movementsCad)} tone="gold" />
        <KpiCard
          label={t("treasury.picture")}
          value={show(summary.profitCad + movementsCad)}
          hint={t("treasury.hint")}
        />
      </div>
      <RecordsView kind="cash" records={records} extrasReady={extrasReady} hideHeader />
    </div>
  );
}
