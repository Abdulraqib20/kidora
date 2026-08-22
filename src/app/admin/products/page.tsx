import Link from "next/link";
import { listProducts } from "@/lib/queries";
import { NewProductDialog } from "@/components/admin/new-product-dialog";
import { formatNaira } from "@/lib/money";

export const dynamic = "force-dynamic";

/** Admin products catalog page listing all products with stock summary and creation dialog. */
export default async function AdminProductsPage() {

  const items = await listProducts({});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} products in the catalogue
          </p>
        </div>
        <NewProductDialog />
      </div>

      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Brand</th>
              <th className="p-3 text-right font-medium">Variants</th>
              <th className="p-3 text-right font-medium">Units in stock</th>
              <th className="p-3 text-right font-medium">From</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.brand ?? "—"}</td>
                <td className="p-3 text-right">{p.variantCount}</td>
                <td className="p-3 text-right">{p.totalStock}</td>
                <td className="p-3 text-right">{formatNaira(p.minPrice)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No products yet — add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
