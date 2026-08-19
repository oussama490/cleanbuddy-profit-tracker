"use client";

import { useDisplayCurrency } from "@/components/DisplayCurrency";
import { LangToggle, usePrefs } from "@/components/PrefsProvider";
import { PageHeader, Section, SettingRow, StatusBadge } from "@/components/ui";
import {
  DEFAULT_SHOP,
  FULFILLMENT_APPS,
  type FulfillmentApp,
  type SalesModel,
} from "@/lib/commerce";
import type { DailyEntry, ProductCalculation, WorkspaceRecord } from "@/lib/types";
import { useState, type FormEvent } from "react";

export function SettingsView({
  supabaseReady,
  schemaReady,
  extrasReady,
  lifeReady,
  passwordEnabled,
  productCount,
  entryCount,
  entries,
  products,
  records,
}: {
  supabaseReady: boolean;
  schemaReady: boolean;
  extrasReady: boolean;
  lifeReady: boolean;
  passwordEnabled: boolean;
  productCount: number;
  entryCount: number;
  entries: DailyEntry[];
  products: ProductCalculation[];
  records: WorkspaceRecord[];
}) {
  const { currency } = useDisplayCurrency();
  const { shop, setShop, t } = usePrefs();
  const [salesModel, setSalesModel] = useState<SalesModel>(shop.salesModel);
  const [fulfillment, setFulfillment] = useState<FulfillmentApp>(shop.fulfillment);
  const [saved, setSaved] = useState(false);

  function exportAll() {
    const blob = new Blob(
      [JSON.stringify({ entries, products, records, shop, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cleanbuddy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setShop({
      salesModel,
      fulfillment,
      customApp: String(data.get("custom") ?? ""),
      shopifyStore: String(data.get("store") ?? shop.shopifyStore),
      shopifyUrl: String(data.get("url") ?? shop.shopifyUrl),
      payoutDelayDays: Number(data.get("delay")) || DEFAULT_SHOP.payoutDelayDays,
      ownerPayPct: Number(data.get("owner")) || DEFAULT_SHOP.ownerPayPct,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div>
      <PageHeader
        kicker={t("nav.settings")}
        title={t("nav.settings")}
        description={t("settings.desc")}
      />

      <form onSubmit={onSave}>
        <Section
          title={t("settings.shop")}
          hint={t("settings.shopHint")}
          footer={
            <div className="flex items-center justify-between gap-3">
              <p className={`text-sm ${saved ? "text-forest-mid" : "text-transparent"}`}>
                {t("common.saved")}
              </p>
              <button className="cb-btn min-h-10 px-5" type="submit">
                {t("save")}
              </button>
            </div>
          }
        >
          <p className="cb-label mb-2">{t("settings.model")}</p>
          <div className="mb-5 grid grid-cols-2 gap-2">
            {(["cod", "prepaid"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSalesModel(value)}
                className={`cb-choice ${salesModel === value ? "cb-choice-on" : "cb-choice-off"}`}
              >
                <span className="text-sm font-semibold">
                  {t(value === "cod" ? "settings.codShort" : "settings.prepaidShort")}
                </span>
                <span className="mt-0.5 text-xs text-muted">
                  {t(value === "cod" ? "settings.codHint" : "settings.prepaidHint")}
                </span>
              </button>
            ))}
          </div>

          <label className="mb-4 block space-y-1.5">
            <span className="cb-label">{t("settings.app")}</span>
            <select
              className="cb-input"
              name="app"
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

          {fulfillment === "custom" ? (
            <label className="mb-4 block space-y-1.5">
              <span className="cb-label">{t("settings.customApp")}</span>
              <input
                className="cb-input"
                name="custom"
                defaultValue={shop.customApp}
                placeholder="CJ, Zendrop, AutoDS…"
              />
            </label>
          ) : (
            <input type="hidden" name="custom" value={shop.customApp} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="cb-label">{t("settings.store")}</span>
              <input
                className="cb-input"
                name="store"
                defaultValue={shop.shopifyStore}
                placeholder="cleanbuddy"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="cb-label">{t("settings.url")}</span>
              <input
                className="cb-input"
                name="url"
                defaultValue={shop.shopifyUrl}
                placeholder="https://….myshopify.com"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="cb-label">{t("settings.payout")}</span>
              <input className="cb-input" name="delay" defaultValue={String(shop.payoutDelayDays)} />
            </label>
            <label className="block space-y-1.5">
              <span className="cb-label">{t("settings.owner")}</span>
              <input className="cb-input" name="owner" defaultValue={String(shop.ownerPayPct)} />
            </label>
          </div>
        </Section>
      </form>

      <Section title={t("settings.display")} hint={t("settings.displayHint")}>
        <SettingRow label={t("settings.lang")}>
          <LangToggle />
        </SettingRow>
      </Section>

      <Section title={t("settings.backup")} hint={t("settings.backupHint")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {entryCount} {t("settings.days")} · {productCount} {t("settings.products")}
          </p>
          <button className="cb-btn-ghost min-h-10" type="button" onClick={exportAll}>
            {t("settings.export")}
          </button>
        </div>
      </Section>

      <Section title={t("settings.system")}>
        <SettingRow label={t("common.currency")}>
          <span className="cb-badge cb-badge-muted">{currency}</span>
        </SettingRow>
        <SettingRow label={t("settings.password")}>
          <StatusBadge ok={passwordEnabled} onLabel={t("settings.on")} offLabel={t("settings.off")} />
        </SettingRow>
        <SettingRow label="Supabase">
          <StatusBadge ok={supabaseReady} onLabel={t("settings.ok")} offLabel={t("settings.off")} />
        </SettingRow>
        <SettingRow label="Tables">
          <StatusBadge ok={schemaReady} onLabel={t("settings.ok")} offLabel={t("settings.missing")} />
        </SettingRow>
        <SettingRow label="workspace_records">
          <StatusBadge ok={extrasReady} onLabel={t("settings.ok")} offLabel={t("settings.missing")} />
        </SettingRow>
        <SettingRow label="jobs / budget">
          <StatusBadge ok={lifeReady} onLabel={t("settings.ok")} offLabel={t("settings.missing")} />
        </SettingRow>
      </Section>
    </div>
  );
}
