"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NewProductDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    description: "",
    image: "",
  });

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    const res = await fetch("/api/products", {
      method: "POST",
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
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not create product");
      return;
    }
    toast.success("Product created — now add variants");
    setOpen(false);
    setForm({ name: "", category: "", brand: "", description: "", image: "" });
    router.push(`/admin/products/${data.product.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus /> New product
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New product</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={set("name")} placeholder="Baby Girl Floral Gown" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={set("category")} placeholder="Baby Clothing" />
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={set("brand")} placeholder="Kiddie Lane" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={set("description")} />
          </div>
          <div className="space-y-1.5">
            <Label>Image URL (optional)</Label>
            <Input value={form.image} onChange={set("image")} placeholder="/products/floral-gown.svg" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !form.name || !form.category}>
            Create product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
