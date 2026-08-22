"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/db/schema";

/** Action buttons for updating order fulfillment status or initiating order cancellation. */
export function OrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {

  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const update = async (next: OrderStatus, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Update failed");
      return;
    }
    toast.success(`Order marked ${next}`);
    router.refresh();
  };

  if (status === "shipped" || status === "cancelled") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {busy && <Loader2 className="size-4 animate-spin" />}
      {status === "pending" && (
        <>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => update("paid")}>
            Mark paid
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              update("cancelled", "Cancel this order? Reserved stock will be returned to inventory.")
            }
          >
            Cancel
          </Button>
        </>
      )}
      {status === "paid" && (
        <>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => update("shipped")}>
            Mark shipped
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              update("cancelled", "Cancel this paid order? Stock is returned and the refund is handled in Paystack.")
            }
          >
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}
