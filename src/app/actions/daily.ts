"use server";

import { parseDailyOps } from "@/lib/commerce";
import { isCurrency, isValidSnapshot } from "@/lib/currency";
import { getSupabase, humanizeSupabaseError, isSupabaseConfigured } from "@/lib/supabase";
import type {
  ActionResult,
  Currency,
  DailyEntry,
  DailyEntryInput,
  ExchangeRateSnapshot,
} from "@/lib/types";
import { revalidateApp } from "@/lib/revalidate";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseEntry(row: Record<string, unknown>): DailyEntry {
  return {
    id: String(row.id),
    entry_date: String(row.entry_date),
    new_orders: toNumber(row.new_orders),
    confirmed: toNumber(row.confirmed),
    delivered: toNumber(row.delivered),
    returned: toNumber(row.returned),
    revenue_amount: toNumber(row.revenue_amount),
    revenue_currency: isCurrency(String(row.revenue_currency))
      ? (row.revenue_currency as Currency)
      : "MXN",
    ads_cost_amount: toNumber(row.ads_cost_amount),
    ads_cost_currency: isCurrency(String(row.ads_cost_currency))
      ? (row.ads_cost_currency as Currency)
      : "USD",
    exchange_rate_snapshot: row.exchange_rate_snapshot as ExchangeRateSnapshot,
    ops: parseDailyOps(row.ops),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listDailyEntries(): Promise<DailyEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("daily_entries")
    .select("*")
    .order("entry_date", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => parseEntry(row as Record<string, unknown>));
}

export async function tablesReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await getSupabase()
    .from("daily_entries")
    .select("id")
    .limit(1);
  return !error;
}

async function persistDaily(
  payload: Record<string, unknown>,
  id?: string,
): Promise<ActionResult> {
  const supabase = getSupabase();
  const withOps = { ...payload };
  if (id) {
    const first = await supabase.from("daily_entries").update(withOps).eq("id", id);
    if (!first.error) {
      revalidateApp();
      return { ok: true, message: "تم حفظ الإدخال اليومي." };
    }
    if (!String(first.error.message).includes("ops")) {
      return { ok: false, error: humanizeSupabaseError(first.error.message) };
    }
    const { ops: _ops, ...withoutOps } = withOps;
    const retry = await supabase.from("daily_entries").update(withoutOps).eq("id", id);
    if (retry.error) return { ok: false, error: humanizeSupabaseError(retry.error.message) };
  } else {
    const first = await supabase.from("daily_entries").upsert(withOps, { onConflict: "entry_date" });
    if (!first.error) {
      revalidateApp();
      return { ok: true, message: "تم حفظ الإدخال اليومي." };
    }
    if (!String(first.error.message).includes("ops")) {
      return { ok: false, error: humanizeSupabaseError(first.error.message) };
    }
    const { ops: _ops, ...withoutOps } = withOps;
    const retry = await supabase
      .from("daily_entries")
      .upsert(withoutOps, { onConflict: "entry_date" });
    if (retry.error) return { ok: false, error: humanizeSupabaseError(retry.error.message) };
  }
  revalidateApp();
  return { ok: true, message: "تم حفظ الإدخال اليومي." };
}

export async function saveDailyEntry(
  input: DailyEntryInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }
  if (!isValidSnapshot(input.exchange_rate_snapshot)) {
    return { ok: false, error: "Taux de change manquant." };
  }

  return persistDaily(
    {
      entry_date: input.entry_date,
      new_orders: input.new_orders,
      confirmed: input.confirmed,
      delivered: input.delivered,
      returned: input.returned,
      revenue_amount: input.revenue_amount,
      revenue_currency: input.revenue_currency,
      ads_cost_amount: input.ads_cost_amount,
      ads_cost_currency: input.ads_cost_currency,
      exchange_rate_snapshot: input.exchange_rate_snapshot,
      ops: parseDailyOps(input.ops),
    },
    input.id,
  );
}

export async function deleteDailyEntry(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }

  const { error } = await getSupabase()
    .from("daily_entries")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  revalidateApp();
  return { ok: true, message: "تم حذف الإدخال." };
}
