import { getInventoryRows } from "@/lib/queries";
import { InventoryTable } from "@/components/admin/inventory-table";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const rows = await getInventoryRows();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Live ledger — qty sold, stock left and total sales are computed from
          orders, not typed in.
        </p>
      </div>
      <InventoryTable rows={rows} />
    </div>
  );
}
