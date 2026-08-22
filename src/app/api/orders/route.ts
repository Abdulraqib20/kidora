import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderItems, orders, variants } from "@/db/schema";
import { initializeTransaction, paystackEnabled } from "@/lib/paystack";
import { OrderError, cancelOrder } from "@/lib/orders";
import { orderCreateSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const parsed = orderCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }
  const body = parsed.data;
  const reference = `boda-${crypto.randomUUID()}`;

  let result: { orderId: string; total: number; email: string };
  try {
    result = await db.transaction(async (tx) => {
      const ids = [...new Set(body.items.map((i) => i.variantId))];
      const rows = await tx.select().from(variants).where(inArray(variants.id, ids));
      const byId = new Map(rows.map((r) => [r.id, r]));

      // Merge duplicate lines, then reserve stock with a guarded decrement so
      // concurrent checkouts can never oversell.
      const merged = new Map<string, number>();
      for (const item of body.items) {
        if (!byId.has(item.variantId)) {
          throw new OrderError("An item in your cart is no longer available", 404);
        }
        merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
      }
      for (const [variantId, qty] of merged) {
        const res = await tx.execute(
          sql`UPDATE variants SET quantity_in_stock = quantity_in_stock - ${qty}
              WHERE id = ${variantId} AND quantity_in_stock >= ${qty}`,
        );
        if ((res.rowCount ?? 0) === 0) {
          throw new OrderError(
            `Insufficient stock for ${byId.get(variantId)!.serialNo}`,
            409,
          );
        }
      }

      let [customer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.email, body.customer.email));
      if (!customer) {
        [customer] = await tx.insert(customers).values(body.customer).returning();
      }

      // Totals from DB prices only — never trust client prices.
      const total = [...merged].reduce(
        (sum, [id, qty]) => sum + Number(byId.get(id)!.price) * qty,
        0,
      );

      const [order] = await tx
        .insert(orders)
        .values({
          customerId: customer.id,
          status: "pending",
          totalAmount: total.toFixed(2),
          paymentReference: reference,
          shippingAddress: body.shippingAddress,
        })
        .returning();

      await tx.insert(orderItems).values(
        [...merged].map(([variantId, quantity]) => ({
          orderId: order.id,
          variantId,
          quantity,
          unitPrice: Number(byId.get(variantId)!.price).toFixed(2),
        })),
      );

      return { orderId: order.id, total, email: customer.email };
    });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  if (paystackEnabled()) {
    try {
      const { authorizationUrl } = await initializeTransaction({
        email: result.email,
        amount: result.total,
        reference,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/verify`,
      });
      return NextResponse.json(
        { ...result, authorizationUrl, devMode: false },
        { status: 201 },
      );
    } catch {
      // Payment could not start — release the reserved stock.
      await cancelOrder(result.orderId);
      return NextResponse.json(
        { error: "Payment initialization failed. Please try again." },
        { status: 502 },
      );
    }
  }

  // Dev mode: no Paystack key configured — simulate payment on the verify page.
  return NextResponse.json(
    { ...result, authorizationUrl: null, devMode: true },
    { status: 201 },
  );
}
