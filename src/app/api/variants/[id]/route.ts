import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, variants } from "@/db/schema";
import { getAdminSession } from "@/lib/session";
import { variantUpdateSchema } from "@/lib/validation";
import { isUniqueViolation } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = variantUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }
  const { price, ...rest } = parsed.data;
  try {
    const [variant] = await db
      .update(variants)
      .set({ ...rest, ...(price != null ? { price: price.toFixed(2) } : {}) })
      .where(eq(variants.id, id))
      .returning();
    if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ variant });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json(
        { error: "Serial number already exists" },
        { status: 409 },
      );
    }
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const hasSales = await db
    .select({ one: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.variantId, id))
    .limit(1);
  if (hasSales.length > 0) {
    return NextResponse.json(
      { error: "Variant has sales history and cannot be deleted" },
      { status: 409 },
    );
  }

  const deleted = await db.delete(variants).where(eq(variants.id, id)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
