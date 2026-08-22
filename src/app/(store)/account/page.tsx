import Link from "next/link";
import { getSession } from "@/lib/session";
import { listOrdersForEmail } from "@/lib/queries";
import { AuthForms } from "@/components/store/auth-forms";
import { SignOutButton } from "@/components/store/signout-button";
import { formatNaira } from "@/lib/money";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

/** Customer account dashboard displaying sign-in forms for guests or order history for authenticated users. */
export default async function AccountPage() {

  const session = await getSession();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="pb-4 text-center text-xl font-bold">Your account</h1>
        <AuthForms />
      </div>
    );
  }

  const orders = await listOrdersForEmail(session.user.email);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Hello, {session.user.name}</h1>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Order history</h2>
        {orders.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link href="/" className="underline">
              Start shopping
            </Link>
            .
          </p>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
                  {formatNaira(order.totalAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[order.status]}`}
              >
                {order.status}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
