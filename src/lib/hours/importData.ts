import type {
  HoursData,
  BreakMinutes,
  PayStub,
  RateEntry,
  HoursSettings,
  Shift,
} from "./types";
import { payableHoursExact, getRateForDate } from "./calculations";
import { createDefaultSettings, DATA_VERSION } from "./defaults";
import { round2 } from "./format";

interface NativeImport {
  version?: number;
  shifts?: unknown;
  payStubs?: unknown;
  settings?: Partial<HoursSettings> & { rateHistory?: RateEntry[] };
}

interface ExternalImport {
  fileType?: string;
  settings?: {
    defaultHourlyRate?: number;
    defaultBreakMinutes?: number;
    automaticBreakAfterHours?: number;
    targetHoursPerPayPeriod?: number;
    firstOfficialPayPeriodStart?: string;
    nextExpectedPayDate?: string;
    estimatedDeductionPercent?: number;
  };
  hourlyRates?: Array<{ amount: number; effectiveDate: string; note?: string }>;
  shifts?: Array<{
    id?: string;
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    note?: string;
    payableHours?: number;
    grossPay?: number;
    hourlyRate?: number;
  }>;
  paySlips?: Array<{
    id?: string;
    periodStart: string;
    periodEnd: string;
    paymentDate: string;
    regularHoursPaid: number;
    holidayHoursPaid?: number;
    holidayHours?: number;
    grossPay?: number;
    officialGross?: number;
    deductions: number;
    netPay?: number;
    netReceived?: number;
    manualHourAdjustment?: number;
    manualAdjustmentHours?: number;
    note?: string;
  }>;
  payStubs?: ExternalImport["paySlips"];
}

function isBreakMinutes(value: number): value is BreakMinutes {
  return value === 0 || value === 30 || value === 40 || value === 60;
}

function shiftKey(shift: {
  date: string;
  startTime: string;
  endTime: string;
}): string {
  return `${shift.date}|${shift.startTime}|${shift.endTime}`;
}

function dedupeShifts(shifts: Shift[]): Shift[] {
  const byId = new Map<string, Shift>();
  const byKey = new Map<string, Shift>();

  for (const shift of shifts) {
    if (byId.has(shift.id)) continue;
    const key = shiftKey(shift);
    if (byKey.has(key)) continue;
    byId.set(shift.id, shift);
    byKey.set(key, shift);
  }

  return [...byId.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.startTime.localeCompare(a.startTime),
  );
}

function dedupePayStubs(stubs: PayStub[]): PayStub[] {
  const byId = new Map<string, PayStub>();
  const byPeriod = new Map<string, PayStub>();

  for (const stub of stubs) {
    if (byId.has(stub.id)) continue;
    const key = `${stub.periodStart}|${stub.periodEnd}`;
    if (byPeriod.has(key)) continue;
    byId.set(stub.id, stub);
    byPeriod.set(key, stub);
  }

  return [...byId.values()].sort((a, b) =>
    a.periodStart.localeCompare(b.periodStart),
  );
}

function buildShift(
  raw: NonNullable<ExternalImport["shifts"]>[number],
  rateHistory: RateEntry[],
  now: string,
): Shift {
  const breakMinutes = raw.breakMinutes;
  if (!isBreakMinutes(breakMinutes)) {
    throw new Error(`Pause invalide (${breakMinutes} min) pour le quart du ${raw.date}.`);
  }

  const hours =
    typeof raw.payableHours === "number"
      ? raw.payableHours
      : payableHoursExact(raw.startTime, raw.endTime, breakMinutes);
  const hourlyRate =
    typeof raw.hourlyRate === "number"
      ? raw.hourlyRate
      : getRateForDate(rateHistory, raw.date);
  const grossPay =
    typeof raw.grossPay === "number" ? raw.grossPay : hours * hourlyRate;

  return {
    id: raw.id || crypto.randomUUID(),
    date: raw.date,
    startTime: raw.startTime,
    endTime: raw.endTime,
    breakMinutes,
    note: raw.note ?? "",
    payableHours: hours,
    grossPay,
    hourlyRate,
    createdAt: now,
    updatedAt: now,
  };
}

function buildPayStub(
  raw: NonNullable<ExternalImport["paySlips"]>[number],
  now: string,
): PayStub {
  return {
    id: raw.id || crypto.randomUUID(),
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
    paymentDate: raw.paymentDate,
    regularHoursPaid: raw.regularHoursPaid,
    holidayHours: raw.holidayHoursPaid ?? raw.holidayHours ?? 0,
    officialGross: raw.grossPay ?? raw.officialGross ?? 0,
    deductions: raw.deductions,
    netReceived: raw.netPay ?? raw.netReceived ?? 0,
    manualAdjustmentHours:
      raw.manualHourAdjustment ?? raw.manualAdjustmentHours ?? 0,
    note: raw.note ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

function convertExternal(data: ExternalImport): HoursData {
  const now = new Date().toISOString();
  const defaults = createDefaultSettings();
  const externalSettings = data.settings ?? {};

  const rateHistory: RateEntry[] =
    data.hourlyRates && data.hourlyRates.length > 0
      ? data.hourlyRates.map((rate) => ({
          id: crypto.randomUUID(),
          rate: rate.amount,
          effectiveDate: rate.effectiveDate,
        }))
      : [
          {
            id: crypto.randomUUID(),
            rate: externalSettings.defaultHourlyRate ?? 17,
            effectiveDate:
              externalSettings.firstOfficialPayPeriodStart ?? "2026-05-13",
          },
        ];

  const breakValue = externalSettings.defaultBreakMinutes ?? 30;
  const autoBreakMinutes: BreakMinutes = isBreakMinutes(breakValue)
    ? breakValue
    : 30;

  const settings: HoursSettings = {
    ...defaults,
    rateHistory,
    autoBreakMinutes,
    autoBreakAfterHours: externalSettings.automaticBreakAfterHours ?? 5,
    periodGoalHours: externalSettings.targetHoursPerPayPeriod ?? 80,
    deductionPercent: externalSettings.estimatedDeductionPercent ?? 18,
    payCycleStartDate:
      externalSettings.firstOfficialPayPeriodStart ??
      defaults.payCycleStartDate,
    nextPayDate:
      externalSettings.nextExpectedPayDate ?? defaults.nextPayDate,
  };

  const shifts = dedupeShifts(
    (data.shifts ?? []).map((shift) => buildShift(shift, rateHistory, now)),
  );

  const slips = data.paySlips ?? data.payStubs ?? [];
  const payStubs = dedupePayStubs(slips.map((slip) => buildPayStub(slip, now)));

  return {
    version: DATA_VERSION,
    shifts,
    payStubs,
    settings,
  };
}

function convertNative(data: NativeImport): HoursData {
  const defaults = createDefaultSettings();
  if (!Array.isArray(data.shifts) || !Array.isArray(data.payStubs)) {
    throw new Error("Le fichier ne contient pas les données attendues.");
  }

  const settings: HoursSettings = {
    ...defaults,
    ...(data.settings ?? {}),
    rateHistory:
      data.settings?.rateHistory && data.settings.rateHistory.length > 0
        ? data.settings.rateHistory
        : defaults.rateHistory,
  };

  const now = new Date().toISOString();
  const shifts = dedupeShifts(
    (data.shifts as Shift[]).map((shift) => {
      const hours =
        typeof shift.payableHours === "number"
          ? shift.payableHours
          : payableHoursExact(
              shift.startTime,
              shift.endTime,
              shift.breakMinutes,
            );
      const hourlyRate =
        typeof shift.hourlyRate === "number"
          ? shift.hourlyRate
          : getRateForDate(settings.rateHistory, shift.date);
      const grossPay =
        typeof shift.grossPay === "number" ? shift.grossPay : hours * hourlyRate;

      return {
        ...shift,
        id: shift.id || crypto.randomUUID(),
        note: shift.note ?? "",
        payableHours: hours,
        hourlyRate,
        grossPay,
        createdAt: shift.createdAt ?? now,
        updatedAt: shift.updatedAt ?? now,
      };
    }),
  );

  const payStubs = dedupePayStubs(
    (data.payStubs as PayStub[]).map((stub) => ({
      ...stub,
      id: stub.id || crypto.randomUUID(),
      note: stub.note ?? "",
      holidayHours: stub.holidayHours ?? 0,
      manualAdjustmentHours: stub.manualAdjustmentHours ?? 0,
      createdAt: stub.createdAt ?? now,
      updatedAt: stub.updatedAt ?? now,
    })),
  );

  return {
    version: DATA_VERSION,
    shifts,
    payStubs,
    settings,
  };
}

export function isExternalFormat(data: unknown): data is ExternalImport {
  if (!data || typeof data !== "object") return false;
  const obj = data as ExternalImport;
  return (
    obj.fileType === "mes-heures-complete-data" ||
    Array.isArray(obj.paySlips) ||
    Array.isArray(obj.hourlyRates)
  );
}

export function normalizeImportedData(parsed: unknown): HoursData {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Fichier invalide.");
  }

  const data = isExternalFormat(parsed)
    ? convertExternal(parsed)
    : convertNative(parsed as NativeImport);

  if (data.shifts.length === 0 && data.payStubs.length === 0) {
    throw new Error("Le fichier ne contient aucun quart ni fiche de paie.");
  }

  return data;
}

export function computeEstimatedReserve(
  shifts: Array<{ date: string; payableHours: number }>,
  payStubs: PayStub[],
): number | null {
  if (payStubs.length === 0) return null;

  const lastPeriodEnd = [...payStubs].sort((a, b) =>
    b.periodEnd.localeCompare(a.periodEnd),
  )[0].periodEnd;

  const hours = round2(
    shifts
      .filter((s) => s.date <= lastPeriodEnd)
      .reduce((sum, s) => sum + s.payableHours, 0),
  );
  const adjustments = round2(
    payStubs.reduce((sum, s) => sum + s.manualAdjustmentHours, 0),
  );
  const paid = round2(
    payStubs.reduce((sum, s) => sum + s.regularHoursPaid, 0),
  );

  return round2(hours + adjustments - paid);
}

export function sumNetReceived(payStubs: PayStub[]): number {
  return round2(payStubs.reduce((sum, s) => sum + s.netReceived, 0));
}
