import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

export { isSupabaseConfigured };

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = supabaseUrl();
  const key = supabaseKey();

  if (!url || !key) {
    throw new Error("Variables Supabase manquantes.");
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function humanizeSupabaseError(message: string): string {
  if (message.includes("schema cache") || message.includes("does not exist")) {
    return "الجداول غير موجودة بعد. نفّذ supabase/schema.sql في SQL Editor.";
  }
  return message;
}
