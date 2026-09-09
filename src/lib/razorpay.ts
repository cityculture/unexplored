import Razorpay from 'razorpay';
import crypto from 'crypto';

const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

export const razorpay = new Razorpay({
    key_id,
    key_secret,
});


export interface CreateOrderOptions {
    amount: number; // in paise (e.g., 500.00 -> 50000)
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
}

export async function createRazorpayOrder(options: CreateOrderOptions) {
    try {
        const order = await razorpay.orders.create({
            amount: Math.round(options.amount), // Ensure it's an integer
            currency: options.currency || 'INR',
            receipt: options.receipt,
            notes: options.notes,
        });
        return order;
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
}

export function verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = orderId + '|' + paymentId;
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');
    
    return expectedSignature === signature;
}

export function verifyRazorpaySubscriptionSignature(
    subscriptionId: string,
    paymentId: string,
    signature: string
): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = paymentId + '|' + subscriptionId;
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');
    
    return expectedSignature === signature;
}

export function verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');
    
    return expectedSignature === signature;
}
export async function getRazorpaySubscription(subscriptionId: string) {
    try {
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);
        return subscription;
    } catch (error) {
        console.error('Error fetching Razorpay subscription:', error);
        throw error;
    }
}
