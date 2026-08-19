"use client";

import { AddShiftPanel } from "@/components/hours/AddShiftPanel";
import { HistoryPanel } from "@/components/hours/HistoryPanel";
import { HoursSettingsPanel } from "@/components/hours/HoursSettingsPanel";
import { ResumePanel } from "@/components/hours/ResumePanel";
import { useHoursData } from "@/components/hours/useHoursData";
import { usePrefs } from "@/components/PrefsProvider";
import { PageHeader } from "@/components/ui";
import type { HoursTab, Shift } from "@/lib/hours/types";
import { useState } from "react";

const TABS: { id: HoursTab; key: string }[] = [
  { id: "resume", key: "hours.tab.resume" },
  { id: "ajouter", key: "hours.tab.add" },
  { id: "historique", key: "hours.tab.history" },
  { id: "reglages", key: "hours.tab.settings" },
];

export function HoursView() {
  const { t } = usePrefs();
  const {
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
  } = useHoursData();

  const [tab, setTab] = useState<HoursTab>("resume");
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  function handleSaveShift(input: Parameters<typeof addShift>[0]) {
    if (editingShift) {
      updateShift(editingShift.id, input);
      setEditingShift(null);
      setTab("historique");
    } else {
      addShift(input);
    }
  }

  function handleTabChange(next: HoursTab) {
    if (next !== "ajouter") setEditingShift(null);
    setTab(next);
  }

  return (
    <div>
      <PageHeader
        kicker={t("nav.hours")}
        title={t("hours.title")}
        description={t("hours.desc")}
      />

      <div className="mb-5 grid w-full grid-cols-4 gap-0.5 rounded-[9px] border border-line bg-card p-0.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabChange(item.id)}
            className={`cb-seg-item min-h-10 px-1 text-[11px] sm:text-xs ${
              tab === item.id ? "cb-seg-item-on" : ""
            }`}
          >
            {t(item.key)}
          </button>
        ))}
      </div>

      {!ready ? (
        <p className="cb-notice">{t("hours.loading")}</p>
      ) : tab === "resume" ? (
        <ResumePanel data={data} />
      ) : tab === "ajouter" ? (
        <AddShiftPanel
          settings={data.settings}
          editing={editingShift}
          onSave={handleSaveShift}
          onCancelEdit={() => {
            setEditingShift(null);
            setTab("historique");
          }}
        />
      ) : tab === "historique" ? (
        <HistoryPanel
          data={data}
          onEditShift={(shift) => {
            setEditingShift(shift);
            setTab("ajouter");
          }}
          onDeleteShift={deleteShift}
          onAddPayStub={addPayStub}
          onUpdatePayStub={updatePayStub}
          onDeletePayStub={deletePayStub}
        />
      ) : (
        <HoursSettingsPanel
          data={data}
          onUpdateSettings={updateSettings}
          onAddRateIncrease={addRateIncrease}
          onRemoveRateEntry={removeRateEntry}
          onExport={exportJson}
          onImport={importJson}
          onReset={resetApp}
        />
      )}
    </div>
  );
}
