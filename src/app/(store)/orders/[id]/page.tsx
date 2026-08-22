import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrderDetail } from "@/lib/queries";
import { formatNaira } from "@/lib/money";

export const dynamic = "force-dynamic";

const statusConfig = {
  pending: { label: "Payment pending", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", className: "bg-blue-100 text-blue-800" },
  shipped: { label: "Shipped", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
} as const;

/** Customer order receipt view displaying fulfillment badge, line items, and delivery address. */
export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {

  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();

  const { order, items } = detail;
  const status = statusConfig[order.status];
  const StatusIcon =
    order.status === "pending"
      ? Clock
      : order.status === "shipped"
        ? Package
        : order.status === "cancelled"
          ? XCircle
          : CheckCircle2;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <StatusIcon className="size-8 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold">
            {order.status === "pending" ? "Order received" : "Thank you for your order!"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Order placed {order.createdAt.toLocaleDateString("en-NG", { dateStyle: "long" })}
          </p>
        </div>
        <Badge variant="outline" className={`ml-auto ${status.className}`}>
          {status.label}
        </Badge>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.sizeLabel}
                {item.color ? ` · ${item.color}` : ""} · {item.serialNo} × {item.quantity}
              </p>
            </div>
            <p>{formatNaira(item.unitPrice * item.quantity)}</p>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatNaira(order.totalAmount)}</span>
        </div>
      </div>

      <div className="grid gap-2 rounded-xl border bg-card p-4 text-sm">
        <p className="font-medium">Delivery details</p>
        <p className="text-muted-foreground">
          {order.customerName} · {order.customerEmail}
          {order.customerPhone ? ` · ${order.customerPhone}` : ""}
        </p>
        <p className="text-muted-foreground">{order.shippingAddress}</p>
        {order.paymentReference && (
          <p className="text-xs text-muted-foreground">
            Payment reference: {order.paymentReference}
          </p>
        )}
      </div>
    </div>
  );
}
