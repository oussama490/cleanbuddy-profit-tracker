"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-10">
      <section className="cb-card space-y-5 p-6">
        <div>
          <p className="text-sm font-medium text-teal-800">Cleanbuddy</p>
          <h1 className="text-2xl font-bold">تتبع أرباح كلينبادي</h1>
          <p className="mt-1 text-sm text-stone-500">أدخل كلمة المرور للمتابعة.</p>
        </div>
        <form action={action} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">كلمة المرور</span>
            <input
              className="cb-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {state?.error ? (
            <p className="text-sm text-red-700">{state.error}</p>
          ) : null}
          <button className="cb-btn w-full" disabled={pending} type="submit">
            {pending ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </section>
    </main>
  );
}
