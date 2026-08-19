"use client";

import { usePrefs } from "@/components/PrefsProvider";
import type { ReactNode } from "react";

export function PageHeader({
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
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4">
      <div className="min-w-0 max-w-xl">
        {kicker ? <p className="cb-kicker mb-2">{kicker}</p> : null}
        <h1 className="cb-page-title">{title}</h1>
        {description ? (
          <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "profit" | "loss" | "gold" | "warn";
}) {
  const valueClass =
    tone === "profit"
      ? "text-profit"
      : tone === "loss"
        ? "text-loss"
        : tone === "gold"
          ? "text-gold"
          : tone === "warn"
            ? "text-[var(--warn-ink)]"
            : "text-foreground";

  return (
    <article className="cb-kpi min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className={`cb-num mt-2.5 break-words text-[clamp(1.05rem,4.6vw,1.6rem)] font-semibold leading-none ${valueClass}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </article>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="border border-dashed border-line bg-background px-5 py-12 text-center" style={{ borderRadius: "var(--radius)" }}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="cb-fieldset space-y-4">
      <legend className="cb-fieldset-legend">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ExtrasBanner({
  ready,
  messageKey = "extras.banner",
}: {
  ready: boolean;
  messageKey?: string;
}) {
  const { t } = usePrefs();
  if (ready) return null;
  return <p className="cb-notice mb-4">{t(messageKey)}</p>;
}

export function Section({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="cb-card mb-4 overflow-hidden p-0">
      <header className="border-b border-line px-5 py-4">
        <p className="cb-section-title">{title}</p>
        {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      </header>
      <div className="px-5 py-5">{children}</div>
      {footer ? (
        <footer className="border-t border-line bg-background/70 px-5 py-3">{footer}</footer>
      ) : null}
    </section>
  );
}

export function SettingRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0 last:pb-0 first:pt-0">
      <p className="min-w-0 flex-1 text-sm font-medium">{label}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function StatusBadge({
  ok,
  onLabel,
  offLabel,
}: {
  ok: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <span className={`cb-badge ${ok ? "cb-badge-ok" : "cb-badge-off"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-profit" : "bg-loss"}`} />
      {ok ? onLabel : offLabel}
    </span>
  );
}
