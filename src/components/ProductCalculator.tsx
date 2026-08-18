"use client";

import { deleteProduct, saveProduct } from "@/app/actions/products";
import { calculateProductPricing } from "@/lib/calculations";
import {
  commissionLabel,
  FULFILLMENT_APPS,
  type FulfillmentApp,
  type ProductDecision,
  type SalesModel,
} from "@/lib/commerce";
import {
  DEFAULT_CLICK_TO_ORDER_PCT,
  DEFAULT_CONFIRMATION_PCT,
  DEFAULT_DELIVERY_PCT,
  DEFAULT_SAFETY_PCT,
  costSharePct,
  estimateAds,
  historicalFunnel,
  salePriceCoveringCpaMxn,
} from "@/lib/ads";
import { convertAmount, convertFromCad } from "@/lib/currency";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import type { Currency, DailyEntry, ProductCalculation } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useDisplayCurrency } from "./DisplayCurrency";
import { MoneyInput } from "./MoneyInput";
import { usePrefs } from "./PrefsProvider";
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
  entries,
  initialProduct = null,
}: {
  products: ProductCalculation[];
  entries: DailyEntry[];
  initialProduct?: ProductCalculation | null;
}) {
  const router = useRouter();
  const { snapshot, error: ratesError } = useRates();
  const { currency: displayCurrency } = useDisplayCurrency();
  const { shop, t, lang } = usePrefs();
  const history = historicalFunnel(entries);
  const [form, setForm] = useState(() =>
    initialProduct
      ? {
          id: initialProduct.id,
          product_name: initialProduct.product_name,
          supplier_cost_amount: String(initialProduct.supplier_cost_amount),
          supplier_cost_currency: initialProduct.supplier_cost_currency,
          shipping_cost_amount: String(initialProduct.shipping_cost_amount),
          shipping_cost_currency: initialProduct.shipping_cost_currency,
          dropi_commission_pct: String(initialProduct.dropi_commission_pct),
          sale_price_amount: String(initialProduct.sale_price_amount),
          sale_price_currency: initialProduct.sale_price_currency,
          ads_cost_per_order_amount: String(initialProduct.ads_cost_per_order_amount),
          ads_cost_per_order_currency: initialProduct.ads_cost_per_order_currency,
        }
      : emptyForm,
  );
  const [salesModel, setSalesModel] = useState<SalesModel>(
    initialProduct?.ops.sales_model ?? shop.salesModel,
  );
  const [fulfillment, setFulfillment] = useState<FulfillmentApp>(
    initialProduct?.ops.fulfillment ?? shop.fulfillment,
  );
  const [customApp, setCustomApp] = useState(
    initialProduct?.ops.fulfillment_custom ?? shop.customApp,
  );
  const [shopifyUrl, setShopifyUrl] = useState(
    initialProduct?.ops.shopify_url ?? shop.shopifyUrl,
  );
  const [decision, setDecision] = useState<ProductDecision>(
    initialProduct?.ops.decision ?? "watch",
  );
  const [decisionNote, setDecisionNote] = useState(
    initialProduct?.ops.decision_note ?? "",
  );
  const [targetMarginPct, setTargetMarginPct] = useState("20");
  const [safetyPct, setSafetyPct] = useState(String(DEFAULT_SAFETY_PCT));
  const [confirmationPct, setConfirmationPct] = useState(
    history.confirmationPct
      ? String(Math.round(history.confirmationPct))
      : String(DEFAULT_CONFIRMATION_PCT),
  );
  const [deliveryPct, setDeliveryPct] = useState(
    history.deliveryPct
      ? String(Math.round(history.deliveryPct))
      : String(DEFAULT_DELIVERY_PCT),
  );
  const [clickToOrderPct, setClickToOrderPct] = useState(
    String(DEFAULT_CLICK_TO_ORDER_PCT),
  );
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const supplierMxn = snapshot
    ? convertAmount(
        Number(form.supplier_cost_amount) || 0,
        form.supplier_cost_currency,
        "MXN",
        snapshot,
      )
    : 0;
  const shippingMxn = snapshot
    ? convertAmount(
        Number(form.shipping_cost_amount) || 0,
        form.shipping_cost_currency,
        "MXN",
        snapshot,
      )
    : 0;
  const saleMxn = snapshot
    ? convertAmount(
        Number(form.sale_price_amount) || 0,
        form.sale_price_currency,
        "MXN",
        snapshot,
      )
    : 0;

  const adsEstimate = useMemo(() => {
    if (!snapshot || saleMxn <= 0) return null;
    return estimateAds({
      supplierMxn,
      shippingMxn,
      saleMxn,
      dropiCommissionPct: Number(form.dropi_commission_pct) || 0,
      confirmationPct: Number(confirmationPct) || 0,
      deliveryPct: Number(deliveryPct) || 0,
      safetyPct: Number(safetyPct) || 0,
      clickToOrderPct: Number(clickToOrderPct) || 0,
      snapshot,
    });
  }, [
    snapshot,
    saleMxn,
    supplierMxn,
    shippingMxn,
    form.dropi_commission_pct,
    confirmationPct,
    deliveryPct,
    safetyPct,
    clickToOrderPct,
  ]);

  const pricing = useMemo(() => {
    if (!snapshot) return null;
    const adsAmount =
      Number(form.ads_cost_per_order_amount) ||
      (adsEstimate
        ? convertAmount(
            adsEstimate.recommendedCpaMxn,
            "MXN",
            form.ads_cost_per_order_currency,
            snapshot,
          )
        : 0);
    return calculateProductPricing(
      {
        supplierCostAmount: Number(form.supplier_cost_amount) || 0,
        supplierCostCurrency: form.supplier_cost_currency,
        shippingCostAmount: Number(form.shipping_cost_amount) || 0,
        shippingCostCurrency: form.shipping_cost_currency,
        dropiCommissionPct: Number(form.dropi_commission_pct) || 0,
        salePriceAmount: Number(form.sale_price_amount) || 0,
        salePriceCurrency: form.sale_price_currency,
        adsCostPerOrderAmount: adsAmount,
        adsCostPerOrderCurrency: form.ads_cost_per_order_currency,
        targetMarginPct: Number(targetMarginPct) || 20,
      },
      snapshot,
    );
  }, [form, snapshot, targetMarginPct, adsEstimate]);

  const priceCoveringCpa = useMemo(() => {
    if (!snapshot || !adsEstimate) return null;
    return salePriceCoveringCpaMxn({
      supplierMxn,
      shippingMxn,
      dropiCommissionPct: Number(form.dropi_commission_pct) || 0,
      cpaMxn: adsEstimate.recommendedCpaMxn,
      targetMarginPct: Number(targetMarginPct) || 20,
    });
  }, [
    snapshot,
    adsEstimate,
    supplierMxn,
    shippingMxn,
    form.dropi_commission_pct,
    targetMarginPct,
  ]);

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
    setSalesModel(product.ops.sales_model);
    setFulfillment(product.ops.fulfillment);
    setCustomApp(product.ops.fulfillment_custom);
    setShopifyUrl(product.ops.shopify_url);
    setDecision(product.ops.decision);
    setDecisionNote(product.ops.decision_note);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setTargetMarginPct("20");
    setSafetyPct(String(DEFAULT_SAFETY_PCT));
    setSalesModel(shop.salesModel);
    setFulfillment(shop.fulfillment);
    setCustomApp(shop.customApp);
    setShopifyUrl(shop.shopifyUrl);
    setDecision("watch");
    setDecisionNote("");
  }

  function applyRecommendedPrice(priceMxn: number) {
    setForm((current) => ({
      ...current,
      sale_price_amount: String(Math.ceil(priceMxn)),
      sale_price_currency: "MXN",
    }));
    setMessage("تم تعبئة سعر البيع المقترح.");
  }

  function applyRecommendedCpa(cpaUsd: number) {
    setForm((current) => ({
      ...current,
      ads_cost_per_order_amount: String(Math.round(cpaUsd * 100) / 100),
      ads_cost_per_order_currency: "USD",
    }));
    setMessage("تم تعبئة أقصى CPA مقبول كتكلفة إعلان لكل طلب.");
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
        ops: {
          sales_model: salesModel,
          fulfillment,
          fulfillment_custom: customApp,
          shopify_url: shopifyUrl,
          decision,
          decision_note: decisionNote,
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
              من تكلفة المنتج حتى أقصى إعلان مقبول وسعر البيع النهائي.
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
            <span className="text-sm font-medium">التطبيق</span>
            <select
              className="cb-input"
              value={fulfillment}
              onChange={(event) => setFulfillment(event.target.value as FulfillmentApp)}
            >
              {FULFILLMENT_APPS.map((app) => (
                <option key={app} value={app}>
                  {t(`app.${app}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {fulfillment === "custom" ? (
          <input
            className="cb-input"
            value={customApp}
            onChange={(event) => setCustomApp(event.target.value)}
            placeholder="Zendrop, AutoDS, app name..."
          />
        ) : null}
        {fulfillment === "shopify" || salesModel === "prepaid" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">رابط Shopify / المنتج</span>
            <input
              className="cb-input"
              value={shopifyUrl}
              onChange={(event) => setShopifyUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
        ) : null}
        <div className="space-y-2">
          <p className="text-sm font-medium">القرار</p>
          <div className="grid grid-cols-3 gap-2">
            {(["scale", "watch", "kill"] as ProductDecision[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDecision(value)}
                className={`min-h-11 rounded-2xl text-sm font-semibold ${
                  decision === value
                    ? value === "kill"
                      ? "bg-loss text-white"
                      : value === "scale"
                        ? "bg-profit text-white"
                        : "bg-forest text-white"
                    : "border border-line bg-card"
                }`}
              >
                {t(`decision.${value}`)}
              </button>
            ))}
          </div>
          <input
            className="cb-input"
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            placeholder={lang === "fr" ? "Pourquoi cette décision ?" : "لماذا هذا القرار؟"}
          />
        </div>

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
          <span className="text-sm font-medium text-stone-700">
            {commissionLabel(fulfillment, lang)}
          </span>
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
          id="sale"
          label="سعر البيع"
          hint="أدخل سعراً تجريبياً لحساب أقصى إعلان مقبول"
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

        {snapshot ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-amber-950">
                تقدير الإعلان لكل طلب (CPA)
              </h3>
              <p className="mt-1 text-xs text-amber-900/80">
                أقصى CPA مقبول = الهامش الخام قبل الإعلان × نسبة التسليم من
                الطلبات الجديدة × (1 − هامش الأمان). الإعلان يُدفع على كل طلب،
                والربح يأتي من الطلبات المسلّمة فقط.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PercentField
                label="معدل التأكيد %"
                value={confirmationPct}
                onChange={setConfirmationPct}
                hint={
                  history.confirmationPct
                    ? `من بياناتك: ${formatNumber(history.confirmationPct, 0)}%`
                    : "افتراضي COD: 50%"
                }
              />
              <PercentField
                label="معدل التسليم %"
                value={deliveryPct}
                onChange={setDeliveryPct}
                hint={
                  history.deliveryPct
                    ? `من بياناتك: ${formatNumber(history.deliveryPct, 0)}%`
                    : "من المؤكد: 70%"
                }
              />
              <PercentField
                label="هامش الأمان %"
                value={safetyPct}
                onChange={setSafetyPct}
                hint="احتفظ بربح بعد الإعلان"
              />
              <PercentField
                label="تحويل النقرة لطلب %"
                value={clickToOrderPct}
                onChange={setClickToOrderPct}
                hint="لحساب أقصى CPC"
              />
            </div>

            {adsEstimate ? (
              <>
                <div
                  className={`rounded-xl p-3 ${
                    adsEstimate.verdict === "go"
                      ? "bg-teal-700 text-white"
                      : adsEstimate.verdict === "caution"
                        ? "bg-amber-700 text-white"
                        : "bg-red-700 text-white"
                  }`}
                >
                  <p className="text-xs opacity-90">أقصى CPA مقبول لكل طلب جديد</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatMoney(adsEstimate.maxCpaUsd, "USD")}
                  </p>
                  <p className="mt-1 text-xs opacity-90">
                    {formatMoney(adsEstimate.maxCpaMxn, "MXN")} /{" "}
                    {formatMoney(adsEstimate.maxCpaCad, "CAD")}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {adsEstimate.verdict === "go"
                      ? "المنتج قابل للإعلان — CPA مريح"
                      : adsEstimate.verdict === "caution"
                        ? "حساس: أعلن بحذر أو ارفع سعر البيع"
                        : "غير مربح للإعلان بهذا السعر"}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Stat
                    label="الهامش الخام قبل الإعلان"
                    value={formatMoney(adsEstimate.grossBeforeAdsMxn, "MXN")}
                    sub={`${formatNumber(adsEstimate.grossBeforeAdsPct)}% من البيع`}
                  />
                  <Stat
                    label="التسليم من الطلبات الجديدة"
                    value={formatPercent(adsEstimate.deliveredOfNew)}
                  />
                  <Stat
                    label="CPA نقطة التعادل"
                    value={formatMoney(
                      convertAmount(
                        adsEstimate.breakEvenCpaMxn,
                        "MXN",
                        "USD",
                        snapshot,
                      ),
                      "USD",
                    )}
                    sub="بدون هامش أمان"
                  />
                  <Stat
                    label="أقصى CPC"
                    value={
                      adsEstimate.maxCpcUsd
                        ? formatMoney(adsEstimate.maxCpcUsd, "USD")
                        : "—"
                    }
                    sub="تكلفة النقرة القصوى"
                  />
                </dl>

                <p className="text-xs text-amber-950">
                  إذا أنفقت {formatMoney(adsEstimate.recommendedCpaUsd, "USD")}{" "}
                  لكل طلب، يبقى صافي تقريبي{" "}
                  {formatMoney(adsEstimate.netIfRecommendedMxn, "MXN")} (
                  {formatNumber(adsEstimate.netIfRecommendedPct)}%).
                </p>

                <button
                  className="cb-btn w-full"
                  type="button"
                  disabled={adsEstimate.maxCpaUsd <= 0}
                  onClick={() => applyRecommendedCpa(adsEstimate.recommendedCpaUsd)}
                >
                  استخدم هذا الـ CPA في تكلفة الإعلان
                </button>

                {priceCoveringCpa ? (
                  <div className="rounded-xl bg-white p-3 ring-1 ring-amber-200">
                    <p className="text-xs text-stone-500">
                      سعر البيع النهائي المطلوب لهامش {targetMarginPct}% مع هذا
                      الـ CPA
                    </p>
                    <p className="mt-1 text-xl font-bold text-stone-900">
                      {formatMoney(Math.ceil(priceCoveringCpa), "MXN")}
                    </p>
                    <button
                      className="mt-2 text-sm font-semibold text-teal-800 underline"
                      type="button"
                      onClick={() => applyRecommendedPrice(priceCoveringCpa)}
                    >
                      استخدم سعر البيع النهائي
                    </button>
                  </div>
                ) : null}

                <CostBreakdown
                  sale={saleMxn}
                  supplier={adsEstimate.productCostMxn - shippingMxn}
                  shipping={shippingMxn}
                  commission={adsEstimate.commissionMxn}
                  ads={convertAmount(
                    Number(form.ads_cost_per_order_amount) || adsEstimate.recommendedCpaMxn,
                    Number(form.ads_cost_per_order_amount)
                      ? form.ads_cost_per_order_currency
                      : "MXN",
                    "MXN",
                    snapshot,
                  )}
                />
              </>
            ) : (
              <p className="text-sm text-amber-900">
                أدخل سعر البيع أولاً لحساب أقصى إعلان مقبول.
              </p>
            )}
          </section>
        ) : null}

        <MoneyInput
          id="ads-order"
          label="تكلفة الإعلان المقدّرة لكل طلب"
          hint="يمكن تعبئتها تلقائياً من أقصى CPA أعلاه"
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
                يحسب السعر ليشمل تكلفة المنتج والتوصيل والإعلان والعمولة مع
                الهامش المطلوب.
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
                <dt className="text-stone-600">الهامش الصافي بعد الإعلان</dt>
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
              const sale = convertAmount(
                product.sale_price_amount,
                product.sale_price_currency,
                "MXN",
                product.exchange_rate_snapshot,
              );
              const supplier = convertAmount(
                product.supplier_cost_amount,
                product.supplier_cost_currency,
                "MXN",
                product.exchange_rate_snapshot,
              );
              const shipping = convertAmount(
                product.shipping_cost_amount,
                product.shipping_cost_currency,
                "MXN",
                product.exchange_rate_snapshot,
              );
              const estimate = estimateAds({
                supplierMxn: supplier,
                shippingMxn: shipping,
                saleMxn: sale,
                dropiCommissionPct: product.dropi_commission_pct,
                confirmationPct: Number(confirmationPct) || DEFAULT_CONFIRMATION_PCT,
                deliveryPct: Number(deliveryPct) || DEFAULT_DELIVERY_PCT,
                safetyPct: Number(safetyPct) || DEFAULT_SAFETY_PCT,
                clickToOrderPct: Number(clickToOrderPct) || DEFAULT_CLICK_TO_ORDER_PCT,
                snapshot: product.exchange_rate_snapshot,
              });
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
                    أقصى CPA:{" "}
                    {estimate
                      ? formatMoney(estimate.maxCpaUsd, "USD")
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

function PercentField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-stone-700">{label}</span>
      <input
        className="cb-input"
        inputMode="decimal"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="block text-[11px] text-stone-500">{hint}</span> : null}
    </label>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-amber-100">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 font-semibold text-stone-900">{value}</dd>
      {sub ? <p className="mt-0.5 text-[11px] text-stone-500">{sub}</p> : null}
    </div>
  );
}

function CostBreakdown({
  sale,
  supplier,
  shipping,
  commission,
  ads,
}: {
  sale: number;
  supplier: number;
  shipping: number;
  commission: number;
  ads: number;
}) {
  const rows = [
    { label: "المورد", value: supplier, color: "bg-stone-400" },
    { label: "التوصيل", value: shipping, color: "bg-stone-500" },
    { label: "Dropi", value: commission, color: "bg-amber-500" },
    { label: "إعلان", value: ads, color: "bg-orange-500" },
  ];
  const profit = sale - supplier - shipping - commission - ads;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-stone-700">توزيع سعر البيع</p>
      <div className="flex h-3 overflow-hidden rounded-full bg-stone-200">
        {rows.map((row) => (
          <div
            key={row.label}
            className={row.color}
            style={{ width: `${Math.max(costSharePct(row.value, sale), 0)}%` }}
          />
        ))}
        <div
          className={profit >= 0 ? "bg-teal-600" : "bg-red-600"}
          style={{ width: `${Math.max(costSharePct(Math.abs(profit), sale), 0)}%` }}
        />
      </div>
      <ul className="grid grid-cols-2 gap-1 text-[11px] text-stone-600">
        {rows.map((row) => (
          <li key={row.label}>
            {row.label}: {formatNumber(costSharePct(row.value, sale), 0)}%
          </li>
        ))}
        <li>
          ربح: {formatNumber(costSharePct(profit, sale), 0)}%
        </li>
      </ul>
    </div>
  );
}
