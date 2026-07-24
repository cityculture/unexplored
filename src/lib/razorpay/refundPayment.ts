import Razorpay from 'razorpay';

export interface RefundPaymentParams {
  paymentId: string;
  amount?: number; // optional, in paise. If not provided, full refund.
  notes?: Record<string, string>;
}

import { env } from '@/lib/env_server';

export async function createRazorpayRefund({ paymentId, amount, notes }: RefundPaymentParams) {

  const razorpay = new Razorpay({
    key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount,
      notes,
    });

    return refund;
  } catch (error) {
    console.error('Razorpay Refund Creation Error:', error);
    throw new Error('Failed to create Razorpay refund');
  }
}
