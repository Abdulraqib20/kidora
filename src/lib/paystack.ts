import crypto from "node:crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

const secret = () => process.env.PAYSTACK_SECRET_KEY || "";

/** Return true when Paystack secret key credentials are configured in the environment. */
export function paystackEnabled(): boolean {
  return secret().length > 0;
}

/** Initialize a Paystack transaction in NGN kobo and return its hosted checkout authorization URL. */
export async function initializeTransaction(opts: {
  email: string;
  amount: number; // naira
  reference: string;
  callbackUrl: string;
}): Promise<{ authorizationUrl: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      amount: Math.round(opts.amount * 100), // kobo
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      currency: "NGN",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack initialization failed");
  }
  return { authorizationUrl: data.data.authorization_url };
}

/** Verify transaction status and charged amount with Paystack by transaction reference. */
export async function verifyTransaction(
  reference: string,
): Promise<{ status: "success" | "failed" | "pending"; amount: number }> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret()}` } },
  );
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack verification failed");
  }
  return { status: data.data.status, amount: data.data.amount / 100 };
}

/** Verify incoming Paystack webhook HMAC-SHA512 signature in timing-safe comparison. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!secret() || !signature) return false;
  const expected = crypto.createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

