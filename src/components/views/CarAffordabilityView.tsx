"use client";

import { FormSection, KpiCard, PageHeader } from "@/components/ui";
import { usePrefs } from "@/components/PrefsProvider";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  LOAN_TERMS,
  assessCarRisks,
  amortize,
  evaluateCarAffordability,
  type CarAffordInput,
  type LoanTerm,
  type RatioTone,
} from "@/lib/carAffordability";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cb-car-affordability";

type FormState = {
  salaryNet: string;
  price: string;
  downPayment: string;
  annualRatePct: string;
  termMonths: LoanTerm;
  insuranceAnnual: string;
  uberRider: boolean;
  uberRiderMonthly: string;
  gasMonthly: string;
  maintenanceAmount: string;
  maintenancePeriod: "month" | "year";
  saaqAnnual: string;
  uberDaysPerWeek: string;
  uberNetPerDay: string;
  livingMonthly: string;
  compareA: LoanTerm;
  compareB: LoanTerm;
};

const EMPTY: FormState = {
  salaryNet: "",
  price: "",
  downPayment: "",
  annualRatePct: "7",
  termMonths: 48,
  insuranceAnnual: "1200",
  uberRider: false,
  uberRiderMonthly: "80",
  gasMonthly: "250",
  maintenanceAmount: "80",
  maintenancePeriod: "month",
  saaqAnnual: "230",
  uberDaysPerWeek: "3",
  uberNetPerDay: "80",
  livingMonthly: "",
  compareA: 24,
  compareB: 48,
};

function num(value: string): number {
  return Number(value.replace(",", ".")) || 0;
}

function toInput(form: FormState): CarAffordInput {
  return {
    salaryNet: num(form.salaryNet),
    price: num(form.price),
    downPayment: num(form.downPayment),
    annualRatePct: num(form.annualRatePct),
    termMonths: form.termMonths,
    insuranceAnnual: num(form.insuranceAnnual),
    uberRider: form.uberRider,
    uberRiderMonthly: num(form.uberRiderMonthly),
    gasMonthly: num(form.gasMonthly),
    maintenanceAmount: num(form.maintenanceAmount),
    maintenancePeriod: form.maintenancePeriod,
    saaqAnnual: num(form.saaqAnnual),
    uberDaysPerWeek: num(form.uberDaysPerWeek),
    uberNetPerDay: num(form.uberNetPerDay),
    livingMonthly: num(form.livingMonthly),
  };
}

function loadForm(): FormState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<FormState>;
    const term = LOAN_TERMS.includes(parsed.termMonths as LoanTerm)
      ? (parsed.termMonths as LoanTerm)
      : EMPTY.termMonths;
    const compareA = LOAN_TERMS.includes(parsed.compareA as LoanTerm)
      ? (parsed.compareA as LoanTerm)
      : 24;
    const compareB = LOAN_TERMS.includes(parsed.compareB as LoanTerm)
      ? (parsed.compareB as LoanTerm)
      : 48;
    return { ...EMPTY, ...parsed, termMonths: term, compareA, compareB };
  } catch {
    return EMPTY;
  }
}

function cad(amount: number): string {
  return formatMoney(amount, "CAD");
}

function toneClass(tone: RatioTone): string {
  if (tone === "ok") return "text-[var(--led)]";
  if (tone === "warn") return "text-[var(--warn)]";
  return "text-[var(--loss)]";
}

function kpiTone(tone: RatioTone): "profit" | "warn" | "loss" {
  if (tone === "ok") return "profit";
  if (tone === "warn") return "warn";
  return "loss";
}

export function CarAffordabilityView() {
  const { t } = usePrefs();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setForm(loadForm());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form, hydrated]);

  const input = useMemo(() => toInput(form), [form]);
  const result = useMemo(() => evaluateCarAffordability(input), [input]);
  const risks = useMemo(() => assessCarRisks(input, result), [input, result]);
  const principal = Math.max(0, input.price - Math.min(input.downPayment, input.price));
  const quoteA = useMemo(
    () => amortize(principal, input.annualRatePct, form.compareA),
    [principal, input.annualRatePct, form.compareA],
  );
  const quoteB = useMemo(
    () => amortize(principal, input.annualRatePct, form.compareB),
    [principal, input.annualRatePct, form.compareB],
  );

  function patch(partial: Partial<FormState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  const ready = input.salaryNet > 0 && input.price > 0;
  const tillColor = toneClass(result.salaryTone);

  return (
    <div>
      <section className="cb-till mb-6">
        <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--led)]">
              {t("car.till.kicker")}
            </p>
            <p
              className="cb-till-num mt-3 break-words"
              style={{
                color:
                  !ready
                    ? "var(--led)"
                    : result.salaryTone === "ok"
                      ? "var(--led)"
                      : result.salaryTone === "warn"
                        ? "var(--warn)"
                        : "var(--loss)",
              }}
            >
              {ready ? cad(result.vehicleMonthly) : "—"}
            </p>
            <p className="mt-3 text-sm text-[var(--sidebar-muted)]">
              {ready
                ? t("car.till.ratio", { n: formatNumber(result.salaryRatioPct, 1) })
                : t("car.till.empty")}
            </p>
          </div>
          <div className="grid min-w-[11rem] gap-2 text-sm">
            <p className={`cb-num text-lg font-semibold ${tillColor}`}>
              {ready ? `${formatNumber(result.salaryRatioPct, 1)} %` : "—"}
            </p>
            <p className="text-[11px] text-[var(--sidebar-muted)]">{t("car.till.ofSalary")}</p>
          </div>
        </div>
      </section>

      <PageHeader
        kicker={t("nav.car")}
        title={t("car.title")}
        description={t("car.desc")}
      />

      {result.dependsOnUber ? (
        <p className="cb-alert mb-4">{t("car.alert.uber")}</p>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("car.kpi.payment")}
          value={ready ? cad(result.loan.monthlyPayment) : "—"}
        />
        <KpiCard
          label={t("car.kpi.ratio")}
          value={ready ? `${formatNumber(result.salaryRatioPct, 1)} %` : "—"}
          hint={t("car.kpi.ratioHint")}
          tone={ready ? kpiTone(result.salaryTone) : "default"}
        />
        <KpiCard
          label={t("car.kpi.uber")}
          value={cad(result.uberMonthly)}
          hint={t("car.kpi.uberHint")}
        />
        <KpiCard
          label={t("car.kpi.net")}
          value={ready ? cad(result.netBalance) : "—"}
          hint={t("car.kpi.netHint")}
          tone={
            !ready
              ? "default"
              : result.netBalance < 0
                ? "loss"
                : result.netBalance < 250
                  ? "warn"
                  : "profit"
          }
        />
      </div>

      <section className="cb-card mb-4">
        <p className="cb-section-title">{t("car.risk.title")}</p>
        <p className="mt-1 mb-4 text-sm text-muted">{t("car.risk.desc")}</p>
        <ul className="space-y-2">
          {risks.map((risk) => (
            <li
              key={risk.id}
              className={`border px-4 py-3 text-sm ${
                risk.level === "ok"
                  ? "border-profit/30 bg-profit/10"
                  : risk.level === "warn"
                    ? "border-[color-mix(in_srgb,var(--warn)_35%,var(--line))] bg-[var(--warn-soft)] text-[var(--warn-ink)]"
                    : "border-loss/25 bg-loss/10"
              }`}
              style={{ borderRadius: "var(--radius)" }}
            >
              {t(risk.key)}
            </li>
          ))}
        </ul>
      </section>

      <form className="cb-card mb-4 space-y-4" onSubmit={(event) => event.preventDefault()}>
        <FormSection title={t("car.section.income")}>
          <Field
            label={t("car.salary")}
            hint={t("car.salaryHint")}
            value={form.salaryNet}
            onChange={(salaryNet) => patch({ salaryNet })}
          />
          <Field
            label={t("car.living")}
            hint={t("car.livingHint")}
            value={form.livingMonthly}
            onChange={(livingMonthly) => patch({ livingMonthly })}
          />
          <p className="text-xs text-muted">
            {t("car.livingLink")}{" "}
            <Link href="/expenses" className="font-semibold text-forest-mid underline">
              {t("nav.expenses")}
            </Link>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("car.uberDays")}
              value={form.uberDaysPerWeek}
              onChange={(uberDaysPerWeek) => patch({ uberDaysPerWeek })}
            />
            <Field
              label={t("car.uberDay")}
              hint={t("car.uberDayHint")}
              value={form.uberNetPerDay}
              onChange={(uberNetPerDay) => patch({ uberNetPerDay })}
            />
          </div>
        </FormSection>

        <FormSection title={t("car.section.loan")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("car.price")}
              value={form.price}
              onChange={(price) => patch({ price })}
            />
            <Field
              label={t("car.down")}
              value={form.downPayment}
              onChange={(downPayment) => patch({ downPayment })}
            />
          </div>
          <Field
            label={t("car.rate")}
            hint={t("car.rateHint")}
            value={form.annualRatePct}
            onChange={(annualRatePct) => patch({ annualRatePct })}
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("car.term")}</span>
            <select
              className="cb-input"
              value={form.termMonths}
              onChange={(event) =>
                patch({ termMonths: Number(event.target.value) as LoanTerm })
              }
            >
              {LOAN_TERMS.map((term) => (
                <option key={term} value={term}>
                  {t("car.termOption", { n: term })}
                </option>
              ))}
            </select>
          </label>
        </FormSection>

        <FormSection title={t("car.section.costs")}>
          <Field
            label={t("car.insurance")}
            hint={t("car.insuranceHint")}
            value={form.insuranceAnnual}
            onChange={(insuranceAnnual) => patch({ insuranceAnnual })}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={form.uberRider}
              onChange={(event) => patch({ uberRider: event.target.checked })}
            />
            {t("car.rider")}
          </label>
          {form.uberRider ? (
            <Field
              label={t("car.riderCost")}
              hint={t("car.riderHint")}
              value={form.uberRiderMonthly}
              onChange={(uberRiderMonthly) => patch({ uberRiderMonthly })}
            />
          ) : null}
          <Field
            label={t("car.gas")}
            value={form.gasMonthly}
            onChange={(gasMonthly) => patch({ gasMonthly })}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Field
              label={t("car.maint")}
              value={form.maintenanceAmount}
              onChange={(maintenanceAmount) => patch({ maintenanceAmount })}
            />
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("car.maintPeriod")}</span>
              <select
                className="cb-input"
                value={form.maintenancePeriod}
                onChange={(event) =>
                  patch({
                    maintenancePeriod: event.target.value as "month" | "year",
                  })
                }
              >
                <option value="month">{t("car.perMonth")}</option>
                <option value="year">{t("car.perYear")}</option>
              </select>
            </label>
          </div>
          <Field
            label={t("car.saaq")}
            hint={t("car.saaqHint")}
            value={form.saaqAnnual}
            onChange={(saaqAnnual) => patch({ saaqAnnual })}
          />
        </FormSection>
      </form>

      {ready ? (
        <section className="cb-card mb-4">
          <p className="cb-section-title">{t("car.break.title")}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <Row label={t("car.kpi.payment")} value={cad(result.loan.monthlyPayment)} />
            <Row label={t("car.break.insurance")} value={cad(result.insuranceMonthly)} />
            {result.riderMonthly > 0 ? (
              <Row label={t("car.break.rider")} value={cad(result.riderMonthly)} />
            ) : null}
            <Row label={t("car.gas")} value={cad(result.gasMonthly)} />
            <Row label={t("car.maint")} value={cad(result.maintenanceMonthly)} />
            <Row label={t("car.break.saaq")} value={cad(result.saaqMonthly)} />
            <Row label={t("car.break.interest")} value={cad(result.loan.totalInterest)} />
            <Row label={t("car.break.uberShare")} value={`${formatNumber(result.uberSharePct, 0)} %`} />
          </dl>
        </section>
      ) : null}

      <section className="cb-card">
        <p className="cb-section-title">{t("car.compare.title")}</p>
        <p className="mt-1 mb-4 text-sm text-muted">{t("car.compare.desc")}</p>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <TermPick
            label={t("car.compare.a")}
            value={form.compareA}
            onChange={(compareA) => patch({ compareA })}
            t={t}
          />
          <TermPick
            label={t("car.compare.b")}
            value={form.compareB}
            onChange={(compareB) => patch({ compareB })}
            t={t}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuoteCard
            title={t("car.termOption", { n: form.compareA })}
            quote={quoteA}
            cad={cad}
            t={t}
          />
          <QuoteCard
            title={t("car.termOption", { n: form.compareB })}
            quote={quoteB}
            cad={cad}
            t={t}
            deltaPayment={quoteB.monthlyPayment - quoteA.monthlyPayment}
            deltaInterest={quoteB.totalInterest - quoteA.totalInterest}
          />
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="cb-input"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="cb-num font-semibold">{value}</dd>
    </div>
  );
}

function TermPick({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: LoanTerm;
  onChange: (value: LoanTerm) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="cb-input"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as LoanTerm)}
      >
        {LOAN_TERMS.map((term) => (
          <option key={term} value={term}>
            {t("car.termOption", { n: term })}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuoteCard({
  title,
  quote,
  cad,
  t,
  deltaPayment,
  deltaInterest,
}: {
  title: string;
  quote: { monthlyPayment: number; totalInterest: number; totalPaid: number };
  cad: (amount: number) => string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  deltaPayment?: number;
  deltaInterest?: number;
}) {
  return (
    <article className="border border-line bg-background p-4" style={{ borderRadius: "var(--radius)" }}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="cb-num mt-3 text-xl font-bold">{cad(quote.monthlyPayment)}</p>
      <p className="mt-1 text-xs text-muted">{t("car.compare.perMonth")}</p>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">{t("car.break.interest")}</dt>
          <dd className="cb-num font-semibold">{cad(quote.totalInterest)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">{t("car.compare.total")}</dt>
          <dd className="cb-num font-semibold">{cad(quote.totalPaid)}</dd>
        </div>
        {deltaPayment !== undefined ? (
          <div className="flex justify-between gap-2 pt-1">
            <dt className="text-muted">{t("car.compare.deltaPay")}</dt>
            <dd className="cb-num font-semibold">
              {deltaPayment > 0 ? "+" : ""}
              {cad(deltaPayment)}
            </dd>
          </div>
        ) : null}
        {deltaInterest !== undefined ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">{t("car.compare.deltaInt")}</dt>
            <dd className="cb-num font-semibold">
              {deltaInterest > 0 ? "+" : ""}
              {cad(deltaInterest)}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
