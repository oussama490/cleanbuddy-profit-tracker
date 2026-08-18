"use server";

import { AUTH_COOKIE, createAuthToken } from "@/lib/auth";
import { appPassword } from "@/lib/env";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const password = String(formData.get("password") ?? "");
  const expected = appPassword();

  if (!expected) {
    return { error: "متغير APP_PASSWORD غير مضبوط." };
  }

  if (password !== expected) {
    return { error: "كلمة المرور غير صحيحة." };
  }

  const token = await createAuthToken(expected);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect("/login");
}
