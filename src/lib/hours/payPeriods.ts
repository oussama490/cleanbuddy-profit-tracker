import type { HoursSettings, PayPeriod } from "./types";
import { addDays, daysBetween, formatLocalDate, isDateInRange, parseLocalDate } from "./dates";

const PERIOD_DAYS = 14;

export function getPayPeriodForDate(
  date: string,
  settings: HoursSettings,
): PayPeriod | null {
  if (!settings.payCycleStartDate) return null;

  const cycleStart = settings.payCycleStartDate;
  const offset = daysBetween(cycleStart, date);
  if (offset < 0) {
    const periodsBack = Math.ceil(Math.abs(offset) / PERIOD_DAYS);
    const start = addDays(cycleStart, -periodsBack * PERIOD_DAYS);
    return buildPeriod(start, settings.nextPayDate, cycleStart);
  }

  const periodIndex = Math.floor(offset / PERIOD_DAYS);
  const start = addDays(cycleStart, periodIndex * PERIOD_DAYS);
  return buildPeriod(start, settings.nextPayDate, cycleStart);
}

function buildPeriod(
  start: string,
  nextPayDate: string,
  cycleStart: string,
): PayPeriod {
  const end = addDays(start, PERIOD_DAYS - 1);
  const payDate = resolvePayDate(start, nextPayDate, cycleStart);
  return { start, end, payDate };
}

function resolvePayDate(
  periodStart: string,
  nextPayDate: string,
  cycleStart: string,
): string {
  if (!nextPayDate) return addDays(periodStart, 13 + 1);

  const anchorPeriodStart = getPeriodStartContaining(nextPayDate, cycleStart);
  const daysFromPeriodStart = daysBetween(anchorPeriodStart, nextPayDate);
  return addDays(periodStart, daysFromPeriodStart);
}

function getPeriodStartContaining(date: string, cycleStart: string): string {
  const offset = daysBetween(cycleStart, date);
  if (offset < 0) {
    const periodsBack = Math.ceil(Math.abs(offset) / PERIOD_DAYS);
    return addDays(cycleStart, -periodsBack * PERIOD_DAYS);
  }
  const periodIndex = Math.floor(offset / PERIOD_DAYS);
  return addDays(cycleStart, periodIndex * PERIOD_DAYS);
}

export function getCurrentPayPeriod(settings: HoursSettings, today: string): PayPeriod | null {
  return getPayPeriodForDate(today, settings);
}

export function getNextPayDate(settings: HoursSettings, today: string): string {
  if (settings.nextPayDate && settings.nextPayDate >= today) {
    return settings.nextPayDate;
  }

  const current = getCurrentPayPeriod(settings, today);
  if (!current) return settings.nextPayDate || "";

  if (current.payDate >= today) return current.payDate;

  const next = getPayPeriodForDate(addDays(current.end, 1), settings);
  return next?.payDate ?? addDays(current.payDate, PERIOD_DAYS);
}

export function listRecentPeriods(
  settings: HoursSettings,
  today: string,
  count = 8,
): PayPeriod[] {
  const current = getCurrentPayPeriod(settings, today);
  if (!current) return [];

  const periods: PayPeriod[] = [];
  let start = current.start;
  for (let i = 0; i < count; i++) {
    const period = getPayPeriodForDate(start, settings);
    if (!period) break;
    periods.push(period);
    start = addDays(period.start, -1);
  }
  return periods;
}

export function filterShiftsByPeriod<T extends { date: string }>(
  shifts: T[],
  period: PayPeriod,
): T[] {
  return shifts.filter((s) => isDateInRange(s.date, period.start, period.end));
}

export function getWeekBounds(today: string): { start: string; end: string } {
  const date = parseLocalDate(today);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const start = formatLocalDate(date);
  return { start, end: addDays(start, 6) };
}
