import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { variants } from "@/db/schema";
import { getAdminSession } from "@/lib/session";
import { restockSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = restockSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const [variant] = await db
    .update(variants)
    .set({
      quantityInStock: sql`${variants.quantityInStock} + ${parsed.data.addQuantity}`,
      restockedAt: new Date(),
    })
    .where(eq(variants.id, id))
    .returning();
  if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ variant });
}
