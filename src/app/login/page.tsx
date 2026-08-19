"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { BrandMark } from "@/components/BrandMark";
import { usePrefs } from "@/components/PrefsProvider";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);
  const { t } = usePrefs();

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-[var(--sidebar)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_280px_at_80%_-10%,color-mix(in_srgb,var(--led)_22%,transparent),transparent)]" />
      <section className="relative w-full max-w-[400px] border border-[var(--sidebar-line)] bg-[var(--card)] p-8 text-foreground" style={{ borderRadius: "var(--radius)" }}>
        <div className="mb-7 flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <div>
            <p className="cb-kicker">{t("desk.kicker")}</p>
            <h1 className="text-xl font-bold tracking-tight">Cleanbuddy</h1>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted">{t("login.lead")}</p>
        <form action={action} className="mt-7 space-y-4">
          <label className="block space-y-1.5">
            <span className="cb-label">{t("login.password")}</span>
            <input
              className="cb-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {state?.error ? (
            <p className="text-sm text-loss">
              {state.error.includes("APP_PASSWORD") || state.error.includes("غير مضبوط")
                ? t("login.noPassword")
                : t("login.wrong")}
            </p>
          ) : null}
          <button className="cb-btn-led w-full" disabled={pending} type="submit">
            {pending ? t("login.pending") : t("login.submit")}
          </button>
        </form>
      </section>
    </main>
  );
}
