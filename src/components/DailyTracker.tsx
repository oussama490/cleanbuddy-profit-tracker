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
    setMessage(t("daily.loaded"));
  }

  function copyPrevious() {
    const previousDate = addDaysIso(form.entry_date || todayIsoDate(), -1);
    const previous =
      entries.find((entry) => entry.entry_date === previousDate) ?? entries[0];
    if (!previous) {
      setError(t("daily.noPrev"));
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
      setError(t("common.waitRates"));
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
      setMessage(t("common.saved"));
      resetForm();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteDailyEntry(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(t("common.deleted"));
      if (form.id === id) resetForm();
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <form className="cb-card space-y-4" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("daily.title")}</h2>
            <p className="text-sm text-muted">{t("daily.formHint")}</p>
          </div>
          {form.id ? (
            <button className="text-sm text-forest-mid underline" type="button" onClick={resetForm}>
              {t("daily.new")}
            </button>
          ) : (
            <button className="cb-btn-ghost min-h-9 px-3 text-xs" type="button" onClick={copyPrevious}>
              {t("copy.yesterday")}
            </button>
          )}
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">{t("common.date")}</span>
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
            <span className="text-sm font-medium">{t("common.salesModel")}</span>
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
            <span className="text-sm font-medium">{t("common.app")}</span>
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
          label={t("dash.revenue")}
          hint={t("daily.revenueHint")}
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
          label={t("dash.ads")}
          hint={t("daily.adsHint")}
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
          <span className="text-sm font-medium">{t("daily.cogs")}</span>
          <select
            className="cb-input"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="avg">{t("daily.avg")}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.product_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {t("daily.unitCost")}:{" "}
            {activeSnapshot
              ? formatMoney(
                  convertFromCad(unitCogsCad, displayCurrency, activeSnapshot),
                  displayCurrency,
                )
              : "—"}
            {products.length === 0 ? ` — ${t("dash.noProductsBody")}` : null}
          </p>
        </label>

        <button className="cb-btn w-full" disabled={pending} type="submit">
          {pending ? t("common.saving") : form.id ? t("daily.update") : t("daily.save")}
        </button>
        {ratesError ? <p className="text-sm text-loss">{ratesError}</p> : null}
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        {message ? <p className="text-sm text-forest-mid">{message}</p> : null}
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label={t("daily.confirmRate")} value={formatPercent(confirmationRate(previewEntry))} />
        <Kpi label={t("daily.deliverRate")} value={formatPercent(deliveryRate(previewEntry))} />
        <Kpi
          label={`${t("daily.net")} (${displayCurrency})`}
          value={formatMoney(previewProfitDisplay, displayCurrency)}
        />
      </div>

      <DailyChart entries={entries} unitCogsCad={unitCogsCad} />

      <section className="cb-card overflow-hidden p-0">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold">{t("daily.all")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="cb-table">
            <thead>
              <tr>
                <th>{t("common.date")}</th>
                <th>{t("dash.orders")}</th>
                <th>{t("dash.confirmDeliver")}</th>
                <th>{t("dash.revenue")}</th>
                <th>{t("daily.net")}</th>
                <th> </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-muted" colSpan={6}>
                    {t("daily.none")}
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
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap">
                        {formatDisplayDate(entry.entry_date)}
                      </td>
                      <td className="cb-num">{entry.new_orders}</td>
                      <td className="cb-num">
                        {formatPercent(confirmationRate(entry))}
                        <span className="text-muted"> / </span>
                        {formatPercent(deliveryRate(entry))}
                      </td>
                      <td className="cb-num whitespace-nowrap">
                        {formatMoney(revenueDisplay, displayCurrency)}
                      </td>
                      <td className="cb-num whitespace-nowrap">
                        {formatMoney(profitDisplay, displayCurrency)}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            className="text-forest-mid underline"
                            type="button"
                            onClick={() => loadEntry(entry)}
                          >
                            {t("common.edit")}
                          </button>
                          <button
                            className="text-loss underline"
                            type="button"
                            onClick={() => onDelete(entry.id)}
                          >
                            {t("delete")}
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
      <span className="text-sm font-medium text-foreground">{label}</span>
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
    <article className="cb-kpi">
      <p className="text-xs text-muted">{label}</p>
      <p className="cb-num mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </article>
  );
}
