"use client";

import { logoutAction } from "@/app/login/actions";
import { BrandMark } from "@/components/BrandMark";
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
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

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
  const { t, lang, setLang } = usePrefs();
  const [menu, setMenu] = useState({ path: pathname, open: false });
  const menuOpen = menu.open && menu.path === pathname;
  const drawerId = useId();

  const setMenuOpen = useCallback((open: boolean) => {
    setMenu({ path: pathname, open });
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
  }, [menuOpen, setMenuOpen]);

  return (
    <div className="min-h-dvh overflow-x-clip bg-background">
      <button
        type="button"
        className={`cb-drawer-overlay fixed inset-0 z-40 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label={t("close")}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        id={drawerId}
        className={`cb-drawer fixed inset-y-0 start-0 z-50 flex flex-col lg:z-30 lg:w-[16.75rem] lg:max-w-none ${
          menuOpen
            ? "translate-x-0 opacity-100"
            : "max-lg:pointer-events-none max-lg:opacity-0 ltr:max-lg:-translate-x-full rtl:max-lg:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark className="h-9 w-9" />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight text-[var(--sidebar-fg)]">
                Cleanbuddy
              </p>
              <p className="text-[11px] text-[var(--sidebar-muted)]">{t("desk.kicker")}</p>
            </div>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-[12px] text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)] lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label={t("close")}
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.titleKey}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
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

        <div className="shrink-0">
          <div className="space-y-1 border-t border-[var(--sidebar-line)] px-3 py-3">
            <SideLink
              item={SETTINGS_NAV}
              active={isActivePath(pathname, SETTINGS_NAV.href)}
              label={t(SETTINGS_NAV.labelKey)}
              onNavigate={() => setMenuOpen(false)}
            />
            {passwordEnabled ? (
              <form action={logoutAction}>
                <button
                  className="min-h-10 w-full rounded-[12px] px-3 text-start text-sm text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]"
                  type="submit"
                >
                  {t("logout")}
                </button>
              </form>
            ) : null}
          </div>
          <div className="space-y-2 border-t border-[var(--sidebar-line)] bg-[var(--sidebar-footer)] p-3">
            <ThemeToggle ink />
            <CurrencyToggle ink />
          </div>
        </div>
      </aside>

      <div className="lg:ps-[16.75rem]">
        <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur-md">
          <div className="flex h-14 min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:h-[3.25rem] lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-line bg-card"
                aria-label={t("nav.tab.menu")}
                aria-expanded={menuOpen}
                aria-controls={drawerId}
                onClick={() => setMenuOpen(true)}
              >
                <NavIcon name="menu" className="h-4 w-4" />
              </button>
              <BrandMark className="h-8 w-8" />
              <p className="truncate text-sm font-semibold tracking-tight">Cleanbuddy</p>
            </div>
            <p className="hidden min-w-0 truncate text-[13px] text-muted lg:block">
              {t("tagline")}
            </p>
            <button
              type="button"
              className="cb-chip"
              onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            >
              {lang === "ar" ? "FR" : "ع"}
            </button>
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
            aria-expanded={menuOpen}
            aria-controls={drawerId}
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
      className={`relative flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13.5px] transition ${
        active
          ? "bg-[var(--sidebar-active)] font-semibold text-[var(--sidebar-fg)]"
          : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]"
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
