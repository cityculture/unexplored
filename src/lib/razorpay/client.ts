import Razorpay from 'razorpay';
import { env } from '@/lib/env_server';

let razorpay: Razorpay | null = null;

try {
  razorpay = new Razorpay({
    key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error('❌ Failed to initialize Razorpay SDK:', error);
}

export { razorpay };
