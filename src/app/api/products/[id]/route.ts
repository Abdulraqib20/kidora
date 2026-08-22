import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, products, variants } from "@/db/schema";
import { getAdminSession } from "@/lib/session";
import { getProductWithVariants } from "@/lib/queries";
import { productUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Fetch product details and all associated variants by product ID. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const result = await getProductWithVariants(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

/** Update product catalogue information (admin only). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = productUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }
  const [product] = await db
    .update(products)
    .set(parsed.data)
    .where(eq(products.id, id))
    .returning();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

/** Delete a product if it has no associated sales history (admin only). */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const hasSales = await db
    .select({ one: orderItems.id })
    .from(orderItems)
    .innerJoin(variants, eq(variants.id, orderItems.variantId))
    .where(eq(variants.productId, id))
    .limit(1);
  if (hasSales.length > 0) {
    return NextResponse.json(
      { error: "Product has sales history and cannot be deleted" },
      { status: 409 },
    );
  }

  const deleted = await db.delete(products).where(eq(products.id, id)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

