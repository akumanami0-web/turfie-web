import "server-only";
import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export const paymentsLive = !!(KEY_ID && KEY_SECRET);

export type CreatedOrder = {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string | null; // public key for the client, null when simulated
  simulated: boolean;
};

/** Create a payment order. Uses Razorpay when keys are set; otherwise returns
    a simulated order so the prototype checkout works end-to-end. */
export async function createOrder(amountInr: number, receipt: string): Promise<CreatedOrder> {
  const amount = Math.round(amountInr * 100);
  if (!paymentsLive) {
    return { orderId: "sim_" + crypto.randomBytes(8).toString("hex"), amount, currency: "INR", keyId: null, simulated: true };
  }
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({ amount, currency: "INR", receipt }),
  });
  if (!res.ok) throw new Error("Failed to create Razorpay order: " + (await res.text()));
  const data = await res.json();
  return { orderId: data.id, amount: data.amount, currency: data.currency, keyId: KEY_ID, simulated: false };
}

/** Verify a Razorpay payment signature. Simulated orders always pass. */
export function verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  if (!paymentsLive || orderId.startsWith("sim_")) return true;
  const expected = crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return expected === signature;
}
