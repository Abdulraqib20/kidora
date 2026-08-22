"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import type { Product } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { SizeOptionWithUsage, VariantDetail } from "@/lib/queries";
import { formatNaira } from "@/lib/money";

type VariantForm = {
  serialNo: string;
  sizeOptionId: string;
  color: string;
  price: string;
  quantityInStock: string;
  notes: string;
};

const emptyVariant: VariantForm = {
  serialNo: "",
  sizeOptionId: "",
  color: "",
  price: "",
  quantityInStock: "0",
  notes: "",
};

export function ProductEditor({
  product,
  variants,
  sizeOptions,
}: {
  product: Product;
  variants: VariantDetail[];
  sizeOptions: SizeOptionWithUsage[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    brand: product.brand ?? "",
    description: product.description ?? "",
    image: product.images[0] ?? "",
  });
  const [addOpen, setAddOpen] = useState(false);
  const [newVariant, setNewVariant] = useState<VariantForm>(emptyVariant);
  const [editVariant, setEditVariant] = useState<VariantDetail | null>(null);
  const [editForm, setEditForm] = useState<VariantForm>(emptyVariant);

  const groups = new Map<string, SizeOptionWithUsage[]>();
  for (const opt of sizeOptions) {
    const list = groups.get(opt.category) ?? [];
    list.push(opt);
    groups.set(opt.category, list);
  }

  const saveProduct = async () => {
    setBusy(true);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        brand: form.brand || null,
        description: form.description || null,
        images: form.image ? [form.image] : [],
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not save product");
      return;
    }
    toast.success("Product saved");
    router.refresh();
  };

  const deleteProduct = async () => {
    if (!confirm(`Delete "${product.name}" and all its variants?`)) return;
    setBusy(true);
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not delete product");
      return;
    }
    toast.success("Product deleted");
    router.push("/admin/products");
  };

  const addVariant = async () => {
    setBusy(true);
    const res = await fetch("/api/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        serialNo: newVariant.serialNo,
        sizeOptionId: newVariant.sizeOptionId,
        color: newVariant.color || null,
        price: Number(newVariant.price),
        quantityInStock: Number(newVariant.quantityInStock),
        notes: newVariant.notes || null,
      }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not add variant");
      return;
    }
    toast.success("Variant added");
    setAddOpen(false);
    setNewVariant(emptyVariant);
    router.refresh();
  };

  const saveVariantEdit = async () => {
    if (!editVariant) return;
    setBusy(true);
    const res = await fetch(`/api/variants/${editVariant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serialNo: editForm.serialNo,
        sizeOptionId: editForm.sizeOptionId,
        color: editForm.color || null,
        price: Number(editForm.price),
        quantityInStock: Number(editForm.quantityInStock),
        notes: editForm.notes || null,
      }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not save variant");
      return;
    }
    toast.success("Variant saved");
    setEditVariant(null);
    router.refresh();
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm("Delete this variant?")) return;
    const res = await fetch(`/api/variants/${variantId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not delete variant");
      return;
    }
    toast.success("Variant deleted");
    router.refresh();
  };

  const variantFormFields = (
    v: VariantForm,
    setV: (v: VariantForm) => void,
  ) => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Serial no (SKU)</Label>
          <Input
            value={v.serialNo}
            onChange={(e) => setV({ ...v, serialNo: e.target.value })}
            placeholder="KLAG-101-0-6"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Size / age group</Label>
          <Select
            value={v.sizeOptionId}
            onValueChange={(val) => val && setV({ ...v, sizeOptionId: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {[...groups.entries()].map(([cat, opts]) => (
                <div key={cat}>
                  <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                    {cat}
                  </p>
                  {opts.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Colour</Label>
          <Input
            value={v.color}
            onChange={(e) => setV({ ...v, color: e.target.value })}
            placeholder="Black"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Price (₦)</Label>
          <Input
            type="number"
            min={0}
            value={v.price}
            onChange={(e) => setV({ ...v, price: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Qty in stock</Label>
          <Input
            type="number"
            min={0}
            value={v.quantityInStock}
            onChange={(e) => setV({ ...v, quantityInStock: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          rows={2}
          value={v.notes}
          onChange={(e) => setV({ ...v, notes: e.target.value })}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Products
      </Link>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Product details</h1>
          <Button variant="destructive" size="sm" onClick={deleteProduct} disabled={busy}>
            <Trash2 /> Delete product
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Image URL</Label>
          <Input
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          />
        </div>
        <Button onClick={saveProduct} disabled={busy}>
          <Save /> Save product
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Variants ({variants.length})</h2>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus /> Add variant
          </Button>
        </div>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial</TableHead>
                <TableHead>Size / Age</TableHead>
                <TableHead>Colour</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.serialNo}</TableCell>
                  <TableCell>{v.sizeLabel}</TableCell>
                  <TableCell>{v.color ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatNaira(v.price)}</TableCell>
                  <TableCell className="text-right">{v.quantityInStock}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                    {v.notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditVariant(v);
                          setEditForm({
                            serialNo: v.serialNo,
                            sizeOptionId: v.sizeOptionId,
                            color: v.color ?? "",
                            price: String(v.price),
                            quantityInStock: String(v.quantityInStock),
                            notes: v.notes ?? "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteVariant(v.id)}
                        aria-label="Delete variant"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {variants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    No variants yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add variant</DialogTitle>
          </DialogHeader>
          {variantFormFields(newVariant, setNewVariant)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={addVariant}
              disabled={busy || !newVariant.serialNo || !newVariant.sizeOptionId || !newVariant.price}
            >
              Add variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editVariant} onOpenChange={(open) => !open && setEditVariant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit variant</DialogTitle>
          </DialogHeader>
          {variantFormFields(editForm, setEditForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVariant(null)}>
              Cancel
            </Button>
            <Button onClick={saveVariantEdit} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
