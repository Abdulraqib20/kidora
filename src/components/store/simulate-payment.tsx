"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/money";

/** Dev-mode payment simulator for completing orders when Paystack credentials are unset. */
export function SimulatePayment({
  orderId,
  total,
}: {
  orderId: string;
  total: number;
}) {

  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/simulate-payment`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not simulate payment");
        return;
      }
      router.push(`/orders/${orderId}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border bg-card p-6 text-center">
      <h1 className="text-xl font-bold">Confirm payment</h1>
      <p className="text-sm text-muted-foreground">
        Paystack is not configured yet, so checkout is running in dev-simulated
        mode. Confirming here marks the order as paid and completes the flow.
      </p>
      <p className="text-2xl font-bold">{formatNaira(total)}</p>
      <Button size="lg" className="w-full" onClick={pay} disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        Simulate successful payment
      </Button>
    </div>
  );
}
