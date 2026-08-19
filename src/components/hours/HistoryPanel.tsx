"use client";

import { HoursConfirm } from "@/components/hours/HoursConfirm";
import { usePrefs } from "@/components/PrefsProvider";
import { Section } from "@/components/ui";
import { computeDifference, sumPayableHours } from "@/lib/hours/calculations";
import {
  endOfMonth,
  endOfWeek,
  formatShortDate,
  isDateInRange,
  startOfMonth,
  startOfWeek,
  todayIso,
} from "@/lib/hours/dates";
import { formatHours, formatMoney, pluralHours } from "@/lib/hours/format";
import { computeEstimatedReserve } from "@/lib/hours/importData";
import {
  filterShiftsByPeriod,
  getCurrentPayPeriod,
  listRecentPeriods,
} from "@/lib/hours/payPeriods";
import type {
  HistoryFilter,
  HoursData,
  HoursSettings,
  PayStub,
  Shift,
} from "@/lib/hours/types";
import { useMemo, useState, type FormEvent } from "react";

export function HistoryPanel({
  data,
  onEditShift,
  onDeleteShift,
  onAddPayStub,
  onUpdatePayStub,
  onDeletePayStub,
}: {
  data: HoursData;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
  onAddPayStub: (stub: Omit<PayStub, "id" | "createdAt" | "updatedAt">) => void;
  onUpdatePayStub: (
    id: string,
    stub: Omit<PayStub, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onDeletePayStub: (id: string) => void;
}) {
  const { t, lang } = usePrefs();
  const locale = lang === "ar" ? "ar" : "fr-CA";
  const [filter, setFilter] = useState<HistoryFilter>("periode");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPayForm, setShowPayForm] = useState(false);
  const [editingStub, setEditingStub] = useState<PayStub | null>(null);
  const [deleteStubId, setDeleteStubId] = useState<string | null>(null);

  const today = todayIso();
  const period = getCurrentPayPeriod(data.settings, today);

  const filteredShifts = useMemo(() => {
    let start = "";
    let end = "";
    if (filter === "semaine") {
      start = startOfWeek(today);
      end = endOfWeek(today);
    } else if (filter === "mois") {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else if (period) {
      start = period.start;
      end = period.end;
    } else {
      return [...data.shifts].sort(
        (a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
      );
    }
    return data.shifts
      .filter((s) => isDateInRange(s.date, start, end))
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [data.shifts, filter, period, today]);

  const grouped = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const shift of filteredShifts) {
      const list = map.get(shift.date) ?? [];
      list.push(shift);
      map.set(shift.date, list);
    }
    return [...map.entries()];
  }, [filteredShifts]);

  const periodShifts = period ? filterShiftsByPeriod(data.shifts, period) : [];
  const recorded = sumPayableHours(periodShifts);
  const matchingStub = period
    ? data.payStubs.find((s) => s.periodStart === period.start && s.periodEnd === period.end)
    : undefined;
  const difference = matchingStub
    ? computeDifference(recorded, matchingStub.manualAdjustmentHours, matchingStub.regularHoursPaid)
    : null;
  const globalReserve = computeEstimatedReserve(data.shifts, data.payStubs);

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {(
          [
            ["semaine", "hours.filterWeek"],
            ["periode", "hours.filterPeriod"],
            ["mois", "hours.filterMonth"],
          ] as const
        ).map(([id, key]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={filter === id ? "cb-choice cb-choice-on min-h-11 px-2 py-2 text-center text-sm" : "cb-choice cb-choice-off min-h-11 px-2 py-2 text-center text-sm"}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {period ? (
        <Section title={t("hours.currentPeriod")}>
          <div className="space-y-2 text-sm">
            <p>
              {formatShortDate(period.start, locale)} → {formatShortDate(period.end, locale)}
            </p>
            <p>
              {t("hours.recordedHours")}: {formatHours(recorded)}
            </p>
            <p>
              {t("hours.paidOfficial")}:{" "}
              {matchingStub ? formatHours(matchingStub.regularHoursPaid) : "—"}
            </p>
            <p className="font-semibold text-forest-mid">
              {t("hours.periodDiff")}:{" "}
              {difference != null ? pluralHours(difference, t("hours.hour"), t("hours.hours")) : "—"}
            </p>
            <p className="text-xs text-muted">
              {t("hours.globalReserve")}: {globalReserve != null ? formatHours(globalReserve) : "—"}
            </p>
          </div>
        </Section>
      ) : null}

      <Section title={t("hours.payStubs")}>
        <div className="space-y-3">
          {data.payStubs.length === 0 ? (
            <p className="text-sm text-muted">{t("hours.noStubs")}</p>
          ) : (
            [...data.payStubs]
              .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
              .map((stub) => {
                const shifts = data.shifts.filter((s) =>
                  isDateInRange(s.date, stub.periodStart, stub.periodEnd),
                );
                const hours = sumPayableHours(shifts);
                const diff = computeDifference(
                  hours,
                  stub.manualAdjustmentHours,
                  stub.regularHoursPaid,
                );
                return (
                  <article key={stub.id} className="rounded-[10px] bg-background px-3 py-3">
                    <p className="font-semibold">
                      {formatShortDate(stub.periodStart, locale)} →{" "}
                      {formatShortDate(stub.periodEnd, locale)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t("hours.paidOn")} {formatShortDate(stub.paymentDate, locale)} ·{" "}
                      {formatMoney(stub.netReceived)}
                    </p>
                    <p className="text-xs text-muted">
                      {t("hours.difference")}: {pluralHours(diff, t("hours.hour"), t("hours.hours"))}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="cb-btn-ghost min-h-11 text-sm"
                        onClick={() => {
                          setEditingStub(stub);
                          setShowPayForm(true);
                        }}
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        className="cb-btn-ghost min-h-11 text-sm text-loss"
                        onClick={() => setDeleteStubId(stub.id)}
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </article>
                );
              })
          )}
          <button
            type="button"
            className="cb-btn-ghost min-h-11 w-full"
            onClick={() => {
              setEditingStub(null);
              setShowPayForm(true);
            }}
          >
            {t("hours.addStub")}
          </button>
        </div>
      </Section>

      {showPayForm ? (
        <PayStubForm
          settings={data.settings}
          initial={editingStub}
          onCancel={() => {
            setShowPayForm(false);
            setEditingStub(null);
          }}
          onSave={(stub) => {
            if (editingStub) onUpdatePayStub(editingStub.id, stub);
            else onAddPayStub(stub);
            setShowPayForm(false);
            setEditingStub(null);
          }}
        />
      ) : null}

      <Section title={t("hours.shifts")}>
        {grouped.length === 0 ? (
          <p className="text-sm text-muted">{t("hours.noShifts")}</p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, shifts]) => (
              <div key={date}>
                <h3 className="mb-2 text-sm font-semibold">{formatShortDate(date, locale)}</h3>
                <div className="space-y-3">
                  {shifts.map((shift) => (
                    <article key={shift.id} className="rounded-[10px] bg-background px-3 py-3">
                      <p className="font-semibold">
                        {shift.startTime} → {shift.endTime}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {t("hours.break")} {shift.breakMinutes} min · {formatHours(shift.payableHours)} ·{" "}
                        {formatMoney(shift.grossPay)}
                      </p>
                      {shift.note ? <p className="mt-1 text-xs text-muted">{shift.note}</p> : null}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="cb-btn-ghost min-h-11 text-sm"
                          onClick={() => onEditShift(shift)}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          type="button"
                          className="cb-btn-ghost min-h-11 text-sm text-loss"
                          onClick={() => setDeleteId(shift.id)}
                        >
                          {t("delete")}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <HoursConfirm
        open={deleteId != null}
        title={t("hours.deleteShift")}
        message={t("hours.deleteForever")}
        confirmLabel={t("delete")}
        cancelLabel={t("hours.cancel")}
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDeleteShift(deleteId);
          setDeleteId(null);
        }}
      />

      <HoursConfirm
        open={deleteStubId != null}
        title={t("hours.deleteStub")}
        message={t("hours.deleteForever")}
        confirmLabel={t("delete")}
        cancelLabel={t("hours.cancel")}
        danger
        onCancel={() => setDeleteStubId(null)}
        onConfirm={() => {
          if (deleteStubId) onDeletePayStub(deleteStubId);
          setDeleteStubId(null);
        }}
      />
    </div>
  );
}

function PayStubForm({
  settings,
  initial,
  onSave,
  onCancel,
}: {
  settings: HoursSettings;
  initial: PayStub | null;
  onSave: (stub: Omit<PayStub, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const { t, lang } = usePrefs();
  const locale = lang === "ar" ? "ar" : "fr-CA";
  const today = todayIso();
  const current = getCurrentPayPeriod(settings, today);
  const periods = listRecentPeriods(settings, today, 10);

  const [periodStart, setPeriodStart] = useState(initial?.periodStart ?? current?.start ?? "");
  const [periodEnd, setPeriodEnd] = useState(initial?.periodEnd ?? current?.end ?? "");
  const [paymentDate, setPaymentDate] = useState(initial?.paymentDate ?? current?.payDate ?? today);
  const [regularHoursPaid, setRegularHoursPaid] = useState(String(initial?.regularHoursPaid ?? ""));
  const [holidayHours, setHolidayHours] = useState(String(initial?.holidayHours ?? "0"));
  const [officialGross, setOfficialGross] = useState(String(initial?.officialGross ?? ""));
  const [deductions, setDeductions] = useState(String(initial?.deductions ?? ""));
  const [netReceived, setNetReceived] = useState(String(initial?.netReceived ?? ""));
  const [manualAdjustmentHours, setManualAdjustmentHours] = useState(
    String(initial?.manualAdjustmentHours ?? "0"),
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");

  function applyPeriod(start: string) {
    const match = periods.find((p) => p.start === start);
    if (match) {
      setPeriodStart(match.start);
      setPeriodEnd(match.end);
      setPaymentDate(match.payDate);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const regular = Number(regularHoursPaid);
    const holiday = Number(holidayHours);
    const gross = Number(officialGross);
    const ded = Number(deductions);
    const net = Number(netReceived);
    const adj = Number(manualAdjustmentHours);

    if (!periodStart || !periodEnd || !paymentDate) {
      setError(t("hours.fillDates"));
      return;
    }
    if ([regular, holiday, gross, ded, net, adj].some((n) => Number.isNaN(n))) {
      setError(t("hours.checkAmounts"));
      return;
    }
    if ([regular, holiday, gross, ded, net].some((n) => n < 0)) {
      setError(t("hours.noNegative"));
      return;
    }

    onSave({
      periodStart,
      periodEnd,
      paymentDate,
      regularHoursPaid: Math.round(regular * 100) / 100,
      holidayHours: Math.round(holiday * 100) / 100,
      officialGross: Math.round(gross * 100) / 100,
      deductions: Math.round(ded * 100) / 100,
      netReceived: Math.round(net * 100) / 100,
      manualAdjustmentHours: Math.round(adj * 100) / 100,
      note: note.trim(),
    });
  }

  return (
    <Section title={initial ? t("hours.editStub") : t("hours.newStub")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {periods.length > 0 ? (
          <label className="block space-y-1.5">
            <span className="cb-label">{t("hours.quickPeriod")}</span>
            <select
              className="cb-input"
              value={periodStart}
              onChange={(e) => applyPeriod(e.target.value)}
            >
              <option value="">{t("hours.choose")}</option>
              {periods.map((p) => (
                <option key={p.start} value={p.start}>
                  {formatShortDate(p.start, locale)} → {formatShortDate(p.end, locale)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <FieldDate label={t("hours.periodStart")} value={periodStart} onChange={setPeriodStart} />
        <FieldDate label={t("hours.periodEnd")} value={periodEnd} onChange={setPeriodEnd} />
        <FieldDate label={t("hours.payDate")} value={paymentDate} onChange={setPaymentDate} />
        <FieldNum label={t("hours.regularPaid")} value={regularHoursPaid} onChange={setRegularHoursPaid} />
        <FieldNum label={t("hours.holiday")} value={holidayHours} onChange={setHolidayHours} />
        <FieldNum label={t("hours.officialGross")} value={officialGross} onChange={setOfficialGross} />
        <FieldNum label={t("hours.deductions")} value={deductions} onChange={setDeductions} />
        <FieldNum label={t("hours.net")} value={netReceived} onChange={setNetReceived} />
        <label className="block space-y-1.5">
          <span className="cb-label">{t("hours.manualHours")}</span>
          <input
            type="number"
            step="0.01"
            className="cb-input"
            value={manualAdjustmentHours}
            onChange={(e) => setManualAdjustmentHours(e.target.value)}
          />
          <span className="text-xs text-muted">{t("hours.manualHint")}</span>
        </label>
        <label className="block space-y-1.5">
          <span className="cb-label">{t("hours.note")}</span>
          <textarea
            className="cb-input min-h-20 py-3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {error ? <p className="cb-alert">{error}</p> : null}

        <button className="cb-btn min-h-12 w-full" type="submit">
          {t("hours.saveStub")}
        </button>
        <button className="cb-btn-ghost min-h-12 w-full" type="button" onClick={onCancel}>
          {t("hours.cancel")}
        </button>
      </form>
    </Section>
  );
}

function FieldDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="cb-label">{label}</span>
      <input type="date" className="cb-input" value={value} onChange={(e) => onChange(e.target.value)} required />
    </label>
  );
}

function FieldNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="cb-label">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        className="cb-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </label>
  );
}
