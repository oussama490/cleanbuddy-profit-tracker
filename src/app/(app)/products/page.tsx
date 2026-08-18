import { ProductCalculator } from "@/components/ProductCalculator";
import { PageHeader } from "@/components/ui";
import { ProductCatalog } from "@/components/views/ProductCatalog";
import { loadCore } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const data = await loadCore();
  return (
    <div>
      <PageHeader
        kicker="المنتجات"
        title="التسعير والكتالوج"
        description="احسب الهامش وأقصى إعلان، ثم احفظ المنتج في قائمتك الخاصة."
      />
      <ProductCatalog products={data.products} />
      <ProductCalculator products={data.products} entries={data.entries} />
    </div>
  );
}
