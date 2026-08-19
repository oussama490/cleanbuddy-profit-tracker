"use client";

export function HoursConfirm({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hours-confirm-title"
        className="w-full max-w-md border border-line bg-card p-5 shadow-[var(--lift)]"
        style={{ borderRadius: "calc(var(--radius) + 4px)" }}
      >
        <h2 id="hours-confirm-title" className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? "cb-btn min-h-12 w-full bg-loss" : "cb-btn min-h-12 w-full"}
          >
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel} className="cb-btn-ghost min-h-12 w-full">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
