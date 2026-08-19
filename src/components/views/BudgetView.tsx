"use client";

import { deleteBudgetEntry, saveBudgetEntry } from "@/app/actions/life";
import { deleteWorkspaceRecord } from "@/app/actions/workspace";
import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { MoneyInput } from "@/components/MoneyInput";
import { usePrefs } from "@/components/PrefsProvider";
import { useRates } from "@/components/RatesProvider";
import { EmptyState, ExtrasBanner, KpiCard, PageHeader, Section } from "@/components/ui";
import { formatDisplayDate, formatMoney, todayIsoDate } from "@/lib/format";
import {
  filterEntries,
  money,
  periodStart,
  summarizePeriod,
  unitCogsFromProducts,
} from "@/lib/insights";
import {
  currentMonthPrefix,
  entriesInMonth,
  spendByCategory,
  totalActiveJobIncomeCad,
} from "@/lib/life";
import type {
  BudgetCategory,
  BudgetEntry,
  Currency,
  DailyEntry,
  ExchangeRateSnapshot,
  IncomeSource,
  Job,
  ProductCalculation,
  WorkspaceRecord,
} from "@/lib/types";
import { BUDGET_CATEGORIES } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const emptyForm = {
  entry_date: todayIsoDate(),
  category: "food" as BudgetCategory,
  amount: "",
  currency: "CAD" as Currency,
  income_source: "other" as IncomeSource,
  job_id: "",
  notes: "",
};

export function BudgetView({
  entries,
  jobs,
  dailyEntries,
  products,
  snapshot,
  legacyExpenses,
  lifeReady,
}: {
  entries: BudgetEntry[];
  jobs: Job[];
  dailyEntries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
  legacyExpenses: WorkspaceRecord[];
  lifeReady: boolean;
}) {
  const { t } = usePrefs();
  const { currency } = useDisplayCurrency();
  const { snapshot: liveSnapshot } = useRates();
  const fx = liveSnapshot ?? snapshot ?? dailyEntries[0]?.exchange_rate_snapshot ?? null;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthPrefix = currentMonthPrefix();
  const monthEntries = entriesInMonth(entries, monthPrefix);
  const jobIncome = totalActiveJobIncomeCad(jobs, fx);
  const unitCogsCad = unitCogsFromProducts(products);
  const dropship = summarizePeriod(filterEntries(dailyEntries, periodStart("month")), unitCogsCad);
  const dropshipIncome = Math.max(dropship.profitCad, 0);
  const totalIncome = jobIncome + dropshipIncome;
  const byCategory = spendByCategory(monthEntries, fx);
  const totalSpend = Object.values(byCategory).reduce((sum, value) => sum + value, 0);
  const net = totalIncome - totalSpend;
  const overspent = totalSpend > totalIncome && totalIncome > 0;

  const chart = useMemo(
    () =>
      BUDGET_CATEGORIES.map((category) => ({
        name: t(`budget.cat.${category}`),
        amount: Number(fx ? money(byCategory[category], currency, fx) : byCategory[category].toFixed(2)),
      })).filter((row) => row.amount > 0),
    [byCategory, currency, fx, t],
  );

  const show = (cad: number) => (fx ? formatMoney(money(cad, currency, fx), currency) : formatMoney(cad, "CAD"));

  function reset() {
    setForm({ ...emptyForm, entry_date: todayIsoDate() });
    setEditId(null);
  }

  function loadEntry(entry: BudgetEntry) {
    setEditId(entry.id);
    setForm({
      entry_date: entry.entry_date,
      category: entry.category,
      amount: String(entry.amount),
      currency: entry.currency,
      income_source: entry.income_source,
      job_id: entry.job_id ?? "",
      notes: entry.notes,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      const result = await saveBudgetEntry({
        id: editId || undefined,
        entry_date: form.entry_date,
        category: form.category,
        amount: Number(form.amount) || 0,
        currency: form.currency,
        income_source: form.income_source,
        job_id: form.job_id || null,
        notes: form.notes,
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
      const result = await deleteBudgetEntry(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (editId === id) reset();
      router.refresh();
    });
  }

  function onDeleteLegacy(id: string) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    startTransition(async () => {
      await deleteWorkspaceRecord(id);
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        kicker={t("nav.expenses")}
        title={t("budget.title")}
        description={t("budget.desc")}
      />
      <ExtrasBanner ready={lifeReady} messageKey="life.banner" />

      {overspent ? <p className="cb-warn mb-4">{t("budget.overspent")}</p> : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <KpiCard
          label={t("budget.income")}
          value={show(totalIncome)}
          hint={`${t("budget.job")}: ${show(jobIncome)} · ${t("budget.drop")}: ${show(dropshipIncome)}`}
          tone="profit"
        />
        <KpiCard label={t("budget.spend")} value={show(totalSpend)} tone="loss" />
        <KpiCard
          label={t("budget.net")}
          value={show(net)}
          hint={t("budget.netHint")}
          tone={net >= 0 ? "gold" : "loss"}
        />
      </div>

      <Section title={t("budget.byCat")}>
        {chart.length === 0 ? (
          <EmptyState title={t("budget.noSpend")} body={t("budget.noSpendBody")} />
        ) : (
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="amount" fill="var(--forest-mid)" name={t("budget.spend")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <form className="cb-card mb-5 space-y-4" onSubmit={onSubmit}>
        <p className="font-semibold">{editId ? t("budget.edit") : t("budget.add")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("common.date")}</span>
            <input
              className="cb-input"
              type="date"
              value={form.entry_date}
              onChange={(event) => setForm({ ...form, entry_date: event.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("budget.category")}</span>
            <select
              className="cb-input"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value as BudgetCategory })}
            >
              {BUDGET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(`budget.cat.${category}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <MoneyInput
          id="budget-amount"
          label={t("records.amount")}
          amount={form.amount}
          currency={form.currency}
          onAmountChange={(value) => setForm({ ...form, amount: value })}
          onCurrencyChange={(value) => setForm({ ...form, currency: value })}
          snapshot={fx}
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t("budget.source")}</span>
          <select
            className="cb-input"
            value={form.income_source === "job" && form.job_id ? `job:${form.job_id}` : form.income_source}
            onChange={(event) => {
              const value = event.target.value;
              if (value.startsWith("job:")) {
                setForm({ ...form, income_source: "job", job_id: value.slice(4) });
                return;
              }
              setForm({ ...form, income_source: value as IncomeSource, job_id: "" });
            }}
          >
            <option value="dropshipping">{t("budget.src.dropshipping")}</option>
            {jobs.map((job) => (
              <option key={job.id} value={`job:${job.id}`}>
                {t("budget.src.job")}: {job.job_title}
              </option>
            ))}
            <option value="other">{t("budget.src.other")}</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t("budget.notes")}</span>
          <input
            className="cb-input"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>
        <div className="flex gap-2">
          <button className="cb-btn flex-1" disabled={pending || !lifeReady} type="submit">
            {pending ? t("common.saving") : editId ? t("budget.update") : t("budget.add")}
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

      {entries.length === 0 ? (
        <EmptyState title={t("budget.empty")} body={t("budget.emptyBody")} />
      ) : (
        <ul className="mb-6 space-y-2">
          {entries.map((entry) => {
            const jobName = jobs.find((job) => job.id === entry.job_id)?.job_title;
            return (
              <li key={entry.id} className="cb-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t(`budget.cat.${entry.category}`)}</p>
                    <p className="text-xs text-muted">
                      {formatDisplayDate(entry.entry_date)} · {t(`budget.src.${entry.income_source}`)}
                      {jobName ? ` · ${jobName}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-forest-mid">
                      {formatMoney(entry.amount, entry.currency)}
                    </p>
                    {entry.notes ? <p className="mt-1 text-sm text-muted">{entry.notes}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button className="cb-btn-ghost min-h-10 px-3" type="button" onClick={() => loadEntry(entry)}>
                      {t("common.edit")}
                    </button>
                    <button
                      className="cb-btn-ghost min-h-10 px-3 text-loss"
                      type="button"
                      onClick={() => onDelete(entry.id)}
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

      {legacyExpenses.length > 0 ? (
        <Section title={t("budget.legacy")} hint={t("budget.legacyHint")}>
          <ul className="space-y-2">
            {legacyExpenses.map((record) => (
              <li key={record.id} className="flex items-start justify-between gap-3 rounded-[1.2rem] border border-line bg-background px-4 py-3">
                <div>
                  <p className="font-semibold">{record.title || t("records.untitled")}</p>
                  <p className="text-xs text-muted">
                    {record.entry_date ? formatDisplayDate(record.entry_date) : ""}
                  </p>
                  {record.amount ? (
                    <p className="mt-1 text-sm">{formatMoney(record.amount, record.currency)}</p>
                  ) : null}
                  {record.body ? <p className="mt-1 text-sm text-muted">{record.body}</p> : null}
                </div>
                <button
                  className="text-sm text-loss underline"
                  type="button"
                  onClick={() => onDeleteLegacy(record.id)}
                >
                  {t("delete")}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
