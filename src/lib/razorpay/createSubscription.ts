import { razorpay } from './client';

export interface CreateSubscriptionParams {
  plan_id: string;
  total_count: number;
  quantity?: number;
  customer_notify?: boolean;
  notes?: Record<string, string>;
}

export async function createRazorpaySubscription({ 
  plan_id, 
  total_count = 12, // Default to 12 cycles (e.g. 1 year of months)
  quantity = 1,
  customer_notify = true,
  notes
}: CreateSubscriptionParams) {
  if (!razorpay) {
    throw new Error('Razorpay is not initialized. Check your environment variables.');
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id,
      total_count,
      quantity,
      customer_notify: customer_notify ? 1 : 0,
      notes,
    });

    return subscription;
  } catch (error: unknown) {
    console.error('Razorpay Subscription Creation Error:', error);
    const err = error as { description?: string; message?: string };
    throw new Error(err.description || err.message || 'Failed to create Razorpay subscription');
  }
}
