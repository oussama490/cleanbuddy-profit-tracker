"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-forest" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(176,137,77,0.28),transparent_42%),radial-gradient(circle_at_90%_80%,rgba(255,252,248,0.08),transparent_40%)]" />
      <section className="relative w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[#fffcf8] p-7 shadow-[0_40px_80px_-32px_rgba(0,0,0,0.55)]">
        <p className="cb-kicker">PRIVATE DESK</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Cleanbuddy</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          مساحة شخصية لتتبع الربح. أدخل كلمة المرور للمتابعة.
        </p>
        <form action={action} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">كلمة المرور</span>
            <input
              className="cb-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {state?.error ? (
            <p className="text-sm text-loss">{state.error}</p>
          ) : null}
          <button className="cb-btn w-full" disabled={pending} type="submit">
            {pending ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </section>
    </main>
  );
}
