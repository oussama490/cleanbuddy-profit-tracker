import type { HoursData } from "./types";
import { createDefaultSettings, DATA_VERSION, STORAGE_KEY } from "./defaults";
import { normalizeImportedData } from "./importData";

export { STORAGE_KEY, DATA_VERSION, createDefaultSettings };

export function createEmptyData(): HoursData {
  return {
    version: DATA_VERSION,
    shifts: [],
    payStubs: [],
    settings: createDefaultSettings(),
  };
}

export function loadData(): HoursData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyData();
    const parsed = JSON.parse(raw) as HoursData;
    if (!parsed || parsed.version !== DATA_VERSION) return createEmptyData();
    return {
      ...createEmptyData(),
      ...parsed,
      settings: {
        ...createDefaultSettings(),
        ...parsed.settings,
        rateHistory:
          parsed.settings?.rateHistory?.length > 0
            ? parsed.settings.rateHistory
            : createDefaultSettings().rateHistory,
      },
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
      payStubs: Array.isArray(parsed.payStubs) ? parsed.payStubs : [],
    };
  } catch {
    return createEmptyData();
  }
}

export function saveData(data: HoursData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportDataJson(data: HoursData): string {
  return JSON.stringify(data, null, 2);
}

export function parseImportedData(json: string): HoursData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Fichier JSON invalide.");
  }
  return normalizeImportedData(parsed);
}
