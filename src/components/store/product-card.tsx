import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/lib/queries";
import { formatNaira } from "@/lib/money";

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const soldOut = product.totalStock === 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🛍️</div>
        )}
        {soldOut && (
          <span className="absolute top-2 left-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.brand ?? product.category}</p>
        <p className="pt-1 text-sm font-semibold">
          {product.variantCount > 1 && (
            <span className="mr-1 font-normal text-muted-foreground">from</span>
          )}
          {formatNaira(product.minPrice)}
        </p>
      </div>
    </Link>
  );
}
