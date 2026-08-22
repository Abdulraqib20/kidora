import Link from "next/link";
import { listOrders } from "@/lib/queries";
import { OrderActions } from "@/components/admin/order-actions";
import { formatNaira } from "@/lib/money";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusFilterTabs = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" },
];

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

/** Admin orders management page with status tabs, customer details, and fulfillment controls. */
export default async function AdminOrdersPage({

  searchParams,
}: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const statusParam = typeof sp.status === "string" ? sp.status : "";
  const status = ["pending", "paid", "shipped", "cancelled"].includes(statusParam)
    ? (statusParam as "pending" | "paid" | "shipped" | "cancelled")
    : undefined;
  const orders = await listOrders(status);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} order{orders.length === 1 ? "" : "s"}
          {status ? ` · ${status}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {statusFilterTabs.map((tab) => {
          const active = statusParam === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/orders?status=${tab.value}` : "/admin/orders"}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Reference</th>
              <th className="p-3 text-right font-medium">Items</th>
              <th className="p-3 text-right font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">
                  {order.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </td>
                <td className="p-3">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                </td>
                <td className="p-3 font-mono text-xs">{order.paymentReference ?? "—"}</td>
                <td className="p-3 text-right">{order.itemCount}</td>
                <td className="p-3 text-right font-medium">
                  {formatNaira(order.totalAmount)}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[order.status]}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-3">
                  <OrderActions orderId={order.id} status={order.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No orders here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
