import { ShopifyView } from "@/components/views/LifeViews";
import { loadCore, loadRecords } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function ShopifyPage() {
  const [data, stores] = await Promise.all([loadCore(), loadRecords("shop")]);
  return (
    <ShopifyView
      products={data.products}
      stores={stores}
      extrasReady={data.extrasReady}
    />
  );
}
