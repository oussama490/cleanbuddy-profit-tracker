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
import { FormSection } from "./ui";
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
    setMessage(t("product.filledPrice"));
  }

  function applyRecommendedCpa(cpaUsd: number) {
    setForm((current) => ({
      ...current,
      ads_cost_per_order_amount: String(Math.round(cpaUsd * 100) / 100),
      ads_cost_per_order_currency: "USD",
    }));
    setMessage(t("product.filledCpa"));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!snapshot) {
      setError(t("common.waitRates"));
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
      setMessage(t("common.saved"));
      resetForm();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
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
            <h2 className="text-lg font-semibold">{t("product.calc")}</h2>
            <p className="text-sm text-muted">
              {t("product.calcHint")}
            </p>
          </div>
          {form.id ? (
            <button className="text-sm text-forest-mid underline" type="button" onClick={resetForm}>
              {t("product.new")}
            </button>
          ) : null}
        </div>

        <FormSection title={t("product.section.info")}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{t("product.name")}</span>
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
            <span className="text-sm font-medium">{t("product.appOnly")}</span>
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
            <span className="text-sm font-medium">{t("product.shopifyUrl")}</span>
            <input
              className="cb-input"
              value={shopifyUrl}
              onChange={(event) => setShopifyUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
        ) : null}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("product.decision")}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["scale", "watch", "kill"] as ProductDecision[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDecision(value)}
                className={`min-h-11 text-sm font-semibold ${
                  decision === value
                    ? value === "kill"
                      ? "bg-loss text-white"
                      : value === "scale"
                        ? "bg-profit text-on-accent"
                        : "bg-forest-mid text-on-accent"
                    : "border border-line bg-card"
                }`}
                style={{ borderRadius: "var(--radius)" }}
              >
                {t(`decision.${value}`)}
              </button>
            ))}
          </div>
          <input
            className="cb-input"
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            placeholder={t("product.why")}
          />
        </div>
        </FormSection>

        <FormSection title={t("product.section.costs")}>
        <MoneyInput
          id="supplier"
          label={t("product.supplier")}
          hint={t("product.supplierHint")}
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
          label={t("product.shipping")}
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
          <span className="text-sm font-medium text-foreground">
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
          label={t("product.sale")}
          hint={t("product.saleHint")}
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
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                {t("product.cpaTitle")}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {t("product.cpaHint")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PercentField
                label={t("product.confirmPct")}
                value={confirmationPct}
                onChange={setConfirmationPct}
                hint={
                  history.confirmationPct
                    ? t("product.fromData", { n: formatNumber(history.confirmationPct, 0) })
                    : t("product.defaultCod")
                }
              />
              <PercentField
                label={t("product.deliverPct")}
                value={deliveryPct}
                onChange={setDeliveryPct}
                hint={
                  history.deliveryPct
                    ? t("product.fromData", { n: formatNumber(history.deliveryPct, 0) })
                    : t("product.fromConfirmed")
                }
              />
              <PercentField
                label={t("product.safety")}
                value={safetyPct}
                onChange={setSafetyPct}
                hint={t("product.safetyHint")}
              />
              <PercentField
                label={t("product.cto")}
                value={clickToOrderPct}
                onChange={setClickToOrderPct}
                hint={t("product.ctoHint")}
              />
            </div>

            {adsEstimate ? (
              <>
                <div
                  className={`p-4 ${
                    adsEstimate.verdict === "go"
                      ? "bg-forest-mid text-on-accent"
                      : adsEstimate.verdict === "caution"
                        ? "bg-warn text-on-accent"
                        : "bg-loss text-white"
                  }`}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <p className="text-xs opacity-90">{t("product.maxCpaNew")}</p>
                  <p className="cb-num mt-1 text-2xl font-semibold">
                    {formatMoney(adsEstimate.maxCpaUsd, "USD")}
                  </p>
                  <p className="mt-1 text-xs opacity-90">
                    {formatMoney(adsEstimate.maxCpaMxn, "MXN")} /{" "}
                    {formatMoney(adsEstimate.maxCpaCad, "CAD")}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {adsEstimate.verdict === "go"
                      ? t("product.adsOk")
                      : adsEstimate.verdict === "caution"
                        ? t("product.adsCareful")
                        : t("product.adsBad")}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Stat
                    label={t("product.grossBefore")}
                    value={formatMoney(adsEstimate.grossBeforeAdsMxn, "MXN")}
                    sub={t("product.ofSale", { n: formatNumber(adsEstimate.grossBeforeAdsPct) })}
                  />
                  <Stat
                    label={t("product.delivOfNew")}
                    value={formatPercent(adsEstimate.deliveredOfNew)}
                  />
                  <Stat
                    label={t("product.beCpa")}
                    value={formatMoney(
                      convertAmount(
                        adsEstimate.breakEvenCpaMxn,
                        "MXN",
                        "USD",
                        snapshot,
                      ),
                      "USD",
                    )}
                    sub={t("product.noSafety")}
                  />
                  <Stat
                    label={t("product.maxCpc")}
                    value={
                      adsEstimate.maxCpcUsd
                        ? formatMoney(adsEstimate.maxCpcUsd, "USD")
                        : "—"
                    }
                    sub={t("product.maxCpcSub")}
                  />
                </dl>

                <p className="text-xs text-muted">
                  {t("product.ifSpend", {
                    cpa: formatMoney(adsEstimate.recommendedCpaUsd, "USD"),
                    net: formatMoney(adsEstimate.netIfRecommendedMxn, "MXN"),
                    pct: formatNumber(adsEstimate.netIfRecommendedPct),
                  })}
                </p>

                <button
                  className="cb-btn w-full"
                  type="button"
                  disabled={adsEstimate.maxCpaUsd <= 0}
                  onClick={() => applyRecommendedCpa(adsEstimate.recommendedCpaUsd)}
                >
                  {t("product.useCpa")}
                </button>

                {priceCoveringCpa ? (
                  <div className="border border-line bg-background p-3" style={{ borderRadius: "var(--radius)" }}>
                    <p className="text-xs text-muted">
                      {t("product.finalPriceFor", { n: targetMarginPct })}
                    </p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                      {formatMoney(Math.ceil(priceCoveringCpa), "MXN")}
                    </p>
                    <button
                      className="mt-2 text-sm font-semibold text-forest-mid underline"
                      type="button"
                      onClick={() => applyRecommendedPrice(priceCoveringCpa)}
                    >
                      {t("product.useFinalPrice")}
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
              <p className="text-sm text-muted">
                {t("product.enterSaleFirst")}
              </p>
            )}
          </section>
        ) : null}

        <MoneyInput
          id="ads-order"
          label={t("product.estAds")}
          hint={t("product.estAdsHint")}
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
        </FormSection>

        {pricing && snapshot ? (
          <FormSection title={t("product.section.results")}>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("product.dontKnow")}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {t("product.priceHint")}
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">
                {t("product.targetMargin")}
              </span>
              <div className="flex flex-wrap gap-2">
                {[20, 25, 30].map((margin) => (
                  <button
                    key={margin}
                    type="button"
                    className={`px-3 py-1.5 text-sm font-semibold ${
                      Number(targetMarginPct) === margin
                        ? "bg-forest-mid text-on-accent"
                        : "bg-background text-foreground ring-1 ring-line"
                    }`}
                    style={{ borderRadius: "var(--radius)" }}
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
              <div className="border border-line bg-background p-3" style={{ borderRadius: "var(--radius)" }}>
                <p className="text-xs text-muted">{t("product.suggestedPrice")}</p>
                <p className="mt-1 text-2xl font-bold text-forest-mid">
                  {formatMoney(
                    Math.ceil(pricing.recommendedSalePriceMxn),
                    "MXN",
                  )}
                </p>
                <p className="mt-1 text-xs text-forest-mid">
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
                  {t("product.usePrice")}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">
                {t("product.enterCosts")}
              </p>
            )}

            <dl className="grid grid-cols-3 gap-2 text-center text-xs">
              {[20, 25, 30].map((margin) => {
                const price = pricing.recommendedPricesMxn[margin];
                return (
                  <div
                    key={margin}
                    className="border border-line bg-background px-2 py-2"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <dt className="text-muted">{t("product.marginPct", { n: margin })}</dt>
                    <dd className="mt-1 font-semibold text-forest-mid">
                      {price
                        ? formatMoney(Math.ceil(price), "MXN")
                        : "—"}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {Number(form.sale_price_amount) > 0 ? (
              <div
                className={`border p-4 ${
                  pricing.isHealthy
                    ? "border-line bg-card text-foreground"
                    : "border-loss/40 bg-card text-loss"
                }`}
                style={{ borderRadius: "var(--radius)" }}
              >
                <p className="text-sm font-semibold">
                  {pricing.isHealthy
                    ? t("product.healthyMsg")
                    : t("product.warnMsg")}
                </p>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">{t("product.netAfterAds")}</dt>
                    <dd className="font-semibold">
                      {formatMoney(pricing.netMarginMxn, "MXN")}
                      <span className="mt-0.5 block text-xs font-normal">
                        {formatMoney(pricing.netMarginCad, "CAD")}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t("product.marginRatio")}</dt>
                    <dd className="font-semibold">
                      {formatNumber(pricing.marginPercent)}%
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted">{t("product.minSale")}</dt>
                    <dd className="font-semibold">
                      {Number.isFinite(pricing.minSalePriceMxn)
                        ? formatMoney(pricing.minSalePriceMxn, "MXN")
                        : t("product.impossible")}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </FormSection>
        ) : null}

        <button className="cb-btn w-full" disabled={pending} type="submit">
          {pending ? t("common.saving") : form.id ? t("product.updateBtn") : t("product.saveBtn")}
        </button>
        {ratesError ? <p className="text-sm text-loss">{ratesError}</p> : null}
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        {message ? <p className="text-sm text-forest-mid">{message}</p> : null}
      </form>

      <section className="cb-card space-y-3">
        <h2 className="text-base font-semibold">{t("product.savedList")}</h2>
        <input
          className="cb-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("product.searchPh")}
        />
        <ul className="space-y-3">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted">
              {t("product.noMatch")}
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
                  className={`border p-4 ${
                    result.isHealthy ? "border-line bg-card" : "border-loss/30 bg-card"
                  }`}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.product_name}</p>
                      <p className="text-sm text-muted">
                        {t("product.saleShort")}: {formatMoney(product.sale_price_amount, product.sale_price_currency)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatNumber(result.marginPercent)}%
                    </p>
                  </div>
                  <p className="mt-2 text-sm">
                    {t("product.margin")}: {formatMoney(result.netMarginMxn, "MXN")} /{" "}
                    {formatMoney(marginDisplay, displayCurrency)}
                  </p>
                  <p className="text-xs text-muted">
                    {t("product.maxCpaShort")}:{" "}
                    {estimate
                      ? formatMoney(estimate.maxCpaUsd, "USD")
                      : "—"}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      className="text-sm text-forest-mid underline"
                      type="button"
                      onClick={() => loadProduct(product)}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      className="text-loss underline"
                      type="button"
                      onClick={() => onDelete(product.id)}
                    >
                      {t("delete")}
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
      <span className="text-xs font-medium text-foreground">{label}</span>
      <input
        className="cb-input"
        inputMode="decimal"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="block text-[11px] text-muted">{hint}</span> : null}
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
    <div className="rounded-[var(--radius)] border border-line bg-background p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-foreground">{value}</dd>
      {sub ? <p className="mt-0.5 text-[11px] text-muted">{sub}</p> : null}
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
  const { t } = usePrefs();
  const rows = [
    { label: t("product.supplierShort"), value: supplier, color: "bg-muted" },
    { label: t("product.shipShort"), value: shipping, color: "bg-forest-mid" },
    { label: "Dropi", value: commission, color: "bg-gold" },
    { label: t("product.adShort"), value: ads, color: "bg-warn" },
  ];
  const profit = sale - supplier - shipping - commission - ads;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">{t("product.breakdown")}</p>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-line">
        {rows.map((row) => (
          <div
            key={row.label}
            className={row.color}
            style={{ width: `${Math.max(costSharePct(row.value, sale), 0)}%` }}
          />
        ))}
        <div
          className={profit >= 0 ? "bg-profit" : "bg-loss"}
          style={{ width: `${Math.max(costSharePct(Math.abs(profit), sale), 0)}%` }}
        />
      </div>
      <ul className="grid grid-cols-2 gap-1 text-[11px] text-muted">
        {rows.map((row) => (
          <li key={row.label}>
            {row.label}: {formatNumber(costSharePct(row.value, sale), 0)}%
          </li>
        ))}
        <li>
          {t("product.profitShare")}: {formatNumber(costSharePct(profit, sale), 0)}%
        </li>
      </ul>
    </div>
  );
}
