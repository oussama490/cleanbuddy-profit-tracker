"use client";

import {
  deleteWorkspaceRecord,
  saveWorkspaceRecord,
} from "@/app/actions/workspace";
import { MoneyInput } from "@/components/MoneyInput";
import { useRates } from "@/components/RatesProvider";
import { EmptyState, ExtrasBanner, PageHeader } from "@/components/ui";
import { formatDisplayDate, formatMoney, todayIsoDate } from "@/lib/format";
import type { Currency, WorkspaceKind, WorkspaceRecord } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

const COPY: Record<
  WorkspaceKind,
  { kicker: string; title: string; description: string; titleLabel: string; bodyLabel: string }
> = {
  journal: {
    kicker: "اليومية",
    title: "ملاحظاتك",
    description: "ما تغيّر اليوم: كرييتف، شحن، مشكلة تأكيد. لك وحدك.",
    titleLabel: "العنوان",
    bodyLabel: "التفاصيل",
  },
  goal: {
    kicker: "الأهداف",
    title: "هدف الربح",
    description: "ضع مبلغاً. اللوحة تتابع تقدّم الشهر.",
    titleLabel: "اسم الهدف",
    bodyLabel: "ملاحظة",
  },
  cash: {
    kicker: "الخزينة",
    title: "حركة نقدية",
    description: "تحويل، سحب، مصروف. الموجب دخول، السالب خروج.",
    titleLabel: "البيان",
    bodyLabel: "ملاحظة",
  },
  supplier: {
    kicker: "الموردون",
    title: "دفتر الموردين",
    description: "اسم، تواصل، وتكلفة تقريبية.",
    titleLabel: "اسم المورد",
    bodyLabel: "تفاصيل / تواصل",
  },
  checklist: {
    kicker: "اليوم",
    title: "مهام اليوم",
    description: "روتينك. أضف مهمة أو استخدم القائمة الجاهزة.",
    titleLabel: "المهمة",
    bodyLabel: "تفاصيل",
  },
  bill: {
    kicker: "الفواتير",
    title: "ما يجب دفعه",
    description: "Meta، Dropi، CJ، إنترنت، Shopify. التاريخ = الاستحقاق.",
    titleLabel: "الفاتورة",
    bodyLabel: "ملاحظة",
  },
  payout: {
    kicker: "COD",
    title: "تحويل متوقع",
    description: "أضف تحويلاً يدوياً إن لزم. الصفحة تحسب أيضاً تلقائياً.",
    titleLabel: "البيان",
    bodyLabel: "ملاحظة",
  },
  creative: {
    kicker: "الكرييتفز",
    title: "ما يبقى وما يُقتل",
    description: "اسم الكرييتف + ملاحظة. المبلغ = إنفاق تقريبي.",
    titleLabel: "اسم الكرييتف",
    bodyLabel: "لماذا نُبقيه أو نقتله",
  },
  review: {
    kicker: "الأسبوع",
    title: "مراجعة الأسبوع",
    description: "3 جمل: ما نجح، ما فشل، هدف الأسبوع القادم.",
    titleLabel: "عنوان الأسبوع",
    bodyLabel: "المراجعة",
  },
  expense: {
    kicker: "المصاريف",
    title: "شخصي vs بزنس",
    description: "أضف مصروفاً. اكتب في التفاصيل: شخصي أو بزنس.",
    titleLabel: "المصروف",
    bodyLabel: "شخصي أو بزنس + ملاحظة",
  },
  shop: {
    kicker: "Shopify",
    title: "المتجر",
    description: "إعدادات المتجر.",
    titleLabel: "الاسم",
    bodyLabel: "رابط",
  },
};

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
  const copy = COPY[kind];
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
        title: title || (kind === "cash" ? "حركة" : ""),
        body,
        amount: Number(amount) || 0,
        currency,
        entry_date: entryDate,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "تم الحفظ.");
      reset();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!window.confirm("حذف هذا السجل؟")) return;
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
        <PageHeader kicker={copy.kicker} title={copy.title} description={copy.description} />
      ) : null}
      <ExtrasBanner ready={extrasReady} />
      <form className="cb-card mb-5 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{copy.titleLabel}</span>
          <input className="cb-input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        {kind !== "goal" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">التاريخ</span>
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
            label={kind === "cash" ? "المبلغ (سالب = خروج)" : "المبلغ"}
            amount={amount}
            currency={currency}
            onAmountChange={setAmount}
            onCurrencyChange={setCurrency}
            snapshot={snapshot}
          />
        ) : null}
        <label className="block space-y-2">
          <span className="text-sm font-medium">{copy.bodyLabel}</span>
          <textarea
            className="cb-input min-h-28 py-3"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <button className="cb-btn w-full" disabled={pending || !extrasReady} type="submit">
          {pending ? "جاري الحفظ..." : "حفظ"}
        </button>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        {message ? <p className="text-sm text-profit">{message}</p> : null}
      </form>

      {kind === "cash" && records.length > 0 ? (
        <p className="mb-3 text-sm text-muted">
          مجموع الحركات المسجّلة (بدون تحويل): {formatMoney(cashTotal, "CAD")} — أدخل الكل بعملة واحدة للوضوح.
        </p>
      ) : null}

      {records.length === 0 ? (
        <EmptyState title="لا سجلات بعد" body="أضف أول سجل أعلاه." />
      ) : (
        <ul className="space-y-2">
          {records.map((record) => (
            <li key={record.id} className="cb-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{record.title || "بدون عنوان"}</p>
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
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
