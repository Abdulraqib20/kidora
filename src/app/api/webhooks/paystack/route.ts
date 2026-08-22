import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { markOrderPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/paystack";

/** Handle Paystack payment success webhooks and mark corresponding orders as paid. */
export async function POST(req: Request) {

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.paymentReference, event.data.reference));
    if (order) await markOrderPaid(order.id);
  }

  // Always 200 on valid signature so Paystack doesn't retry indefinitely.
  return NextResponse.json({ received: true });
}
