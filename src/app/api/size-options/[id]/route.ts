import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sizeOptions, variants } from "@/db/schema";
import { getAdminSession } from "@/lib/session";
import { sizeOptionUpdateSchema } from "@/lib/validation";
import { isUniqueViolation } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** Update size option label or sort order (admin only). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = sizeOptionUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }
  try {
    const [sizeOption] = await db
      .update(sizeOptions)
      .set(parsed.data)
      .where(eq(sizeOptions.id, id))
      .returning();
    if (!sizeOption) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ sizeOption });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json(
        { error: "That label already exists in this category" },
        { status: 409 },
      );
    }
    throw e;
  }
}

/** Delete a size option if not currently referenced by any variants (admin only). */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const inUse = await db
    .select({ one: variants.id })
    .from(variants)
    .where(eq(variants.sizeOptionId, id))
    .limit(1);
  if (inUse.length > 0) {
    return NextResponse.json(
      { error: "Size group is used by variants and cannot be deleted" },
      { status: 409 },
    );
  }

  const deleted = await db.delete(sizeOptions).where(eq(sizeOptions.id, id)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

