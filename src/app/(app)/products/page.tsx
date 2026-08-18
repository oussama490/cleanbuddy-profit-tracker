import { ProductCalculator } from "@/components/ProductCalculator";
import { I18nHeader } from "@/components/I18nHeader";
import { ProductCatalog } from "@/components/views/ProductCatalog";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const data = await loadCore();
  return (
    <div>
      <I18nHeader kicker="product.kicker" title="product.title" description="product.desc" />
      <ProductCatalog products={data.products} />
      <ProductCalculator products={data.products} entries={data.entries} />
    </div>
  );
}
