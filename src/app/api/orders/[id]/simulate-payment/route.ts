import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { paystackEnabled } from "@/lib/paystack";

type Ctx = { params: Promise<{ id: string }> };

// Dev-only stand-in for the Paystack redirect; disabled once a real key exists.
export async function POST(_req: Request, { params }: Ctx) {
  if (paystackEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { id } = await params;
  const paid = await markOrderPaid(id);
  if (!paid) {
    return NextResponse.json(
      { error: "Order is not pending (already paid, shipped, or cancelled)" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
