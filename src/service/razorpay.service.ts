// services/razorpay.service.ts
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface CreateOrderOptions {
  amount: number; // in paise (rupees × 100)
  currency?: string;
  receipt: string; // your internal order ID
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Create a Razorpay order — call this before showing the payment modal
 */
export const createRazorpayOrder = async (
  options: CreateOrderOptions,
): Promise<RazorpayOrder> => {
  const order = await razorpay.orders.create({
    amount: options.amount,
    currency: options.currency || "INR",
    receipt: options.receipt,
    notes: options.notes || {},
  });
  return order as RazorpayOrder;
};

/**
 * Verify payment signature after successful payment
 * Must be called server-side before marking order as paid
 */
export const verifyPaymentSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === razorpaySignature;
};

/**
 * Fetch payment details from Razorpay (for audit / reconciliation)
 */
export const fetchPaymentDetails = async (razorpayPaymentId: string) => {
  return await razorpay.payments.fetch(razorpayPaymentId);
};
