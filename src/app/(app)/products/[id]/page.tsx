import { ProductCalculator } from "@/components/ProductCalculator";
import { ProductDetailHeader } from "@/components/I18nHeader";
import { getProduct, listProducts } from "@/app/actions/products";
import { listDailyEntries } from "@/app/actions/daily";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, products, entries] = await Promise.all([
    getProduct(id),
    listProducts(),
    listDailyEntries(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <ProductDetailHeader name={product.product_name} />
      <ProductCalculator
        products={products}
        entries={entries}
        initialProduct={product}
      />
    </div>
  );
}
