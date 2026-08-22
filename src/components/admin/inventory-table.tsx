"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PackagePlus, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { InventoryRow } from "@/lib/queries";
import { formatNaira } from "@/lib/money";
import { daysSince } from "@/lib/dates";

const LOW_STOCK_THRESHOLD = 5;
const STALE_STOCK_DAYS = 60;

/** Admin inventory ledger table with real-time text search, inline restock dialog, and note editor. */
export function InventoryTable({ rows }: { rows: InventoryRow[] }) {

  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [restockRow, setRestockRow] = useState<InventoryRow | null>(null);
  const [restockQty, setRestockQty] = useState("10");
  const [notesRow, setNotesRow] = useState<InventoryRow | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.serialNo.toLowerCase().includes(q) ||
        r.sizeLabel.toLowerCase().includes(q) ||
        (r.color ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const restock = async () => {
    if (!restockRow) return;
    const qty = Number(restockQty);
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error("Enter a whole number of units");
      return;
    }
    setBusyId(restockRow.variantId);
    const res = await fetch(`/api/variants/${restockRow.variantId}/restock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addQuantity: qty }),
    });
    setBusyId(null);
    if (!res.ok) {
      toast.error("Restock failed");
      return;
    }
    toast.success(`Restocked ${qty} units — stock age reset`);
    setRestockRow(null);
    router.refresh();
  };

  const saveNotes = async () => {
    if (!notesRow) return;
    setBusyId(notesRow.variantId);
    const res = await fetch(`/api/variants/${notesRow.variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesValue.trim() || null }),
    });
    setBusyId(null);
    if (!res.ok) {
      toast.error("Could not save note");
      return;
    }
    toast.success("Note saved");
    setNotesRow(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Filter by product, serial, size or colour…"
        className="max-w-sm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Serial no</TableHead>
              <TableHead>Size / Age</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock left</TableHead>
              <TableHead className="text-right">Qty sold</TableHead>
              <TableHead className="text-right">Total sales</TableHead>
              <TableHead className="text-right">Stock age</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const age = daysSince(r.restockedAt);
              const low = r.quantityInStock <= LOW_STOCK_THRESHOLD;
              const stale = r.quantityInStock > 0 && age > STALE_STOCK_DAYS;
              return (
                <TableRow key={r.variantId}>
                  <TableCell>
                    <p className="font-medium">{r.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.brand ?? r.category}
                      {r.color ? ` · ${r.color}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.serialNo}</TableCell>
                  <TableCell>{r.sizeLabel}</TableCell>
                  <TableCell className="text-right">{formatNaira(r.price)}</TableCell>
                  <TableCell className="text-right">
                    {low ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">
                        {r.quantityInStock} left
                      </Badge>
                    ) : (
                      r.quantityInStock
                    )}
                  </TableCell>
                  <TableCell className="text-right">{r.qtySold}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNaira(r.totalSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={stale ? "font-medium text-muted-foreground" : ""}>
                      {age}d
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <button
                      className="block w-full truncate text-left text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setNotesRow(r);
                        setNotesValue(r.notes ?? "");
                      }}
                      title={r.notes ?? "Add note"}
                    >
                      {r.notes ?? "—"}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Restock"
                        disabled={busyId === r.variantId}
                        onClick={() => {
                          setRestockRow(r);
                          setRestockQty("10");
                        }}
                      >
                        {busyId === r.variantId ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <PackagePlus />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit note"
                        onClick={() => {
                          setNotesRow(r);
                          setNotesValue(r.notes ?? "");
                        }}
                      >
                        <StickyNote />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                  No matching variants.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!restockRow} onOpenChange={(open) => !open && setRestockRow(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Restock</DialogTitle>
            <DialogDescription>
              {restockRow?.productName} · {restockRow?.sizeLabel} ·{" "}
              {restockRow?.serialNo}. Current stock: {restockRow?.quantityInStock}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="restock-qty">Units added</Label>
            <Input
              id="restock-qty"
              type="number"
              min={1}
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Restocking resets the stock-age clock.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockRow(null)}>
              Cancel
            </Button>
            <Button onClick={restock} disabled={busyId === restockRow?.variantId}>
              Add stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!notesRow} onOpenChange={(open) => !open && setNotesRow(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Note</DialogTitle>
            <DialogDescription>{notesRow?.serialNo}</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="e.g. Last packs — reorder from supplier"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesRow(null)}>
              Cancel
            </Button>
            <Button onClick={saveNotes} disabled={busyId === notesRow?.variantId}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
