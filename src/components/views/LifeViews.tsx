"use client";

import {
  deleteWorkspaceRecord,
  saveWorkspaceRecord,
} from "@/app/actions/workspace";
import { usePrefs } from "@/components/PrefsProvider";
import { EmptyState, ExtrasBanner, KpiCard, PageHeader } from "@/components/ui";
import { addDaysIso, loggingStreak } from "@/lib/commerce";
import {
  filterEntries,
  money,
  periodStart,
  summarizePeriod,
  unitCogsFromProducts,
} from "@/lib/insights";
import { formatDisplayDate, formatMoney, todayIsoDate } from "@/lib/format";
import type {
  DailyEntry,
  ExchangeRateSnapshot,
  ProductCalculation,
  WorkspaceRecord,
} from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { useDisplayCurrency } from "@/components/DisplayCurrency";

const DEFAULT_TASKS_AR = [
  "تحقق من الإعلانات",
  "راجع التطبيق (Dropi / CJ / Shopify)",
  "تأكيدات أو تجهيز الشحن",
  "سجّل أرقام اليوم",
  "أوقف الإعلان الضعيف",
];

const DEFAULT_TASKS_FR = [
  "Vérifier les pubs",
  "Checker l’app (Dropi / CJ / Shopify)",
  "Confirmations ou expédition",
  "Saisir les chiffres du jour",
  "Couper la pub faible",
];

export function ChecklistView({
  records,
  extrasReady,
}: {
  records: WorkspaceRecord[];
  extrasReady: boolean;
}) {
  const { t, lang } = usePrefs();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = todayIsoDate();
  const todayTasks = records.filter((record) => record.entry_date === today);

  function seed() {
    const tasks = lang === "fr" ? DEFAULT_TASKS_FR : DEFAULT_TASKS_AR;
    startTransition(async () => {
      for (const title of tasks) {
        await saveWorkspaceRecord({
          kind: "checklist",
          title,
          entry_date: today,
          meta: { done: false },
        });
      }
      router.refresh();
    });
  }

  function toggle(record: WorkspaceRecord) {
    startTransition(async () => {
      await saveWorkspaceRecord({
        id: record.id,
        kind: "checklist",
        title: record.title,
        body: record.body,
        entry_date: record.entry_date,
        meta: { ...record.meta, done: !record.meta.done },
      });
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        kicker={t("nav.checklist")}
        title={t("nav.checklist")}
        description={lang === "fr" ? "Coche le rituel du matin. 5 minutes." : "روتين الصباح. خمس دقائق."}
        actions={
          todayTasks.length === 0 ? (
            <button className="cb-btn px-4" type="button" onClick={seed} disabled={pending || !extrasReady}>
              {lang === "fr" ? "Créer la liste" : "إنشاء القائمة"}
            </button>
          ) : null
        }
      />
      <ExtrasBanner ready={extrasReady} />
      {todayTasks.length === 0 ? (
        <EmptyState
          title={lang === "fr" ? "Pas encore de liste" : "لا قائمة اليوم"}
          body={lang === "fr" ? "Crée la liste du jour en un tap." : "أنشئ قائمة اليوم بضغطة."}
        />
      ) : (
        <ul className="space-y-2">
          {todayTasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => toggle(task)}
                className={`flex w-full items-center gap-3 rounded-[1.2rem] border px-4 py-4 text-start ${
                  task.meta.done ? "border-profit/40 bg-profit/10" : "border-line bg-card"
                }`}
              >
                <span className="grid h-6 w-6 place-items-center rounded-full border border-line text-xs">
                  {task.meta.done ? "✓" : ""}
                </span>
                <span className={task.meta.done ? "text-muted line-through" : "font-semibold"}>
                  {task.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CalendarView({ entries }: { entries: DailyEntry[] }) {
  const { t, lang } = usePrefs();
  const today = todayIsoDate();
  const month = today.slice(0, 7);
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const logged = new Set(entries.map((entry) => entry.entry_date));
  const streak = loggingStreak(entries.map((entry) => entry.entry_date), today);
  const yesterday = addDaysIso(today, -1);
  const missed = !logged.has(yesterday) && entries.length > 0;

  return (
    <div>
      <PageHeader
        kicker={t("nav.calendar")}
        title={month}
        description={lang === "fr" ? "Vert = saisi. Vide = oublié." : "أخضر = مسجّل. فارغ = منسي."}
      />
      {missed ? (
        <Link href="/daily" className="cb-warn mb-4">
          {t("missed.yesterday")}
        </Link>
      ) : null}
      <p className="mb-4 text-sm text-muted">
        {t("streak")}: <span className="font-bold text-forest-mid">{streak}</span>
      </p>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = String(index + 1).padStart(2, "0");
          const iso = `${month}-${day}`;
          const isLogged = logged.has(iso);
          const isToday = iso === today;
          return (
            <Link
              key={iso}
              href="/daily"
              className={`grid aspect-square place-items-center text-[11px] font-semibold sm:text-sm ${
                isLogged
                  ? "bg-profit text-on-accent"
                  : isToday
                    ? "bg-forest-mid text-on-accent"
                    : "border border-line bg-card text-muted"
              }`}
              style={{ borderRadius: "var(--radius)" }}
            >
              {index + 1}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function OwnerView({
  entries,
  products,
  snapshot,
}: {
  entries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
}) {
  const { shop, t, lang } = usePrefs();
  const { currency } = useDisplayCurrency();
  const unitCogsCad = unitCogsFromProducts(products);
  const month = summarizePeriod(filterEntries(entries, periodStart("month")), unitCogsCad);
  const fx = snapshot ?? entries[0]?.exchange_rate_snapshot ?? null;
  const takeCad = Math.max(month.profitCad, 0) * (shop.ownerPayPct / 100);
  const show = (cad: number) => (fx ? formatMoney(money(cad, currency, fx), currency) : "—");

  return (
    <div>
      <PageHeader
        kicker={t("nav.owner")}
        title={t("owner.take")}
        description={
          lang === "fr"
            ? `${shop.ownerPayPct}% du profit du mois. Change le % dans Réglages.`
            : `${shop.ownerPayPct}% من ربح الشهر. غيّر النسبة في الإعدادات.`
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={lang === "fr" ? "Profit du mois" : "ربح الشهر"} value={show(month.profitCad)} tone={month.profitCad >= 0 ? "profit" : "loss"} />
        <KpiCard label={t("owner.take")} value={show(takeCad)} tone="gold" />
        <KpiCard label={lang === "fr" ? "À laisser dans le business" : "يبقى في البزنس"} value={show(Math.max(month.profitCad - takeCad, 0))} />
      </div>
    </div>
  );
}

export function PayoutsView({
  entries,
  snapshot,
  records,
  extrasReady,
}: {
  entries: DailyEntry[];
  snapshot: ExchangeRateSnapshot | null;
  records: WorkspaceRecord[];
  extrasReady: boolean;
}) {
  const { shop, t, lang } = usePrefs();
  const { currency } = useDisplayCurrency();
  const fx = snapshot ?? entries[0]?.exchange_rate_snapshot ?? null;
  const today = todayIsoDate();
  const upcoming = entries
    .filter((entry) => entry.ops.sales_model === "cod" && entry.delivered > 0)
    .map((entry) => {
      const due = addDaysIso(entry.entry_date, shop.payoutDelayDays);
      const cad = entry.revenue_amount * entry.exchange_rate_snapshot.toCad[entry.revenue_currency];
      return { entry, due, cad, pending: due >= today };
    })
    .sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div>
      <PageHeader
        kicker={t("nav.payouts")}
        title={t("nav.payouts")}
        description={
          lang === "fr"
            ? `COD: l’argent arrive environ ${shop.payoutDelayDays} jours après la livraison.`
            : `COD: المال يصل تقريباً بعد ${shop.payoutDelayDays} يوماً من التسليم.`
        }
      />
      <ExtrasBanner ready={extrasReady} />
      {upcoming.length === 0 ? (
        <EmptyState title={lang === "fr" ? "Pas de livraisons COD" : "لا تسليم COD"} body="" />
      ) : (
        <ul className="space-y-2">
          {upcoming.slice(0, 30).map((item) => (
            <li key={item.entry.id} className="cb-card flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{formatDisplayDate(item.due)}</p>
                <p className="text-xs text-muted">
                  {lang === "fr" ? "Livré le" : "سُلّم"} {formatDisplayDate(item.entry.entry_date)}
                </p>
              </div>
              <div className="text-end">
                <p className="font-bold">
                  {fx ? formatMoney(money(item.cad, currency, fx), currency) : "—"}
                </p>
                <p className={`text-xs ${item.pending ? "text-gold" : "text-profit"}`}>
                  {item.pending ? (lang === "fr" ? "en attente" : "قيد الانتظار") : lang === "fr" ? "dû" : "استُحق"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {records.length > 0 ? (
        <p className="mt-4 text-sm text-muted">
          {lang === "fr" ? "Mouvements manuels" : "حركات يدوية"}: {records.length}
        </p>
      ) : null}
    </div>
  );
}

export function ShopifyView({
  products,
  stores,
  extrasReady,
}: {
  products: ProductCalculation[];
  stores: WorkspaceRecord[];
  extrasReady: boolean;
}) {
  const { shop, setShop, t, lang } = usePrefs();
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shopifyProducts = products.filter(
    (product) => product.ops.fulfillment === "shopify" || product.ops.sales_model === "prepaid",
  );

  function resetForm() {
    setName("");
    setUrl("");
    setNote("");
    setEditId(null);
  }

  function normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return `https://${trimmed}`;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const storeName = name.trim();
    const storeUrl = normalizeUrl(url);
    if (!storeName) {
      setError(lang === "fr" ? "Le nom du site est obligatoire." : "اسم الموقع مطلوب.");
      return;
    }
    if (!storeUrl) {
      setError(lang === "fr" ? "L’URL du site est obligatoire." : "رابط الموقع مطلوب.");
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await saveWorkspaceRecord({
        id: editId || undefined,
        kind: "shop",
        title: storeName,
        body: storeUrl,
        meta: { url: storeUrl, note: note.trim() },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!shop.shopifyUrl || editId) {
        setShop({
          ...shop,
          shopifyStore: storeName,
          shopifyUrl: storeUrl,
        });
      }
      setMessage(
        lang === "fr"
          ? editId
            ? "Site modifié."
            : "Site ajouté."
          : editId
            ? "تم تعديل الموقع."
            : "تمت إضافة الموقع.",
      );
      resetForm();
      router.refresh();
    });
  }

  function loadStore(record: WorkspaceRecord) {
    setEditId(record.id);
    setName(record.title);
    setUrl(String(record.meta.url ?? record.body ?? ""));
    setNote(String(record.meta.note ?? ""));
    setMessage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeStore(record: WorkspaceRecord) {
    const ok = window.confirm(
      lang === "fr"
        ? `Supprimer le site « ${record.title} » ?`
        : `حذف الموقع « ${record.title} »؟`,
    );
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteWorkspaceRecord(record.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (shop.shopifyUrl === (record.meta.url || record.body)) {
        setShop({ ...shop, shopifyStore: "", shopifyUrl: "" });
      }
      if (editId === record.id) resetForm();
      setMessage(lang === "fr" ? "Site supprimé." : "تم حذف الموقع.");
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        kicker="Shopify"
        title={lang === "fr" ? "Tes sites Shopify" : "مواقع Shopify"}
        description={
          lang === "fr"
            ? "Ajoute un site, ouvre-le, modifie-le ou supprime-le. Tu peux en avoir plusieurs."
            : "أضف موقعاً، افتحه، عدّله أو احذفه. يمكنك حفظ أكثر من متجر."
        }
      />
      <ExtrasBanner ready={extrasReady} />
      <form className="cb-card mb-5 space-y-3" onSubmit={onSubmit}>
        <p className="font-semibold">
          {editId
            ? lang === "fr"
              ? "Modifier le site"
              : "تعديل الموقع"
            : lang === "fr"
              ? "Ajouter un site"
              : "إضافة موقع"}
        </p>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{lang === "fr" ? "Nom du site" : "اسم الموقع"}</span>
          <input
            className="cb-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Cleanbuddy MX"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">URL</span>
          <input
            className="cb-input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://cleanbuddy.myshopify.com"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">{lang === "fr" ? "Note (optionnel)" : "ملاحظة (اختياري)"}</span>
          <input
            className="cb-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={lang === "fr" ? "Thème, pays, prepaid..." : "الثيم، البلد، prepaid..."}
          />
        </label>
        <div className="flex gap-2">
          <button className="cb-btn flex-1" disabled={pending || !extrasReady} type="submit">
            {pending
              ? lang === "fr"
                ? "Enregistrement..."
                : "جاري الحفظ..."
              : editId
                ? lang === "fr"
                  ? "Mettre à jour"
                  : "تحديث"
                : lang === "fr"
                  ? "Ajouter le site"
                  : "إضافة الموقع"}
          </button>
          {editId ? (
            <button className="cb-btn-ghost" type="button" onClick={resetForm}>
              {t("close")}
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        {message ? <p className="text-sm text-profit">{message}</p> : null}
      </form>

      {stores.length === 0 ? (
        <EmptyState
          title={lang === "fr" ? "Aucun site encore" : "لا مواقع بعد"}
          body={
            lang === "fr"
              ? "Écris le nom + l’URL puis « Ajouter le site »."
              : "اكتب الاسم والرابط ثم « إضافة الموقع »."
          }
        />
      ) : (
        <ul className="mb-6 space-y-2">
          {stores.map((store) => {
            const storeUrl = String(store.meta.url ?? store.body ?? "");
            return (
              <li key={store.id} className="cb-card">
                <p className="font-semibold">{store.title}</p>
                <p className="mt-1 break-all text-xs text-muted">{storeUrl}</p>
                {store.meta.note ? (
                  <p className="mt-1 text-sm text-muted">{String(store.meta.note)}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {storeUrl ? (
                    <a className="cb-btn-ghost min-h-10 px-3" href={storeUrl} target="_blank" rel="noreferrer">
                      {lang === "fr" ? "Ouvrir" : "فتح"}
                    </a>
                  ) : null}
                  <button className="cb-btn-ghost min-h-10 px-3" type="button" onClick={() => loadStore(store)}>
                    {lang === "fr" ? "Modifier" : "تعديل"}
                  </button>
                  <button
                    className="cb-btn-ghost min-h-10 px-3 text-loss"
                    type="button"
                    onClick={() => removeStore(store)}
                  >
                    {lang === "fr" ? "Supprimer" : "حذف"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {shopifyProducts.length > 0 ? (
        <div className="space-y-2">
          <p className="font-semibold">{lang === "fr" ? "Produits Shopify / prepaid" : "منتجات Shopify / مدفوعة"}</p>
          {shopifyProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="cb-card block">
              <p className="font-semibold">{product.product_name}</p>
              <p className="text-xs text-muted">
                {t(`model.${product.ops.sales_model}`)} · {t(`app.${product.ops.fulfillment}`)} · {t(`decision.${product.ops.decision}`)}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SearchView({
  entries,
  products,
  records,
}: {
  entries: DailyEntry[];
  products: ProductCalculation[];
  records: WorkspaceRecord[];
}) {
  const { lang } = usePrefs();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const productHits = products.filter((product) => product.product_name.toLowerCase().includes(q));
  const noteHits = records.filter(
    (record) =>
      record.title.toLowerCase().includes(q) || record.body.toLowerCase().includes(q),
  );
  const dayHits = entries.filter((entry) => entry.entry_date.includes(q));

  return (
    <div>
      <PageHeader
        kicker={lang === "fr" ? "Recherche" : "بحث"}
        title={lang === "fr" ? "Tout trouver" : "ابحث في كل شيء"}
      />
      <input
        className="cb-input mb-5"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={lang === "fr" ? "Produit, note, date..." : "منتج، ملاحظة، تاريخ..."}
      />
      {!q ? (
        <EmptyState title={lang === "fr" ? "Tape un mot" : "اكتب كلمة"} body="" />
      ) : (
        <div className="space-y-4">
          {productHits.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="cb-card block">
              {product.product_name}
            </Link>
          ))}
          {noteHits.map((record) => (
            <article key={record.id} className="cb-card">
              <p className="text-xs text-gold">{record.kind}</p>
              <p className="font-semibold">{record.title}</p>
              <p className="text-sm text-muted">{record.body}</p>
            </article>
          ))}
          {dayHits.map((entry) => (
            <Link key={entry.id} href="/daily" className="cb-card block">
              {formatDisplayDate(entry.entry_date)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function RitualStrip({
  entries,
  products,
  snapshot,
}: {
  entries: DailyEntry[];
  products: ProductCalculation[];
  snapshot: ExchangeRateSnapshot | null;
}) {
  const { t, shop, lang } = usePrefs();
  const { currency } = useDisplayCurrency();
  const hour = new Date().getHours();
  const greeting = hour < 17 ? t("greeting.morning") : t("greeting.evening");
  const today = todayIsoDate();
  const yesterday = addDaysIso(today, -1);
  const logged = new Set(entries.map((entry) => entry.entry_date));
  const missed = !logged.has(yesterday) && entries.length > 0;
  const streak = loggingStreak([...logged], today);
  const unitCogsCad = unitCogsFromProducts(products);
  const month = summarizePeriod(filterEntries(entries, periodStart("month")), unitCogsCad);
  const fx = snapshot ?? entries[0]?.exchange_rate_snapshot ?? null;
  const take = Math.max(month.profitCad, 0) * (shop.ownerPayPct / 100);

  return (
    <div className="mb-5 space-y-3">
      {missed ? (
        <Link href="/daily" className="cb-warn">
          {t("missed.yesterday")}
        </Link>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="cb-card">
          <p className="text-xs text-muted">{greeting}</p>
          <p className="mt-1 font-semibold">{t("streak")}: {streak}</p>
        </article>
        <article className="cb-card">
          <p className="text-xs text-muted">{t("owner.take")}</p>
          <p className="mt-1 font-bold text-gold">
            {fx ? formatMoney(money(take, currency, fx), currency) : "—"}
          </p>
        </article>
        <article className="cb-card">
          <p className="text-xs text-muted">{lang === "fr" ? "Modèle" : "النموذج"}</p>
          <p className="mt-1 text-sm font-semibold">
            {t(`model.${shop.salesModel}`)} · {t(`app.${shop.fulfillment}`)}
          </p>
        </article>
      </div>
    </div>
  );
}
