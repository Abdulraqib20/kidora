import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const items = await listProducts({ q, limit: 6 });
  return NextResponse.json({
    results: items.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      image: p.images[0] ?? null,
      minPrice: p.minPrice,
      unitsSold: p.unitsSold,
    })),
  });
}
