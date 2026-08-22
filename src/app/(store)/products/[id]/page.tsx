import { notFound } from "next/navigation";
import { getProductWithVariants } from "@/lib/queries";
import { AddToCart } from "@/components/store/add-to-cart";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  const result = await getProductWithVariants(id);
  if (!result) notFound();

  const { product, variants } = result;
  const image = product.images[0];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl border bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-6xl">🛍️</div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {product.brand} · {product.category}
          </p>
          <h1 className="pt-1 text-2xl font-bold tracking-tight">{product.name}</h1>
        </div>
        {product.description && <p className="text-sm">{product.description}</p>}
        <AddToCart
          variants={variants}
          product={{ id: product.id, name: product.name, image: image ?? null }}
        />
      </div>
    </div>
  );
}
