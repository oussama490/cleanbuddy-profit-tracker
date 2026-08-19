"use client";

import { HoursConfirm } from "@/components/hours/HoursConfirm";
import { usePrefs } from "@/components/PrefsProvider";
import { Section } from "@/components/ui";
import { getCurrentRate } from "@/lib/hours/calculations";
import { formatDisplayDate, todayIso } from "@/lib/hours/dates";
import { formatMoney, formatRate } from "@/lib/hours/format";
import type { BreakMinutes, HoursData } from "@/lib/hours/types";
import { BREAK_OPTIONS } from "@/lib/hours/validation";
import { useRef, useState } from "react";

export function HoursSettingsPanel({
  data,
  onUpdateSettings,
  onAddRateIncrease,
  onRemoveRateEntry,
  onExport,
  onImport,
  onReset,
}: {
  data: HoursData;
  onUpdateSettings: (patch: Partial<HoursData["settings"]>) => void;
  onAddRateIncrease: (rate: number, effectiveDate: string) => void;
  onRemoveRateEntry: (id: string) => void;
  onExport: () => string;
  onImport: (json: string) => void;
  onReset: () => void;
}) {
  const { t, lang } = usePrefs();
  const locale = lang === "ar" ? "ar" : "fr-CA";
  const today = todayIso();
  const currentRate = getCurrentRate(data.settings.rateHistory, today);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newRate, setNewRate] = useState("");
  const [newRateDate, setNewRateDate] = useState(today);
  const [rateError, setRateError] = useState("");
  const [importConfirm, setImportConfirm] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [message, setMessage] = useState("");

  function handleExport() {
    const json = onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mes-heures-sauvegarde-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(t("hours.exported"));
  }

  function handleAddRate() {
    const rate = Number(newRate);
    if (Number.isNaN(rate) || rate <= 0) {
      setRateError(t("hours.invalidRate"));
      return;
    }
    if (!newRateDate) {
      setRateError(t("hours.needDate"));
      return;
    }
    onAddRateIncrease(Math.round(rate * 100) / 100, newRateDate);
    setNewRate("");
    setRateError("");
    setMessage(t("hours.keepOld"));
  }

  return (
    <div>
      {message ? <p className="cb-notice mb-4 text-profit">{message}</p> : null}

      <Section title={t("hours.hourlyRate")} hint={t("hours.currentRate")}>
        <p className="cb-num text-[1.7rem] font-semibold leading-none">{formatRate(currentRate)}</p>
        <div className="mt-4 space-y-4">
          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.newRaise")}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="cb-input"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="18.00"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.effective")}</span>
            <input
              type="date"
              className="cb-input"
              value={newRateDate}
              onChange={(e) => setNewRateDate(e.target.value)}
            />
          </label>
          {rateError ? <p className="text-sm text-loss">{rateError}</p> : null}
          <button type="button" className="cb-btn min-h-11 w-full" onClick={handleAddRate}>
            {t("hours.addRaise")}
          </button>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold">{t("hours.rateHistory")}</p>
          <ul className="space-y-2">
            {[...data.settings.rateHistory]
              .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
              .map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-[10px] bg-background px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{formatMoney(entry.rate)}/h</p>
                    <p className="text-xs text-muted">
                      {t("hours.since")} {formatDisplayDate(entry.effectiveDate, locale)}
                    </p>
                  </div>
                  {data.settings.rateHistory.length > 1 ? (
                    <button
                      type="button"
                      className="shrink-0 text-sm font-semibold text-loss"
                      onClick={() => onRemoveRateEntry(entry.id)}
                    >
                      {t("hours.remove")}
                    </button>
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      </Section>

      <Section title={t("hours.autoPause")}>
        <p className="cb-label mb-2">{t("hours.pauseDuration")}</p>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {BREAK_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onUpdateSettings({ autoBreakMinutes: m as BreakMinutes })}
              className={
                data.settings.autoBreakMinutes === m
                  ? "cb-choice cb-choice-on min-h-12 px-0 py-0 text-center text-sm"
                  : "cb-choice cb-choice-off min-h-12 px-0 py-0 text-center text-sm"
              }
            >
              {m}
            </button>
          ))}
        </div>
        <label className="block space-y-1.5">
          <span className="cb-label">{t("hours.afterHours")}</span>
          <input
            type="number"
            step="0.5"
            min="0"
            className="cb-input"
            value={data.settings.autoBreakAfterHours}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v) && v >= 0) onUpdateSettings({ autoBreakAfterHours: v });
            }}
          />
        </label>
      </Section>

      <Section title={t("hours.payroll")}>
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.periodGoal")}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="cb-input"
              value={data.settings.periodGoalHours}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v) && v >= 0) onUpdateSettings({ periodGoalHours: v });
              }}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.deductionPct")}</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              className="cb-input"
              value={data.settings.deductionPercent}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v) && v >= 0 && v <= 100) {
                  onUpdateSettings({ deductionPercent: v });
                }
              }}
            />
            <span className="text-xs text-muted">{t("hours.deductionHint")}</span>
          </label>
          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.cycleStart")}</span>
            <input
              type="date"
              className="cb-input"
              value={data.settings.payCycleStartDate}
              onChange={(e) => onUpdateSettings({ payCycleStartDate: e.target.value })}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.nextPayDate")}</span>
            <input
              type="date"
              className="cb-input"
              value={data.settings.nextPayDate}
              onChange={(e) => onUpdateSettings({ nextPayDate: e.target.value })}
            />
          </label>
        </div>
      </Section>

      <Section title={t("hours.backup")} hint={t("hours.backupHint")}>
        <div className="space-y-2">
          <button type="button" className="cb-btn min-h-11 w-full" onClick={handleExport}>
            {t("hours.export")}
          </button>
          <button
            type="button"
            className="cb-btn-ghost min-h-11 w-full"
            onClick={() => fileRef.current?.click()}
          >
            {t("hours.import")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setImportConfirm(String(reader.result ?? ""));
              reader.readAsText(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="cb-btn-ghost min-h-11 w-full text-loss"
            onClick={() => setResetStep(1)}
          >
            {t("hours.reset")}
          </button>
        </div>
      </Section>

      <HoursConfirm
        open={importConfirm != null}
        title={t("hours.replaceData")}
        message={t("hours.replaceWarn")}
        confirmLabel={t("hours.replace")}
        cancelLabel={t("hours.cancel")}
        danger
        onCancel={() => setImportConfirm(null)}
        onConfirm={() => {
          try {
            if (importConfirm) onImport(importConfirm);
            setMessage(t("hours.imported"));
          } catch (err) {
            setMessage(err instanceof Error ? err.message : t("hours.importFail"));
          }
          setImportConfirm(null);
        }}
      />

      <HoursConfirm
        open={resetStep === 1}
        title={t("hours.resetQ")}
        message={t("hours.resetWarn")}
        confirmLabel={t("hours.continue")}
        cancelLabel={t("hours.cancel")}
        danger
        onCancel={() => setResetStep(0)}
        onConfirm={() => setResetStep(2)}
      />

      <HoursConfirm
        open={resetStep === 2}
        title={t("hours.resetFinal")}
        message={t("hours.resetYes")}
        confirmLabel={t("hours.resetConfirm")}
        cancelLabel={t("hours.cancel")}
        danger
        onCancel={() => setResetStep(0)}
        onConfirm={() => {
          onReset();
          setResetStep(0);
          setMessage(t("hours.resetDone"));
        }}
      />
    </div>
  );
}
