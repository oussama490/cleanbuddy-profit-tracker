export type NavItem = {
  href: string;
  labelKey: string;
  hintKey: string;
  shortKey: string;
  icon:
    | "home"
    | "day"
    | "box"
    | "ads"
    | "funnel"
    | "returns"
    | "report"
    | "cash"
    | "goal"
    | "lab"
    | "fx"
    | "truck"
    | "note"
    | "gear"
    | "cal"
    | "check"
    | "shop"
    | "spark"
    | "search"
    | "bill"
    | "clock"
    | "menu";
};

function item(
  href: string,
  labelKey: string,
  hintKey: string,
  icon: NavItem["icon"],
  shortKey = labelKey,
): NavItem {
  return { href, labelKey, hintKey, icon, shortKey };
}

export const PRIMARY_NAV: NavItem[] = [
  item("/", "nav.home", "nav.homeHint", "home", "nav.tab.home"),
  item("/daily", "nav.daily", "nav.dailyHint", "day", "nav.tab.daily"),
  item("/products", "nav.products", "nav.productsHint", "box", "nav.tab.products"),
  item("/ads", "nav.ads", "nav.adsHint", "ads", "nav.tab.ads"),
  item("/reports", "nav.reports", "nav.reportsHint", "report", "nav.tab.reports"),
];

export const HOURS_NAV = item(
  "/hours",
  "nav.hours",
  "nav.hoursHint",
  "clock",
  "nav.tab.hours",
);

export const SETTINGS_NAV = item(
  "/settings",
  "nav.settings",
  "nav.settingsHint",
  "gear",
  "nav.tab.settings",
);

export const ADVANCED_NAV: NavItem[] = [
  item("/funnel", "nav.funnel", "nav.funnelHint", "funnel"),
  item("/simulate", "nav.simulate", "nav.simulateHint", "lab"),
  item("/treasury", "nav.treasury", "nav.treasuryHint", "cash"),
  item("/goals", "nav.goals", "nav.goalsHint", "goal"),
  item("/rates", "nav.rates", "nav.ratesHint", "fx"),
  item("/returns", "nav.returns", "nav.returnsHint", "returns"),
  item("/calendar", "nav.calendar", "nav.calendarHint", "cal"),
  item("/checklist", "nav.checklist", "nav.checklistHint", "check"),
  item("/expenses", "nav.expenses", "nav.expensesHint", "bill"),
  item("/suppliers", "nav.suppliers", "nav.suppliersHint", "truck"),
];

export const SIDEBAR_GROUPS: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: "group.overview",
    items: PRIMARY_NAV,
  },
  {
    titleKey: "group.life",
    items: [HOURS_NAV],
  },
  {
    titleKey: "group.ops",
    items: ADVANCED_NAV.filter((navItem) =>
      ["/funnel", "/returns", "/calendar", "/checklist", "/suppliers"].includes(navItem.href),
    ),
  },
  {
    titleKey: "group.money",
    items: ADVANCED_NAV.filter((navItem) =>
      ["/treasury", "/expenses", "/goals", "/rates"].includes(navItem.href),
    ),
  },
  {
    titleKey: "group.tools",
    items: ADVANCED_NAV.filter((navItem) => navItem.href === "/simulate"),
  },
];

export const MOBILE_NAV: NavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  HOURS_NAV,
];

export const MOBILE_PRIMARY = PRIMARY_NAV;

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
