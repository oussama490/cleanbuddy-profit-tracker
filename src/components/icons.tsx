import type { NavItem } from "@/lib/nav";
import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function NavIcon({
  name,
  className = "h-5 w-5",
}: {
  name: NavItem["icon"];
  className?: string;
}) {
  const icons: Record<NavItem["icon"], ReactNode> = {
    home: (
      <>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </>
    ),
    day: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </>
    ),
    box: (
      <>
        <path d="M3 8.5 12 4l9 4.5-9 4.5z" />
        <path d="M3 8.5v7L12 20l9-4.5v-7" />
        <path d="M12 13v7" />
      </>
    ),
    ads: (
      <>
        <path d="M4 9v6h4l5 4V5L8 9z" />
        <path d="M16 9.5a3 3 0 0 1 0 5" />
      </>
    ),
    funnel: (
      <>
        <path d="M4 5h16l-6 7v6l-4 2v-8z" />
      </>
    ),
    returns: (
      <>
        <path d="M4 12h12" />
        <path d="M8 8 4 12l4 4" />
        <path d="M20 7v10" />
      </>
    ),
    report: (
      <>
        <path d="M6 20V10M12 20V4M18 20v-7" />
      </>
    ),
    cash: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.4" />
      </>
    ),
    goal: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </>
    ),
    lab: (
      <>
        <path d="M9 3v7L5 18a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 18l-4-8V3" />
        <path d="M8 3h8" />
      </>
    ),
    fx: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 12h8M12 8c1.8 0 3 1.8 3 4s-1.2 4-3 4-3-1.8-3-4 1.2-4 3-4z" />
      </>
    ),
    truck: (
      <>
        <path d="M3 7h11v10H3z" />
        <path d="M14 11h4l3 3v3h-7" />
        <circle cx="7" cy="18" r="1.4" />
        <circle cx="17.5" cy="18" r="1.4" />
      </>
    ),
    note: (
      <>
        <path d="M7 4h8l4 4v12H7z" />
        <path d="M15 4v4h4M9 12h6M9 16h4" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2.2M12 18.3v2.2M4.8 7.2l1.9 1.1M17.3 15.7l1.9 1.1M4.8 16.8l1.9-1.1M17.3 8.3l1.9-1.1" />
      </>
    ),
    cal: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v3M16 3v3M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    check: (
      <>
        <path d="M5 12 10 17l9-11" />
      </>
    ),
    shop: (
      <>
        <path d="M4 10h16l-1 10H5z" />
        <path d="M7 10V7a5 5 0 0 1 10 0v3" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3v4M12 17v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    bill: (
      <>
        <path d="M6 4h12v16l-2-1-2 1-2-1-2 1-2-1-2 1z" />
        <path d="M9 9h6M9 13h6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.2l2.5 1.5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
  };

  return <Svg className={className}>{icons[name]}</Svg>;
}
