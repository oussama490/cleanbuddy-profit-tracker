"use client";

import { deleteProduct, saveProduct } from "@/app/actions/products";
import { calculateProductPricing } from "@/lib/calculations";
import { convertAmount, convertFromCad } from "@/lib/currency";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Currency, ProductCalculation } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useDisplayCurrency } from "./DisplayCurrency";
import { MoneyInput } from "./MoneyInput";
import { useRates } from "./RatesProvider";

const emptyForm = {
  id: "",
  product_name: "",
  supplier_cost_amount: "",
  supplier_cost_currency: "MXN" as Currency,
  shipping_cost_amount: "",
  shipping_cost_currency: "MXN" as Currency,
  dropi_commission_pct: "",
  sale_price_amount: "",
  sale_price_currency: "MXN" as Currency,
  ads_cost_per_order_amount: "",
  ads_cost_per_order_currency: "USD" as Currency,
};

export function ProductCalculator({
  products,
}: {
  products: ProductCalculation[];
}) {
  const router = useRouter();
  const { snapshot, error: ratesError } = useRates();
  const { currency: displayCurrency } = useDisplayCurrency();
  const [form, setForm] = useState(emptyForm);
  const [targetMarginPct, setTargetMarginPct] = useState("20");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pricing = useMemo(() => {
    if (!snapshot) return null;
    return calculateProductPricing(
      {
        supplierCostAmount: Number(form.supplier_cost_amount) || 0,
        supplierCostCurrency: form.supplier_cost_currency,
        shippingCostAmount: Number(form.shipping_cost_amount) || 0,
        shippingCostCurrency: form.shipping_cost_currency,
        dropiCommissionPct: Number(form.dropi_commission_pct) || 0,
        salePriceAmount: Number(form.sale_price_amount) || 0,
        salePriceCurrency: form.sale_price_currency,
        adsCostPerOrderAmount: Number(form.ads_cost_per_order_amount) || 0,
        adsCostPerOrderCurrency: form.ads_cost_per_order_currency,
        targetMarginPct: Number(targetMarginPct) || 20,
      },
      snapshot,
    );
  }, [form, snapshot, targetMarginPct]);

  const filtered = products.filter((product) =>
    product.product_name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function loadProduct(product: ProductCalculation) {
    setForm({
      id: product.id,
      product_name: product.product_name,
      supplier_cost_amount: String(product.supplier_cost_amount),
      supplier_cost_currency: product.supplier_cost_currency,
      shipping_cost_amount: String(product.shipping_cost_amount),
      shipping_cost_currency: product.shipping_cost_currency,
      dropi_commission_pct: String(product.dropi_commission_pct),
      sale_price_amount: String(product.sale_price_amount),
      sale_price_currency: product.sale_price_currency,
      ads_cost_per_order_amount: String(product.ads_cost_per_order_amount),
      ads_cost_per_order_currency: product.ads_cost_per_order_currency,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setTargetMarginPct("20");
  }

  function applyRecommendedPrice(priceMxn: number) {
    setForm((current) => ({
      ...current,
      sale_price_amount: String(Math.ceil(priceMxn)),
      sale_price_currency: "MXN",
    }));
    setMessage("تم تعبئة سعر البيع المقترح.");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!snapshot) {
      setError("انتظر تحميل أسعار الصرف قبل الحفظ.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await saveProduct({
        id: form.id || undefined,
        product_name: form.product_name,
        supplier_cost_amount: Number(form.supplier_cost_amount) || 0,
        supplier_cost_currency: form.supplier_cost_currency,
        shipping_cost_amount: Number(form.shipping_cost_amount) || 0,
        shipping_cost_currency: form.shipping_cost_currency,
        dropi_commission_pct: Number(form.dropi_commission_pct) || 0,
        sale_price_amount: Number(form.sale_price_amount) || 0,
        sale_price_currency: form.sale_price_currency,
        ads_cost_per_order_amount: Number(form.ads_cost_per_order_amount) || 0,
        ads_cost_per_order_currency: form.ads_cost_per_order_currency,
        exchange_rate_snapshot: snapshot,
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
    if (!window.confirm("هل تريد حذف هذا المنتج؟")) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
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
            <h2 className="text-lg font-semibold">حاسبة التسعير</h2>
            <p className="text-sm text-stone-500">
              النتائج تتحدث فوراً حسب أسعار الصرف الحالية.
            </p>
          </div>
          {form.id ? (
            <button className="text-sm text-teal-800 underline" type="button" onClick={resetForm}>
              منتج جديد
            </button>
          ) : null}
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">اسم المنتج</span>
          <input
            className="cb-input"
            value={form.product_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, product_name: event.target.value }))
            }
            required
          />
        </label>

        <MoneyInput
          id="supplier"
          label="تكلفة المنتج من المورد"
          hint="تُدخل عادة بالبيزو"
          amount={form.supplier_cost_amount}
          currency={form.supplier_cost_currency}
          onAmountChange={(value) =>
            setForm((current) => ({ ...current, supplier_cost_amount: value }))
          }
          onCurrencyChange={(value) =>
            setForm((current) => ({ ...current, supplier_cost_currency: value }))
          }
          snapshot={snapshot}
        />

        <MoneyInput
          id="shipping"
          label="تكلفة التوصيل"
          amount={form.shipping_cost_amount}
          currency={form.shipping_cost_currency}
          onAmountChange={(value) =>
            setForm((current) => ({ ...current, shipping_cost_amount: value }))
          }
          onCurrencyChange={(value) =>
            setForm((current) => ({ ...current, shipping_cost_currency: value }))
          }
          snapshot={snapshot}
        />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">عمولة Dropi (%)</span>
          <input
            className="cb-input"
            inputMode="decimal"
            type="text"
            value={form.dropi_commission_pct}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                dropi_commission_pct: event.target.value,
              }))
            }
            placeholder="0"
          />
        </label>

        <MoneyInput
          id="ads-order"
          label="تكلفة الإعلان المقدّرة لكل طلب"
          hint="تُدخل عادة بالدولار الأمريكي"
          amount={form.ads_cost_per_order_amount}
          currency={form.ads_cost_per_order_currency}
          onAmountChange={(value) =>
            setForm((current) => ({
              ...current,
              ads_cost_per_order_amount: value,
            }))
          }
          onCurrencyChange={(value) =>
            setForm((current) => ({
              ...current,
              ads_cost_per_order_currency: value,
            }))
          }
          snapshot={snapshot}
        />

        {pricing && snapshot ? (
          <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-teal-950">
                لا تعرف بكم تبيع؟
              </h3>
              <p className="mt-1 text-xs text-teal-900/80">
                أدخل تكلفة المورد والتوصيل والإعلانات، ثم اختر الهامش المطلوب
                لمعرفة سعر البيع المناسب.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">
                الهامش المستهدف (%)
              </span>
              <div className="flex flex-wrap gap-2">
                {[20, 25, 30].map((margin) => (
                  <button
                    key={margin}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      Number(targetMarginPct) === margin
                        ? "bg-teal-700 text-white"
                        : "bg-white text-teal-800 ring-1 ring-teal-200"
                    }`}
                    onClick={() => setTargetMarginPct(String(margin))}
                  >
                    {margin}%
                  </button>
                ))}
              </div>
              <input
                className="cb-input"
                inputMode="decimal"
                type="text"
                value={targetMarginPct}
                onChange={(event) => setTargetMarginPct(event.target.value)}
                placeholder="20"
              />
            </label>

            {pricing.recommendedSalePriceMxn ? (
              <div className="rounded-xl bg-white p-3 ring-1 ring-teal-100">
                <p className="text-xs text-stone-500">سعر البيع المقترح</p>
                <p className="mt-1 text-2xl font-bold text-teal-900">
                  {formatMoney(
                    Math.ceil(pricing.recommendedSalePriceMxn),
                    "MXN",
                  )}
                </p>
                <p className="mt-1 text-xs text-teal-800">
                  = {formatMoney(
                    convertAmount(
                      Math.ceil(pricing.recommendedSalePriceMxn),
                      "MXN",
                      "USD",
                      snapshot,
                    ),
                    "USD",
                  )}{" "}
                  /{" "}
                  {formatMoney(
                    convertAmount(
                      Math.ceil(pricing.recommendedSalePriceMxn),
                      "MXN",
                      "CAD",
                      snapshot,
                    ),
                    "CAD",
                  )}
                </p>
                <button
                  className="cb-btn mt-3 w-full"
                  type="button"
                  onClick={() =>
                    applyRecommendedPrice(pricing.recommendedSalePriceMxn!)
                  }
                >
                  استخدم هذا السعر
                </button>
              </div>
            ) : (
              <p className="text-sm text-amber-900">
                أدخل التكاليف أولاً، أو الهامش المطلوب كبير جداً مقارنة بعمولة
                Dropi.
              </p>
            )}

            <dl className="grid grid-cols-3 gap-2 text-center text-xs">
              {[20, 25, 30].map((margin) => {
                const price = pricing.recommendedPricesMxn[margin];
                return (
                  <div
                    key={margin}
                    className="rounded-lg bg-white px-2 py-2 ring-1 ring-teal-100"
                  >
                    <dt className="text-stone-500">هامش {margin}%</dt>
                    <dd className="mt-1 font-semibold text-teal-900">
                      {price
                        ? formatMoney(Math.ceil(price), "MXN")
                        : "—"}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ) : null}

        <MoneyInput
          id="sale"
          label="سعر البيع المقترح"
          hint="اختياري — للتحقق من هامش سعر محدد"
          amount={form.sale_price_amount}
          currency={form.sale_price_currency}
          onAmountChange={(value) =>
            setForm((current) => ({ ...current, sale_price_amount: value }))
          }
          onCurrencyChange={(value) =>
            setForm((current) => ({ ...current, sale_price_currency: value }))
          }
          snapshot={snapshot}
        />

        {pricing && Number(form.sale_price_amount) > 0 ? (
          <div
            className={`rounded-2xl border p-4 ${
              pricing.isHealthy
                ? "border-teal-200 bg-teal-50 text-teal-950"
                : "border-red-200 bg-red-50 text-red-950"
            }`}
          >
            <p className="text-sm font-semibold">
              {pricing.isHealthy
                ? "الهامش صحي (20% أو أكثر)"
                : "تحذير: الهامش أقل من 20%"}
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-stone-600">الهامش الصافي</dt>
                <dd className="font-semibold">
                  {formatMoney(pricing.netMarginMxn, "MXN")}
                  <span className="mt-0.5 block text-xs font-normal">
                    {formatMoney(pricing.netMarginCad, "CAD")}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-stone-600">نسبة الهامش</dt>
                <dd className="font-semibold">
                  {formatNumber(pricing.marginPercent)}%
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-stone-600">الحد الأدنى لسعر البيع للربحية</dt>
                <dd className="font-semibold">
                  {Number.isFinite(pricing.minSalePriceMxn)
                    ? formatMoney(pricing.minSalePriceMxn, "MXN")
                    : "غير ممكن مع عمولة 100%"}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <button className="cb-btn w-full" disabled={pending} type="submit">
          {pending ? "جاري الحفظ..." : form.id ? "تحديث المنتج" : "حفظ التقييم"}
        </button>
        {ratesError ? <p className="text-sm text-red-700">{ratesError}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-teal-800">{message}</p> : null}
      </form>

      <section className="cb-card space-y-3">
        <h2 className="text-base font-semibold">المنتجات المحفوظة</h2>
        <input
          className="cb-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="بحث باسم المنتج"
        />
        <ul className="space-y-3">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-stone-500">
              لا توجد منتجات مطابقة.
            </li>
          ) : (
            filtered.map((product) => {
              const result = calculateProductPricing(
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
              );
              const marginDisplay = convertFromCad(
                result.netMarginCad,
                displayCurrency,
                product.exchange_rate_snapshot,
              );
              return (
                <li
                  key={product.id}
                  className={`rounded-2xl border p-4 ${
                    result.isHealthy ? "border-teal-100 bg-teal-50/50" : "border-red-100 bg-red-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.product_name}</p>
                      <p className="text-sm text-stone-600">
                        بيع: {formatMoney(product.sale_price_amount, product.sale_price_currency)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatNumber(result.marginPercent)}%
                    </p>
                  </div>
                  <p className="mt-2 text-sm">
                    هامش: {formatMoney(result.netMarginMxn, "MXN")} /{" "}
                    {formatMoney(marginDisplay, displayCurrency)}
                  </p>
                  <p className="text-xs text-stone-500">
                    حد أدنى:{" "}
                    {Number.isFinite(result.minSalePriceMxn)
                      ? formatMoney(result.minSalePriceMxn, "MXN")
                      : "—"}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      className="text-sm text-teal-800 underline"
                      type="button"
                      onClick={() => loadProduct(product)}
                    >
                      تعديل
                    </button>
                    <button
                      className="text-sm text-red-700 underline"
                      type="button"
                      onClick={() => onDelete(product.id)}
                    >
                      حذف
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
