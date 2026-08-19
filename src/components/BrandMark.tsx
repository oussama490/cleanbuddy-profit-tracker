"use client";

import { useId } from "react";

export function BrandMark({
  className = "h-9 w-9",
  title = "Cleanbuddy",
}: {
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const fillId = `cb-mark-fill-${uid}`;

  return (
    <svg
      className={`cb-mark shrink-0 ${className}`}
      viewBox="0 0 36 36"
      role="img"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={fillId} x1="8" y1="2" x2="30" y2="34">
          <stop offset="0%" stopColor="#24352C" />
          <stop offset="100%" stopColor="#0A100E" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="12" fill={`url(#${fillId})`} />
      <path d="M-4 26 L40 14 L40 22 L-4 34 Z" fill="#D4890B" opacity="0.92" />
      <path d="M-4 27.2 L40 15.2" stroke="#F0C56A" strokeWidth="0.6" opacity="0.55" />
      <circle cx="18" cy="12" r="3.2" fill="#5FF5D0" />
      <path
        d="M11 12.5c2.4-3.6 4.2-3.6 7 0 2.8-3.6 4.6-3.6 7 0"
        fill="none"
        stroke="#5FF5D0"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
