import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getAdminSession } from "@/lib/session";
import { listProducts } from "@/lib/queries";
import { productCreateSchema } from "@/lib/validation";

/** List catalogue products matching query filters and price constraints. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  const rows = await listProducts({
    q: sp.get("q") || undefined,
    category: sp.get("category") || undefined,
    sizeOptionId: sp.get("sizeOptionId") || undefined,
    minPrice: minPrice != null && minPrice !== "" ? Number(minPrice) : undefined,
    maxPrice: maxPrice != null && maxPrice !== "" ? Number(maxPrice) : undefined,
  });
  return NextResponse.json({ products: rows });
}

/** Create a new product entry in the catalogue (admin only). */
export async function POST(req: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = productCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }
  const [product] = await db.insert(products).values(parsed.data).returning();
  return NextResponse.json({ product }, { status: 201 });
}

