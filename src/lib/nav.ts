export type NavItem = {
  href: string;
  labelKey: string;
  hintKey: string;
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
    | "bill";
};

export const NAV_GROUPS: {
  titleKey: string;
  items: NavItem[];
}[] = [
  {
    titleKey: "group.overview",
    items: [
      { href: "/", labelKey: "nav.home", hintKey: "nav.homeHint", icon: "home" },
      { href: "/daily", labelKey: "nav.daily", hintKey: "nav.dailyHint", icon: "day" },
      { href: "/calendar", labelKey: "nav.calendar", hintKey: "nav.calendarHint", icon: "cal" },
      { href: "/checklist", labelKey: "nav.checklist", hintKey: "nav.checklistHint", icon: "check" },
      { href: "/reports", labelKey: "nav.reports", hintKey: "nav.reportsHint", icon: "report" },
    ],
  },
  {
    titleKey: "group.ops",
    items: [
      { href: "/products", labelKey: "nav.products", hintKey: "nav.productsHint", icon: "box" },
      { href: "/shopify", labelKey: "nav.shopify", hintKey: "nav.shopifyHint", icon: "shop" },
      { href: "/ads", labelKey: "nav.ads", hintKey: "nav.adsHint", icon: "ads" },
      { href: "/funnel", labelKey: "nav.funnel", hintKey: "nav.funnelHint", icon: "funnel" },
      { href: "/returns", labelKey: "nav.returns", hintKey: "nav.returnsHint", icon: "returns" },
      { href: "/creatives", labelKey: "nav.creatives", hintKey: "nav.creativesHint", icon: "spark" },
      { href: "/suppliers", labelKey: "nav.suppliers", hintKey: "nav.suppliersHint", icon: "truck" },
    ],
  },
  {
    titleKey: "group.money",
    items: [
      { href: "/treasury", labelKey: "nav.treasury", hintKey: "nav.treasuryHint", icon: "cash" },
      { href: "/owner", labelKey: "nav.owner", hintKey: "nav.ownerHint", icon: "goal" },
      { href: "/bills", labelKey: "nav.bills", hintKey: "nav.billsHint", icon: "bill" },
      { href: "/payouts", labelKey: "nav.payouts", hintKey: "nav.payoutsHint", icon: "cash" },
      { href: "/expenses", labelKey: "nav.expenses", hintKey: "nav.expensesHint", icon: "bill" },
      { href: "/goals", labelKey: "nav.goals", hintKey: "nav.goalsHint", icon: "goal" },
      { href: "/rates", labelKey: "nav.rates", hintKey: "nav.ratesHint", icon: "fx" },
    ],
  },
  {
    titleKey: "group.tools",
    items: [
      { href: "/simulate", labelKey: "nav.simulate", hintKey: "nav.simulateHint", icon: "lab" },
      { href: "/review", labelKey: "nav.review", hintKey: "nav.reviewHint", icon: "note" },
      { href: "/journal", labelKey: "nav.journal", hintKey: "nav.journalHint", icon: "note" },
      { href: "/search", labelKey: "nav.search", hintKey: "nav.searchHint", icon: "search" },
      { href: "/settings", labelKey: "nav.settings", hintKey: "nav.settingsHint", icon: "gear" },
    ],
  },
];

export const MOBILE_PRIMARY: NavItem[] = [
  NAV_GROUPS[0].items[0],
  NAV_GROUPS[0].items[1],
  NAV_GROUPS[1].items[0],
  NAV_GROUPS[2].items[0],
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
