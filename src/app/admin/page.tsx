import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardStats, getInventoryRows } from "@/lib/queries";
import { formatNaira } from "@/lib/money";
import { daysSince } from "@/lib/dates";
import { RevenueChart } from "@/components/admin/revenue-chart";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;
const STALE_STOCK_DAYS = 60;

/** Admin overview dashboard displaying aggregate business KPIs, revenue chart, and inventory warnings. */
export default async function AdminDashboard() {

  const [stats, inventory] = await Promise.all([
    getDashboardStats(),
    getInventoryRows(),
  ]);

  const lowStock = inventory
    .filter((r) => r.quantityInStock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.quantityInStock - b.quantityInStock);
  const staleStock = inventory.filter(
    (r) => r.quantityInStock > 0 && daysSince(r.restockedAt) > STALE_STOCK_DAYS,
  );

  const cards = [
    { label: "Total revenue", value: formatNaira(stats.totals.totalRevenue) },
    {
      label: "Orders",
      value: `${stats.totals.paidCount + stats.totals.shippedCount} paid · ${stats.totals.pendingCount} pending`,
    },
    { label: "Units in stock", value: `${stats.stock.unitsInStock}` },
    { label: "Inventory value", value: formatNaira(stats.stock.inventoryValue) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-xl">{c.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue — last 30 days</CardTitle>
          <CardDescription>Paid and shipped orders</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={stats.revenue30} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" /> Low stock
            </CardTitle>
            <CardDescription>{LOW_STOCK_THRESHOLD} units or fewer left</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing running low. 👍</p>
            )}
            {lowStock.slice(0, 6).map((r) => (
              <div key={r.variantId} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">
                  {r.productName} · {r.sizeLabel}
                </span>
                <span className="font-medium text-amber-700">{r.quantityInStock} left</span>
              </div>
            ))}
            {lowStock.length > 6 && (
              <Link href="/admin/inventory" className="text-xs underline">
                View all {lowStock.length} in inventory →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-muted-foreground" /> Stale stock
            </CardTitle>
            <CardDescription>Unsold for over {STALE_STOCK_DAYS} days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {staleStock.length === 0 && (
              <p className="text-sm text-muted-foreground">No stale stock. 👍</p>
            )}
            {staleStock.slice(0, 6).map((r) => (
              <div key={r.variantId} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">
                  {r.productName} · {r.sizeLabel}
                </span>
                <span className="text-muted-foreground">
                  {daysSince(r.restockedAt)}d · {r.quantityInStock} units
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Best sellers</CardTitle>
            <CardDescription>By units sold</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topVariants.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            )}
            {stats.topVariants.map((v, i) => (
              <div key={i} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">
                  {v.productName} · {v.sizeLabel}
                  {v.color ? ` · ${v.color}` : ""}
                </span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {v.qtySold} sold · {formatNaira(v.revenue)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
