"use client";

import { useCallback, useEffect, useState } from "react";
import type { HoursData, HoursSettings, PayStub, Shift, ShiftInput } from "@/lib/hours/types";
import { computeShiftPay } from "@/lib/hours/calculations";
import { SEED_KEY } from "@/lib/hours/defaults";
import { normalizeImportedData } from "@/lib/hours/importData";
import {
  createEmptyData,
  exportDataJson,
  loadData,
  parseImportedData,
  saveData,
  STORAGE_KEY,
} from "@/lib/hours/storage";
import rawCompleteData from "@/lib/hours/seed.json";

function loadInitialData(): HoursData {
  if (typeof window === "undefined") return createEmptyData();
  try {
    if (localStorage.getItem(SEED_KEY) !== "1") {
      const imported = normalizeImportedData(rawCompleteData);
      saveData(imported);
      localStorage.setItem(SEED_KEY, "1");
      return imported;
    }
  } catch {
    // Seed failed — fall back to whatever is already stored.
  }
  return loadData();
}

export function useHoursData() {
  const [data, setData] = useState<HoursData>(createEmptyData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(loadInitialData());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveData(data);
  }, [data, ready]);

  const updateSettings = useCallback((patch: Partial<HoursSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const addShift = useCallback((input: ShiftInput) => {
    const pay = computeShiftPay(input, data.settings.rateHistory);
    const now = new Date().toISOString();
    const shift: Shift = {
      id: crypto.randomUUID(),
      ...input,
      note: input.note.trim(),
      payableHours: pay.payableHours,
      grossPay: pay.grossPay,
      hourlyRate: pay.hourlyRate,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      shifts: [...prev.shifts, shift],
    }));
    return shift;
  }, [data.settings.rateHistory]);

  const updateShift = useCallback((id: string, input: ShiftInput) => {
    setData((prev) => {
      const pay = computeShiftPay(input, prev.settings.rateHistory);
      return {
        ...prev,
        shifts: prev.shifts.map((s) =>
          s.id === id
            ? {
                ...s,
                ...input,
                note: input.note.trim(),
                payableHours: pay.payableHours,
                grossPay: pay.grossPay,
                hourlyRate: pay.hourlyRate,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      };
    });
  }, []);

  const deleteShift = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((s) => s.id !== id),
    }));
  }, []);

  const addPayStub = useCallback((stub: Omit<PayStub, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const payStub: PayStub = {
      ...stub,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      payStubs: [...prev.payStubs, payStub],
    }));
    return payStub;
  }, []);

  const updatePayStub = useCallback(
    (id: string, stub: Omit<PayStub, "id" | "createdAt" | "updatedAt">) => {
      setData((prev) => ({
        ...prev,
        payStubs: prev.payStubs.map((p) =>
          p.id === id
            ? { ...p, ...stub, updatedAt: new Date().toISOString() }
            : p,
        ),
      }));
    },
    [],
  );

  const deletePayStub = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      payStubs: prev.payStubs.filter((p) => p.id !== id),
    }));
  }, []);

  const addRateIncrease = useCallback((rate: number, effectiveDate: string) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        rateHistory: [
          ...prev.settings.rateHistory.filter(
            (e) => e.effectiveDate !== effectiveDate,
          ),
          {
            id: crypto.randomUUID(),
            rate,
            effectiveDate,
          },
        ].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate)),
      },
    }));
  }, []);

  const removeRateEntry = useCallback((id: string) => {
    setData((prev) => {
      if (prev.settings.rateHistory.length <= 1) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          rateHistory: prev.settings.rateHistory.filter((e) => e.id !== id),
        },
      };
    });
  }, []);

  const exportJson = useCallback(() => exportDataJson(data), [data]);

  const importJson = useCallback((json: string) => {
    const imported = parseImportedData(json);
    setData(imported);
    localStorage.setItem(SEED_KEY, "1");
  }, []);

  const resetApp = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SEED_KEY);
    setData(createEmptyData());
  }, []);

  return {
    data,
    ready,
    updateSettings,
    addShift,
    updateShift,
    deleteShift,
    addPayStub,
    updatePayStub,
    deletePayStub,
    addRateIncrease,
    removeRateEntry,
    exportJson,
    importJson,
    resetApp,
  };
}
