"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/money";
import type { VariantDetail } from "@/lib/queries";

type Props = {
  variants: VariantDetail[];
  product: { id: string; name: string; image: string | null };
};

const sizeCategoryLabel: Record<string, string> = {
  age_range: "Age group",
  shoe_size: "Size",
  kids_shoe_size: "Size",
  free_size: "Size",
};

/** Product variant selection, stock validation, quantity adjustment, and cart submission control. */
export function AddToCart({ variants, product }: Props) {

  const { add } = useCart();
  const firstAvailable = variants.find((v) => v.quantityInStock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable?.id);
  const [qty, setQty] = useState(1);

  const selected = variants.find((v) => v.id === variantId);
  const maxQty = selected?.quantityInStock ?? 0;
  const sizeLabel = selected ? sizeCategoryLabel[selected.sizeCategory] ?? "Size" : "Size";

  const groups = new Map<string, VariantDetail[]>();
  for (const v of variants) {
    const list = groups.get(v.sizeCategory) ?? [];
    list.push(v);
    groups.set(v.sizeCategory, list);
  }

  const handleAdd = () => {
    if (!selected || maxQty === 0) return;
    add(
      {
        variantId: selected.id,
        productId: product.id,
        productName: product.name,
        image: product.image,
        sizeLabel: selected.sizeLabel,
        color: selected.color,
        serialNo: selected.serialNo,
        unitPrice: selected.price,
      },
      Math.min(qty, maxQty),
    );
    toast.success("Added to cart", {
      description: `${product.name} · ${selected.sizeLabel}${selected.color ? ` · ${selected.color}` : ""}`,
      action: { label: "View cart", onClick: () => (window.location.href = "/cart") },
    });
  };

  return (
    <div className="space-y-4">
      {selected && (
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold">{formatNaira(selected.price)}</span>
          {maxQty > 0 ? (
            <span className="text-sm text-muted-foreground">
              {maxQty} in stock
            </span>
          ) : (
            <span className="text-sm font-medium text-destructive">Out of stock</span>
          )}
        </div>
      )}

      {[...groups.entries()].map(([category, group]) => (
        <div key={category} className="space-y-2">
          <p className="text-sm font-medium">
            {sizeCategoryLabel[category] ?? "Size"}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.map((v) => {
              const isSelected = v.id === variantId;
              const soldOut = v.quantityInStock === 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : soldOut
                        ? "cursor-not-allowed text-muted-foreground line-through opacity-50"
                        : "hover:border-primary"
                  }`}
                >
                  {v.sizeLabel}
                  {v.color ? ` · ${v.color}` : ""}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus />
          </Button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))}
            aria-label="Increase quantity"
          >
            <Plus />
          </Button>
        </div>
        <Button
          size="lg"
          className="flex-1"
          disabled={!selected || maxQty === 0}
          onClick={handleAdd}
        >
          Add to cart
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Need help picking a size?{" "}
        <Link href="/cart" className="underline">
          Your cart
        </Link>{" "}
        keeps each item's serial number for easy reference.
      </p>
    </div>
  );
}
