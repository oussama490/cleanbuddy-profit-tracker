"use client";

import { logoutAction } from "@/app/login/actions";
import { NavIcon } from "@/components/icons";
import { CurrencyToggle } from "@/components/DisplayCurrency";
import { ThemeToggle, usePrefs } from "@/components/PrefsProvider";
import {
  isActivePath,
  PRIMARY_NAV,
  SETTINGS_NAV,
  type NavItem,
} from "@/lib/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
  const pathname = usePathname();
  const { t, lang, setLang, theme, setTheme } = usePrefs();

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[15.5rem] flex-col bg-[var(--ink)] text-[#e8eef6] lg:flex">
        <div className="flex items-center gap-3 px-5 pb-7 pt-6">
          <span className="cb-mark h-9 w-9 text-[12px]">CB</span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight">Cleanbuddy</p>
            <p className="text-[11px] text-white/40">{t("desk.kicker")}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {PRIMARY_NAV.map((navItem) => (
            <SideLink
              key={navItem.href}
              item={navItem}
              active={isActivePath(pathname, navItem.href)}
              label={t(navItem.labelKey)}
            />
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <SideLink
            item={SETTINGS_NAV}
            active={isActivePath(pathname, SETTINGS_NAV.href)}
            label={t(SETTINGS_NAV.labelKey)}
          />
          {passwordEnabled ? (
            <form action={logoutAction}>
              <button
                className="min-h-10 w-full rounded-[8px] px-3 text-start text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
                type="submit"
              >
                {t("logout")}
              </button>
            </form>
          ) : null}
        </div>
      </aside>

      <div className="lg:ps-[15.5rem]">
        <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur-md">
          <div className="flex h-[3.25rem] items-center justify-between gap-3 px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <span className="cb-mark h-8 w-8 text-[11px]">CB</span>
              <p className="truncate text-sm font-semibold tracking-tight">Cleanbuddy</p>
            </div>
            <p className="hidden text-[13px] text-muted lg:block">{t("tagline")}</p>
            <div className="flex min-w-0 items-center gap-1.5">
              <button
                type="button"
                className="cb-chip"
                onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              >
                {lang === "ar" ? "FR" : "ع"}
              </button>
              <button
                type="button"
                className="cb-chip md:hidden"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {t(theme === "dark" ? "theme.light" : "theme.dark")}
              </button>
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <CurrencyToggle />
              <Link
                href="/settings"
                className={`grid h-8 w-8 place-items-center rounded-[8px] border border-line lg:hidden ${
                  isActivePath(pathname, "/settings")
                    ? "bg-forest-mid text-[#05241e]"
                    : "bg-card text-foreground"
                }`}
                aria-label={t("nav.settings")}
              >
                <NavIcon name="gear" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {!supabaseReady ? (
          <p className="cb-notice mx-4 mt-4 lg:mx-8">{t("frame.noEnv")}</p>
        ) : !schemaReady ? (
          <p className="cb-notice mx-4 mt-4 lg:mx-8">{t("frame.noTables")}</p>
        ) : null}

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8 lg:px-8 lg:pb-16">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5">
          {PRIMARY_NAV.map((navItem) => {
            const active = isActivePath(pathname, navItem.href);
            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
                  active ? "text-forest-mid" : "text-muted"
                }`}
              >
                {active ? (
                  <span className="absolute inset-x-7 top-0 h-0.5 rounded-full bg-forest-mid" />
                ) : null}
                <NavIcon name={navItem.icon} className="h-4 w-4" />
                {t(navItem.shortKey)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function SideLink({
  item,
  active,
  label,
}: {
  item: NavItem;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-3 rounded-[8px] px-3 py-2 text-[13.5px] transition ${
        active
          ? "bg-white/8 font-semibold text-white"
          : "text-white/50 hover:bg-white/5 hover:text-white"
      }`}
    >
      {active ? (
        <span className="absolute inset-y-2 start-0 w-[2px] rounded-full bg-[var(--led)]" />
      ) : null}
      <NavIcon name={item.icon} className="h-4 w-4 shrink-0 opacity-80" />
      {label}
    </Link>
  );
}
