import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getOrderDetail } from "@/lib/queries";
import { markOrderPaid } from "@/lib/orders";
import { paystackEnabled, verifyTransaction } from "@/lib/paystack";
import { SimulatePayment } from "@/components/store/simulate-payment";

export const dynamic = "force-dynamic";

/** Payment verification page confirming Paystack callback references or rendering dev simulator. */
export default async function VerifyPage({

  searchParams,
}: PageProps<"/checkout/verify">) {
  const sp = await searchParams;
  const reference = typeof sp.reference === "string" ? sp.reference : null;
  const orderId = typeof sp.order === "string" ? sp.order : null;

  if (reference) {
    if (!paystackEnabled()) notFound();
    let verified = false;
    try {
      const result = await verifyTransaction(reference);
      verified = result.status === "success";
    } catch {
      verified = false;
    }
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.paymentReference, reference));
    if (order && verified) {
      await markOrderPaid(order.id);
      redirect(`/orders/${order.id}`);
    }
    if (order) redirect(`/orders/${order.id}`);
  }

  if (orderId) {
    const detail = await getOrderDetail(orderId);
    if (!detail) notFound();
    if (detail.order.status !== "pending") redirect(`/orders/${orderId}`);
    return <SimulatePayment orderId={orderId} total={detail.order.totalAmount} />;
  }

  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <p className="font-medium">Waiting for payment confirmation…</p>
      <p className="pt-1 text-sm text-muted-foreground">
        If you just paid, give it a moment and refresh this page.
      </p>
      <Link href="/" className="mt-4 inline-block text-sm underline">
        Back to shop
      </Link>
    </div>
  );
}
