"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { SizeOptionWithUsage } from "@/lib/queries";

const categoryLabels: Record<string, string> = {
  age_range: "Age groups (baby clothing)",
  shoe_size: "Shoe sizes",
  kids_shoe_size: "Kids shoe sizes",
  free_size: "One size",
};

export function SizeGroupsManager({ options }: { options: SizeOptionWithUsage[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ category: "", label: "" });
  const [editOption, setEditOption] = useState<SizeOptionWithUsage | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const groups = new Map<string, SizeOptionWithUsage[]>();
  for (const opt of options) {
    const list = groups.get(opt.category) ?? [];
    list.push(opt);
    groups.set(opt.category, list);
  }
  const categories = [...groups.keys()];

  const addOption = async () => {
    setBusy(true);
    const res = await fetch("/api/size-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: addForm.label,
        category: addForm.category,
      }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not add");
      return;
    }
    toast.success(`Added “${addForm.label}” to ${addForm.category}`);
    setAddOpen(false);
    setAddForm({ category: "", label: "" });
    router.refresh();
  };

  const saveEdit = async () => {
    if (!editOption) return;
    setBusy(true);
    const res = await fetch(`/api/size-options/${editOption.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not save");
      return;
    }
    toast.success("Saved");
    setEditOption(null);
    router.refresh();
  };

  const remove = async (option: SizeOptionWithUsage) => {
    if (!confirm(`Delete “${option.label}” from ${option.category}?`)) return;
    const res = await fetch(`/api/size-options/${option.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not delete");
      return;
    }
    toast.success("Deleted");
    router.refresh();
  };

  const move = async (option: SizeOptionWithUsage, dir: -1 | 1) => {
    const group = groups.get(option.category)!;
    const index = group.findIndex((o) => o.id === option.id);
    const neighbor = group[index + dir];
    if (!neighbor) return;
    setBusy(true);
    // Swap sort orders with the neighbour.
    await Promise.all([
      fetch(`/api/size-options/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: neighbor.sortOrder }),
      }),
      fetch(`/api/size-options/${neighbor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: option.sortOrder }),
      }),
    ]);
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => setAddOpen(true)}>
        <Plus /> Add size / age group
      </Button>

      {categories.map((category) => {
        const group = groups.get(category)!;
        return (
          <div key={category} className="rounded-xl border">
            <p className="border-b bg-muted/50 p-3 text-sm font-medium">
              {categoryLabels[category] ?? category}
              <span className="ml-2 font-normal text-muted-foreground">
                ({category})
              </span>
            </p>
            <div className="divide-y">
              {group.map((option, i) => (
                <div key={option.id} className="flex items-center gap-2 p-2 pl-3 text-sm">
                  <span className="flex-1">{option.label}</span>
                  {option.variantCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {option.variantCount} variant{option.variantCount === 1 ? "" : "s"}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy || i === 0}
                      onClick={() => move(option, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy || i === group.length - 1}
                      onClick={() => move(option, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Rename"
                      onClick={() => {
                        setEditOption(option);
                        setEditLabel(option.label);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      disabled={option.variantCount > 0}
                      onClick={() => remove(option)}
                      title={
                        option.variantCount > 0
                          ? "In use by variants — cannot delete"
                          : "Delete"
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add size / age group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                list="size-categories"
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="age_range or a new one…"
              />
              <datalist id="size-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Pick an existing category or type a new one to start a new sizing
                system.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                value={addForm.label}
                onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="36-48 months"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={addOption}
              disabled={busy || !addForm.category || !addForm.label}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editOption} onOpenChange={(open) => !open && setEditOption(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOption(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={busy || !editLabel}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
