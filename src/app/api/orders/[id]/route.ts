import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getAdminSession } from "@/lib/session";
import { getOrderDetail } from "@/lib/queries";
import { cancelOrder, markOrderPaid } from "@/lib/orders";
import { orderStatusSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Fetch full order details including line items and customer info (admin only). */
export async function GET(_req: Request, { params }: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

/** Transition order status between pending, paid, shipped, or cancelled (admin only). */
export async function PATCH(req: Request, { params }: Ctx) {

  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = orderStatusSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.status === "pending") {
    return NextResponse.json({ error: "Cannot revert to pending" }, { status: 409 });
  }

  if (parsed.data.status === "paid") {
    if (order.status === "paid") return NextResponse.json({ ok: true });
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be marked paid" },
        { status: 409 },
      );
    }
    await markOrderPaid(id);
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.status === "shipped") {
    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Only paid orders can be shipped" },
        { status: 409 },
      );
    }
    await db.update(orders).set({ status: "shipped" }).where(eq(orders.id, id));
    return NextResponse.json({ ok: true });
  }

  // cancelled
  const result = await cancelOrder(id);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    return NextResponse.json(
      { error: result.reason === "not_found" ? "Not found" : "Shipped or already-cancelled orders cannot be cancelled" },
      { status },
    );
  }
  return NextResponse.json({ ok: true });
}
