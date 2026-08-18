"use server";

import { revalidateApp } from "@/lib/revalidate";
import { isCurrency } from "@/lib/currency";
import { getSupabase, humanizeSupabaseError, isSupabaseConfigured } from "@/lib/supabase";
import type {
  ActionResult,
  Currency,
  WorkspaceKind,
  WorkspaceRecord,
  WorkspaceRecordInput,
} from "@/lib/types";
import { WORKSPACE_KINDS } from "@/lib/types";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isKind(value: string): value is WorkspaceKind {
  return (WORKSPACE_KINDS as readonly string[]).includes(value);
}

function parseRecord(row: Record<string, unknown>): WorkspaceRecord {
  const kind = String(row.kind);
  return {
    id: String(row.id),
    kind: isKind(kind) ? kind : "journal",
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    amount: toNumber(row.amount),
    currency: isCurrency(String(row.currency)) ? (row.currency as Currency) : "CAD",
    entry_date: row.entry_date ? String(row.entry_date) : null,
    meta:
      row.meta && typeof row.meta === "object"
        ? (row.meta as Record<string, unknown>)
        : {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function extrasReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await getSupabase()
    .from("workspace_records")
    .select("id")
    .limit(1);
  return !error;
}

export async function listWorkspaceRecords(
  kind?: WorkspaceKind,
): Promise<WorkspaceRecord[]> {
  if (!isSupabaseConfigured()) return [];
  let query = getSupabase()
    .from("workspace_records")
    .select("*")
    .order("created_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => parseRecord(row as Record<string, unknown>));
}

export async function saveWorkspaceRecord(
  input: WorkspaceRecordInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }
  if (!input.title.trim() && input.kind !== "cash" && input.kind !== "checklist") {
    return { ok: false, error: "العنوان مطلوب." };
  }

  const payload = {
    kind: input.kind,
    title: input.title.trim(),
    body: input.body?.trim() ?? "",
    amount: input.amount ?? 0,
    currency: input.currency ?? "CAD",
    entry_date: input.entry_date || null,
    meta: input.meta ?? {},
  };

  const supabase = getSupabase();
  if (input.id) {
    const { error } = await supabase
      .from("workspace_records")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  } else {
    const { error } = await supabase.from("workspace_records").insert(payload);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  }

  revalidateApp();
  return { ok: true, message: "تم الحفظ." };
}

export async function deleteWorkspaceRecord(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }
  const { error } = await getSupabase()
    .from("workspace_records")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  revalidateApp();
  return { ok: true, message: "تم الحذف." };
}
