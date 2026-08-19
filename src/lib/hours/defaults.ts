import type { HoursSettings } from "./types";

export const DATA_VERSION = 1 as const;
export const STORAGE_KEY = "mes-heures-data";
export const SEED_KEY = "mes-heures-seed-complete-v2";

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function createDefaultSettings(): HoursSettings {
  const iso = formatLocalDate(new Date());

  return {
    rateHistory: [
      {
        id: crypto.randomUUID(),
        rate: 17,
        effectiveDate: "2026-05-13",
      },
    ],
    autoBreakMinutes: 30,
    autoBreakAfterHours: 5,
    periodGoalHours: 80,
    deductionPercent: 18,
    payCycleStartDate: "2026-05-17",
    nextPayDate: addDays(iso, 14),
  };
}
