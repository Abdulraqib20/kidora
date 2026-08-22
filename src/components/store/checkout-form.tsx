"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/money";

export function CheckoutForm() {
  const { items, subtotal, clear, count } = useCart();
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    shippingAddress: "",
  });

  // Prefill for signed-in customers.
  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        name: f.name || session.user.name,
        email: f.email || session.user.email,
      }));
    }
  }, [session?.user]);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          customer: { name: form.name, email: form.email, phone: form.phone || undefined },
          shippingAddress: form.shippingAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Checkout failed", {
          description: res.status === 409 ? "Stock may have changed — review your cart." : undefined,
        });
        return;
      }
      clear();
      if (data.devMode) {
        router.push(`/checkout/verify?order=${data.orderId}`);
      } else {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (count === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">Nothing to check out</p>
        <Link href="/" className={cn(buttonVariants({ className: "mt-4" }))}>
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4">
        <h1 className="text-xl font-bold">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Paying as a guest is fine —{" "}
          <Link href="/account" className="underline">
            sign in
          </Link>{" "}
          to keep order history.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={set("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="080…"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={set("email")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Delivery address</Label>
          <Textarea
            id="address"
            required
            rows={3}
            placeholder="Street, area, city, state"
            value={form.shippingAddress}
            onChange={set("shippingAddress")}
          />
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting && <Loader2 className="animate-spin" />}
          Pay {formatNaira(subtotal)}
        </Button>
      </form>

      <div className="h-fit space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Order summary</h2>
        {items.map((i) => (
          <div key={i.variantId} className="flex justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">
              {i.productName} × {i.quantity}
            </span>
            <span>{formatNaira(i.unitPrice * i.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>{formatNaira(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
