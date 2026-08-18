"use client";

import {
  deleteWorkspaceRecord,
  saveWorkspaceRecord,
} from "@/app/actions/workspace";
import { MoneyInput } from "@/components/MoneyInput";
import { usePrefs } from "@/components/PrefsProvider";
import { useRates } from "@/components/RatesProvider";
import { EmptyState, ExtrasBanner, PageHeader } from "@/components/ui";
import { formatDisplayDate, formatMoney, todayIsoDate } from "@/lib/format";
import type { Currency, WorkspaceKind, WorkspaceRecord } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

export function RecordsView({
  kind,
  records,
  extrasReady,
  hideHeader = false,
}: {
  kind: WorkspaceKind;
  records: WorkspaceRecord[];
  extrasReady: boolean;
  hideHeader?: boolean;
}) {
  const { t } = usePrefs();
  const router = useRouter();
  const { snapshot } = useRates();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("CAD");
  const [entryDate, setEntryDate] = useState(todayIsoDate());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showAmount = kind === "goal" || kind === "cash" || kind === "supplier" || kind === "bill" || kind === "expense" || kind === "payout" || kind === "creative";

  function reset() {
    setTitle("");
    setBody("");
    setAmount("");
    setEntryDate(todayIsoDate());
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      const result = await saveWorkspaceRecord({
        kind,
        title: title || (kind === "cash" ? t("records.movement") : ""),
        body,
        amount: Number(amount) || 0,
        currency,
        entry_date: entryDate,
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
      router.refresh();
    });
  }

  const cashTotal = records.reduce((sum, record) => {
    if (record.currency === "CAD") return sum + record.amount;
    return sum + record.amount;
  }, 0);

  return (
    <div>
      {!hideHeader ? (
        <PageHeader
          kicker={t(`kind.${kind}.kicker`)}
          title={t(`kind.${kind}.title`)}
          description={t(`kind.${kind}.desc`)}
        />
      ) : null}
      <ExtrasBanner ready={extrasReady} />
      <form className="cb-card mb-5 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t(`kind.${kind}.titleLabel`)}</span>
          <input className="cb-input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        {kind !== "goal" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("common.date")}</span>
            <input
              className="cb-input"
              type="date"
              value={entryDate}
              onChange={(event) => setEntryDate(event.target.value)}
            />
          </label>
        ) : null}
        {showAmount ? (
          <MoneyInput
            id={`${kind}-amount`}
            label={kind === "cash" ? t("records.amountOut") : t("records.amount")}
            amount={amount}
            currency={currency}
            onAmountChange={setAmount}
            onCurrencyChange={setCurrency}
            snapshot={snapshot}
          />
        ) : null}
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t(`kind.${kind}.bodyLabel`)}</span>
          <textarea
            className="cb-input min-h-28 py-3"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <button className="cb-btn w-full" disabled={pending || !extrasReady} type="submit">
          {pending ? t("common.saving") : t("save")}
        </button>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        {message ? <p className="text-sm text-profit">{message}</p> : null}
      </form>

      {kind === "cash" && records.length > 0 ? (
        <p className="mb-3 text-sm text-muted">
          {t("records.cashTotal", { n: formatMoney(cashTotal, "CAD") })}
        </p>
      ) : null}

      {records.length === 0 ? (
        <EmptyState title={t("records.none")} body={t("records.noneBody")} />
      ) : (
        <ul className="space-y-2">
          {records.map((record) => (
            <li key={record.id} className="cb-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{record.title || t("records.untitled")}</p>
                  <p className="text-xs text-muted">
                    {record.entry_date ? formatDisplayDate(record.entry_date) : formatDisplayDate(record.created_at.slice(0, 10))}
                  </p>
                  {record.amount ? (
                    <p className="mt-1 text-sm font-semibold text-forest-mid">
                      {formatMoney(record.amount, record.currency)}
                    </p>
                  ) : null}
                  {record.body ? <p className="mt-2 text-sm leading-6 text-muted">{record.body}</p> : null}
                </div>
                <button
                  className="text-sm text-loss underline"
                  type="button"
                  onClick={() => onDelete(record.id)}
                >
                  {t("delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
