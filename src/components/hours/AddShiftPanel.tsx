"use client";

import { usePrefs } from "@/components/PrefsProvider";
import { Section } from "@/components/ui";
import {
  computeShiftPay,
  durationHours,
  suggestBreak,
} from "@/lib/hours/calculations";
import { todayIso } from "@/lib/hours/dates";
import { formatHours, formatMoney } from "@/lib/hours/format";
import type { BreakMinutes, HoursSettings, Shift, ShiftInput } from "@/lib/hours/types";
import { BREAK_OPTIONS, validateShift } from "@/lib/hours/validation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

export function AddShiftPanel({
  settings,
  editing,
  onSave,
  onCancelEdit,
}: {
  settings: HoursSettings;
  editing?: Shift | null;
  onSave: (input: ShiftInput) => void;
  onCancelEdit?: () => void;
}) {
  const { t } = usePrefs();
  const [date, setDate] = useState(editing?.date ?? todayIso());
  const [startTime, setStartTime] = useState(editing?.startTime ?? "");
  const [endTime, setEndTime] = useState(editing?.endTime ?? "");
  const [breakMinutes, setBreakMinutes] = useState<BreakMinutes>(editing?.breakMinutes ?? 0);
  const [note, setNote] = useState(editing?.note ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [autoSuggested, setAutoSuggested] = useState(false);

  useEffect(() => {
    if (editing) {
      setDate(editing.date);
      setStartTime(editing.startTime);
      setEndTime(editing.endTime);
      setBreakMinutes(editing.breakMinutes);
      setNote(editing.note);
      setErrors([]);
      setSuccess("");
    }
  }, [editing]);

  useEffect(() => {
    if (editing) return;
    if (!startTime || !endTime) return;
    const suggested = suggestBreak(
      startTime,
      endTime,
      settings.autoBreakMinutes,
      settings.autoBreakAfterHours,
    );
    if (suggested > 0 && !autoSuggested) {
      setBreakMinutes(suggested);
      setAutoSuggested(true);
    }
  }, [
    startTime,
    endTime,
    settings.autoBreakMinutes,
    settings.autoBreakAfterHours,
    autoSuggested,
    editing,
  ]);

  const preview = useMemo(() => {
    const input: ShiftInput = { date, startTime, endTime, breakMinutes, note };
    const validation = validateShift(input, {
      needDate: t("hours.needDate"),
      needStart: t("hours.needStart"),
      needEnd: t("hours.needEnd"),
      endAfterStart: t("hours.endAfterStart"),
      breakTooLong: t("hours.breakTooLong"),
      breakNegative: t("hours.breakNegative"),
    });
    if (!validation.valid) return null;
    return computeShiftPay(input, settings.rateHistory);
  }, [date, startTime, endTime, breakMinutes, note, settings.rateHistory, t]);

  const totalDuration =
    startTime && endTime && endTime > startTime ? durationHours(startTime, endTime) : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input: ShiftInput = { date, startTime, endTime, breakMinutes, note };
    const validation = validateShift(input, {
      needDate: t("hours.needDate"),
      needStart: t("hours.needStart"),
      needEnd: t("hours.needEnd"),
      endAfterStart: t("hours.endAfterStart"),
      breakTooLong: t("hours.breakTooLong"),
      breakNegative: t("hours.breakNegative"),
    });
    if (!validation.valid) {
      setErrors(validation.errors);
      setSuccess("");
      return;
    }
    onSave(input);
    setErrors([]);
    if (editing) {
      setSuccess(t("hours.updated"));
      onCancelEdit?.();
    } else {
      setSuccess(t("hours.saved"));
      setStartTime("");
      setEndTime("");
      setBreakMinutes(0);
      setNote("");
      setAutoSuggested(false);
      setDate(todayIso());
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Section title={editing ? t("hours.editTitle") : t("hours.addTitle")} hint={t("hours.addHint")}>
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.date")}</span>
            <input
              type="date"
              className="cb-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0 space-y-1.5">
              <span className="cb-label">{t("hours.start")}</span>
              <input
                type="time"
                className="cb-input"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setAutoSuggested(false);
                }}
                required
              />
            </label>
            <label className="block min-w-0 space-y-1.5">
              <span className="cb-label">{t("hours.end")}</span>
              <input
                type="time"
                className="cb-input"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setAutoSuggested(false);
                }}
                required
              />
            </label>
          </div>

          <div>
            <p className="cb-label mb-2">{t("hours.break")}</p>
            <div className="grid grid-cols-4 gap-2">
              {BREAK_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBreakMinutes(option)}
                  className={`min-h-12 text-sm font-semibold ${
                    breakMinutes === option ? "cb-choice cb-choice-on px-0 py-0 text-center" : "cb-choice cb-choice-off px-0 py-0 text-center"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {autoSuggested && breakMinutes === settings.autoBreakMinutes ? (
              <p className="mt-2 text-xs text-muted">
                {t("hours.autoBreakHint", {
                  m: settings.autoBreakMinutes,
                  h: settings.autoBreakAfterHours,
                })}
              </p>
            ) : null}
          </div>

          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.note")}</span>
            <textarea
              className="cb-input min-h-24 py-3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("hours.notePh")}
            />
          </label>
        </div>
      </Section>

      <Section title={t("hours.autoCalc")}>
        <div className="space-y-2.5 text-sm">
          <Row label={t("hours.totalDuration")} value={totalDuration != null ? formatHours(totalDuration) : "—"} />
          <Row label={t("hours.break")} value={`${breakMinutes} min`} />
          <Row label={t("hours.payable")} value={preview ? formatHours(preview.payableHours) : "—"} />
          <Row label={t("hours.rate")} value={preview ? `${formatMoney(preview.hourlyRate)}/h` : "—"} />
          <Row label={t("hours.gross")} value={preview ? formatMoney(preview.grossPay) : "—"} strong />
        </div>
      </Section>

      {errors.length > 0 ? (
        <p className="cb-alert mb-4">
          {errors.map((err) => (
            <span key={err} className="block">
              {err}
            </span>
          ))}
        </p>
      ) : null}

      {success ? <p className="cb-notice mb-4 text-profit">{success}</p> : null}

      <button className="cb-btn mb-3 min-h-12 w-full" type="submit">
        {editing ? t("hours.saveEdits") : t("save")}
      </button>
      {editing ? (
        <button className="cb-btn-ghost min-h-12 w-full" type="button" onClick={onCancelEdit}>
          {t("hours.cancel")}
        </button>
      ) : null}
    </form>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={strong ? "cb-num text-base font-semibold text-forest-mid" : "cb-num font-semibold"}>
        {value}
      </span>
    </div>
  );
}
