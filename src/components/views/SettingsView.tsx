"use client";

import { CurrencyToggle, useDisplayCurrency } from "@/components/DisplayCurrency";
import { usePrefs } from "@/components/PrefsProvider";
import { PageHeader } from "@/components/ui";
import {
  DEFAULT_SHOP,
  FULFILLMENT_APPS,
  type FulfillmentApp,
} from "@/lib/commerce";
import type { DailyEntry, ProductCalculation, WorkspaceRecord } from "@/lib/types";

export function SettingsView({
  supabaseReady,
  schemaReady,
  extrasReady,
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
  passwordEnabled: boolean;
  productCount: number;
  entryCount: number;
  entries: DailyEntry[];
  products: ProductCalculation[];
  records: WorkspaceRecord[];
}) {
  const { currency } = useDisplayCurrency();
  const { shop, setShop, lang, setLang, theme, setTheme, t } = usePrefs();

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

  return (
    <div>
      <PageHeader
        kicker={t("nav.settings")}
        title={lang === "fr" ? "Réglages" : "الإعدادات"}
        description={
          lang === "fr"
            ? "Modèle COD ou prepaid, app (Dropi, CJ, Shopify…), langue et nuit."
            : "COD أو مدفوع مسبقاً، التطبيق، اللغة، والوضع الليلي."
        }
      />

      <form
        className="cb-card mb-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setShop({
            salesModel: data.get("model") === "prepaid" ? "prepaid" : "cod",
            fulfillment: (String(data.get("app")) as FulfillmentApp) || "dropi",
            customApp: String(data.get("custom") ?? ""),
            shopifyStore: String(data.get("store") ?? shop.shopifyStore),
            shopifyUrl: String(data.get("url") ?? shop.shopifyUrl),
            payoutDelayDays: Number(data.get("delay")) || DEFAULT_SHOP.payoutDelayDays,
            ownerPayPct: Number(data.get("owner")) || DEFAULT_SHOP.ownerPayPct,
          });
        }}
      >
        <p className="font-semibold">{lang === "fr" ? "Modèle de vente" : "نموذج البيع"}</p>
        <select className="cb-input" name="model" defaultValue={shop.salesModel}>
          <option value="cod">{t("model.cod")}</option>
          <option value="prepaid">{t("model.prepaid")}</option>
        </select>
        <select className="cb-input" name="app" defaultValue={shop.fulfillment}>
          {FULFILLMENT_APPS.map((app) => (
            <option key={app} value={app}>
              {t(`app.${app}`)}
            </option>
          ))}
        </select>
        <input
          className="cb-input"
          name="custom"
          defaultValue={shop.customApp}
          placeholder={lang === "fr" ? "Nom de l’autre app" : "اسم التطبيق الآخر"}
        />
        <input className="cb-input" name="store" defaultValue={shop.shopifyStore} placeholder="Shopify store name" />
        <input className="cb-input" name="url" defaultValue={shop.shopifyUrl} placeholder="https://....myshopify.com" />
        <label className="block space-y-2">
          <span className="text-sm">{lang === "fr" ? "Délai paiement COD (jours)" : "تأخير تحويل COD (أيام)"}</span>
          <input className="cb-input" name="delay" defaultValue={String(shop.payoutDelayDays)} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm">{lang === "fr" ? "% que tu te verses" : "٪ تسحبه لنفسك"}</span>
          <input className="cb-input" name="owner" defaultValue={String(shop.ownerPayPct)} />
        </label>
        <button className="cb-btn w-full" type="submit">
          {t("save")}
        </button>
      </form>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <article className="cb-card space-y-3">
          <p className="font-semibold">{lang === "fr" ? "Affichage" : "العرض"}</p>
          <div className="flex flex-wrap gap-2">
            <button className="cb-chip" type="button" onClick={() => setLang(lang === "ar" ? "fr" : "ar")}>
              {lang === "ar" ? "Français" : "العربية"}
            </button>
            <button className="cb-chip" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {t(theme === "dark" ? "theme.light" : "theme.dark")}
            </button>
            <CurrencyToggle />
          </div>
        </article>
        <article className="cb-card space-y-3">
          <p className="font-semibold">{lang === "fr" ? "Sauvegarde" : "نسخة احتياطية"}</p>
          <button className="cb-btn-ghost w-full" type="button" onClick={exportAll}>
            {lang === "fr" ? "Télécharger JSON" : "تنزيل JSON"}
          </button>
        </article>
      </div>

      <article className="cb-card space-y-2 text-sm">
        <Row label={lang === "fr" ? "Devise" : "العملة"} value={currency} />
        <Row label="Mot de passe" value={passwordEnabled ? "on" : "off"} />
        <Row label="Supabase" value={supabaseReady ? "ok" : "off"} />
        <Row label="Tables" value={schemaReady ? "ok" : "missing"} />
        <Row label="workspace_records" value={extrasReady ? "ok" : "run upgrade.sql"} />
        <Row label={lang === "fr" ? "Jours" : "أيام"} value={String(entryCount)} />
        <Row label={lang === "fr" ? "Produits" : "منتجات"} value={String(productCount)} />
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 py-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
