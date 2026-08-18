"use client";

import { PageHeader } from "@/components/ui";
import { usePrefs } from "@/components/PrefsProvider";
import type { ReactNode } from "react";

export function I18nHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const { t } = usePrefs();
  return (
    <PageHeader
      kicker={kicker ? t(kicker) : undefined}
      title={t(title)}
      description={description ? t(description) : undefined}
      actions={actions}
    />
  );
}

export function ProductDetailHeader({ name }: { name: string }) {
  const { t } = usePrefs();
  return (
    <PageHeader
      kicker={t("product.detailKicker")}
      title={name}
      description={t("product.detailDesc")}
    />
  );
}
