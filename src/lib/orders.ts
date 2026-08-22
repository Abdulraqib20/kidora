import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, variants } from "@/db/schema";

// Idempotent pending→paid flip (webhook and verify callback may both fire).
export async function markOrderPaid(orderId: string): Promise<boolean> {
  const rows = await db
    .update(orders)
    .set({ status: "paid" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  return rows.length > 0;
}

// Cancel restores reserved stock inside one transaction.
export async function cancelOrder(
  orderId: string,
): Promise<{ ok: boolean; reason?: string }> {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return { ok: false, reason: "not_found" };
    if (order.status === "shipped" || order.status === "cancelled") {
      return { ok: false, reason: "cannot_cancel" };
    }

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      await tx
        .update(variants)
        .set({ quantityInStock: sql`${variants.quantityInStock} + ${item.quantity}` })
        .where(eq(variants.id, item.variantId));
    }
    await tx.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
    return { ok: true };
  });
}

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
