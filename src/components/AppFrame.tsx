"use client";

import { logoutAction } from "@/app/login/actions";
import { NavIcon } from "@/components/icons";
import { CurrencyToggle } from "@/components/DisplayCurrency";
import { usePrefs } from "@/components/PrefsProvider";
import { isActivePath, MOBILE_PRIMARY, NAV_GROUPS, type NavItem } from "@/lib/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

export function AppFrame({
  children,
  passwordEnabled,
  supabaseReady,
  schemaReady,
}: {
  children: ReactNode;
  passwordEnabled: boolean;
  supabaseReady: boolean;
  schemaReady: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const { t, lang, setLang, theme, setTheme } = usePrefs();

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[17.5rem] flex-col border-e border-white/10 bg-forest text-[#f6f0e6] lg:flex">
        <div className="px-6 pb-4 pt-7">
          <p className="cb-kicker text-gold-soft">PRIVATE DESK</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">Cleanbuddy</p>
          <p className="mt-1 text-sm text-white/55">{t("private")}</p>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.titleKey}>
              <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.16em] text-gold-soft/80">
                {t(group.titleKey)}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SideLink
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    label={t(item.labelKey)}
                    hint={t(item.hintKey)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        {passwordEnabled ? (
          <form action={logoutAction} className="border-t border-white/10 p-4">
            <button
              className="min-h-11 w-full rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              type="submit"
            >
              {t("logout")}
            </button>
          </form>
        ) : null}
      </aside>

      <div className="lg:ps-[17.5rem]">
        <header className="sticky top-0 z-20 border-b border-line/70 bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="min-w-0 lg:hidden">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-gold">CLEANBUDDY</p>
              <p className="truncate text-sm font-semibold">{t("private")}</p>
            </div>
            <p className="hidden text-sm text-muted lg:block">{t("tagline")}</p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="cb-chip"
                onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              >
                {lang === "ar" ? "FR" : "ع"}
              </button>
              <button
                type="button"
                className="cb-chip"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {t(theme === "dark" ? "theme.light" : "theme.dark")}
              </button>
              <CurrencyToggle />
            </div>
          </div>
        </header>

        {!supabaseReady ? (
          <p className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 lg:mx-8">
            أضف متغيرات Supabase ثم نفّذ supabase/schema.sql لحفظ البيانات.
          </p>
        ) : !schemaReady ? (
          <p className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 lg:mx-8">
            الجداول غير موجودة بعد. افتح SQL Editor في Supabase والصق محتوى schema.sql ثم Run.
          </p>
        ) : null}

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      {pathname !== "/daily" ? (
        <Link href="/daily" className="cb-fab lg:hidden" aria-label={t("enter.today")}>
          +
        </Link>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {MOBILE_PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-[11px] font-semibold ${
                isActivePath(pathname, item.href) ? "bg-forest text-white" : "text-muted"
              }`}
            >
              <NavIcon name={item.icon} className="mb-0.5 h-4 w-4" />
              {t(item.labelKey).split(" ")[0]}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-12 flex-col items-center justify-center rounded-2xl text-[11px] font-semibold text-muted"
          >
            <span className="mb-0.5 text-base leading-none">•••</span>
            {t("more")}
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-forest/50"
            type="button"
            aria-label={t("close")}
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[1.8rem] bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">{t("all.pages")}</p>
              <button className="cb-btn-ghost min-h-9 px-3" type="button" onClick={() => setMoreOpen(false)}>
                {t("close")}
              </button>
            </div>
            <div className="space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.titleKey}>
                  <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-gold">
                    {t(group.titleKey)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`rounded-2xl border px-3 py-3 ${
                          isActivePath(pathname, item.href)
                            ? "border-forest-mid bg-forest text-white"
                            : "border-line bg-background"
                        }`}
                      >
                        <p className="text-sm font-semibold">{t(item.labelKey)}</p>
                        <p className={`mt-0.5 text-xs ${isActivePath(pathname, item.href) ? "text-white/70" : "text-muted"}`}>
                          {t(item.hintKey)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {passwordEnabled ? (
              <form action={logoutAction} className="mt-5">
                <button className="cb-btn w-full bg-stone-800 hover:bg-stone-900" type="submit">
                  {t("logout")}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SideLink({
  item,
  active,
  label,
  hint,
}: {
  item: NavItem;
  active: boolean;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${
        active ? "bg-white/10 text-white shadow-inner" : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-gold/20 text-gold-soft" : "bg-white/5"}`}>
        <NavIcon name={item.icon} className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block truncate text-[11px] text-white/45">{hint}</span>
      </span>
    </Link>
  );
}
