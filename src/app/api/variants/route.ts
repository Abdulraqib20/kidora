import { NextResponse } from "next/server";
import { db } from "@/db";
import { variants } from "@/db/schema";
import { getAdminSession } from "@/lib/session";
import { isUniqueViolation } from "@/lib/errors";
import { variantCreateSchema } from "@/lib/validation";

/** Create a new product SKU variant with unique serial number (admin only). */
export async function POST(req: Request) {

  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = variantCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }
  try {
    const [variant] = await db
      .insert(variants)
      .values({
        ...parsed.data,
        price: parsed.data.price.toFixed(2),
      })
      .returning();
    return NextResponse.json({ variant }, { status: 201 });
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
