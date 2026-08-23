import Link from "next/link";
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingBag,
  ArrowUpRight,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { listOrdersForEmail } from "@/lib/queries";
import { AuthForms } from "@/components/store/auth-forms";
import { SignOutButton } from "@/components/store/signout-button";
import { formatNaira } from "@/lib/money";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  shipped: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

/** Account dashboard providing store administration tools for staff and order tracking for customers. */
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

  const isAdmin = session.user.role === "admin";
  const orders = await listOrdersForEmail(session.user.email);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Account header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Hello, {session.user.name}</h1>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                <ShieldCheck className="size-3.5" />
                Store Admin
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Customer
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Admin management center */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Store Administration</h2>
              <p className="text-xs text-muted-foreground">
                Quick shortcuts to manage inventory, catalog, and customer orders.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
            >
              <span>Open full dashboard</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin"
              className="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-purple-500/50 hover:shadow-md"
            >
              <div className="size-9 rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                <LayoutDashboard className="size-5" />
              </div>
              <div className="pt-3">
                <p className="font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  Dashboard
                </p>
                <p className="text-xs text-muted-foreground">Analytics & stats</p>
              </div>
            </Link>

            <Link
              href="/admin/inventory"
              className="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-purple-500/50 hover:shadow-md"
            >
              <div className="size-9 rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <ClipboardList className="size-5" />
              </div>
              <div className="pt-3">
                <p className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Inventory
                </p>
                <p className="text-xs text-muted-foreground">Stock & restock logs</p>
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-purple-500/50 hover:shadow-md"
            >
              <div className="size-9 rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="size-5" />
              </div>
              <div className="pt-3">
                <p className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Store Orders
                </p>
                <p className="text-xs text-muted-foreground">Manage & fulfill</p>
              </div>
            </Link>

            <Link
              href="/admin/products"
              className="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-purple-500/50 hover:shadow-md"
            >
              <div className="size-9 rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                <Package className="size-5" />
              </div>
              <div className="pt-3">
                <p className="font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Products
                </p>
                <p className="text-xs text-muted-foreground">Catalogue & variants</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Orders section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            {isAdmin ? "Personal Purchases & Test Orders" : "Order History"}
          </h2>
          {orders.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {orders.length} order{orders.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium">No orders yet</p>
            <p className="pt-1 text-xs text-muted-foreground">
              {isAdmin
                ? "Orders placed through the storefront checkout using this email will appear here."
                : "You haven't placed any orders yet."}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href="/"
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Browse products
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/orders"
                  className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  View all store orders
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm transition-all hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
                      {formatNaira(order.totalAmount)}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadge[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Order #{order.id.slice(0, 8)} ·{" "}
                    {order.createdAt.toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  View →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
