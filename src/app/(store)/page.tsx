import { listCategories, listProducts, listSizeOptions } from "@/lib/queries";
import { ProductCard } from "@/components/store/product-card";
import { ProductFilters } from "@/components/store/product-filters";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function StorePage({ searchParams }: PageProps<"/">) {
  const sp = (await searchParams) as SP;
  const filters = {
    q: one(sp.q) || undefined,
    category: one(sp.category) || undefined,
    sizeOptionId: one(sp.size) || undefined,
    minPrice: one(sp.minPrice) ? Number(one(sp.minPrice)) : undefined,
    maxPrice: one(sp.maxPrice) ? Number(one(sp.maxPrice)) : undefined,
  };

  const [items, categories, sizeOptions] = await Promise.all([
    listProducts(filters),
    listCategories(),
    listSizeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shop</h1>
        <p className="text-sm text-muted-foreground">
          Baby clothing, kids shoes, footwear and accessories.
        </p>
      </div>

      <ProductFilters categories={categories} sizeOptions={sizeOptions} />

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No products match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
