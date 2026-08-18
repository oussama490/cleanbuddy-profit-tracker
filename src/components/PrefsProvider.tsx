"use client";

import {
  DEFAULT_SHOP,
  parseShopSettings,
  type ShopSettings,
} from "@/lib/commerce";
import { translate, type Lang, type Theme } from "@/lib/i18n";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useSyncExternalStore } from "react";

const LANG_KEY = "cb-lang";
const THEME_KEY = "cb-theme";
const SHOP_KEY = "cb-shop";
const EVENT = "cb-prefs";

type Prefs = {
  lang: Lang;
  theme: Theme;
  shop: ShopSettings;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setShop: (shop: ShopSettings) => void;
  t: (key: string) => string;
};

const PrefsContext = createContext<Prefs | null>(null);

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(EVENT, onStoreChange);
  };
}

function getLang(): Lang {
  return window.localStorage.getItem(LANG_KEY) === "fr" ? "fr" : "ar";
}

function getTheme(): Theme {
  return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

function getShop(): ShopSettings {
  try {
    return parseShopSettings(JSON.parse(window.localStorage.getItem(SHOP_KEY) || "{}"));
  } catch {
    return DEFAULT_SHOP;
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getLang, () => "ar" as Lang);
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
  const shopJson = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(SHOP_KEY) || "",
    () => "",
  );
  const shop = useMemo(() => {
    try {
      return shopJson ? parseShopSettings(JSON.parse(shopJson)) : DEFAULT_SHOP;
    } catch {
      return DEFAULT_SHOP;
    }
  }, [shopJson]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [lang, theme]);

  const setLang = useCallback((next: Lang) => {
    window.localStorage.setItem(LANG_KEY, next);
    emit();
  }, []);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(THEME_KEY, next);
    emit();
  }, []);

  const setShop = useCallback((next: ShopSettings) => {
    window.localStorage.setItem(SHOP_KEY, JSON.stringify(next));
    emit();
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const value = useMemo(
    () => ({ lang, theme, shop, setLang, setTheme, setShop, t }),
    [lang, theme, shop, setLang, setTheme, setShop, t],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Prefs {
  const context = useContext(PrefsContext);
  if (!context) throw new Error("usePrefs must be used within PrefsProvider");
  return context;
}
