"use client";

import { calculateProductPricing } from "@/lib/calculations";
import type { ProductCalculation } from "@/lib/types";
import Link from "next/link";

export function ProductCatalog({ products }: { products: ProductCalculation[] }) {
  if (products.length === 0) return null;
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2">
      {products.map((product) => {
        const pricing = calculateProductPricing(
          {
            supplierCostAmount: product.supplier_cost_amount,
            supplierCostCurrency: product.supplier_cost_currency,
            shippingCostAmount: product.shipping_cost_amount,
            shippingCostCurrency: product.shipping_cost_currency,
            dropiCommissionPct: product.dropi_commission_pct,
            salePriceAmount: product.sale_price_amount,
            salePriceCurrency: product.sale_price_currency,
            adsCostPerOrderAmount: product.ads_cost_per_order_amount,
            adsCostPerOrderCurrency: product.ads_cost_per_order_currency,
          },
          product.exchange_rate_snapshot,
        );
        return (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="cb-card block transition hover:-translate-y-0.5 hover:border-gold"
          >
            <p className="font-semibold">{product.product_name}</p>
            <p className="text-xs text-muted">
              {product.ops.sales_model === "prepaid" ? "Prepaid" : "COD"} · {product.ops.fulfillment} · {product.ops.decision}
            </p>
            <p className={`mt-2 text-sm font-bold ${pricing.isHealthy ? "text-profit" : "text-loss"}`}>
              هامش {pricing.marginPercent.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-muted">
              {pricing.isHealthy ? "صحي ≥ 20%" : "تحت عتبة 20%"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
