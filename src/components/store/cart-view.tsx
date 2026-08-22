"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/money";

/** Shopping cart view displaying line items, quantity controls, removal actions, and checkout CTA. */
export function CartView() {

  const { items, subtotal, setQuantity, remove, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">Your cart is empty</p>
        <p className="pt-1 text-sm text-muted-foreground">
          Browse the shop to find something you like.
        </p>
        <Link href="/" className={cn(buttonVariants({ className: "mt-4" }))}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Cart ({count})</h1>
        {items.map((item) => (
          <div
            key={item.variantId}
            className="flex gap-3 rounded-xl border bg-card p-3"
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.productName}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.sizeLabel}
                    {item.color ? ` · ${item.color}` : ""} · {item.serialNo}
                  </p>
                </div>
                <button
                  onClick={() => remove(item.variantId)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove item"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-lg border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                    aria-label="Decrease"
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                    aria-label="Increase"
                  >
                    <Plus />
                  </Button>
                </div>
                <p className="text-sm font-semibold">
                  {formatNaira(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-fit space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatNaira(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span>Arranged after payment</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatNaira(subtotal)}</span>
        </div>
        <Link
          href="/checkout"
          className={cn(buttonVariants({ size: "lg", className: "w-full" }))}
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
