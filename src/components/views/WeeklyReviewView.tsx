"use client";

import { deleteWorkspaceRecord, saveWorkspaceRecord } from "@/app/actions/workspace";
import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { usePrefs } from "@/components/PrefsProvider";
import { EmptyState, ExtrasBanner, KpiCard, PageHeader } from "@/components/ui";
import { addDaysIso } from "@/lib/commerce";
import { formatDisplayDate, formatMoney } from "@/lib/format";
import {
  filterEntries,
  money,
  summarizePeriod,
  unitCogsFromProducts,
} from "@/lib/insights";
import { defaultWeekStart, parseWeeklyReviewMeta } from "@/lib/life";
import type {
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
  WorkspaceRecord,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";

export function WeeklyReviewView({
  records,
  entries,
  products,
  snapshot,
  extrasReady,
}: {
  records: WorkspaceRecord[];
  entries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
  extrasReady: boolean;
}) {
  const { t } = usePrefs();
  const { currency } = useDisplayCurrency();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [weekStart, setWeekStart] = useState(defaultWeekStart());
  const [editId, setEditId] = useState<string | null>(null);
  const [progresPr, setProgresPr] = useState("");
  const [resultatBusiness, setResultatBusiness] = useState("");
  const [santeForme, setSanteForme] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekEnd = addDaysIso(weekStart, 6);
  const unitCogsCad = unitCogsFromProducts(products);
  const weekEntries = filterEntries(entries, weekStart, weekEnd);
  const weekSummary = summarizePeriod(weekEntries, unitCogsCad);
  const fx = snapshot ?? entries[0]?.exchange_rate_snapshot ?? null;
  const profitLabel = fx
    ? formatMoney(money(weekSummary.profitCad, currency, fx), currency)
    : formatMoney(weekSummary.profitCad, "CAD");

  const sorted = useMemo(
    () =>
      [...records].sort((a, b) => {
        const da = a.entry_date ?? a.created_at.slice(0, 10);
        const db = b.entry_date ?? b.created_at.slice(0, 10);
        return db.localeCompare(da);
      }),
    [records],
  );

  function reset() {
    setEditId(null);
    setWeekStart(defaultWeekStart());
    setProgresPr("");
    setResultatBusiness("");
    setSanteForme("");
  }

  function loadRecord(record: WorkspaceRecord) {
    const meta = parseWeeklyReviewMeta(record);
    setEditId(record.id);
    setWeekStart(record.entry_date ?? defaultWeekStart(record.created_at.slice(0, 10)));
    setProgresPr(meta.progresPr);
    setResultatBusiness(meta.resultatBusiness);
    setSanteForme(meta.santeForme);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const existing = records.find((record) => record.entry_date === weekStart);
    startTransition(async () => {
      setError(null);
      const body = [
        progresPr && `${t("review.qPr")}: ${progresPr}`,
        resultatBusiness && `${t("review.qBiz")}: ${resultatBusiness}`,
        santeForme && `${t("review.qHealth")}: ${santeForme}`,
      ]
        .filter(Boolean)
        .join("\n");
      const result = await saveWorkspaceRecord({
        id: editId || existing?.id,
        kind: "review",
        title: t("review.weekOf", { d: weekStart }),
        body,
        amount: weekSummary.profitCad,
        currency: "CAD",
        entry_date: weekStart,
        meta: { progresPr, resultatBusiness, santeForme },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(t("common.saved"));
      reset();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteWorkspaceRecord(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (editId === id) reset();
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        kicker={t("nav.review")}
        title={t("review.title")}
        description={t("review.desc")}
      />
      <ExtrasBanner ready={extrasReady} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <KpiCard
          label={t("review.weekProfit")}
          value={profitLabel}
          hint={`${formatDisplayDate(weekStart)} → ${formatDisplayDate(weekEnd)}`}
          tone={weekSummary.profitCad >= 0 ? "profit" : "loss"}
        />
        <KpiCard
          label={t("review.daysLogged")}
          value={String(weekEntries.length)}
          hint={t("review.autoHint")}
        />
      </div>

      <form className="cb-card mb-5 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t("review.weekStart")}</span>
          <input
            className="cb-input"
            type="date"
            value={weekStart}
            onChange={(event) => {
              setWeekStart(event.target.value);
              const match = records.find((record) => record.entry_date === event.target.value);
              if (match) loadRecord(match);
            }}
          />
        </label>
        <p className="rounded-[0.9rem] border border-line bg-background px-4 py-3 text-sm">
          <span className="text-muted">{t("review.weekProfit")}: </span>
          <span className={`font-semibold ${weekSummary.profitCad >= 0 ? "text-profit" : "text-loss"}`}>
            {profitLabel}
          </span>
          <span className="ms-2 text-xs text-muted">{t("review.autoHint")}</span>
        </p>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t("review.qPr")}</span>
          <textarea
            className="cb-input min-h-24 py-3"
            value={progresPr}
            onChange={(event) => setProgresPr(event.target.value)}
            placeholder={t("review.qPrPh")}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t("review.qBiz")}</span>
          <textarea
            className="cb-input min-h-24 py-3"
            value={resultatBusiness}
            onChange={(event) => setResultatBusiness(event.target.value)}
            placeholder={t("review.qBizPh")}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t("review.qHealth")}</span>
          <textarea
            className="cb-input min-h-24 py-3"
            value={santeForme}
            onChange={(event) => setSanteForme(event.target.value)}
            placeholder={t("review.qHealthPh")}
          />
        </label>
        <div className="flex gap-2">
          <button className="cb-btn flex-1" disabled={pending || !extrasReady} type="submit">
            {pending ? t("common.saving") : editId ? t("review.update") : t("review.save")}
          </button>
          {editId ? (
            <button className="cb-btn-ghost" type="button" onClick={reset}>
              {t("close")}
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        {message ? <p className="text-sm text-profit">{message}</p> : null}
      </form>

      {sorted.length === 0 ? (
        <EmptyState title={t("review.empty")} body={t("review.emptyBody")} />
      ) : (
        <ul className="space-y-2">
          {sorted.map((record) => {
            const meta = parseWeeklyReviewMeta(record);
            const start = record.entry_date ?? record.created_at.slice(0, 10);
            return (
              <li key={record.id} className="cb-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {t("review.weekOf", { d: formatDisplayDate(start) })}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDisplayDate(start)} → {formatDisplayDate(addDaysIso(start, 6))}
                    </p>
                    {record.amount ? (
                      <p className={`mt-1 text-sm font-semibold ${record.amount >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatMoney(record.amount, record.currency)}
                      </p>
                    ) : null}
                    {meta.progresPr ? (
                      <p className="mt-2 text-sm leading-6">
                        <span className="text-muted">{t("review.qPr")}: </span>
                        {meta.progresPr}
                      </p>
                    ) : null}
                    {meta.resultatBusiness ? (
                      <p className="mt-1 text-sm leading-6">
                        <span className="text-muted">{t("review.qBiz")}: </span>
                        {meta.resultatBusiness}
                      </p>
                    ) : null}
                    {meta.santeForme ? (
                      <p className="mt-1 text-sm leading-6">
                        <span className="text-muted">{t("review.qHealth")}: </span>
                        {meta.santeForme}
                      </p>
                    ) : null}
                    {!meta.progresPr && !meta.santeForme && record.body ? (
                      <p className="mt-2 text-sm leading-6 text-muted">{record.body}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button className="cb-btn-ghost min-h-10 px-3" type="button" onClick={() => loadRecord(record)}>
                      {t("common.edit")}
                    </button>
                    <button
                      className="cb-btn-ghost min-h-10 px-3 text-loss"
                      type="button"
                      onClick={() => onDelete(record.id)}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
