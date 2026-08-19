import type { BreakMinutes, RateEntry, ShiftInput } from "./types";
import { round2 } from "./format";

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function durationMinutes(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

export function durationHours(startTime: string, endTime: string): number {
  return round2(durationMinutes(startTime, endTime) / 60);
}

export function payableHoursExact(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): number {
  const total = durationMinutes(startTime, endTime);
  return Math.max(0, total - breakMinutes) / 60;
}

export function payableHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): number {
  return round2(payableHoursExact(startTime, endTime, breakMinutes));
}

export function getRateForDate(rateHistory: RateEntry[], date: string): number {
  const applicable = rateHistory
    .filter((entry) => entry.effectiveDate <= date)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (applicable.length > 0) return applicable[0].rate;

  const earliest = [...rateHistory].sort((a, b) =>
    a.effectiveDate.localeCompare(b.effectiveDate),
  )[0];

  return earliest?.rate ?? 0;
}

export function getCurrentRate(rateHistory: RateEntry[], today: string): number {
  return getRateForDate(rateHistory, today);
}

export function suggestBreak(
  startTime: string,
  endTime: string,
  autoBreakMinutes: BreakMinutes,
  autoBreakAfterHours: number,
): BreakMinutes {
  if (!startTime || !endTime) return 0;
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return 0;
  const hours = durationHours(startTime, endTime);
  if (hours > autoBreakAfterHours) return autoBreakMinutes;
  return 0;
}

export function computeShiftPay(
  input: ShiftInput,
  rateHistory: RateEntry[],
): { payableHours: number; hourlyRate: number; grossPay: number } {
  const hours = payableHoursExact(
    input.startTime,
    input.endTime,
    input.breakMinutes,
  );
  const hourlyRate = getRateForDate(rateHistory, input.date);
  const grossPay = hours * hourlyRate;
  return { payableHours: hours, hourlyRate, grossPay };
}

export function estimateNet(gross: number, deductionPercent: number): number {
  const deductions = round2(gross * (deductionPercent / 100));
  return round2(Math.max(0, gross - deductions));
}

export function sumPayableHours(
  shifts: Array<{ payableHours: number }>,
): number {
  return round2(shifts.reduce((sum, s) => sum + s.payableHours, 0));
}

export function sumGrossPay(shifts: Array<{ grossPay: number }>): number {
  return round2(shifts.reduce((sum, s) => sum + s.grossPay, 0));
}

export function computeDifference(
  recordedHours: number,
  manualAdjustment: number,
  regularHoursPaid: number,
): number {
  return round2(recordedHours + manualAdjustment - regularHoursPaid);
}
