"use client";

import { useRates } from "@/components/RatesProvider";
import { usePrefs } from "@/components/PrefsProvider";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui";
import { uniqueSnapshots } from "@/lib/insights";
import { formatDisplayDate, formatNumber } from "@/lib/format";
import type { DailyEntry, ExchangeRateSnapshot } from "@/lib/types";

export function RatesView({
  entries,
  snapshot,
}: {
  entries: DailyEntry[];
  snapshot: ExchangeRateSnapshot | null;
}) {
  const { refresh, loading, error } = useRates();
  const { t } = usePrefs();
  const current = snapshot;
  const history = uniqueSnapshots(entries);

  function cadPer(code: "MXN" | "USD") {
    if (!current) return "—";
    const perCad = 1 / current.toCad[code];
    return formatNumber(perCad, 4);
  }

  return (
    <div>
      <PageHeader
        kicker={t("nav.rates")}
        title="MXN · USD · CAD"
        description={t("rates.desc")}
        actions={
          <button className="cb-btn-ghost" type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? t("rates.refreshing") : t("rates.refresh")}
          </button>
        }
      />
      {error ? <p className="mb-4 text-sm text-loss">{error}</p> : null}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="1 CAD = MXN" value={cadPer("MXN")} tone="gold" />
        <KpiCard label="1 CAD = USD" value={cadPer("USD")} />
        <KpiCard
          label={t("rates.market")}
          value={current?.date ? formatDisplayDate(current.date) : "—"}
          hint={current ? "Frankfurter" : t("rates.none")}
        />
      </div>
      {history.length === 0 ? (
        <EmptyState title={t("rates.empty")} body={t("rates.emptyBody")} />
      ) : (
        <section className="cb-card overflow-hidden p-0">
          <div className="border-b border-line px-4 py-3 font-semibold">{t("rates.saved")}</div>
          <div className="overflow-x-auto">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>{t("common.date")}</th>
                  <th>MXN / CAD</th>
                  <th>USD / CAD</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.date}>
                    <td>{formatDisplayDate(item.date)}</td>
                    <td className="cb-num">{formatNumber(1 / item.toCad.MXN, 4)}</td>
                    <td className="cb-num">{formatNumber(1 / item.toCad.USD, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
