import { getRazorpayClient } from './client';

export interface CreateOrderParams {
  amount: number; // in paise
  currency: string;
  receipt: string;
}

export async function createRazorpayOrder({ amount, currency, receipt }: CreateOrderParams) {
  const razorpay = getRazorpayClient();

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
    });

    return order;
  } catch (error: unknown) {
    console.error('Razorpay Order Creation Error:', error);
    const err = error as { description?: string; message?: string };
    throw new Error(err.description || err.message || 'Failed to create Razorpay order');
  }
}
