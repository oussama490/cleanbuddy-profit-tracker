"use client";

import { logoutAction } from "@/app/login/actions";
import { NavIcon } from "@/components/icons";
import { CurrencyToggle } from "@/components/DisplayCurrency";
import { ThemeToggle, usePrefs } from "@/components/PrefsProvider";
import {
  isActivePath,
  MOBILE_NAV,
  SETTINGS_NAV,
  SIDEBAR_GROUPS,
  type NavItem,
} from "@/lib/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const closedSlide = lang === "ar" ? "translate-x-full" : "-translate-x-full";

  return (
    <div className="min-h-dvh overflow-x-clip bg-background">
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label={t("close")}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-[16.5rem] flex-col bg-[var(--ink)] text-[#e8eef6] transition-transform duration-200 lg:z-30 lg:translate-x-0 lg:pointer-events-auto ${
          menuOpen ? "translate-x-0" : `${closedSlide} pointer-events-none lg:translate-x-0`
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-6 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="cb-mark h-9 w-9 text-[12px]">CB</span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight">Cleanbuddy</p>
              <p className="text-[11px] text-white/40">{t("desk.kicker")}</p>
            </div>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-[8px] text-white/60 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label={t("close")}
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.titleKey}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                {t(group.titleKey)}
              </p>
              <div className="space-y-0.5">
                {group.items.map((navItem) => (
                  <SideLink
                    key={navItem.href}
                    item={navItem}
                    active={isActivePath(pathname, navItem.href)}
                    label={t(navItem.labelKey)}
                    onNavigate={() => setMenuOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-3">
          <div className="lg:hidden">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              {t("settings.display")}
            </p>
            <div className="flex flex-col gap-2">
              <ThemeToggle />
              <CurrencyToggle />
            </div>
          </div>
          <SideLink
            item={SETTINGS_NAV}
            active={isActivePath(pathname, SETTINGS_NAV.href)}
            label={t(SETTINGS_NAV.labelKey)}
            onNavigate={() => setMenuOpen(false)}
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

      <div className="lg:ps-[16.5rem]">
        <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur-md">
          <div className="flex h-14 min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:h-[3.25rem] lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-line bg-card"
                aria-label={t("nav.tab.menu")}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <NavIcon name="menu" className="h-4 w-4" />
              </button>
              <span className="cb-mark h-8 w-8 shrink-0 text-[11px]">CB</span>
              <p className="truncate text-sm font-semibold tracking-tight">Cleanbuddy</p>
            </div>
            <p className="hidden min-w-0 truncate text-[13px] text-muted lg:block">
              {t("tagline")}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                className="cb-chip"
                onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              >
                {lang === "ar" ? "FR" : "ع"}
              </button>
              <button
                type="button"
                className="cb-chip lg:hidden"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {t(theme === "dark" ? "theme.light" : "theme.dark")}
              </button>
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
              <div className="hidden lg:block">
                <CurrencyToggle />
              </div>
            </div>
          </div>
        </header>

        {!supabaseReady ? (
          <p className="cb-notice mx-3 mt-4 sm:mx-4 lg:mx-8">{t("frame.noEnv")}</p>
        ) : !schemaReady ? (
          <p className="cb-notice mx-3 mt-4 sm:mx-4 lg:mx-8">{t("frame.noTables")}</p>
        ) : null}

        <main className="mx-auto w-full max-w-5xl px-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-6 sm:px-4 lg:px-8 lg:pb-16 lg:pt-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-4">
          {MOBILE_NAV.map((navItem) => {
            const active = isActivePath(pathname, navItem.href);
            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold ${
                  active ? "text-forest-mid" : "text-muted"
                }`}
              >
                {active ? (
                  <span className="absolute inset-x-7 top-0 h-0.5 rounded-full bg-forest-mid" />
                ) : null}
                <NavIcon name={navItem.icon} className="h-4 w-4" />
                <span className="max-w-full truncate">{t(navItem.shortKey)}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold ${
              menuOpen ? "text-forest-mid" : "text-muted"
            }`}
            onClick={() => setMenuOpen(true)}
          >
            <NavIcon name="menu" className="h-4 w-4" />
            <span className="max-w-full truncate">{t("nav.tab.menu")}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function SideLink({
  item,
  active,
  label,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
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
      <span className="truncate">{label}</span>
    </Link>
  );
}
