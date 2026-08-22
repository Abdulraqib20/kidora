import Link from "next/link";
import { listCategories, listProducts, listSizeOptions } from "@/lib/queries";
import { ProductCard } from "@/components/store/product-card";
import { ProductFilters } from "@/components/store/product-filters";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Storefront homepage presenting marketing banners, category tabs, filters, and product grid. */
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
        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-8 shadow-xs md:p-12">
          <div className="relative max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Curated Children&rsquo;s Collection
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Everything your little ones need.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Baby clothing, kids&rsquo; shoes, footwear and accessories. Quality
              picks at fair prices, with new arrivals every week.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/?category=Baby+Clothing#catalog"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
              >
                Shop baby clothing
              </Link>
              <Link
                href="#catalog"
                className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted"
              >
                Browse everything
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 pt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">✓</span> Premium quality materials
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">✓</span> Verified sizes &amp; fit
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">✓</span> Fast nationwide delivery
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
