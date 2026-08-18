"use client";

import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { KpiCard, PageHeader } from "@/components/ui";
import { useRates } from "@/components/RatesProvider";
import {
  DEFAULT_CLICK_TO_ORDER_PCT,
  DEFAULT_CONFIRMATION_PCT,
  DEFAULT_DELIVERY_PCT,
  historicalFunnel,
} from "@/lib/ads";
import { convertToCad } from "@/lib/currency";
import {
  breakEvenDeliveries,
  money,
  projectFromBudget,
  summarizePeriod,
  unitCogsFromProducts,
} from "@/lib/insights";
import { formatMoney, formatNumber } from "@/lib/format";
import type { DailyEntry, ProductCalculation } from "@/lib/types";
import { useMemo, useState } from "react";

export function SimulateView({
  entries,
  products,
}: {
  entries: DailyEntry[];
  products: ProductCalculation[];
}) {
  const { currency } = useDisplayCurrency();
  const { snapshot } = useRates();
  const history = historicalFunnel(entries);
  const unitCogsCad = unitCogsFromProducts(products);
  const all = summarizePeriod(entries, unitCogsCad);
  const [dailyAds, setDailyAds] = useState("20");
  const [days, setDays] = useState("30");
  const [cpc, setCpc] = useState("0.4");
  const [confirm, setConfirm] = useState(
    String(Math.round(history.confirmationPct ?? DEFAULT_CONFIRMATION_PCT)),
  );
  const [delivery, setDelivery] = useState(
    String(Math.round(history.deliveryPct ?? DEFAULT_DELIVERY_PCT)),
  );
  const [cto, setCto] = useState(String(DEFAULT_CLICK_TO_ORDER_PCT));

  const projection = useMemo(() => {
    if (!snapshot) return null;
    const dailyAdsCad = convertToCad(Number(dailyAds) || 0, currency, snapshot);
    const cpcCad = convertToCad(Number(cpc) || 0, currency, snapshot);
    const profitPer = all.profitPerDeliveredCad ?? 0;
    return projectFromBudget({
      dailyAdsCad,
      days: Number(days) || 0,
      confirmationPct: Number(confirm) || 0,
      deliveryPct: Number(delivery) || 0,
      clickToOrderPct: Number(cto) || 0,
      cpcCad,
      profitPerDeliveredCad: profitPer,
    });
  }, [
    snapshot,
    dailyAds,
    days,
    cpc,
    confirm,
    delivery,
    cto,
    all.profitPerDeliveredCad,
    currency,
  ]);

  const be = breakEvenDeliveries(
    snapshot
      ? convertToCad(Number(dailyAds) || 0, currency, snapshot) * (Number(days) || 0)
      : 0,
    all.profitPerDeliveredCad,
  );
  const show = (cad: number) =>
    snapshot ? formatMoney(money(cad, currency, snapshot), currency) : "—";

  return (
    <div>
      <PageHeader
        kicker="المحاكاة"
        title="ماذا لو رفعت الميزانية؟"
        description="السيناريو يستخدم قمعك الحقيقي وربح المسلّم التاريخي. الأرقام تقديرية لك."
      />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="cb-card space-y-4" onSubmit={(event) => event.preventDefault()}>
          <Field label={`ميزانية إعلان يومية (${currency})`} value={dailyAds} onChange={setDailyAds} />
          <Field label="عدد الأيام" value={days} onChange={setDays} />
          <Field label={`CPC تقريبي (${currency})`} value={cpc} onChange={setCpc} />
          <Field label="تأكيد %" value={confirm} onChange={setConfirm} />
          <Field label="تسليم %" value={delivery} onChange={setDelivery} />
          <Field label="نقرات → طلب %" value={cto} onChange={setCto} />
        </form>
        <div className="space-y-3">
          <KpiCard
            label="ربح متوقع"
            value={projection ? show(projection.profitCad) : "—"}
            tone={projection && projection.profitCad >= 0 ? "profit" : "loss"}
          />
          <KpiCard label="إنفاق الفترة" value={projection ? show(projection.adsCad) : "—"} tone="gold" />
          <KpiCard
            label="طلبات / مسلّم"
            value={
              projection
                ? `${formatNumber(projection.newOrders, 0)} / ${formatNumber(projection.delivered, 0)}`
                : "—"
            }
          />
          <KpiCard
            label="نقطة التعادل"
            value={be ? `${formatNumber(be, 1)} تسليم` : "—"}
            hint="لتغطية إنفاق الفترة"
          />
        </div>
      </div>
    </div>
  );
}

function Field({
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
      <span className="text-sm font-medium">{label}</span>
      <input className="cb-input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
