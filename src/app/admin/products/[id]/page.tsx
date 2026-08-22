import { notFound } from "next/navigation";
import { getProductWithVariants, listSizeOptions } from "@/lib/queries";
import { ProductEditor } from "@/components/admin/product-editor";

export const dynamic = "force-dynamic";

/** Admin product edit page loading product record, variants, and size options into ProductEditor. */
export default async function AdminProductEditorPage({

  params,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [result, sizeOptions] = await Promise.all([
    getProductWithVariants(id),
    listSizeOptions(),
  ]);
  if (!result) notFound();

  return <ProductEditor product={result.product} variants={result.variants} sizeOptions={sizeOptions} />;
}
