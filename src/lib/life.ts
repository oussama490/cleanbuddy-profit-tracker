import { addDaysIso } from "./commerce";
import { convertToCad } from "./currency";
import { todayIsoDate } from "./format";
import { startOfWeek } from "./hours/dates";
import type {
  BudgetCategory,
  BudgetEntry,
  EducationLevel,
  ExchangeRateSnapshot,
  Job,
  PrCriteria,
  TeerLevel,
  WeeklyReviewMeta,
  WorkspaceRecord,
} from "./types";

export const EXPERIENCE_MONTHS_TARGET = 12;
export const EXPERIENCE_HOURS_TARGET = 1560;
export const QUALIFYING_TEER: TeerLevel[] = ["0", "1", "2", "3"];

const EDUCATION_POINTS: Record<EducationLevel, number> = {
  high_school: 30,
  one_year: 90,
  two_year: 98,
  bachelor: 120,
  two_or_more: 128,
  master: 135,
  phd: 150,
};

const AGE_POINTS: Record<number, number> = {
  18: 99,
  19: 105,
  30: 105,
  31: 99,
  32: 94,
  33: 88,
  34: 83,
  35: 77,
  36: 72,
  37: 66,
  38: 61,
  39: 55,
  40: 50,
  41: 39,
  42: 28,
  43: 17,
  44: 6,
};

export function isQualifyingTeer(teer: TeerLevel): boolean {
  return QUALIFYING_TEER.includes(teer);
}

export function isTeerLevel(value: string): value is TeerLevel {
  return ["0", "1", "2", "3", "4", "5"].includes(value);
}

export function daysBetweenInclusive(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(0, diff + 1);
}

export function jobEndDate(job: Job, today = todayIsoDate()): string {
  if (job.end_date && job.status !== "active") return job.end_date;
  if (job.end_date && job.end_date < today) return job.end_date;
  return today;
}

export function jobIsQualifying(job: Job): boolean {
  return isQualifyingTeer(job.teer);
}

export function jobDurationDays(job: Job, today = todayIsoDate()): number {
  const end = jobEndDate(job, today);
  if (end < job.start_date) return 0;
  return daysBetweenInclusive(job.start_date, end);
}

export function jobDurationMonths(job: Job, today = todayIsoDate()): number {
  return jobDurationDays(job, today) / 30.437;
}

export function jobHoursWorked(job: Job, today = todayIsoDate()): number {
  const weeks = jobDurationDays(job, today) / 7;
  return weeks * Math.max(0, job.hours_per_week);
}

export type ExperienceSummary = {
  monthsFromJobs: number;
  hoursFromJobs: number;
  monthsUsed: number;
  hoursUsed: number;
  monthsProgress: number;
  hoursProgress: number;
  progress: number;
  thresholdMet: boolean;
  estimatedDate: string | null;
};

export function qualifyingJobs(jobs: Job[]): Job[] {
  return jobs.filter(jobIsQualifying);
}

export function experienceFromJobs(
  jobs: Job[],
  today = todayIsoDate(),
): { months: number; hours: number } {
  const qualifying = qualifyingJobs(jobs);
  const months = qualifying.reduce((sum, job) => sum + jobDurationMonths(job, today), 0);
  const hours = qualifying.reduce((sum, job) => sum + jobHoursWorked(job, today), 0);
  return { months, hours };
}

function estimatedThresholdDate(
  jobs: Job[],
  monthsUsed: number,
  hoursUsed: number,
  today = todayIsoDate(),
): string | null {
  if (
    monthsUsed >= EXPERIENCE_MONTHS_TARGET ||
    hoursUsed >= EXPERIENCE_HOURS_TARGET
  ) {
    return today;
  }

  const active = qualifyingJobs(jobs).filter((job) => job.status === "active");
  if (active.length === 0) return null;

  const weeklyHours = active.reduce((sum, job) => sum + Math.max(0, job.hours_per_week), 0);
  const remainingMonths = Math.max(0, EXPERIENCE_MONTHS_TARGET - monthsUsed);
  const remainingHours = Math.max(0, EXPERIENCE_HOURS_TARGET - hoursUsed);

  const daysForMonths = remainingMonths * 30.437;
  const daysForHours = weeklyHours > 0 ? (remainingHours / weeklyHours) * 7 : Number.POSITIVE_INFINITY;
  const days = Math.min(daysForMonths, daysForHours);
  if (!Number.isFinite(days)) return null;
  return addDaysIso(today, Math.ceil(days));
}

export function summarizeExperience(
  jobs: Job[],
  criteria: PrCriteria | null,
  today = todayIsoDate(),
): ExperienceSummary {
  const fromJobs = experienceFromJobs(jobs, today);
  const monthsUsed =
    criteria?.experience_months_override != null
      ? criteria.experience_months_override
      : fromJobs.months;
  const hoursUsed = fromJobs.hours;
  const monthsProgress = Math.min(1, monthsUsed / EXPERIENCE_MONTHS_TARGET);
  const hoursProgress = Math.min(1, hoursUsed / EXPERIENCE_HOURS_TARGET);
  const progress = Math.min(1, Math.max(monthsProgress, hoursProgress));
  const thresholdMet =
    monthsUsed >= EXPERIENCE_MONTHS_TARGET || hoursUsed >= EXPERIENCE_HOURS_TARGET;

  return {
    monthsFromJobs: fromJobs.months,
    hoursFromJobs: fromJobs.hours,
    monthsUsed,
    hoursUsed,
    monthsProgress,
    hoursProgress,
    progress,
    thresholdMet,
    estimatedDate: thresholdMet
      ? today
      : estimatedThresholdDate(jobs, monthsUsed, hoursUsed, today),
  };
}

export function clbFirstLanguagePoints(clb: number): number {
  if (clb >= 10) return 34 * 4;
  if (clb >= 9) return 31 * 4;
  if (clb >= 8) return 23 * 4;
  if (clb >= 7) return 17 * 4;
  if (clb >= 6) return 9 * 4;
  if (clb >= 4) return 6 * 4;
  return 0;
}

export function clbSecondLanguagePoints(clb: number): number {
  if (clb >= 9) return 6 * 4;
  if (clb >= 7) return 3 * 4;
  if (clb >= 5) return 1 * 4;
  return 0;
}

export function agePoints(age: number): number {
  if (age < 18 || age >= 45) return 0;
  if (age >= 20 && age <= 29) return 110;
  return AGE_POINTS[age] ?? 0;
}

export function canadianWorkPoints(months: number): number {
  const years = months / 12;
  if (years >= 5) return 80;
  if (years >= 4) return 72;
  if (years >= 3) return 64;
  if (years >= 2) return 53;
  if (years >= 1) return 40;
  return 0;
}

export function frenchBonusPoints(frenchClb: number, englishClb: number): number {
  if (frenchClb >= 7 && englishClb >= 7) return 50;
  if (frenchClb >= 7 && englishClb >= 5) return 25;
  return 0;
}

export type CrsBreakdown = {
  age: number;
  education: number;
  firstLanguage: number;
  secondLanguage: number;
  canadianWork: number;
  frenchBonus: number;
  total: number;
};

export function estimateCrs(input: {
  age: number;
  education: EducationLevel;
  frenchClb: number;
  englishClb: number;
  experienceMonths: number;
}): CrsBreakdown {
  const firstIsFrench = input.frenchClb >= input.englishClb;
  const first = firstIsFrench ? input.frenchClb : input.englishClb;
  const second = firstIsFrench ? input.englishClb : input.frenchClb;
  const breakdown: CrsBreakdown = {
    age: agePoints(input.age),
    education: EDUCATION_POINTS[input.education] ?? 0,
    firstLanguage: clbFirstLanguagePoints(first),
    secondLanguage: clbSecondLanguagePoints(second),
    canadianWork: canadianWorkPoints(input.experienceMonths),
    frenchBonus: frenchBonusPoints(input.frenchClb, input.englishClb),
    total: 0,
  };
  breakdown.total =
    breakdown.age +
    breakdown.education +
    breakdown.firstLanguage +
    breakdown.secondLanguage +
    breakdown.canadianWork +
    breakdown.frenchBonus;
  return breakdown;
}

export function monthlyJobIncomeCad(
  job: Job,
  snapshot: ExchangeRateSnapshot | null,
): number {
  if (job.status !== "active") return 0;
  const hourlyMonthly = job.hourly_wage > 0 ? job.hourly_wage * job.hours_per_week * (52 / 12) : 0;
  const annualMonthly = job.annual_salary > 0 ? job.annual_salary / 12 : 0;
  const amount = Math.max(hourlyMonthly, annualMonthly);
  if (!snapshot) return job.wage_currency === "CAD" ? amount : 0;
  return convertToCad(amount, job.wage_currency, snapshot);
}

export function totalActiveJobIncomeCad(
  jobs: Job[],
  snapshot: ExchangeRateSnapshot | null,
): number {
  return jobs.reduce((sum, job) => sum + monthlyJobIncomeCad(job, snapshot), 0);
}

export function budgetAmountCad(
  entry: BudgetEntry,
  snapshot: ExchangeRateSnapshot | null,
): number {
  if (!snapshot) return entry.currency === "CAD" ? entry.amount : 0;
  return convertToCad(entry.amount, entry.currency, snapshot);
}

export function currentMonthPrefix(today = todayIsoDate()): string {
  return today.slice(0, 7);
}

export function entriesInMonth(entries: BudgetEntry[], monthPrefix: string): BudgetEntry[] {
  return entries.filter((entry) => entry.entry_date.startsWith(monthPrefix));
}

export function spendByCategory(
  entries: BudgetEntry[],
  snapshot: ExchangeRateSnapshot | null,
): Record<BudgetCategory, number> {
  const totals: Record<BudgetCategory, number> = {
    transport: 0,
    food: 0,
    housing: 0,
    gym: 0,
    leisure: 0,
    other: 0,
  };
  for (const entry of entries) {
    totals[entry.category] += budgetAmountCad(entry, snapshot);
  }
  return totals;
}

export function parseWeeklyReviewMeta(record: WorkspaceRecord): WeeklyReviewMeta {
  const meta = record.meta ?? {};
  const progresPr = String(meta.progresPr ?? "");
  const resultatBusiness = String(meta.resultatBusiness ?? "");
  const santeForme = String(meta.santeForme ?? "");
  if (progresPr || resultatBusiness || santeForme) {
    return { progresPr, resultatBusiness, santeForme };
  }
  return {
    progresPr: "",
    resultatBusiness: record.body,
    santeForme: "",
  };
}

export function weekRangeLabel(weekStart: string): { start: string; end: string } {
  return { start: weekStart, end: addDaysIso(weekStart, 6) };
}

export function defaultWeekStart(today = todayIsoDate()): string {
  return startOfWeek(today);
}
