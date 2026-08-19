"use server";

import { revalidateApp } from "@/lib/revalidate";
import { isCurrency } from "@/lib/currency";
import { getSupabase, humanizeSupabaseError, isSupabaseConfigured } from "@/lib/supabase";
import { isTeerLevel } from "@/lib/life";
import type {
  ActionResult,
  BudgetCategory,
  BudgetEntry,
  BudgetEntryInput,
  Currency,
  EducationLevel,
  IncomeSource,
  Job,
  JobInput,
  JobStatus,
  PrCriteria,
  PrCriteriaInput,
  TeerLevel,
} from "@/lib/types";
import {
  BUDGET_CATEGORIES,
  EDUCATION_LEVELS,
  INCOME_SOURCES,
  JOB_STATUSES,
} from "@/lib/types";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isJobStatus(value: string): value is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value);
}

function isEducation(value: string): value is EducationLevel {
  return (EDUCATION_LEVELS as readonly string[]).includes(value);
}

function isCategory(value: string): value is BudgetCategory {
  return (BUDGET_CATEGORIES as readonly string[]).includes(value);
}

function isIncomeSource(value: string): value is IncomeSource {
  return (INCOME_SOURCES as readonly string[]).includes(value);
}

function parseJob(row: Record<string, unknown>): Job {
  const teer = String(row.teer ?? "3");
  const status = String(row.status ?? "active");
  return {
    id: String(row.id),
    job_title: String(row.job_title ?? ""),
    employer: String(row.employer ?? ""),
    start_date: String(row.start_date ?? ""),
    end_date: row.end_date ? String(row.end_date) : null,
    noc_code: String(row.noc_code ?? ""),
    teer: isTeerLevel(teer) ? teer : "3",
    hours_per_week: toNumber(row.hours_per_week),
    hourly_wage: toNumber(row.hourly_wage),
    annual_salary: toNumber(row.annual_salary),
    wage_currency: isCurrency(String(row.wage_currency))
      ? (row.wage_currency as Currency)
      : "CAD",
    status: isJobStatus(status) ? status : "active",
    notes: String(row.notes ?? ""),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function parseCriteria(row: Record<string, unknown>): PrCriteria {
  const education = String(row.education_level ?? "bachelor");
  return {
    id: String(row.id),
    age: Math.round(toNumber(row.age)),
    education_level: isEducation(education) ? education : "bachelor",
    french_clb: Math.round(toNumber(row.french_clb)),
    english_clb: Math.round(toNumber(row.english_clb)),
    experience_months_override:
      row.experience_months_override == null
        ? null
        : Math.round(toNumber(row.experience_months_override)),
    current_status: String(row.current_status ?? "pgwp"),
    notes: String(row.notes ?? ""),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function parseBudget(row: Record<string, unknown>): BudgetEntry {
  const category = String(row.category ?? "other");
  const source = String(row.income_source ?? "other");
  return {
    id: String(row.id),
    entry_date: String(row.entry_date ?? ""),
    category: isCategory(category) ? category : "other",
    amount: toNumber(row.amount),
    currency: isCurrency(String(row.currency)) ? (row.currency as Currency) : "CAD",
    income_source: isIncomeSource(source) ? source : "other",
    job_id: row.job_id ? String(row.job_id) : null,
    notes: String(row.notes ?? ""),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function lifeTablesReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await getSupabase().from("jobs").select("id").limit(1);
  return !error;
}

export async function listJobs(): Promise<Job[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("jobs")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => parseJob(row as Record<string, unknown>));
}

export async function saveJob(input: JobInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }
  if (!input.job_title.trim()) {
    return { ok: false, error: "Le nom de l'emploi est obligatoire." };
  }
  if (!input.start_date) {
    return { ok: false, error: "La date de début est obligatoire." };
  }

  const payload = {
    job_title: input.job_title.trim(),
    employer: input.employer?.trim() ?? "",
    start_date: input.start_date,
    end_date: input.end_date || null,
    noc_code: input.noc_code?.trim() ?? "",
    teer: (input.teer ?? "3") as TeerLevel,
    hours_per_week: input.hours_per_week ?? 0,
    hourly_wage: input.hourly_wage ?? 0,
    annual_salary: input.annual_salary ?? 0,
    wage_currency: input.wage_currency ?? "CAD",
    status: input.status ?? "active",
    notes: input.notes?.trim() ?? "",
  };

  const supabase = getSupabase();
  if (input.id) {
    const { error } = await supabase
      .from("jobs")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  } else {
    const { error } = await supabase.from("jobs").insert(payload);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  }

  revalidateApp();
  return { ok: true };
}

export async function deleteJob(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }
  const { error } = await getSupabase().from("jobs").delete().eq("id", id);
  if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  revalidateApp();
  return { ok: true };
}

export async function getPrCriteria(): Promise<PrCriteria | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase()
    .from("pr_criteria")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  if (error || !data?.[0]) return null;
  return parseCriteria(data[0] as Record<string, unknown>);
}

export async function savePrCriteria(input: PrCriteriaInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }

  const payload = {
    age: Math.max(0, Math.round(input.age)),
    education_level: input.education_level,
    french_clb: Math.min(12, Math.max(0, Math.round(input.french_clb))),
    english_clb: Math.min(12, Math.max(0, Math.round(input.english_clb))),
    experience_months_override:
      input.experience_months_override == null || input.experience_months_override === undefined
        ? null
        : Math.max(0, Math.round(input.experience_months_override)),
    current_status: input.current_status?.trim() || "pgwp",
    notes: input.notes?.trim() ?? "",
  };

  const supabase = getSupabase();
  if (input.id) {
    const { error } = await supabase
      .from("pr_criteria")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  } else {
    const { error } = await supabase.from("pr_criteria").insert(payload);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  }

  revalidateApp();
  return { ok: true };
}

export async function listBudgetEntries(): Promise<BudgetEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("personal_budget")
    .select("*")
    .order("entry_date", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => parseBudget(row as Record<string, unknown>));
}

export async function saveBudgetEntry(input: BudgetEntryInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }
  if (!input.entry_date) {
    return { ok: false, error: "La date est obligatoire." };
  }
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: "Le montant doit être supérieur à 0." };
  }

  const payload = {
    entry_date: input.entry_date,
    category: input.category,
    amount: input.amount,
    currency: input.currency ?? "CAD",
    income_source: input.income_source ?? "other",
    job_id: input.income_source === "job" ? input.job_id || null : null,
    notes: input.notes?.trim() ?? "",
  };

  const supabase = getSupabase();
  if (input.id) {
    const { error } = await supabase
      .from("personal_budget")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  } else {
    const { error } = await supabase.from("personal_budget").insert(payload);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  }

  revalidateApp();
  return { ok: true };
}

export async function deleteBudgetEntry(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }
  const { error } = await getSupabase().from("personal_budget").delete().eq("id", id);
  if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  revalidateApp();
  return { ok: true };
}
