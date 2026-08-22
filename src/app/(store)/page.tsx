import Link from "next/link";
import { listCategories, listProducts, listSizeOptions } from "@/lib/queries";
import { ProductCard } from "@/components/store/product-card";
import { ProductFilters } from "@/components/store/product-filters";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function StorePage({ searchParams }: PageProps<"/">) {
  const sp = (await searchParams) as SP;

  // The size filter travels in the URL as its readable label (e.g.
  // ?size=0-6+months) — resolve it to the option id for querying.
  const sizeOptions = await listSizeOptions();
  const sizeLabel = one(sp.size);
  const sizeOption = sizeLabel
    ? sizeOptions.find((o) => o.label.toLowerCase() === sizeLabel.toLowerCase())
    : undefined;

  const filters = {
    q: one(sp.q) || undefined,
    category: one(sp.category) || undefined,
    sizeOptionId: sizeOption?.id,
    minPrice: one(sp.minPrice) ? Number(one(sp.minPrice)) : undefined,
    maxPrice: one(sp.maxPrice) ? Number(one(sp.maxPrice)) : undefined,
  };
  const filtered =
    filters.q ||
    filters.category ||
    filters.sizeOptionId ||
    filters.minPrice != null ||
    filters.maxPrice != null;

  const [allProducts, categories] = await Promise.all([
    listProducts({}),
    listCategories(),
  ]);
  const items = filtered ? await listProducts(filters) : allProducts;

  const countsByCategory = new Map<string, number>();
  for (const p of allProducts) {
    countsByCategory.set(p.category, (countsByCategory.get(p.category) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      {!filtered && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground">
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-white/5" />
          <div className="relative p-8 md:p-12">
            <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
              Kidora store
            </p>
            <h1 className="max-w-2xl pt-2 text-3xl leading-tight font-bold md:text-4xl">
              Everything your little ones need
            </h1>
            <p className="max-w-xl pt-2 opacity-90">
              Baby clothing, kids&rsquo; shoes, footwear and accessories — quality
              picks at fair prices, with new arrivals every week.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/?category=Baby+Clothing#catalog"
                className="rounded-lg bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-background/90"
              >
                Shop baby clothing
              </Link>
              <Link
                href="#catalog"
                className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
              >
                Browse everything
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="space-y-6" id="catalog">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              !filters.category
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary hover:text-primary",
            )}
          >
            All ({allProducts.length})
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/?category=${encodeURIComponent(c)}#catalog`}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filters.category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary hover:text-primary",
              )}
            >
              {c} ({countsByCategory.get(c) ?? 0})
            </Link>
          ))}
        </div>

        {filtered ? (
          <div className="space-y-4">
            <h1 className="text-xl font-bold tracking-tight">
              {items.length} result{items.length === 1 ? "" : "s"}
              {filters.q ? ` for “${filters.q}”` : ""}
            </h1>
            <ProductFilters categories={categories} sizeOptions={sizeOptions} />
          </div>
        ) : (
          <ProductFilters categories={categories} sizeOptions={sizeOptions} />
        )}

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
    </div>
  );
}
