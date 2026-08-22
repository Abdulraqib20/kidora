import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sizeOptions } from "@/db/schema";
import { getAdminSession } from "@/lib/session";
import { listSizeOptions } from "@/lib/queries";
import { sizeOptionCreateSchema } from "@/lib/validation";
import { isUniqueViolation } from "@/lib/errors";

/** List size options and variant counts, optionally filtered by category. */
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") || undefined;
  return NextResponse.json({ sizeOptions: await listSizeOptions(category) });
}

/** Create a new size or age bracket option (admin only). */
export async function POST(req: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = sizeOptionCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }
  try {
    const [sizeOption] = await db.insert(sizeOptions).values(parsed.data).returning();
    return NextResponse.json({ sizeOption }, { status: 201 });
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

