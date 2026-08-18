"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { usePrefs } from "@/components/PrefsProvider";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);
  const { t } = usePrefs();

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-[var(--ink)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_280px_at_80%_-10%,rgba(95,245,208,0.22),transparent)]" />
      <section className="relative w-full max-w-[400px] rounded-2xl border border-white/10 bg-[#161d27] p-8 text-[#e8eef6]">
        <div className="mb-7 flex items-center gap-3">
          <span className="cb-mark h-10 w-10 text-[13px]">CB</span>
          <div>
            <p className="cb-kicker">{t("desk.kicker")}</p>
            <h1 className="text-xl font-semibold tracking-tight">Cleanbuddy</h1>
          </div>
        </div>
        <p className="text-sm leading-6 text-white/55">{t("login.lead")}</p>
        <form action={action} className="mt-7 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-white/50">{t("login.password")}</span>
            <input
              className="cb-input border-white/10 bg-[#10161f] text-[#e8eef6]"
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
