"use server";

import { isCurrency, isValidSnapshot } from "@/lib/currency";
import { getSupabase, humanizeSupabaseError, isSupabaseConfigured } from "@/lib/supabase";
import type {
  ActionResult,
  Currency,
  ExchangeRateSnapshot,
  ProductCalculation,
  ProductCalculationInput,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseProduct(row: Record<string, unknown>): ProductCalculation {
  return {
    id: String(row.id),
    product_name: String(row.product_name),
    supplier_cost_amount: toNumber(row.supplier_cost_amount),
    supplier_cost_currency: isCurrency(String(row.supplier_cost_currency))
      ? (row.supplier_cost_currency as Currency)
      : "MXN",
    shipping_cost_amount: toNumber(row.shipping_cost_amount),
    shipping_cost_currency: isCurrency(String(row.shipping_cost_currency))
      ? (row.shipping_cost_currency as Currency)
      : "MXN",
    dropi_commission_pct: toNumber(row.dropi_commission_pct),
    sale_price_amount: toNumber(row.sale_price_amount),
    sale_price_currency: isCurrency(String(row.sale_price_currency))
      ? (row.sale_price_currency as Currency)
      : "MXN",
    ads_cost_per_order_amount: toNumber(row.ads_cost_per_order_amount),
    ads_cost_per_order_currency: isCurrency(
      String(row.ads_cost_per_order_currency),
    )
      ? (row.ads_cost_per_order_currency as Currency)
      : "USD",
    exchange_rate_snapshot: row.exchange_rate_snapshot as ExchangeRateSnapshot,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listProducts(): Promise<ProductCalculation[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("product_calculations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) =>
    parseProduct(row as Record<string, unknown>),
  );
}

export async function saveProduct(
  input: ProductCalculationInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }
  if (!input.product_name.trim()) {
    return { ok: false, error: "اسم المنتج مطلوب." };
  }
  if (!isValidSnapshot(input.exchange_rate_snapshot)) {
    return { ok: false, error: "Taux de change manquant." };
  }

  const payload = {
    product_name: input.product_name.trim(),
    supplier_cost_amount: input.supplier_cost_amount,
    supplier_cost_currency: input.supplier_cost_currency,
    shipping_cost_amount: input.shipping_cost_amount,
    shipping_cost_currency: input.shipping_cost_currency,
    dropi_commission_pct: input.dropi_commission_pct,
    sale_price_amount: input.sale_price_amount,
    sale_price_currency: input.sale_price_currency,
    ads_cost_per_order_amount: input.ads_cost_per_order_amount,
    ads_cost_per_order_currency: input.ads_cost_per_order_currency,
    exchange_rate_snapshot: input.exchange_rate_snapshot,
  };

  const supabase = getSupabase();

  if (input.id) {
    const { error } = await supabase
      .from("product_calculations")
      .update(payload)
      .eq("id", input.id);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  } else {
    const { error } = await supabase.from("product_calculations").insert(payload);
    if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  }

  revalidatePath("/");
  return { ok: true, message: "تم حفظ تقييم المنتج." };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase n'est pas configuré." };
  }

  const { error } = await getSupabase()
    .from("product_calculations")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: humanizeSupabaseError(error.message) };
  revalidatePath("/");
  return { ok: true, message: "تم حذف المنتج." };
}
