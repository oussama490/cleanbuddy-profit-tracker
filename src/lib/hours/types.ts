export type BreakMinutes = 0 | 30 | 40 | 60;

export type HoursTab = "resume" | "ajouter" | "historique" | "reglages";

export interface RateEntry {
  id: string;
  rate: number;
  effectiveDate: string;
}

export interface HoursSettings {
  rateHistory: RateEntry[];
  autoBreakMinutes: BreakMinutes;
  autoBreakAfterHours: number;
  periodGoalHours: number;
  deductionPercent: number;
  payCycleStartDate: string;
  nextPayDate: string;
}

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: BreakMinutes;
  note: string;
  payableHours: number;
  grossPay: number;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayStub {
  id: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  regularHoursPaid: number;
  holidayHours: number;
  officialGross: number;
  deductions: number;
  netReceived: number;
  manualAdjustmentHours: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface HoursData {
  version: 1;
  shifts: Shift[];
  payStubs: PayStub[];
  settings: HoursSettings;
}

export interface PayPeriod {
  start: string;
  end: string;
  payDate: string;
}

export interface ShiftInput {
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: BreakMinutes;
  note: string;
}

export type HistoryFilter = "semaine" | "periode" | "mois";
