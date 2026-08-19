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
    | "passport"
    | "menu"
    | "user"
    | "send"
    | "journal"
    | "invoice"
    | "car";
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

export const HOME_NAV = item("/", "nav.home", "nav.homeHint", "home", "nav.tab.home");
export const DAILY_NAV = item("/daily", "nav.daily", "nav.dailyHint", "day", "nav.tab.daily");

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

export const SIDEBAR_GROUPS: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: "group.daily",
    items: [
      HOME_NAV,
      DAILY_NAV,
      item("/checklist", "nav.checklist", "nav.checklistHint", "check"),
      item("/calendar", "nav.calendar", "nav.calendarHint", "cal"),
    ],
  },
  {
    titleKey: "group.business",
    items: [
      item("/products", "nav.products", "nav.productsHint", "box", "nav.tab.products"),
      item("/ads", "nav.ads", "nav.adsHint", "ads", "nav.tab.ads"),
      item("/funnel", "nav.funnel", "nav.funnelHint", "funnel"),
      item("/returns", "nav.returns", "nav.returnsHint", "returns"),
      item("/suppliers", "nav.suppliers", "nav.suppliersHint", "truck"),
      item("/creatives", "nav.creatives", "nav.creativesHint", "spark"),
      item("/simulate", "nav.simulate", "nav.simulateHint", "lab"),
    ],
  },
  {
    titleKey: "group.finance",
    items: [
      item("/treasury", "nav.treasury", "nav.treasuryHint", "cash"),
      item("/expenses", "nav.expenses", "nav.expensesHint", "bill"),
      item("/car-affordability", "nav.car", "nav.carHint", "car"),
      item("/bills", "nav.bills", "nav.billsHint", "invoice"),
      item("/payouts", "nav.payouts", "nav.payoutsHint", "send"),
      item("/goals", "nav.goals", "nav.goalsHint", "goal"),
      item("/rates", "nav.rates", "nav.ratesHint", "fx"),
      item("/reports", "nav.reports", "nav.reportsHint", "report", "nav.tab.reports"),
    ],
  },
  {
    titleKey: "group.personal",
    items: [
      HOURS_NAV,
      item("/pr-tracker", "nav.pr", "nav.prHint", "passport"),
      item("/weekly-review", "nav.review", "nav.reviewHint", "note"),
      item("/owner", "nav.owner", "nav.ownerHint", "user"),
      item("/journal", "nav.journal", "nav.journalHint", "journal"),
    ],
  },
];

export const MOBILE_NAV: NavItem[] = [HOME_NAV, DAILY_NAV, HOURS_NAV];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/weekly-review") {
    return pathname === "/weekly-review" || pathname === "/review" || pathname.startsWith("/weekly-review/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
