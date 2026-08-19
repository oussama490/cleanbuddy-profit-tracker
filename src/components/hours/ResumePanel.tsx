"use client";

import { usePrefs } from "@/components/PrefsProvider";
import { Section } from "@/components/ui";
import {
  computeDifference,
  estimateNet,
  sumGrossPay,
  sumPayableHours,
} from "@/lib/hours/calculations";
import {
  endOfWeek,
  formatDisplayDate,
  formatShortDate,
  isDateInRange,
  startOfWeek,
  todayIso,
} from "@/lib/hours/dates";
import { formatHours, formatMoney, pluralHours } from "@/lib/hours/format";
import { computeEstimatedReserve, sumNetReceived } from "@/lib/hours/importData";
import {
  filterShiftsByPeriod,
  getCurrentPayPeriod,
  getNextPayDate,
} from "@/lib/hours/payPeriods";
import type { HoursData, PayStub } from "@/lib/hours/types";

function findStubForPeriod(stubs: PayStub[], start: string, end: string) {
  return stubs.find((s) => s.periodStart === start && s.periodEnd === end);
}

export function ResumePanel({ data }: { data: HoursData }) {
  const { t, lang } = usePrefs();
  const locale = lang === "ar" ? "ar" : "fr-CA";
  const today = todayIso();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weekShifts = data.shifts.filter((s) => isDateInRange(s.date, weekStart, weekEnd));
  const weekHours = sumPayableHours(weekShifts);

  const period = getCurrentPayPeriod(data.settings, today);
  const periodShifts = period ? filterShiftsByPeriod(data.shifts, period) : [];
  const periodHours = sumPayableHours(periodShifts);
  const periodGross = sumGrossPay(periodShifts);
  const periodNet = estimateNet(periodGross, data.settings.deductionPercent);

  const stub = period ? findStubForPeriod(data.payStubs, period.start, period.end) : undefined;
  const paidHours = stub?.regularHoursPaid ?? 0;
  const adjustment = stub?.manualAdjustmentHours ?? 0;
  const difference = stub ? computeDifference(periodHours, adjustment, paidHours) : null;

  const totalHours = sumPayableHours(data.shifts);
  const totalGross = sumGrossPay(data.shifts);
  const totalNet = sumNetReceived(data.payStubs);
  const reserveHours = computeEstimatedReserve(data.shifts, data.payStubs);
  const nextPay = getNextPayDate(data.settings, today);

  return (
    <div>
      <Section title={t("hours.thisWeek")}>
        <Stat
          label={t("hours.payableHours")}
          value={formatHours(weekHours)}
          detail={`${formatShortDate(weekStart, locale)} → ${formatShortDate(weekEnd, locale)}`}
        />
      </Section>

      <Section title={t("hours.recordedTotals")}>
        <div className="space-y-4">
          <Stat label={t("hours.shiftsCount")} value={String(data.shifts.length)} />
          <Stat label={t("hours.payableHours")} value={formatHours(totalHours)} />
          <Stat label={t("hours.grossPay")} value={formatMoney(totalGross)} />
          <Stat
            label={t("hours.netReceived")}
            value={data.payStubs.length > 0 ? formatMoney(totalNet) : "—"}
            detail={
              data.payStubs.length > 0
                ? t("hours.stubsCount", { n: data.payStubs.length })
                : undefined
            }
          />
        </div>
      </Section>

      <Section title={t("hours.currentPeriod")}>
        {period ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {formatShortDate(period.start, locale)} → {formatShortDate(period.end, locale)}
            </p>
            <Stat
              label={t("hours.recordedHours")}
              value={formatHours(periodHours)}
              detail={`${t("hours.goal")}: ${formatHours(data.settings.periodGoalHours)}`}
            />
            <Stat label={t("hours.estGross")} value={formatMoney(periodGross)} />
            <Stat label={t("hours.estNet")} value={formatMoney(periodNet)} />
            <p className="rounded-[10px] bg-background px-3 py-3 text-sm leading-6 text-muted">
              {t("hours.netDisclaimer")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">{t("hours.setCycle")}</p>
        )}
      </Section>

      <Section title={t("hours.vsPayroll")}>
        {stub ? (
          <div className="space-y-2 text-sm leading-6">
            <p>{t("hours.youWorked", { h: pluralHours(periodHours, t("hours.hour"), t("hours.hours")) })}</p>
            <p>{t("hours.employerPaid", { h: pluralHours(paidHours, t("hours.hour"), t("hours.hours")) })}</p>
            {adjustment !== 0 ? (
              <p>{t("hours.manualAdj", { h: pluralHours(adjustment, t("hours.hour"), t("hours.hours")) })}</p>
            ) : null}
            <p className="font-semibold text-forest-mid">
              {t("hours.difference")}: {pluralHours(difference ?? 0, t("hours.hour"), t("hours.hours"))}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">{t("hours.noStub")}</p>
        )}
      </Section>

      <Section title={t("hours.reserve")}>
        <Stat
          label={t("hours.reserveHours")}
          value={reserveHours != null ? formatHours(reserveHours) : "—"}
        />
        <p className="mt-3 rounded-[10px] bg-gold-soft px-3 py-3 text-sm leading-6 text-foreground">
          {t("hours.reserveNote")}
        </p>
      </Section>

      <Section title={t("hours.nextPay")}>
        <Stat
          label={t("hours.nextPay")}
          value={nextPay ? formatDisplayDate(nextPay, locale) : t("hours.undefined")}
        />
      </Section>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="cb-num mt-1.5 break-words text-[1.7rem] font-semibold leading-none">{value}</p>
      {detail ? <p className="mt-1.5 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}
