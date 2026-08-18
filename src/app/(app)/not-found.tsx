"use client";

import Link from "next/link";
import { usePrefs } from "@/components/PrefsProvider";

export default function NotFound() {
  const { t } = usePrefs();
  return (
    <div className="cb-card max-w-lg">
      <p className="cb-kicker">404</p>
      <h1 className="cb-page-title mt-2">{t("notfound.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("notfound.body")}</p>
      <Link href="/" className="cb-btn mt-5 inline-flex items-center px-5">
        {t("notfound.home")}
      </Link>
    </div>
  );
}
