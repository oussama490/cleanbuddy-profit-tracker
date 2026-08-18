"use client";

import { deleteDailyEntry, saveDailyEntry } from "@/app/actions/daily";
import {
  averageUnitCogsCad,
  confirmationRate,
  dailyNetProfitCad,
  dailyRevenueCad,
  deliveryRate,
  productUnitCogsCad,
} from "@/lib/calculations";
import { convertFromCad } from "@/lib/currency";
import {
  addDaysIso,
  FULFILLMENT_APPS,
  fulfillmentLabel,
  type FulfillmentApp,
  type SalesModel,
} from "@/lib/commerce";
import { formatDisplayDate, formatMoney, formatPercent, todayIsoDate } from "@/lib/format";
import type {
  Currency,
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { DailyChart } from "./DailyChart";
import { useDisplayCurrency } from "./DisplayCurrency";
import { MoneyInput } from "./MoneyInput";
import { usePrefs } from "./PrefsProvider";
import { useRates } from "./RatesProvider";

type DailyTrackerProps = {
  entries: DailyEntry[];
  products: ProductCalculation[];
};

const emptyForm = {
  id: "",
  entry_date: todayIsoDate(),
  new_orders: "0",
  confirmed: "0",
  delivered: "0",
  returned: "0",
  revenue_amount: "",
  revenue_currency: "MXN" as Currency,
  ads_cost_amount: "",
  ads_cost_currency: "USD" as Currency,
};

export function DailyTracker({ entries, products }: DailyTrackerProps) {
  const router = useRouter();
  const { snapshot, error: ratesError } = useRates();
  const { currency: displayCurrency } = useDisplayCurrency();
  const { shop, t, lang } = usePrefs();
  const [form, setForm] = useState(emptyForm);
  const [salesModel, setSalesModel] = useState<SalesModel>(shop.salesModel);
  const [fulfillment, setFulfillment] = useState<FulfillmentApp>(shop.fulfillment);
  const [customApp, setCustomApp] = useState(shop.customApp);
  const [savedSnapshot, setSavedSnapshot] = useState<ExchangeRateSnapshot | null>(
    null,
  );
  const [productId, setProductId] = useState("avg");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const activeSnapshot =
    (form.id && savedSnapshot) || snapshot;

  const unitCogsCad = useMemo(() => {
    if (productId !== "avg") {
      const selected = products.find((product) => product.id === productId);
      return selected ? productUnitCogsCad(selected) : averageUnitCogsCad(products);
    }
    return averageUnitCogsCad(products);
  }, [productId, products]);

  const previewEntry = useMemo<DailyEntry>(
    () => ({
      id: form.id || "preview",
      entry_date: form.entry_date,
      new_orders: Number(form.new_orders) || 0,
      confirmed: Number(form.confirmed) || 0,
      delivered: Number(form.delivered) || 0,
      returned: Number(form.returned) || 0,
      revenue_amount: Number(form.revenue_amount) || 0,
      revenue_currency: form.revenue_currency,
      ads_cost_amount: Number(form.ads_cost_amount) || 0,
      ads_cost_currency: form.ads_cost_currency,
      exchange_rate_snapshot: activeSnapshot ?? {
        date: "",
        fetchedAt: "",
        source: "frankfurter",
        toCad: { MXN: 0, USD: 0, CAD: 1 },
      },
      ops: {
        sales_model: salesModel,
        fulfillment,
        fulfillment_custom: customApp,
      },
      created_at: "",
      updated_at: "",
    }),
    [form, activeSnapshot, salesModel, fulfillment, customApp],
  );

  const previewProfitCad = activeSnapshot
    ? dailyNetProfitCad(previewEntry, unitCogsCad)
    : 0;
  const previewProfitDisplay = activeSnapshot
    ? convertFromCad(previewProfitCad, displayCurrency, activeSnapshot)
    : 0;

  function loadEntry(entry: DailyEntry) {
    setForm({
      id: entry.id,
      entry_date: entry.entry_date,
      new_orders: String(entry.new_orders),
      confirmed: String(entry.confirmed),
      delivered: String(entry.delivered),
      returned: String(entry.returned),
      revenue_amount: String(entry.revenue_amount),
      revenue_currency: entry.revenue_currency,
      ads_cost_amount: String(entry.ads_cost_amount),
      ads_cost_currency: entry.ads_cost_currency,
    });
    setSalesModel(entry.ops.sales_model);
    setFulfillment(entry.ops.fulfillment);
    setCustomApp(entry.ops.fulfillment_custom);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function copyPrevious() {
    const previousDate = addDaysIso(form.entry_date || todayIsoDate(), -1);
    const previous =
      entries.find((entry) => entry.entry_date === previousDate) ?? entries[0];
    if (!previous) {
      setError(lang === "fr" ? "Aucun jour précédent." : "لا يوجد يوم سابق.");
      return;
    }
    setForm({
      id: "",
      entry_date: form.entry_date || todayIsoDate(),
      new_orders: String(previous.new_orders),
      confirmed: String(previous.confirmed),
      delivered: String(previous.delivered),
      returned: String(previous.returned),
      revenue_amount: String(previous.revenue_amount),
      revenue_currency: previous.revenue_currency,
      ads_cost_amount: String(previous.ads_cost_amount),
      ads_cost_currency: previous.ads_cost_currency,
    });
    setSalesModel(previous.ops.sales_model);
    setFulfillment(previous.ops.fulfillment);
    setCustomApp(previous.ops.fulfillment_custom);
    setSavedSnapshot(null);
    setMessage(t("copy.yesterday"));
  }

  function resetForm() {
    setForm({ ...emptyForm, entry_date: todayIsoDate() });
    setSavedSnapshot(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!activeSnapshot) {
      setError("انتظر تحميل أسعار الصرف قبل الحفظ.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await saveDailyEntry({
        id: form.id || undefined,
        entry_date: form.entry_date,
        new_orders: Number(form.new_orders) || 0,
        confirmed: Number(form.confirmed) || 0,
        delivered: Number(form.delivered) || 0,
        returned: Number(form.returned) || 0,
        revenue_amount: Number(form.revenue_amount) || 0,
        revenue_currency: form.revenue_currency,
        ads_cost_amount: Number(form.ads_cost_amount) || 0,
        ads_cost_currency: form.ads_cost_currency,
        exchange_rate_snapshot: activeSnapshot,
        ops: {
          sales_model: salesModel,
          fulfillment,
          fulfillment_custom: customApp,
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "تم الحفظ.");
      resetForm();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذا الإدخال؟")) return;
    startTransition(async () => {
      const result = await deleteDailyEntry(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "تم الحذف.");
      if (form.id === id) resetForm();
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <form className="cb-card space-y-4" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">إدخال اليوم</h2>
            <p className="text-sm text-stone-500">التاريخ الافتراضي هو اليوم، ويمكن تعديله.</p>
          </div>
          {form.id ? (
            <button className="text-sm text-forest-mid underline" type="button" onClick={resetForm}>
              إدخال جديد
            </button>
          ) : (
            <button className="cb-btn-ghost min-h-9 px-3 text-xs" type="button" onClick={copyPrevious}>
              {t("copy.yesterday")}
            </button>
          )}
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">التاريخ</span>
          <input
            className="cb-input"
            type="date"
            value={form.entry_date}
            onChange={(event) =>
              setForm((current) => ({ ...current, entry_date: event.target.value }))
            }
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">نموذج البيع</span>
            <select
              className="cb-input"
              value={salesModel}
              onChange={(event) => setSalesModel(event.target.value as SalesModel)}
            >
              <option value="cod">{t("model.cod")}</option>
              <option value="prepaid">{t("model.prepaid")}</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">التطبيق / المستودع</span>
            <select
              className="cb-input"
              value={fulfillment}
              onChange={(event) => setFulfillment(event.target.value as FulfillmentApp)}
            >
              {FULFILLMENT_APPS.map((app) => (
                <option key={app} value={app}>
                  {fulfillmentLabel(app, customApp, lang)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {fulfillment === "custom" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("app.custom")}</span>
            <input
              className="cb-input"
              value={customApp}
              onChange={(event) => setCustomApp(event.target.value)}
              placeholder="CJ, Zendrop, AutoDS..."
            />
          </label>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={t("funnel.new")}
            value={form.new_orders}
            onChange={(value) => setForm((current) => ({ ...current, new_orders: value }))}
          />
          <NumberField
            label={salesModel === "prepaid" ? t("funnel.paid") : t("funnel.confirmed")}
            value={form.confirmed}
            onChange={(value) => setForm((current) => ({ ...current, confirmed: value }))}
          />
          <NumberField
            label={salesModel === "prepaid" ? t("funnel.shipped") : t("funnel.delivered")}
            value={form.delivered}
            onChange={(value) => setForm((current) => ({ ...current, delivered: value }))}
          />
          <NumberField
            label={salesModel === "prepaid" ? t("funnel.refunds") : t("funnel.returned")}
            value={form.returned}
            onChange={(value) => setForm((current) => ({ ...current, returned: value }))}
          />
        </div>

        <MoneyInput
          id="revenue"
          label="إجمالي الإيرادات"
          hint="يُدخل عادة بالبيزو المكسيكي"
          amount={form.revenue_amount}
          currency={form.revenue_currency}
          onAmountChange={(value) =>
            setForm((current) => ({ ...current, revenue_amount: value }))
          }
          onCurrencyChange={(value) =>
            setForm((current) => ({ ...current, revenue_currency: value }))
          }
          snapshot={activeSnapshot}
        />

        <MoneyInput
          id="ads"
          label="تكلفة الإعلانات"
          hint="تُدخل عادة بالدولار الأمريكي"
          amount={form.ads_cost_amount}
          currency={form.ads_cost_currency}
          onAmountChange={(value) =>
            setForm((current) => ({ ...current, ads_cost_amount: value }))
          }
          onCurrencyChange={(value) =>
            setForm((current) => ({ ...current, ads_cost_currency: value }))
          }
          snapshot={activeSnapshot}
        />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">تكلفة المنتج (من الحاسبة)</span>
          <select
            className="cb-input"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="avg">متوسط كل المنتجات المحفوظة</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.product_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-500">
            تكلفة الوحدة المستخدمة:{" "}
            {activeSnapshot
              ? formatMoney(
                  convertFromCad(unitCogsCad, displayCurrency, activeSnapshot),
                  displayCurrency,
                )
              : "—"}
            {products.length === 0
              ? " — احفظ منتجاً في صفحة المنتجات لاحتساب أدق."
              : null}
          </p>
        </label>

        <button className="cb-btn w-full" disabled={pending} type="submit">
          {pending ? "جاري الحفظ..." : form.id ? "تحديث الإدخال" : "حفظ اليوم"}
        </button>
        {ratesError ? <p className="text-sm text-red-700">{ratesError}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-teal-800">{message}</p> : null}
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          label="معدل التأكيد"
          value={formatPercent(confirmationRate(previewEntry))}
        />
        <Kpi
          label="معدل التسليم"
          value={formatPercent(deliveryRate(previewEntry))}
        />
        <Kpi
          label={`صافي الربح (${displayCurrency})`}
          value={formatMoney(previewProfitDisplay, displayCurrency)}
        />
      </div>

      <DailyChart entries={entries} unitCogsCad={unitCogsCad} />

      <section className="cb-card overflow-hidden p-0">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="text-base font-semibold">كل الإدخالات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-3 py-3 font-medium">التاريخ</th>
                <th className="px-3 py-3 font-medium">طلبات</th>
                <th className="px-3 py-3 font-medium">تأكيد / تسليم</th>
                <th className="px-3 py-3 font-medium">إيرادات</th>
                <th className="px-3 py-3 font-medium">صافي الربح</th>
                <th className="px-3 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-stone-500" colSpan={6}>
                    لا توجد إدخالات بعد.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const profitCad = dailyNetProfitCad(entry, unitCogsCad);
                  const profitDisplay = convertFromCad(
                    profitCad,
                    displayCurrency,
                    entry.exchange_rate_snapshot,
                  );
                  const revenueDisplay = convertFromCad(
                    dailyRevenueCad(entry),
                    displayCurrency,
                    entry.exchange_rate_snapshot,
                  );
                  return (
                    <tr key={entry.id} className="border-t border-stone-100">
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatDisplayDate(entry.entry_date)}
                      </td>
                      <td className="px-3 py-3">{entry.new_orders}</td>
                      <td className="px-3 py-3">
                        {formatPercent(confirmationRate(entry))}
                        <span className="text-stone-400"> / </span>
                        {formatPercent(deliveryRate(entry))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatMoney(revenueDisplay, displayCurrency)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatMoney(profitDisplay, displayCurrency)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            className="text-teal-800 underline"
                            type="button"
                            onClick={() => loadEntry(entry)}
                          >
                            تعديل
                          </button>
                          <button
                            className="text-red-700 underline"
                            type="button"
                            onClick={() => onDelete(entry.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="cb-input"
        inputMode="numeric"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="cb-card">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-teal-900">{value}</p>
    </article>
  );
}
