import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/lib/queries";
import { formatNaira } from "@/lib/money";
import { cn } from "@/lib/utils";

const LOW_STOCK = 5;

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const soldOut = product.totalStock === 0;
  const lowStock = !soldOut && product.totalStock <= LOW_STOCK;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🛍️</div>
        )}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {soldOut && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-white">
              Sold out
            </span>
          )}
          {lowStock && (
            <span className="rounded-full bg-amber-500/95 px-2 py-0.5 text-xs font-medium text-white">
              Only {product.totalStock} left
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 translate-y-full p-2 transition-transform duration-300 group-hover:translate-y-0">
          <span className="block rounded-lg bg-background/95 py-2 text-center text-xs font-semibold shadow-sm backdrop-blur">
            View details
          </span>
        </div>
      </div>

      <div className="space-y-1 p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.brand ?? product.category}</p>
        <div className="flex items-baseline justify-between pt-1">
          <p className={cn("text-sm font-semibold", soldOut && "text-muted-foreground")}>
            {product.variantCount > 1 && (
              <span className="mr-1 font-normal text-muted-foreground">from</span>
            )}
            {formatNaira(product.minPrice)}
          </p>
          {product.unitsSold > 0 && (
            <p className="text-xs text-muted-foreground">{product.unitsSold} sold</p>
          )}
        </div>
      </div>
    </Link>
  );
}
